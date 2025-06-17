
import json
from web3 import Web3

def load_contract(w3: Web3, abi_path: str, contract_address: str):
    with open(abi_path) as f:
        abi = json.load(f)['abi']
    return w3.eth.contract(address=Web3.to_checksum_address(contract_address), abi=abi)
