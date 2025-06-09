import {
  LiveMempoolAlerts,
  ExploitFindings,
  ReplaySession,
} from "@/components/Dashboard";

const Index = () => {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-accent mb-2 text-glow">
          Security Dashboard
        </h1>
        <p className="text-gray-400">
          Real-time blockchain security monitoring and analysis
        </p>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
        <LiveMempoolAlerts />
        <ExploitFindings />
        <ReplaySession />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <div className="gradient-gray-box rounded-xl p-4 border border-gray-600 enhanced-glow hover:pulse-glow transition-all duration-300 group">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl font-bold text-accent font-mono animate-pulse">
              24/7
            </div>
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          </div>
          <div className="text-sm text-gray-400 mb-2">Active Monitoring</div>
          <div className="w-full bg-gray-800 rounded-full h-1">
            <div className="h-1 bg-accent rounded-full w-full data-stream" />
          </div>
        </div>

        <div className="gradient-gray-box rounded-xl p-4 border border-gray-600 enhanced-glow hover:pulse-glow transition-all duration-300 group">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl font-bold text-accent font-mono">
              99.9%
            </div>
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          </div>
          <div className="text-sm text-gray-400 mb-2">System Uptime</div>
          <div className="w-full bg-gray-800 rounded-full h-1">
            <div
              className="h-1 bg-accent rounded-full data-stream"
              style={{ width: "99.9%" }}
            />
          </div>
        </div>

        <div className="gradient-gray-box rounded-xl p-4 border border-gray-600 enhanced-glow hover:pulse-glow transition-all duration-300 group">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl font-bold text-accent font-mono">2.3K</div>
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          </div>
          <div className="text-sm text-gray-400 mb-2">Threats Blocked</div>
          <div className="flex gap-1">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="h-1 rounded flex-1"
                style={{
                  backgroundColor: i < 7 ? "#00FFD1" : "rgb(0 255 209 / 0.3)",
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="gradient-gray-box rounded-xl p-4 border border-gray-600 enhanced-glow hover:pulse-glow transition-all duration-300 group">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl font-bold text-accent font-mono">15ms</div>
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          </div>
          <div className="text-sm text-gray-400 mb-2">Response Time</div>
          <div className="flex items-center gap-1">
            <div className="flex-1 bg-gray-800 rounded-full h-1">
              <div
                className="h-1 bg-accent rounded-full data-stream"
                style={{ width: "85%" }}
              />
            </div>
            <span className="text-xs text-accent font-mono">FAST</span>
          </div>
        </div>
      </div>

      {/* System Vitals */}
      <div className="mt-8 gradient-gray-box rounded-2xl p-6 border border-gray-600 enhanced-glow">
        <h3 className="text-lg font-semibold text-glow text-accent mb-4">
          System Vitals
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Network Activity */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-accent">
              Network Activity
            </h4>
            <div className="space-y-2">
              {["Ethereum", "Polygon", "Arbitrum"].map((network, i) => (
                <div
                  key={network}
                  className="flex justify-between items-center"
                >
                  <span className="text-sm text-gray-400">{network}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-800 rounded-full h-1">
                      <div
                        className="h-1 rounded-full data-stream bg-accent"
                        style={{ width: `${75 + i * 10}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-gray-400">
                      {75 + i * 10}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Events */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-accent">Security Events</h4>
            <div className="space-y-2">
              {[
                { label: "Blocked", count: 1247, color: "text-accent" },
                { label: "Quarantined", count: 23, color: "text-yellow-400" },
                { label: "Investigating", count: 5, color: "text-red-400" },
              ].map((event) => (
                <div
                  key={event.label}
                  className="flex justify-between items-center"
                >
                  <span className="text-sm text-gray-400">{event.label}</span>
                  <span
                    className={`text-sm font-mono ${event.color} animate-pulse`}
                  >
                    {event.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-accent">Performance</h4>
            <div className="space-y-2">
              {[
                { label: "CPU Usage", value: "34%", color: "text-accent" },
                { label: "Memory", value: "2.1GB", color: "text-accent" },
                { label: "Disk I/O", value: "127MB/s", color: "text-accent" },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="flex justify-between items-center"
                >
                  <span className="text-sm text-gray-400">{metric.label}</span>
                  <span className={`text-sm font-mono ${metric.color}`}>
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
