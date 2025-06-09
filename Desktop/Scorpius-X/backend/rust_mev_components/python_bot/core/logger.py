# logging_setup.py (the file is named logger.py, but code references "logging_setup.py")
import logging
import logging.handlers
import os
import sys

try:
    from config import load_config
    CONFIG = load_config()
    LOG_DIR = CONFIG.get('LOG_DIRECTORY', './logs')
    CONSOLE_LEVEL = CONFIG.get('CONSOLE_LOG_LEVEL', 'INFO').upper()
    FILE_LEVEL = CONFIG.get('FILE_LOG_LEVEL', 'DEBUG').upper()
    LOG_MAX_BYTES = CONFIG.get('LOG_MAX_SIZE_MB', 20) * 1024 * 1024
    LOG_BACKUP_COUNT = CONFIG.get('LOG_BACKUP_COUNT', 7)
except Exception as config_err:
    # Fallback if config loading fails
    print(f"CRITICAL: Failed to load config for logging: {config_err}. Using basic defaults.", file=sys.stderr)
    LOG_DIR = './logs'
    CONSOLE_LEVEL = 'INFO'
    FILE_LEVEL = 'INFO'
    LOG_MAX_BYTES = 20 * 1024 * 1024
    LOG_BACKUP_COUNT = 5

# Ensure log directory exists
try:
    if not os.path.exists(LOG_DIR):
        os.makedirs(LOG_DIR, exist_ok=True)
except OSError as e:
    print(f"WARNING: Could not create log directory '{LOG_DIR}': {e}", file=sys.stderr)
    LOG_DIR = '.'

console_formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)-8s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

file_formatter = logging.Formatter(
    '{"timestamp": "%(asctime)s", "name": "%(name)s", "level": "%(levelname)s", "message": %(message)s, "pathname": "%(pathname)s", "lineno": %(lineno)d}',
    datefmt='%Y-%m-%dT%H:%M:%S.%f%z'
)

root_logger = logging.getLogger()
root_logger.setLevel(logging.DEBUG)

# Console handler
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(console_formatter)
try:
    console_handler.setLevel(CONSOLE_LEVEL)
except ValueError:
    print(f"WARNING: Invalid CONSOLE_LOG_LEVEL '{CONSOLE_LEVEL}', defaulting to INFO.", file=sys.stderr)
    console_handler.setLevel(logging.INFO)
root_logger.addHandler(console_handler)

# Rotating file handler (combined)
try:
    combined_log_path = os.path.join(LOG_DIR, 'mev_bot_combined.log')
    file_handler = logging.handlers.RotatingFileHandler(
        combined_log_path,
        maxBytes=LOG_MAX_BYTES,
        backupCount=LOG_BACKUP_COUNT,
        encoding='utf-8'
    )
    file_handler.setFormatter(file_formatter)
    try:
        file_handler.setLevel(FILE_LEVEL)
    except ValueError:
        print(f"WARNING: Invalid FILE_LOG_LEVEL '{FILE_LEVEL}', defaulting to DEBUG.", file=sys.stderr)
        file_handler.setLevel(logging.DEBUG)
    root_logger.addHandler(file_handler)
except Exception as e:
    print(f"WARNING: Failed to create rotating file handler for combined log: {e}", file=sys.stderr)

# Rotating file handler (error-level only)
try:
    error_log_path = os.path.join(LOG_DIR, 'mev_bot_error.log')
    error_handler = logging.handlers.RotatingFileHandler(
        error_log_path,
        maxBytes=LOG_MAX_BYTES,
        backupCount=LOG_BACKUP_COUNT,
        encoding='utf-8'
    )
    error_handler.setFormatter(file_formatter)
    error_handler.setLevel(logging.ERROR)
    root_logger.addHandler(error_handler)
except Exception as e:
    print(f"WARNING: Failed to create rotating file handler for error log: {e}", file=sys.stderr)

def handle_exception(exc_type, exc_value, exc_traceback):
    if issubclass(exc_type, KeyboardInterrupt):
        sys.__excepthook__(exc_type, exc_value, exc_traceback)
        return
    root_logger.critical("Uncaught exception", exc_info=(exc_type, exc_value, exc_traceback))

sys.excepthook = handle_exception

logger_instance = logging.getLogger("MEVBotApp")
