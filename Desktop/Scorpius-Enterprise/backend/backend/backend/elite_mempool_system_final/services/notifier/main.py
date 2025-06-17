"""
Scorpius Mempool Elite Notifier Service

Multi-channel notification service for sending alerts via email, Slack, Discord, 
webhooks, and other channels with rate limiting, templating, and delivery tracking.
"""

import asyncio
import json
import logging
import os
import smtplib
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, List, Optional, Any
from uuid import UUID, uuid4

import aiohttp
import aioredis
from confluent_kafka import Consumer, KafkaError
from jinja2 import Environment, BaseLoader
from pydantic import BaseModel, Field
import asyncpg

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AlertSeverity(str):
    """Alert severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class NotificationChannel(str):
    """Notification channel types"""
    EMAIL = "email"
    SLACK = "slack"
    DISCORD = "discord"
    WEBHOOK = "webhook"
    SMS = "sms"
    TELEGRAM = "telegram"

class NotificationStatus(str):
    """Notification delivery status"""
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    RATE_LIMITED = "rate_limited"

class Alert(BaseModel):
    """Alert data model"""
    id: UUID
    rule_id: UUID
    transaction_hash: str
    chain_id: int
    severity: AlertSeverity
    title: str
    description: str
    metadata: Dict[str, Any]
    created_at: datetime
    tags: List[str]

class NotificationConfig(BaseModel):
    """Notification channel configuration"""
    channel: NotificationChannel
    enabled: bool
    config: Dict[str, Any]
    rate_limit_per_hour: int = 100
    severity_threshold: AlertSeverity = AlertSeverity.LOW

class NotificationTemplate(BaseModel):
    """Notification template"""
    id: UUID
    name: str
    channel: NotificationChannel
    subject_template: str
    body_template: str
    variables: Dict[str, str] = {}

class NotificationDelivery(BaseModel):
    """Notification delivery record"""
    id: UUID
    alert_id: UUID
    channel: NotificationChannel
    status: NotificationStatus
    recipient: str
    sent_at: Optional[datetime] = None
    error_message: Optional[str] = None
    retry_count: int = 0

class Config:
    """Service configuration"""
    def __init__(self):
        self.kafka_brokers = os.getenv("KAFKA_BROKERS", "localhost:9092")
        self.kafka_input_topic = os.getenv("KAFKA_INPUT_TOPIC", "alerts")
        self.kafka_consumer_group = os.getenv("KAFKA_CONSUMER_GROUP", "notifier-service")
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.postgres_url = os.getenv("POSTGRES_URL", "postgresql://postgres:password@localhost:5432/scorpius")
        
        # Email configuration
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.email_from = os.getenv("EMAIL_FROM", "alerts@scorpius.com")
        
        # Slack configuration
        self.slack_webhook_url = os.getenv("SLACK_WEBHOOK_URL", "")
        self.slack_bot_token = os.getenv("SLACK_BOT_TOKEN", "")
        
        # Discord configuration
        self.discord_webhook_url = os.getenv("DISCORD_WEBHOOK_URL", "")
        
        # Rate limiting
        self.max_notifications_per_hour = int(os.getenv("MAX_NOTIFICATIONS_PER_HOUR", "1000"))
        self.max_retries = int(os.getenv("MAX_RETRIES", "3"))
        self.retry_delay_seconds = int(os.getenv("RETRY_DELAY_SECONDS", "60"))

config = Config()

class RateLimiter:
    """Rate limiter for notifications"""
    
    def __init__(self, redis_client: aioredis.Redis):
        self.redis = redis_client
    
    async def is_rate_limited(self, channel: str, recipient: str, limit_per_hour: int) -> bool:
        """Check if recipient is rate limited for a channel"""
        key = f"rate_limit:{channel}:{recipient}"
        current_hour = datetime.now().hour
        count_key = f"{key}:{current_hour}"
        
        current_count = await self.redis.get(count_key)
        if current_count is None:
            current_count = 0
        else:
            current_count = int(current_count)
        
        return current_count >= limit_per_hour
    
    async def increment_rate_limit(self, channel: str, recipient: str) -> None:
        """Increment rate limit counter"""
        key = f"rate_limit:{channel}:{recipient}"
        current_hour = datetime.now().hour
        count_key = f"{key}:{current_hour}"
        
        await self.redis.incr(count_key)
        await self.redis.expire(count_key, 3600)  # Expire after 1 hour

class EmailNotifier:
    """Email notification handler"""
    
    def __init__(self, config: Config):
        self.config = config
    
    async def send_notification(
        self, 
        alert: Alert, 
        recipient: str, 
        template: NotificationTemplate
    ) -> NotificationDelivery:
        """Send email notification"""
        delivery = NotificationDelivery(
            id=uuid4(),
            alert_id=alert.id,
            channel=NotificationChannel.EMAIL,
            status=NotificationStatus.PENDING,
            recipient=recipient
        )
        
        try:
            # Render template
            subject = self._render_template(template.subject_template, alert)
            body = self._render_template(template.body_template, alert)
            
            # Create email message
            msg = MIMEMultipart()
            msg['From'] = self.config.email_from
            msg['To'] = recipient
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'html'))
            
            # Send email
            with smtplib.SMTP(self.config.smtp_server, self.config.smtp_port) as server:
                server.starttls()
                if self.config.smtp_username and self.config.smtp_password:
                    server.login(self.config.smtp_username, self.config.smtp_password)
                server.sendmail(self.config.email_from, recipient, msg.as_string())
            
            delivery.status = NotificationStatus.SENT
            delivery.sent_at = datetime.now()
            logger.info(f"Email sent to {recipient} for alert {alert.id}")
            
        except Exception as e:
            delivery.status = NotificationStatus.FAILED
            delivery.error_message = str(e)
            logger.error(f"Failed to send email to {recipient}: {e}")
        
        return delivery
    
    def _render_template(self, template: str, alert: Alert) -> str:
        """Render Jinja2 template with alert data"""
        env = Environment(loader=BaseLoader())
        template_obj = env.from_string(template)
        
        return template_obj.render(
            alert=alert,
            severity=alert.severity,
            title=alert.title,
            description=alert.description,
            transaction_hash=alert.transaction_hash,
            chain_id=alert.chain_id,
            created_at=alert.created_at,
            tags=", ".join(alert.tags),
            metadata=alert.metadata
        )

class SlackNotifier:
    """Slack notification handler"""
    
    def __init__(self, config: Config):
        self.config = config
    
    async def send_notification(
        self, 
        alert: Alert, 
        recipient: str, 
        template: NotificationTemplate
    ) -> NotificationDelivery:
        """Send Slack notification"""
        delivery = NotificationDelivery(
            id=uuid4(),
            alert_id=alert.id,
            channel=NotificationChannel.SLACK,
            status=NotificationStatus.PENDING,
            recipient=recipient
        )
        
        try:
            # Create Slack message
            message = self._create_slack_message(alert, template)
            
            async with aiohttp.ClientSession() as session:
                if self.config.slack_webhook_url:
                    # Use webhook
                    async with session.post(self.config.slack_webhook_url, json=message) as response:
                        if response.status == 200:
                            delivery.status = NotificationStatus.SENT
                            delivery.sent_at = datetime.now()
                        else:
                            delivery.status = NotificationStatus.FAILED
                            delivery.error_message = f"HTTP {response.status}: {await response.text()}"
                else:
                    delivery.status = NotificationStatus.FAILED
                    delivery.error_message = "No Slack webhook URL configured"
            
            logger.info(f"Slack notification sent for alert {alert.id}")
            
        except Exception as e:
            delivery.status = NotificationStatus.FAILED
            delivery.error_message = str(e)
            logger.error(f"Failed to send Slack notification: {e}")
        
        return delivery
    
    def _create_slack_message(self, alert: Alert, template: NotificationTemplate) -> Dict[str, Any]:
        """Create Slack message payload"""
        color_map = {
            AlertSeverity.LOW: "#36a64f",
            AlertSeverity.MEDIUM: "#ff9900",
            AlertSeverity.HIGH: "#ff4444",
            AlertSeverity.CRITICAL: "#cc0000"
        }
        
        return {
            "text": f"Scorpius Alert: {alert.title}",
            "attachments": [
                {
                    "color": color_map.get(alert.severity, "#cccccc"),
                    "fields": [
                        {
                            "title": "Severity",
                            "value": alert.severity.upper(),
                            "short": True
                        },
                        {
                            "title": "Transaction",
                            "value": f"<https://etherscan.io/tx/{alert.transaction_hash}|{alert.transaction_hash[:12]}...>",
                            "short": True
                        },
                        {
                            "title": "Chain ID",
                            "value": str(alert.chain_id),
                            "short": True
                        },
                        {
                            "title": "Time",
                            "value": alert.created_at.strftime("%Y-%m-%d %H:%M:%S UTC"),
                            "short": True
                        },
                        {
                            "title": "Description",
                            "value": alert.description,
                            "short": False
                        }
                    ],
                    "footer": "Scorpius Mempool Elite",
                    "ts": int(alert.created_at.timestamp())
                }
            ]
        }

class DiscordNotifier:
    """Discord notification handler"""
    
    def __init__(self, config: Config):
        self.config = config
    
    async def send_notification(
        self, 
        alert: Alert, 
        recipient: str, 
        template: NotificationTemplate
    ) -> NotificationDelivery:
        """Send Discord notification"""
        delivery = NotificationDelivery(
            id=uuid4(),
            alert_id=alert.id,
            channel=NotificationChannel.DISCORD,
            status=NotificationStatus.PENDING,
            recipient=recipient
        )
        
        try:
            # Create Discord embed
            embed = self._create_discord_embed(alert)
            
            async with aiohttp.ClientSession() as session:
                payload = {
                    "content": f"🚨 **Scorpius Alert**: {alert.title}",
                    "embeds": [embed]
                }
                
                async with session.post(self.config.discord_webhook_url, json=payload) as response:
                    if response.status == 204:  # Discord returns 204 for successful webhook
                        delivery.status = NotificationStatus.SENT
                        delivery.sent_at = datetime.now()
                    else:
                        delivery.status = NotificationStatus.FAILED
                        delivery.error_message = f"HTTP {response.status}: {await response.text()}"
            
            logger.info(f"Discord notification sent for alert {alert.id}")
            
        except Exception as e:
            delivery.status = NotificationStatus.FAILED
            delivery.error_message = str(e)
            logger.error(f"Failed to send Discord notification: {e}")
        
        return delivery
    
    def _create_discord_embed(self, alert: Alert) -> Dict[str, Any]:
        """Create Discord embed payload"""
        color_map = {
            AlertSeverity.LOW: 3066993,    # Green
            AlertSeverity.MEDIUM: 16776960, # Yellow
            AlertSeverity.HIGH: 16711680,   # Red
            AlertSeverity.CRITICAL: 8388608 # Dark Red
        }
        
        return {
            "title": alert.title,
            "description": alert.description,
            "color": color_map.get(alert.severity, 12632256),  # Default gray
            "fields": [
                {
                    "name": "Severity",
                    "value": alert.severity.upper(),
                    "inline": True
                },
                {
                    "name": "Chain ID",
                    "value": str(alert.chain_id),
                    "inline": True
                },
                {
                    "name": "Transaction Hash",
                    "value": f"[{alert.transaction_hash[:12]}...](https://etherscan.io/tx/{alert.transaction_hash})",
                    "inline": False
                }
            ],
            "footer": {
                "text": "Scorpius Mempool Elite"
            },
            "timestamp": alert.created_at.isoformat()
        }

class NotifierService:
    """Main notifier service"""
    
    def __init__(self):
        self.config = config
        self.consumer = None
        self.redis_client = None
        self.db_pool = None
        self.rate_limiter = None
        
        # Initialize notifiers
        self.email_notifier = EmailNotifier(config)
        self.slack_notifier = SlackNotifier(config)
        self.discord_notifier = DiscordNotifier(config)
        
        # Notification configurations and templates cache
        self.notification_configs: Dict[str, NotificationConfig] = {}
        self.templates: Dict[UUID, NotificationTemplate] = {}
    
    async def initialize(self):
        """Initialize service components"""
        # Initialize Kafka consumer
        consumer_config = {
            'bootstrap.servers': self.config.kafka_brokers,
            'group.id': self.config.kafka_consumer_group,
            'auto.offset.reset': 'latest',
            'enable.auto.commit': True,
        }
        self.consumer = Consumer(consumer_config)
        self.consumer.subscribe([self.config.kafka_input_topic])
        
        # Initialize Redis
        self.redis_client = await aioredis.from_url(self.config.redis_url)
        self.rate_limiter = RateLimiter(self.redis_client)
        
        # Initialize database
        self.db_pool = await asyncpg.create_pool(self.config.postgres_url, min_size=5, max_size=20)
        
        # Load notification configurations and templates
        await self.load_configurations()
        
        logger.info("Notifier service initialized")
    
    async def start(self):
        """Start the notifier service"""
        await self.initialize()
        
        logger.info("Starting Scorpius Notifier Service")
        
        # Start background tasks
        asyncio.create_task(self.process_alerts())
        asyncio.create_task(self.retry_failed_notifications())
        asyncio.create_task(self.periodic_config_reload())
        
        # Keep service running
        try:
            await asyncio.Event().wait()
        except KeyboardInterrupt:
            logger.info("Shutting down notifier service")
            await self.cleanup()
    
    async def process_alerts(self):
        """Main alert processing loop"""
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
                
                # Parse alert
                try:
                    alert_data = json.loads(message.value().decode('utf-8'))
                    alert = Alert(**alert_data)
                    
                    # Process notification
                    await self.process_alert_notification(alert)
                    
                except Exception as e:
                    logger.error(f"Failed to process alert: {e}")
                
            except Exception as e:
                logger.error(f"Error in alert processing loop: {e}")
                await asyncio.sleep(5)
    
    async def process_alert_notification(self, alert: Alert):
        """Process notification for a single alert"""
        logger.info(f"Processing notifications for alert {alert.id}")
        
        # Get applicable notification configurations
        applicable_configs = await self.get_applicable_configs(alert)
        
        for config_name, notification_config in applicable_configs.items():
            if not notification_config.enabled:
                continue
            
            # Check severity threshold
            if not self._meets_severity_threshold(alert.severity, notification_config.severity_threshold):
                continue
            
            # Get recipients
            recipients = await self.get_recipients(config_name, alert)
            
            for recipient in recipients:
                # Check rate limits
                if await self.rate_limiter.is_rate_limited(
                    notification_config.channel, 
                    recipient, 
                    notification_config.rate_limit_per_hour
                ):
                    logger.warning(f"Rate limited: {notification_config.channel} to {recipient}")
                    continue
                
                # Get template
                template = await self.get_template(notification_config.channel, alert.severity)
                
                # Send notification
                delivery = await self.send_notification(
                    alert, 
                    recipient, 
                    notification_config, 
                    template
                )
                
                # Save delivery record
                await self.save_delivery_record(delivery)
                
                # Update rate limiter
                await self.rate_limiter.increment_rate_limit(
                    notification_config.channel, 
                    recipient
                )
    
    async def send_notification(
        self, 
        alert: Alert, 
        recipient: str, 
        config: NotificationConfig, 
        template: NotificationTemplate
    ) -> NotificationDelivery:
        """Send notification via appropriate channel"""
        try:
            if config.channel == NotificationChannel.EMAIL:
                return await self.email_notifier.send_notification(alert, recipient, template)
            elif config.channel == NotificationChannel.SLACK:
                return await self.slack_notifier.send_notification(alert, recipient, template)
            elif config.channel == NotificationChannel.DISCORD:
                return await self.discord_notifier.send_notification(alert, recipient, template)
            else:
                # Create failed delivery for unsupported channel
                return NotificationDelivery(
                    id=uuid4(),
                    alert_id=alert.id,
                    channel=config.channel,
                    status=NotificationStatus.FAILED,
                    recipient=recipient,
                    error_message=f"Unsupported channel: {config.channel}"
                )
        except Exception as e:
            logger.error(f"Failed to send notification: {e}")
            return NotificationDelivery(
                id=uuid4(),
                alert_id=alert.id,
                channel=config.channel,
                status=NotificationStatus.FAILED,
                recipient=recipient,
                error_message=str(e)
            )
    
    async def load_configurations(self):
        """Load notification configurations from database"""
        try:
            # Load notification configs (simplified - would come from database)
            self.notification_configs = {
                "default_email": NotificationConfig(
                    channel=NotificationChannel.EMAIL,
                    enabled=True,
                    config={"recipients": ["admin@scorpius.com"]},
                    rate_limit_per_hour=50,
                    severity_threshold=AlertSeverity.MEDIUM
                ),
                "slack_critical": NotificationConfig(
                    channel=NotificationChannel.SLACK,
                    enabled=True,
                    config={"channel": "#alerts"},
                    rate_limit_per_hour=100,
                    severity_threshold=AlertSeverity.HIGH
                ),
                "discord_all": NotificationConfig(
                    channel=NotificationChannel.DISCORD,
                    enabled=True,
                    config={"webhook_url": config.discord_webhook_url},
                    rate_limit_per_hour=200,
                    severity_threshold=AlertSeverity.LOW
                )
            }
            
            # Load templates (simplified)
            self.templates = {
                uuid4(): NotificationTemplate(
                    id=uuid4(),
                    name="Default Email",
                    channel=NotificationChannel.EMAIL,
                    subject_template="🚨 Scorpius Alert: {{ alert.title }}",
                    body_template="""
                    <h2>Scorpius Mempool Alert</h2>
                    <p><strong>Severity:</strong> {{ alert.severity.upper() }}</p>
                    <p><strong>Title:</strong> {{ alert.title }}</p>
                    <p><strong>Description:</strong> {{ alert.description }}</p>
                    <p><strong>Transaction:</strong> <a href="https://etherscan.io/tx/{{ alert.transaction_hash }}">{{ alert.transaction_hash }}</a></p>
                    <p><strong>Chain ID:</strong> {{ alert.chain_id }}</p>
                    <p><strong>Time:</strong> {{ alert.created_at }}</p>
                    <p><strong>Tags:</strong> {{ tags }}</p>
                    """
                )
            }
            
            logger.info("Notification configurations loaded")
            
        except Exception as e:
            logger.error(f"Failed to load configurations: {e}")
    
    async def get_applicable_configs(self, alert: Alert) -> Dict[str, NotificationConfig]:
        """Get notification configurations applicable to an alert"""
        # In a real implementation, this would query database based on alert properties
        return self.notification_configs
    
    async def get_recipients(self, config_name: str, alert: Alert) -> List[str]:
        """Get recipients for a notification configuration"""
        config = self.notification_configs.get(config_name)
        if not config:
            return []
        
        if config.channel == NotificationChannel.EMAIL:
            return config.config.get("recipients", [])
        elif config.channel in [NotificationChannel.SLACK, NotificationChannel.DISCORD]:
            return ["webhook"]  # Webhook doesn't need specific recipients
        
        return []
    
    async def get_template(self, channel: NotificationChannel, severity: AlertSeverity) -> NotificationTemplate:
        """Get notification template for channel and severity"""
        # Return first matching template (simplified)
        for template in self.templates.values():
            if template.channel == channel:
                return template
        
        # Return default template
        return NotificationTemplate(
            id=uuid4(),
            name="Default",
            channel=channel,
            subject_template="{{ alert.title }}",
            body_template="{{ alert.description }}"
        )
    
    def _meets_severity_threshold(self, alert_severity: AlertSeverity, threshold: AlertSeverity) -> bool:
        """Check if alert severity meets threshold"""
        severity_order = [AlertSeverity.LOW, AlertSeverity.MEDIUM, AlertSeverity.HIGH, AlertSeverity.CRITICAL]
        return severity_order.index(alert_severity) >= severity_order.index(threshold)
    
    async def save_delivery_record(self, delivery: NotificationDelivery):
        """Save notification delivery record to database"""
        try:
            query = """
            INSERT INTO notification_deliveries 
            (id, alert_id, channel, status, recipient, sent_at, error_message, retry_count)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """
            async with self.db_pool.acquire() as conn:
                await conn.execute(
                    query,
                    delivery.id,
                    delivery.alert_id,
                    delivery.channel,
                    delivery.status,
                    delivery.recipient,
                    delivery.sent_at,
                    delivery.error_message,
                    delivery.retry_count
                )
        except Exception as e:
            logger.error(f"Failed to save delivery record: {e}")
    
    async def retry_failed_notifications(self):
        """Background task to retry failed notifications"""
        while True:
            try:
                # Get failed notifications that can be retried
                query = """
                SELECT id, alert_id, channel, recipient, retry_count, error_message
                FROM notification_deliveries
                WHERE status = $1 AND retry_count < $2
                AND sent_at < $3
                """
                
                retry_threshold = datetime.now() - timedelta(seconds=config.retry_delay_seconds)
                
                async with self.db_pool.acquire() as conn:
                    rows = await conn.fetch(query, NotificationStatus.FAILED, config.max_retries, retry_threshold)
                
                for row in rows:
                    # Implement retry logic here
                    logger.info(f"Retrying notification {row['id']}")
                
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                logger.error(f"Error in retry task: {e}")
                await asyncio.sleep(60)
    
    async def periodic_config_reload(self):
        """Background task to reload configurations periodically"""
        while True:
            try:
                await asyncio.sleep(300)  # Reload every 5 minutes
                await self.load_configurations()
            except Exception as e:
                logger.error(f"Error reloading configurations: {e}")
    
    async def cleanup(self):
        """Cleanup resources"""
        if self.consumer:
            self.consumer.close()
        if self.redis_client:
            await self.redis_client.close()
        if self.db_pool:
            await self.db_pool.close()

async def main():
    """Main entry point"""
    service = NotifierService()
    await service.start()

if __name__ == "__main__":
    asyncio.run(main())
