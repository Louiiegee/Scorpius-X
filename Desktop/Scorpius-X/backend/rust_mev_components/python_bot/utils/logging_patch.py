
import csv
from datetime import datetime

def log_arbitrage_opportunity(pair, profit, confidence):
    with open("arbitrage_log.csv", mode="a", newline="") as file:
        writer = csv.writer(file)
        writer.writerow([
            datetime.utcnow().isoformat(),
            pair,
            profit,
            confidence
        ])
