import asyncio
import logging
import random
import time
from functools import wraps
from typing import Any, Callable, Optional, TypeVar, Union

logger = logging.getLogger(__name__)

T = TypeVar('T')

def with_retry(
    operation_name: str,
    fn: Callable[..., T],
    *args: Any,
    max_retries: int = 3,
    base_delay_ms: int = 100,
    max_delay_ms: int = 3000,
    retry_factor: float = 1.5,
    retryable_exceptions: tuple = (Exception,),
    **kwargs: Any
) -> T:
    """
    Runs a function with retries and exponential backoff (synchronous).
    """
    delay_ms = base_delay_ms
    last_exception = None

    for attempt in range(max_retries + 1):
        try:
            if attempt > 0:
                jitter = random.uniform(0.8, 1.2)
                sleep_s = min(delay_ms * jitter, max_delay_ms) / 1000.0
                logger.debug(f"[SyncRetry] {operation_name}, attempt {attempt}/{max_retries}, sleeping {sleep_s:.2f}s.")
                time.sleep(sleep_s)
            return fn(*args, **kwargs)

        except retryable_exceptions as e:
            last_exception = e
            delay_ms = min(delay_ms * retry_factor, max_delay_ms)
            if attempt < max_retries:
                logger.warning(f"[SyncRetry] {operation_name} failed attempt {attempt+1}/{max_retries}: {e}")
        except Exception as e:
            logger.error(f"[SyncRetry] {operation_name} non-retryable error: {e}")
            raise

    logger.error(f"[SyncRetry] {operation_name} failed after {max_retries+1} attempts.")
    raise last_exception if last_exception else RuntimeError(f"All retries failed for {operation_name}.")

async def with_retry_async(
    operation_name: str,
    async_fn: Callable[..., Any],
    *args: Any,
    max_retries: int = 3,
    base_delay_ms: int = 100,
    max_delay_ms: int = 3000,
    retry_factor: float = 1.5,
    retryable_exceptions: tuple = (Exception,),
    **kwargs: Any
) -> Any:
    """
    Runs an async function with retries and exponential backoff.
    """
    delay_ms = base_delay_ms
    last_exception = None

    for attempt in range(max_retries + 1):
        try:
            if attempt > 0:
                jitter = random.uniform(0.8, 1.2)
                sleep_s = min(delay_ms * jitter, max_delay_ms) / 1000.0
                logger.debug(f"[AsyncRetry] {operation_name}, attempt {attempt}/{max_retries}, sleeping {sleep_s:.2f}s.")
                await asyncio.sleep(sleep_s)

            result = await async_fn(*args, **kwargs)
            return result

        except retryable_exceptions as e:
            last_exception = e
            delay_ms = min(delay_ms * retry_factor, max_delay_ms)
            if attempt < max_retries:
                logger.warning(f"[AsyncRetry] {operation_name} failed attempt {attempt+1}/{max_retries}: {e}")
        except Exception as e:
            logger.error(f"[AsyncRetry] {operation_name} non-retryable error: {e}")
            raise

    logger.error(f"[AsyncRetry] {operation_name} failed after {max_retries+1} attempts.")
    raise last_exception if last_exception else RuntimeError(f"All async retries failed for {operation_name}.")

def retry_decorator(
    max_retries: int = 3,
    base_delay_ms: int = 100,
    max_delay_ms: int = 3000,
    retry_factor: float = 1.5,
    retryable_exceptions: tuple = (Exception,)
) -> Callable:
    """Decorator to apply sync with_retry logic to a function."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            return with_retry(
                func.__name__,
                func,
                *args,
                max_retries=max_retries,
                base_delay_ms=base_delay_ms,
                max_delay_ms=max_delay_ms,
                retry_factor=retry_factor,
                retryable_exceptions=retryable_exceptions,
                **kwargs
            )
        return wrapper
    return decorator

def async_retry_decorator(
    max_retries: int = 3,
    base_delay_ms: int = 100,
    max_delay_ms: int = 3000,
    retry_factor: float = 1.5,
    retryable_exceptions: tuple = (Exception,)
) -> Callable:
    """Decorator to apply async with_retry_async logic to a function."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await with_retry_async(
                func.__name__,
                func,
                *args,
                max_retries=max_retries,
                base_delay_ms=base_delay_ms,
                max_delay_ms=max_delay_ms,
                retry_factor=retry_factor,
                retryable_exceptions=retryable_exceptions,
                **kwargs
            )
        return wrapper
    return decorator
