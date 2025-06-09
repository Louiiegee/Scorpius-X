import { Zap, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export const LiveMempoolAlerts = () => {
  return (
    <div className="gradient-gray-box rounded-2xl p-6 shadow-subtle border border-gray-600 enhanced-glow h-full relative overflow-hidden">
      {/* Data stream background */}
      <div className="absolute top-0 left-0 w-full h-1 data-stream" />

      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center pulse-glow border border-accent/30">
          <Zap className="w-4 h-4 text-accent" />
        </div>
        <h2 className="text-lg font-semibold text-glow text-accent">
          Live Mempool Alerts
        </h2>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          <span className="text-xs text-accent">LIVE</span>
        </div>
      </div>

      {/* Animated stats */}
      <div className="mb-6 space-y-4">
        <div className="gradient-gray-card border border-gray-600 rounded-xl p-4 hologram-effect">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl font-bold text-accent animate-pulse">
              145
            </div>
            <Activity className="w-5 h-5 text-accent animate-bounce" />
          </div>
          <div className="text-sm text-gray-400 mb-3">
            High-risk transactions detected
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="h-2 bg-gradient-to-r from-accent to-accent/80 rounded-full data-stream"
              style={{ width: "73%" }}
            />
          </div>
          <div className="text-xs text-accent mt-1">Threat Level: HIGH</div>
        </div>

        {/* Real-time data feed */}
        <div className="space-y-2">
          <div className="text-xs text-gray-400 mb-2">Recent Alerts</div>
          {[
            { time: "14:23:45", threat: "MEV Bot Detected", severity: "HIGH" },
            {
              time: "14:23:12",
              threat: "Flash Loan Attack",
              severity: "CRITICAL",
            },
            { time: "14:22:58", threat: "Sandwich Attack", severity: "MEDIUM" },
          ].map((alert, i) => (
            <div
              key={i}
              className="flex justify-between text-xs p-2 gradient-gray-card rounded border border-gray-600 hover:border-accent/30 transition-all"
              style={{ animationDelay: `${i * 0.5}s` }}
            >
              <span className="text-gray-400">{alert.time}</span>
              <span className="text-gray-300">{alert.threat}</span>
              <span
                className={`${
                  alert.severity === "CRITICAL"
                    ? "text-red-400"
                    : alert.severity === "HIGH"
                      ? "text-accent"
                      : "text-yellow-400"
                } animate-pulse`}
              >
                {alert.severity}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Button className="w-full bg-gradient-to-r from-accent/80 to-accent hover:from-accent hover:to-accent/80 text-black rounded-xl enhanced-glow transition-all duration-300 font-semibold">
        <Activity className="w-4 h-4 mr-2" />
        View Mempool Stream
      </Button>
    </div>
  );
};
