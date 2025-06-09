from ..engine.engine import ScorpiusEngine

engine = ScorpiusEngine()

def schedule_scan(contract_address: str):
    return engine.submit_scan(contract_address)
