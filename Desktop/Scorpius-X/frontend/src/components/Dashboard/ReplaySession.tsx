import { Skull, Play, Pause, RotateCcw, Cpu, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ReplaySession = () => {
  const progress = 67; // Simulation progress percentage

  return (
    <div className="gradient-gray-box rounded-2xl p-6 shadow-subtle border border-gray-600 enhanced-glow h-full relative overflow-hidden">
      {/* Animated header glow */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent/50 via-accent/50 to-accent/50 data-stream" />

      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center pulse-glow border border-accent/30">
          <Skull className="w-4 h-4 text-accent" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-glow text-accent">
            Replay Session #0420
          </h2>
          <p className="text-sm text-gray-400">Monitoring flash loan attack</p>
        </div>
        <div className="flex gap-1">
          <div
            className="w-1 h-6 bg-accent rounded animate-pulse"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="w-1 h-6 bg-accent rounded animate-pulse"
            style={{ animationDelay: "200ms" }}
          ></div>
          <div
            className="w-1 h-6 bg-accent rounded animate-pulse"
            style={{ animationDelay: "400ms" }}
          ></div>
        </div>
      </div>

      {/* Status and Progress */}
      <div className="mb-6 space-y-4">
        <div className="gradient-gray-card border border-gray-600 rounded-xl p-4 hologram-effect">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Status</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              <span className="text-sm text-accent font-mono">ACTIVE</span>
            </div>
          </div>

          <div className="text-sm text-gray-300 mb-4">
            Simulating MEV attack patterns on Uniswap V3 pools
          </div>

          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Simulation Progress</span>
              <span className="text-accent font-mono">{progress}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 bg-gradient-to-r from-accent via-accent to-accent/80 rounded-full transition-all duration-1000 relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent data-stream"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="gradient-gray-card rounded-lg p-3 border border-gray-600">
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="w-3 h-3 text-accent" />
              <span className="text-xs text-gray-400">CPU Usage</span>
            </div>
            <div className="text-sm font-mono text-accent">87.2%</div>
          </div>

          <div className="gradient-gray-card rounded-lg p-3 border border-gray-600">
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-3 h-3 text-accent" />
              <span className="text-xs text-gray-400">Memory</span>
            </div>
            <div className="text-sm font-mono text-accent">2.4GB</div>
          </div>
        </div>

        {/* Transaction Counter */}
        <div className="gradient-gray-card rounded-lg p-3 border border-gray-600">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">
              Transactions Simulated
            </span>
            <span className="text-lg font-mono text-accent animate-pulse">
              12,847
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button className="flex-1 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/80 hover:to-accent text-black rounded-xl enhanced-glow transition-all duration-300 font-semibold">
          <Play className="w-4 h-4 mr-2" />
          Resume
        </Button>
        <Button
          variant="outline"
          className="px-4 border-accent/30 text-accent hover:bg-accent/10 rounded-xl"
        >
          <Pause className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          className="px-4 border-accent/30 text-accent hover:bg-accent/10 rounded-xl"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
