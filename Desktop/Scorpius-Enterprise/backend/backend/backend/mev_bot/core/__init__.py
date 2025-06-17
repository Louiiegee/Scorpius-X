"""
Scorpius Enterprise MEV Bot - Core Module
High-performance, modular MEV framework for institutional trading
"""

__version__ = "1.0.0"
__author__ = "Scorpius Team"

from .engine import MEVEngine
from .strategy import AbstractStrategy, StrategyResult
from .types import MEVOpportunity, BundleRequest, TransactionData
from .config import Config

__all__ = [
    'MEVEngine',
    'AbstractStrategy', 
    'StrategyResult',
    'MEVOpportunity',
    'BundleRequest', 
    'TransactionData',
    'Config'
]
