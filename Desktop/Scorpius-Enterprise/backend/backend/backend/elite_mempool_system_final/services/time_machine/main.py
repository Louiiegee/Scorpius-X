"""
Scorpius Mempool Elite Time Machine Service

Historical data archival and query service with S3 storage, data compression,
and efficient querying capabilities for mempool transaction analysis.
"""

import asyncio
import json
import logging
import os
import gzip
import pickle
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from uuid import UUID
import io

import asyncpg
import boto3
from botocore.exceptions import ClientError
from confluent_kafka import Consumer, KafkaError
from pydantic import BaseModel, Field
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ArchiveFormat(str):
    """Archive storage formats"""
    JSON = "json"
    PARQUET = "parquet"
    PICKLE = "pickle"

class CompressionType(str):
    """Compression algorithms"""
    GZIP = "gzip"
    LZ4 = "lz4"
    ZSTD = "zstd"

class Transaction(BaseModel):
    """Transaction data model"""
    hash: str
    chain_id: int
    from_address: str = Field(alias="from")
    to_address: str = Field(alias="to")
    value: str
    gas: str
    gas_price: str
    data: str
    nonce: str
    timestamp: int
    block_number: Optional[int] = None
    transaction_index: Optional[int] = None
    status: str
    raw: Dict[str, Any] = {}

class ArchiveMetadata(BaseModel):
    """Archive file metadata"""
    id: UUID
    file_path: str
    format: ArchiveFormat
    compression: CompressionType
    start_timestamp: datetime
    end_timestamp: datetime
    chain_id: int
    transaction_count: int
    file_size_bytes: int
    created_at: datetime
    checksum: str

class QueryRequest(BaseModel):
    """Historical data query request"""
    start_time: datetime
    end_time: datetime
    chain_ids: Optional[List[int]] = None
    from_addresses: Optional[List[str]] = None
    to_addresses: Optional[List[str]] = None
    value_min: Optional[str] = None
    value_max: Optional[str] = None
    gas_price_min: Optional[str] = None
    gas_price_max: Optional[str] = None
    tags: Optional[List[str]] = None
    limit: int = 1000
    offset: int = 0

class Config:
    """Service configuration"""
    def __init__(self):
        self.kafka_brokers = os.getenv("KAFKA_BROKERS", "localhost:9092")
        self.kafka_input_topic = os.getenv("KAFKA_INPUT_TOPIC", "tx_raw")
        self.kafka_consumer_group = os.getenv("KAFKA_CONSUMER_GROUP", "time-machine-service")
        self.postgres_url = os.getenv("POSTGRES_URL", "postgresql://postgres:password@localhost:5432/scorpius")
        
        # S3 configuration
        self.s3_bucket = os.getenv("S3_BUCKET", "scorpius-mempool-archive")
        self.s3_region = os.getenv("S3_REGION", "us-east-1")
        self.aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID", "")
        self.aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY", "")
        
        # Archive configuration
        self.archive_interval_hours = int(os.getenv("ARCHIVE_INTERVAL_HOURS", "1"))
        self.batch_size = int(os.getenv("BATCH_SIZE", "10000"))
        self.compression_type = os.getenv("COMPRESSION_TYPE", CompressionType.GZIP)
        self.archive_format = os.getenv("ARCHIVE_FORMAT", ArchiveFormat.PARQUET)
        self.retention_days = int(os.getenv("RETENTION_DAYS", "365"))
        
        # Performance settings
        self.max_memory_mb = int(os.getenv("MAX_MEMORY_MB", "2048"))
        self.max_concurrent_archives = int(os.getenv("MAX_CONCURRENT_ARCHIVES", "3"))

config = Config()

class S3Manager:
    """S3 storage manager"""
    
    def __init__(self, config: Config):
        self.config = config
        self.s3_client = boto3.client(
            's3',
            region_name=config.s3_region,
            aws_access_key_id=config.aws_access_key_id,
            aws_secret_access_key=config.aws_secret_access_key
        )
    
    async def upload_file(self, file_path: str, file_data: bytes) -> bool:
        """Upload file to S3"""
        try:
            self.s3_client.put_object(
                Bucket=self.config.s3_bucket,
                Key=file_path,
                Body=file_data
            )
            logger.info(f"Uploaded {file_path} to S3")
            return True
        except ClientError as e:
            logger.error(f"Failed to upload {file_path} to S3: {e}")
            return False
    
    async def download_file(self, file_path: str) -> Optional[bytes]:
        """Download file from S3"""
        try:
            response = self.s3_client.get_object(
                Bucket=self.config.s3_bucket,
                Key=file_path
            )
            return response['Body'].read()
        except ClientError as e:
            logger.error(f"Failed to download {file_path} from S3: {e}")
            return None
    
    async def delete_file(self, file_path: str) -> bool:
        """Delete file from S3"""
        try:
            self.s3_client.delete_object(
                Bucket=self.config.s3_bucket,
                Key=file_path
            )
            logger.info(f"Deleted {file_path} from S3")
            return True
        except ClientError as e:
            logger.error(f"Failed to delete {file_path} from S3: {e}")
            return False
    
    async def list_files(self, prefix: str) -> List[str]:
        """List files with prefix in S3"""
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.config.s3_bucket,
                Prefix=prefix
            )
            return [obj['Key'] for obj in response.get('Contents', [])]
        except ClientError as e:
            logger.error(f"Failed to list files with prefix {prefix}: {e}")
            return []

class DataCompressor:
    """Data compression utilities"""
    
    @staticmethod
    def compress_data(data: bytes, compression_type: CompressionType) -> bytes:
        """Compress data using specified algorithm"""
        if compression_type == CompressionType.GZIP:
            return gzip.compress(data)
        elif compression_type == CompressionType.LZ4:
            try:
                import lz4.frame
                return lz4.frame.compress(data)
            except ImportError:
                logger.warning("LZ4 not available, using gzip")
                return gzip.compress(data)
        elif compression_type == CompressionType.ZSTD:
            try:
                import zstandard as zstd
                cctx = zstd.ZstdCompressor()
                return cctx.compress(data)
            except ImportError:
                logger.warning("Zstandard not available, using gzip")
                return gzip.compress(data)
        else:
            return data
    
    @staticmethod
    def decompress_data(data: bytes, compression_type: CompressionType) -> bytes:
        """Decompress data using specified algorithm"""
        if compression_type == CompressionType.GZIP:
            return gzip.decompress(data)
        elif compression_type == CompressionType.LZ4:
            try:
                import lz4.frame
                return lz4.frame.decompress(data)
            except ImportError:
                logger.error("LZ4 not available for decompression")
                raise
        elif compression_type == CompressionType.ZSTD:
            try:
                import zstandard as zstd
                dctx = zstd.ZstdDecompressor()
                return dctx.decompress(data)
            except ImportError:
                logger.error("Zstandard not available for decompression")
                raise
        else:
            return data

class ArchiveManager:
    """Archive file manager"""
    
    def __init__(self, s3_manager: S3Manager):
        self.s3_manager = s3_manager
    
    async def create_archive(
        self, 
        transactions: List[Transaction], 
        metadata: ArchiveMetadata
    ) -> bool:
        """Create archive file from transactions"""
        try:
            # Convert to DataFrame for efficient processing
            df = self._transactions_to_dataframe(transactions)
            
            # Serialize to specified format
            if metadata.format == ArchiveFormat.PARQUET:
                file_data = self._serialize_parquet(df)
            elif metadata.format == ArchiveFormat.JSON:
                file_data = self._serialize_json(transactions)
            elif metadata.format == ArchiveFormat.PICKLE:
                file_data = self._serialize_pickle(transactions)
            else:
                raise ValueError(f"Unsupported format: {metadata.format}")
            
            # Compress data
            compressed_data = DataCompressor.compress_data(file_data, metadata.compression)
            
            # Upload to S3
            success = await self.s3_manager.upload_file(metadata.file_path, compressed_data)
            
            if success:
                logger.info(f"Created archive {metadata.file_path} with {len(transactions)} transactions")
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to create archive: {e}")
            return False
    
    async def load_archive(self, metadata: ArchiveMetadata) -> Optional[List[Transaction]]:
        """Load transactions from archive file"""
        try:
            # Download from S3
            compressed_data = await self.s3_manager.download_file(metadata.file_path)
            if not compressed_data:
                return None
            
            # Decompress data
            file_data = DataCompressor.decompress_data(compressed_data, metadata.compression)
            
            # Deserialize from specified format
            if metadata.format == ArchiveFormat.PARQUET:
                return self._deserialize_parquet(file_data)
            elif metadata.format == ArchiveFormat.JSON:
                return self._deserialize_json(file_data)
            elif metadata.format == ArchiveFormat.PICKLE:
                return self._deserialize_pickle(file_data)
            else:
                raise ValueError(f"Unsupported format: {metadata.format}")
            
        except Exception as e:
            logger.error(f"Failed to load archive {metadata.file_path}: {e}")
            return None
    
    def _transactions_to_dataframe(self, transactions: List[Transaction]) -> pd.DataFrame:
        """Convert transactions to pandas DataFrame"""
        data = []
        for tx in transactions:
            data.append({
                'hash': tx.hash,
                'chain_id': tx.chain_id,
                'from_address': tx.from_address,
                'to_address': tx.to_address,
                'value': tx.value,
                'gas': tx.gas,
                'gas_price': tx.gas_price,
                'data': tx.data,
                'nonce': tx.nonce,
                'timestamp': tx.timestamp,
                'block_number': tx.block_number,
                'transaction_index': tx.transaction_index,
                'status': tx.status
            })
        return pd.DataFrame(data)
    
    def _serialize_parquet(self, df: pd.DataFrame) -> bytes:
        """Serialize DataFrame to Parquet format"""
        buffer = io.BytesIO()
        table = pa.Table.from_pandas(df)
        pq.write_table(table, buffer)
        return buffer.getvalue()
    
    def _serialize_json(self, transactions: List[Transaction]) -> bytes:
        """Serialize transactions to JSON format"""
        data = [tx.dict() for tx in transactions]
        return json.dumps(data, default=str).encode('utf-8')
    
    def _serialize_pickle(self, transactions: List[Transaction]) -> bytes:
        """Serialize transactions to Pickle format"""
        return pickle.dumps(transactions)
    
    def _deserialize_parquet(self, data: bytes) -> List[Transaction]:
        """Deserialize from Parquet format"""
        buffer = io.BytesIO(data)
        table = pq.read_table(buffer)
        df = table.to_pandas()
        
        transactions = []
        for _, row in df.iterrows():
            tx = Transaction(
                hash=row['hash'],
                chain_id=row['chain_id'],
                **{'from': row['from_address']},
                **{'to': row['to_address']},
                value=row['value'],
                gas=row['gas'],
                gas_price=row['gas_price'],
                data=row['data'],
                nonce=row['nonce'],
                timestamp=row['timestamp'],
                block_number=row['block_number'],
                transaction_index=row['transaction_index'],
                status=row['status']
            )
            transactions.append(tx)
        
        return transactions
    
    def _deserialize_json(self, data: bytes) -> List[Transaction]:
        """Deserialize from JSON format"""
        data_list = json.loads(data.decode('utf-8'))
        return [Transaction(**item) for item in data_list]
    
    def _deserialize_pickle(self, data: bytes) -> List[Transaction]:
        """Deserialize from Pickle format"""
        return pickle.loads(data)

class QueryEngine:
    """Historical data query engine"""
    
    def __init__(self, db_pool: asyncpg.Pool, archive_manager: ArchiveManager):
        self.db_pool = db_pool
        self.archive_manager = archive_manager
    
    async def execute_query(self, query: QueryRequest) -> Tuple[List[Transaction], int]:
        """Execute historical data query"""
        # Get relevant archive files
        archive_metadatas = await self.get_relevant_archives(query)
        
        all_transactions = []
        total_count = 0
        
        for metadata in archive_metadatas:
            # Load archive
            transactions = await self.archive_manager.load_archive(metadata)
            if not transactions:
                continue
            
            # Apply filters
            filtered_transactions = self.apply_filters(transactions, query)
            all_transactions.extend(filtered_transactions)
            total_count += len(filtered_transactions)
        
        # Apply pagination
        start_idx = query.offset
        end_idx = start_idx + query.limit
        paginated_transactions = all_transactions[start_idx:end_idx]
        
        logger.info(f"Query returned {len(paginated_transactions)} transactions from {total_count} total matches")
        
        return paginated_transactions, total_count
    
    async def get_relevant_archives(self, query: QueryRequest) -> List[ArchiveMetadata]:
        """Get archive metadata for time range"""
        query_sql = """
        SELECT id, file_path, format, compression, start_timestamp, end_timestamp,
               chain_id, transaction_count, file_size_bytes, created_at, checksum
        FROM archive_metadata
        WHERE start_timestamp <= $1 AND end_timestamp >= $2
        """
        params = [query.end_time, query.start_time]
        
        if query.chain_ids:
            query_sql += " AND chain_id = ANY($3)"
            params.append(query.chain_ids)
        
        query_sql += " ORDER BY start_timestamp"
        
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch(query_sql, *params)
        
        metadatas = []
        for row in rows:
            metadata = ArchiveMetadata(
                id=row['id'],
                file_path=row['file_path'],
                format=row['format'],
                compression=row['compression'],
                start_timestamp=row['start_timestamp'],
                end_timestamp=row['end_timestamp'],
                chain_id=row['chain_id'],
                transaction_count=row['transaction_count'],
                file_size_bytes=row['file_size_bytes'],
                created_at=row['created_at'],
                checksum=row['checksum']
            )
            metadatas.append(metadata)
        
        return metadatas
    
    def apply_filters(self, transactions: List[Transaction], query: QueryRequest) -> List[Transaction]:
        """Apply query filters to transactions"""
        filtered = []
        
        for tx in transactions:
            # Time range filter
            tx_time = datetime.fromtimestamp(tx.timestamp)
            if tx_time < query.start_time or tx_time > query.end_time:
                continue
            
            # Address filters
            if query.from_addresses and tx.from_address not in query.from_addresses:
                continue
            
            if query.to_addresses and tx.to_address not in query.to_addresses:
                continue
            
            # Value filters
            if query.value_min:
                try:
                    if int(tx.value) < int(query.value_min):
                        continue
                except (ValueError, TypeError):
                    pass
            
            if query.value_max:
                try:
                    if int(tx.value) > int(query.value_max):
                        continue
                except (ValueError, TypeError):
                    pass
            
            # Gas price filters
            if query.gas_price_min:
                try:
                    if int(tx.gas_price) < int(query.gas_price_min):
                        continue
                except (ValueError, TypeError):
                    pass
            
            if query.gas_price_max:
                try:
                    if int(tx.gas_price) > int(query.gas_price_max):
                        continue
                except (ValueError, TypeError):
                    pass
            
            filtered.append(tx)
        
        return filtered

class TimeMachineService:
    """Main Time Machine service"""
    
    def __init__(self):
        self.config = config
        self.consumer = None
        self.db_pool = None
        self.s3_manager = S3Manager(config)
        self.archive_manager = ArchiveManager(self.s3_manager)
        self.query_engine = None
        
        # Transaction buffer for archiving
        self.transaction_buffer: List[Transaction] = []
        self.last_archive_time = datetime.now()
    
    async def initialize(self):
        """Initialize service components"""
        # Initialize Kafka consumer
        consumer_config = {
            'bootstrap.servers': self.config.kafka_brokers,
            'group.id': self.config.kafka_consumer_group,
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': True,
        }
        self.consumer = Consumer(consumer_config)
        self.consumer.subscribe([self.config.kafka_input_topic])
        
        # Initialize database
        self.db_pool = await asyncpg.create_pool(self.config.postgres_url, min_size=5, max_size=20)
        
        # Initialize query engine
        self.query_engine = QueryEngine(self.db_pool, self.archive_manager)
        
        logger.info("Time Machine service initialized")
    
    async def start(self):
        """Start the Time Machine service"""
        await self.initialize()
        
        logger.info("Starting Scorpius Time Machine Service")
        
        # Start background tasks
        asyncio.create_task(self.process_transactions())
        asyncio.create_task(self.periodic_archiving())
        asyncio.create_task(self.cleanup_old_archives())
        
        # Keep service running
        try:
            await asyncio.Event().wait()
        except KeyboardInterrupt:
            logger.info("Shutting down Time Machine service")
            await self.cleanup()
    
    async def process_transactions(self):
        """Process incoming transactions from Kafka"""
        while True:
            try:
                message = self.consumer.poll(timeout=1.0)
                
                if message is None:
                    continue
                
                if message.error():
                    if message.error().code() == KafkaError._PARTITION_EOF:
                        continue
                    else:
                        logger.error(f"Kafka error: {message.error()}")
                        continue
                
                # Parse transaction
                try:
                    tx_data = json.loads(message.value().decode('utf-8'))
                    transaction = Transaction(**tx_data)
                    
                    # Add to buffer
                    self.transaction_buffer.append(transaction)
                    
                    # Check if buffer is full
                    if len(self.transaction_buffer) >= self.config.batch_size:
                        await self.create_archive_from_buffer()
                    
                except Exception as e:
                    logger.error(f"Failed to process transaction: {e}")
                
            except Exception as e:
                logger.error(f"Error in transaction processing loop: {e}")
                await asyncio.sleep(5)
    
    async def periodic_archiving(self):
        """Periodic archiving of buffered transactions"""
        while True:
            try:
                await asyncio.sleep(self.config.archive_interval_hours * 3600)
                
                if self.transaction_buffer:
                    await self.create_archive_from_buffer()
                
            except Exception as e:
                logger.error(f"Error in periodic archiving: {e}")
    
    async def create_archive_from_buffer(self):
        """Create archive from current transaction buffer"""
        if not self.transaction_buffer:
            return
        
        try:
            # Group transactions by chain
            chain_groups = {}
            for tx in self.transaction_buffer:
                chain_id = tx.chain_id
                if chain_id not in chain_groups:
                    chain_groups[chain_id] = []
                chain_groups[chain_id].append(tx)
            
            # Create archive for each chain
            for chain_id, transactions in chain_groups.items():
                await self.create_archive(transactions, chain_id)
            
            # Clear buffer
            self.transaction_buffer.clear()
            self.last_archive_time = datetime.now()
            
        except Exception as e:
            logger.error(f"Failed to create archive from buffer: {e}")
    
    async def create_archive(self, transactions: List[Transaction], chain_id: int):
        """Create archive file for transactions"""
        if not transactions:
            return
        
        # Sort transactions by timestamp
        transactions.sort(key=lambda tx: tx.timestamp)
        
        start_time = datetime.fromtimestamp(transactions[0].timestamp)
        end_time = datetime.fromtimestamp(transactions[-1].timestamp)
        
        # Generate file path
        file_path = f"chain_{chain_id}/{start_time.year}/{start_time.month:02d}/{start_time.day:02d}/{start_time.hour:02d}/transactions.{self.config.archive_format}.{self.config.compression_type}"
        
        # Create metadata
        metadata = ArchiveMetadata(
            id=UUID(),
            file_path=file_path,
            format=self.config.archive_format,
            compression=self.config.compression_type,
            start_timestamp=start_time,
            end_timestamp=end_time,
            chain_id=chain_id,
            transaction_count=len(transactions),
            file_size_bytes=0,  # Will be updated after compression
            created_at=datetime.now(),
            checksum=""  # Will be calculated
        )
        
        # Create archive
        success = await self.archive_manager.create_archive(transactions, metadata)
        
        if success:
            # Save metadata to database
            await self.save_archive_metadata(metadata)
            logger.info(f"Archived {len(transactions)} transactions for chain {chain_id}")
    
    async def save_archive_metadata(self, metadata: ArchiveMetadata):
        """Save archive metadata to database"""
        try:
            query = """
            INSERT INTO archive_metadata 
            (id, file_path, format, compression, start_timestamp, end_timestamp,
             chain_id, transaction_count, file_size_bytes, created_at, checksum)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            """
            async with self.db_pool.acquire() as conn:
                await conn.execute(
                    query,
                    metadata.id,
                    metadata.file_path,
                    metadata.format,
                    metadata.compression,
                    metadata.start_timestamp,
                    metadata.end_timestamp,
                    metadata.chain_id,
                    metadata.transaction_count,
                    metadata.file_size_bytes,
                    metadata.created_at,
                    metadata.checksum
                )
        except Exception as e:
            logger.error(f"Failed to save archive metadata: {e}")
    
    async def cleanup_old_archives(self):
        """Clean up archives older than retention period"""
        while True:
            try:
                await asyncio.sleep(24 * 3600)  # Run daily
                
                cutoff_date = datetime.now() - timedelta(days=self.config.retention_days)
                
                # Get old archives
                query = """
                SELECT id, file_path FROM archive_metadata
                WHERE created_at < $1
                """
                
                async with self.db_pool.acquire() as conn:
                    rows = await conn.fetch(query, cutoff_date)
                
                # Delete files and metadata
                for row in rows:
                    # Delete from S3
                    await self.s3_manager.delete_file(row['file_path'])
                    
                    # Delete metadata
                    delete_query = "DELETE FROM archive_metadata WHERE id = $1"
                    async with self.db_pool.acquire() as conn:
                        await conn.execute(delete_query, row['id'])
                
                if rows:
                    logger.info(f"Cleaned up {len(rows)} old archives")
                
            except Exception as e:
                logger.error(f"Error in cleanup task: {e}")
    
    async def cleanup(self):
        """Cleanup resources"""
        if self.consumer:
            self.consumer.close()
        if self.db_pool:
            await self.db_pool.close()

async def main():
    """Main entry point"""
    service = TimeMachineService()
    await service.start()

if __name__ == "__main__":
    asyncio.run(main())
