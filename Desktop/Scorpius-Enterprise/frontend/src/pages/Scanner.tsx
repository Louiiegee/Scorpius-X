import React from "react";
import { VulnerabilityScanner } from "@/components/scanner/VulnerabilityScanner";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export function ScannerPage() {
  return (
    <ProtectedRoute requiredFeature="basic_scanning">
      <div className="space-y-6">
        <VulnerabilityScanner />
      </div>
    </ProtectedRoute>
  );
}

export default ScannerPage;
