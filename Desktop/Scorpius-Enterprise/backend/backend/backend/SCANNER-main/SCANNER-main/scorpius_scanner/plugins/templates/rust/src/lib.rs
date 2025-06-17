use serde::{Deserialize, Serialize};
use std::io::{self, Read};

#[derive(Deserialize)]
struct ScanRequest {
    target: String,
    context: ScanContext,
}

#[derive(Deserialize)]
struct ScanContext {
    chain_rpc: String,
    block_number: Option<u64>,
    workdir: String,
}

#[derive(Serialize)]
struct Finding {
    id: String,
    title: String,
    severity: String,
    description: String,
    metadata: serde_json::Value,
}

#[derive(Serialize)]
struct ScanResult {
    findings: Vec<Finding>,
}

#[no_mangle]
pub extern "C" fn _start() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    
    let request: ScanRequest = serde_json::from_str(&input).unwrap();
    
    // Plugin logic here
    let findings = scan_contract(&request.target, &request.context);
    
    let result = ScanResult { findings };
    println!("{}", serde_json::to_string(&result).unwrap());
}

fn scan_contract(target: &str, _ctx: &ScanContext) -> Vec<Finding> {
    // Example: Simple reentrancy detector
    if target.contains("withdraw") && target.contains("call") {
        vec![Finding {
            id: "potential-reentrancy".to_string(),
            title: "Potential Reentrancy".to_string(),
            severity: "medium".to_string(),
            description: "Contract may be vulnerable to reentrancy attacks".to_string(),
            metadata: serde_json::json!({
                "pattern": "withdraw+call",
                "confidence": 0.7
            }),
        }]
    } else {
        vec![]
    }
}
