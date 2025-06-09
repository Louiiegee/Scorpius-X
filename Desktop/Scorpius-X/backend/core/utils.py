import asyncio
import functools
import logging
from decimal import Decimal, getcontext
from typing import Any, Callable, TypeVar

getcontext().prec = 50
logger = logging.getLogger(__name__)

T = TypeVar('T')

def async_retry(retries: int = 3, delay: float = 1.0, backoff: float = 2.0) -> Callable:
    """
    Decorator for async functions that provides retry logic with exponential backoff.
    
    Args:
        retries: Number of retry attempts
        delay: Initial delay between retries in seconds
        backoff: Multiplier for delay after each retry
        
    Returns:
        Decorated function with retry logic
    """
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            _delay = delay
            for i in range(retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if i == retries - 1:
                        logger.error(f"Function {func.__name__} failed after {retries} retries: {e}")
                        raise
                    logger.warning(f"Attempt {i+1} for {func.__name__} failed: {e}. Retrying in {_delay:.2f}s...")
                    await asyncio.sleep(_delay)
                    _delay *= backoff
        return wrapper
    return decorator

def ether_to_wei(eth_value: float) -> int:
    """
    Convert Ether value to Wei.
    
    Args:
        eth_value: Value in Ether
        
    Returns:
        Value in Wei
        
    Raises:
        TypeError: If eth_value is not a number
    """
    if not isinstance(eth_value, (int, float, Decimal)):
        raise TypeError("eth_value must be a number")
    return int(Decimal(str(eth_value)) * Decimal(10**18))

def wei_to_ether(wei_value: int) -> float:
    """
    Convert Wei value to Ether.
    
    Args:
        wei_value: Value in Wei
        
    Returns:
        Value in Ether
        
    Raises:
        TypeError: If wei_value is not an integer or Decimal
    """
    if not isinstance(wei_value, (int, Decimal)):
        raise TypeError("wei_value must be an integer or Decimal")
    return float(Decimal(str(wei_value)) / Decimal(10**18))
