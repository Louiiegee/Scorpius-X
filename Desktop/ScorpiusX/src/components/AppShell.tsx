import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { TopNavigation } from "./TopNavigation";
import WebChat from "./WebChat";
import Footer from "./Footer";

interface AppShellProps {
  children: ReactNode;
}

// Global animation variants for Fortune-500 polish
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 1.02,
  },
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4,
};

// Stagger children animation for cohesive cascade
const containerVariants = {
  initial: {
    opacity: 0,
  },
  in: {
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.15, // 150ms stagger as recommended
      delayChildren: 0.1,
    },
  },
  out: {
    opacity: 0,
    transition: {
      duration: 0.2,
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export const AppShell = ({ children }: AppShellProps) => {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  // Reset scroll position on route change for professional UX
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Reduced motion fallback for enterprise accessibility
  const motionProps = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
      }
    : {
        variants: pageVariants,
        initial: "initial",
        animate: "in",
        exit: "out",
        transition: pageTransition,
      };

  return (
    <>
      {/* Global styles for professional polish */}
      <style>
        {`
          /* Smooth scrolling for all browsers */
          * {
            scroll-behavior: smooth;
          }

          /* High-quality font rendering */
          body {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
          }

          /* Professional focus rings */
          *:focus-visible {
            outline: 2px solid rgba(0, 255, 136, 0.6);
            outline-offset: 2px;
            border-radius: 4px;
          }

          /* Disable default focus for mouse users */
          *:focus:not(:focus-visible) {
            outline: none;
          }

          /* Selection styling */
          ::selection {
            background-color: rgba(0, 255, 136, 0.3);
            color: #ffffff;
          }

          /* Shimmer animation for loading states */
          @keyframes shimmer {
            0% {
              background-position: -200px 0;
            }
            100% {
              background-position: calc(200px + 100%) 0;
            }
          }

          .shimmer {
            background: linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.03) 0px,
              rgba(255, 255, 255, 0.08) 40px,
              rgba(255, 255, 255, 0.03) 80px
            );
            background-size: 200px 100%;
            animation: shimmer 1.5s infinite ease-out;
          }

          /* Professional scrollbars */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb {
            background: linear-gradient(45deg, rgba(0, 255, 136, 0.6), rgba(0, 255, 255, 0.6));
            border-radius: 4px;
            border: 1px solid rgba(0, 0, 0, 0.1);
          }
          ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(45deg, rgba(0, 255, 136, 0.8), rgba(0, 255, 255, 0.8));
          }

          /* Cyberpunk background */
          .cyberpunk-bg {
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
            position: relative;
          }

          .cyberpunk-bg::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image:
              radial-gradient(circle at 20% 50%, rgba(0, 255, 136, 0.03) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(0, 255, 255, 0.03) 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, rgba(255, 170, 0, 0.02) 0%, transparent 50%);
            pointer-events: none;
          }
        `}
      </style>

      <motion.div
        className="cyberpunk-bg"
        style={{
          minHeight: "100vh",
          color: "#e5e5e5",
          fontFamily: "JetBrains Mono, Space Mono, monospace",
          display: "flex",
          flexDirection: "column",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Top Navigation */}
        <TopNavigation />

        {/* Main Content Area */}
        <main
          style={{
            flex: "1",
            position: "relative",
            minHeight: "calc(100vh - 140px)", // Account for header height
            width: "100%",
          }}
        >
          {/* Global route wrapper with AnimatePresence */}
          <AnimatePresence
            mode="wait"
            initial={false}
            onExitComplete={() => window.scrollTo(0, 0)}
          >
            <motion.div
              key={location.pathname}
              layoutId="main-content"
              {...motionProps}
              style={{
                width: "100%",
                minHeight: "100%",
                position: "relative",
              }}
            >
              <motion.div
                variants={containerVariants}
                initial="initial"
                animate="in"
                exit="out"
                style={{
                  width: "100%",
                  minHeight: "100%",
                }}
              >
                {children}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* WebChat Component */}
        <WebChat />

        {/* Enhanced Footer */}
        <Footer />
      </motion.div>
    </>
  );
};
