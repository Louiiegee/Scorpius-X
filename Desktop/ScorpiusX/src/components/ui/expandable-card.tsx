import React, { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { X, Maximize2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpandableCardProps {
  id: string;
  title: string;
  subtitle?: string;
  preview: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  cardClassName?: string;
  modalClassName?: string;
  image?: string;
  badge?: {
    text: string;
    color: "green" | "blue" | "red" | "yellow" | "purple";
  };
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "ghost";
    icon?: React.ReactNode;
  }>;
}

interface ExpandableCardGridProps {
  items: ExpandableCardProps[];
  columns?: number;
  gap?: number;
  className?: string;
}

const ExpandableCard = ({
  id,
  title,
  subtitle,
  preview,
  children,
  className,
  cardClassName,
  modalClassName,
  image,
  badge,
  actions,
}: ExpandableCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const badgeColors = {
    green: "bg-green-500/20 text-green-400 border-green-500/30",
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    red: "bg-red-500/20 text-red-400 border-red-500/30",
    yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };

  return (
    <>
      <motion.div
        layoutId={`card-${id}`}
        onClick={() => setIsExpanded(true)}
        className={cn(
          "cursor-pointer rounded-xl border border-gray-800 bg-black/40 backdrop-blur-sm",
          "hover:bg-black/60 hover:border-gray-700 transition-colors duration-300",
          "overflow-hidden group",
          cardClassName,
          className,
        )}
        whileHover={{
          scale: 1.02,
          y: -5,
          boxShadow: "0 10px 40px rgba(0, 255, 136, 0.1)",
        }}
        whileTap={{ scale: 0.98 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
      >
        {/* Card Image */}
        {image && (
          <motion.div
            layoutId={`image-${id}`}
            className="aspect-video w-full overflow-hidden"
          >
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </motion.div>
        )}

        <div className="p-6">
          {/* Badge */}
          {badge && (
            <motion.div
              layoutId={`badge-${id}`}
              className={cn(
                "inline-block px-2 py-1 rounded-full text-xs font-medium border mb-3",
                badgeColors[badge.color],
              )}
            >
              {badge.text}
            </motion.div>
          )}

          {/* Title */}
          <motion.h3
            layoutId={`title-${id}`}
            className="text-lg font-semibold text-white mb-2 group-hover:text-green-400 transition-colors"
          >
            {title}
          </motion.h3>

          {/* Subtitle */}
          {subtitle && (
            <motion.p
              layoutId={`subtitle-${id}`}
              className="text-sm text-gray-400 mb-4"
            >
              {subtitle}
            </motion.p>
          )}

          {/* Preview Content */}
          <motion.div layoutId={`preview-${id}`}>{preview}</motion.div>

          {/* Expand Indicator */}
          <motion.div
            className="mt-4 flex items-center text-sm text-gray-500 group-hover:text-green-400 transition-colors"
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Maximize2 size={14} className="mr-2" />
            <span>Click to expand</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              layoutId={`card-${id}`}
              className={cn(
                "w-full max-w-4xl max-h-[90vh] overflow-y-auto",
                "rounded-xl border border-gray-700 bg-black/95 backdrop-blur-sm",
                modalClassName,
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Image */}
              {image && (
                <motion.div
                  layoutId={`image-${id}`}
                  className="aspect-video w-full overflow-hidden"
                >
                  <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              )}

              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    {/* Badge */}
                    {badge && (
                      <motion.div
                        layoutId={`badge-${id}`}
                        className={cn(
                          "inline-block px-3 py-1 rounded-full text-sm font-medium border mb-4",
                          badgeColors[badge.color],
                        )}
                      >
                        {badge.text}
                      </motion.div>
                    )}

                    {/* Title */}
                    <motion.h2
                      layoutId={`title-${id}`}
                      className="text-3xl font-bold text-white mb-3"
                    >
                      {title}
                    </motion.h2>

                    {/* Subtitle */}
                    {subtitle && (
                      <motion.p
                        layoutId={`subtitle-${id}`}
                        className="text-lg text-gray-400 mb-6"
                      >
                        {subtitle}
                      </motion.p>
                    )}
                  </div>

                  {/* Close Button */}
                  <motion.button
                    className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                    onClick={() => setIsExpanded(false)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <X size={24} className="text-gray-400" />
                  </motion.button>
                </div>

                {/* Preview Content (hidden in modal) */}
                <motion.div
                  layoutId={`preview-${id}`}
                  style={{ display: "none" }}
                >
                  {preview}
                </motion.div>

                {/* Full Content */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="prose prose-invert max-w-none"
                >
                  {children}
                </motion.div>

                {/* Actions */}
                {actions && actions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="flex gap-3 mt-8 pt-6 border-t border-gray-800"
                  >
                    {actions.map((action, index) => (
                      <motion.button
                        key={index}
                        onClick={action.onClick}
                        className={cn(
                          "px-4 py-2 rounded-lg font-medium transition-all",
                          "flex items-center gap-2",
                          action.variant === "primary" &&
                            "bg-green-500 hover:bg-green-600 text-black",
                          action.variant === "secondary" &&
                            "bg-gray-700 hover:bg-gray-600 text-white",
                          action.variant === "ghost" &&
                            "bg-transparent hover:bg-gray-800 text-gray-300 border border-gray-700",
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                      >
                        {action.icon}
                        {action.label}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const ExpandableCardGrid = ({
  items,
  columns = 3,
  gap = 6,
  className,
}: ExpandableCardGridProps) => {
  return (
    <LayoutGroup>
      <div
        className={cn(
          "grid gap-6",
          columns === 1 && "grid-cols-1",
          columns === 2 && "grid-cols-1 md:grid-cols-2",
          columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
          columns === 4 &&
            "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          className,
        )}
        style={{ gap: `${gap * 0.25}rem` }}
      >
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: index * 0.1,
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
          >
            <ExpandableCard {...item} />
          </motion.div>
        ))}
      </div>
    </LayoutGroup>
  );
};

// Example usage component
export const ExpandableCardExample = () => {
  const exampleItems: ExpandableCardProps[] = [
    {
      id: "threat-1",
      title: "Critical Vulnerability Detected",
      subtitle: "Smart Contract: 0x742d35Cc...",
      badge: { text: "CRITICAL", color: "red" },
      preview: (
        <div className="text-sm text-gray-300">
          <p>Reentrancy vulnerability found in withdraw function...</p>
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <span>Severity: 9.8/10</span>
            <span className="mx-2">•</span>
            <span>2 hours ago</span>
          </div>
        </div>
      ),
      children: (
        <div className="space-y-6">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <h3 className="text-red-400 font-semibold mb-2">
              ⚠️ Critical Security Alert
            </h3>
            <p className="text-gray-300">
              A critical reentrancy vulnerability has been detected in the smart
              contract's withdraw function. This vulnerability could allow
              attackers to drain funds from the contract.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Technical Details</h3>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
              <div className="text-green-400">
                function withdraw(uint256 amount) external {"{"}
              </div>
              <div className="text-red-400 ml-4">
                // ⚠️ Vulnerable: External call before state update
              </div>
              <div className="ml-4">
                msg.sender.call{"{value: amount}"}("");
              </div>
              <div className="ml-4 text-red-400">
                balances[msg.sender] -= amount; // State update after external
                call
              </div>
              <div className="text-green-400">{"}"}</div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">
              Recommended Actions
            </h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                Implement checks-effects-interactions pattern
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                Add reentrancy guard using OpenZeppelin's ReentrancyGuard
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                Update state variables before external calls
              </li>
            </ul>
          </div>
        </div>
      ),
      actions: [
        {
          label: "Fix Automatically",
          onClick: () => console.log("Auto-fix initiated"),
          variant: "primary",
          icon: <span>🔧</span>,
        },
        {
          label: "View in Explorer",
          onClick: () => console.log("Opening explorer"),
          variant: "secondary",
          icon: <ExternalLink size={16} />,
        },
        {
          label: "Export Report",
          onClick: () => console.log("Exporting report"),
          variant: "ghost",
          icon: <span>📄</span>,
        },
      ],
    },
    {
      id: "scan-2",
      title: "Security Scan Complete",
      subtitle: "DeFi Protocol Analysis",
      badge: { text: "COMPLETED", color: "green" },
      preview: (
        <div className="text-sm text-gray-300">
          <p>
            Comprehensive security analysis finished. 47 checks passed, 3
            warnings found.
          </p>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
              <span className="text-xs text-green-400">
                High Security Score
              </span>
            </div>
            <span className="text-xs text-gray-500">Score: 94/100</span>
          </div>
        </div>
      ),
      children: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">47</div>
              <div className="text-sm text-gray-400">Checks Passed</div>
            </div>
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">3</div>
              <div className="text-sm text-gray-400">Warnings</div>
            </div>
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">94</div>
              <div className="text-sm text-gray-400">Security Score</div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Scan Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded">
                <span className="text-gray-300">Access Control</span>
                <span className="text-green-400">✓ Passed</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded">
                <span className="text-gray-300">Reentrancy Protection</span>
                <span className="text-green-400">✓ Passed</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded">
                <span className="text-gray-300">Integer Overflow</span>
                <span className="text-yellow-400">⚠ Warning</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded">
                <span className="text-gray-300">Gas Optimization</span>
                <span className="text-green-400">✓ Passed</span>
              </div>
            </div>
          </div>
        </div>
      ),
      actions: [
        {
          label: "Download Report",
          onClick: () => console.log("Downloading report"),
          variant: "primary",
          icon: <span>📊</span>,
        },
        {
          label: "View Details",
          onClick: () => console.log("View details"),
          variant: "secondary",
          icon: <ExternalLink size={16} />,
        },
      ],
    },
    {
      id: "honeypot-3",
      title: "Honeypot Detection Alert",
      subtitle: "Suspicious Contract Activity",
      badge: { text: "MONITORING", color: "yellow" },
      preview: (
        <div className="text-sm text-gray-300">
          <p>
            Potential honeypot contract detected. Multiple failed transactions
            observed.
          </p>
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <span>Confidence: 87%</span>
            <span className="mx-2">•</span>
            <span>12 failed txs</span>
          </div>
        </div>
      ),
      children: (
        <div className="space-y-6">
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
            <h3 className="text-yellow-400 font-semibold mb-2">
              🍯 Honeypot Analysis
            </h3>
            <p className="text-gray-300">
              This contract exhibits patterns consistent with honeypot behavior.
              Users can buy tokens but cannot sell them due to hidden
              restrictions.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Detection Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Failed Transactions</span>
                <span className="text-red-400 font-mono">12/15 (80%)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Buy/Sell Ratio</span>
                <span className="text-yellow-400 font-mono">15:0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Confidence Score</span>
                <span className="text-yellow-400 font-mono">87%</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Risk Indicators</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start">
                <span className="text-red-400 mr-2">⚠</span>
                Hidden sell restrictions in contract code
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-2">⚠</span>
                Unusual ownership patterns detected
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-2">⚠</span>
                Multiple failed sell attempts from different addresses
              </li>
            </ul>
          </div>
        </div>
      ),
      actions: [
        {
          label: "Flag as Honeypot",
          onClick: () => console.log("Flagged as honeypot"),
          variant: "primary",
          icon: <span>🚩</span>,
        },
        {
          label: "Investigate Further",
          onClick: () => console.log("Starting investigation"),
          variant: "secondary",
          icon: <span>🔍</span>,
        },
      ],
    },
  ];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-white mb-8">Security Dashboard</h2>
      <ExpandableCardGrid items={exampleItems} columns={3} />
    </div>
  );
};

export { ExpandableCard };
