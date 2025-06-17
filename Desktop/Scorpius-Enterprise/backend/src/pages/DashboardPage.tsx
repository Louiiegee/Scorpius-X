import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Welcome to Scorpius</h2>
      <p className="text-muted-foreground">
        Your central hub for blockchain security analysis. Select a module from the sidebar to get started.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Scanner</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Analyze smart contracts for vulnerabilities.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mempool Monitor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track live transactions and MEV opportunities.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure your Scorpius environment.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}