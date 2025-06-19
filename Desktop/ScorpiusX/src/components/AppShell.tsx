import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import TopNavigation from "./TopNavigation";
import WebChat from "./WebChat";
import Footer from "./Footer";

interface AppShellProps {
  children: ReactNode;
}

// Professional page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.95,
    filter: "blur(4px)",
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
  },
  out: {
    opacity: 0,
    y: -10,
    scale: 1.02,
    filter: "blur(2px)",
  },
};

const pageTransition = {
  type: "tween",
  ease: [0.25, 0.1, 0.25, 1], // Professional cubic-bezier curve
  duration: 0.5,
};

// Professional stagger animation for smooth content loading
const containerVariants = {
  initial: {
    opacity: 0,
  },
  in: {
    opacity: 1,
    transition: {
      duration: 0.4,
      staggerChildren: 0.08, // Faster, more subtle stagger
      delayChildren: 0.15,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  out: {
    opacity: 0,
    transition: {
      duration: 0.25,
      staggerChildren: 0.03,
      staggerDirection: -1,
      ease: [0.4, 0, 0.6, 1],
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

          /* Mobile viewport fixes */
          @media (max-width: 768px) {
            body {
              overflow-x: hidden;
              -webkit-text-size-adjust: 100%;
              -webkit-overflow-scrolling: touch;
            }

            /* Prevent zoom on form inputs */
            input, select, textarea {
              font-size: 16px !important;
            }
          }

          /* iOS Safari fixes */
          @supports (-webkit-touch-callout: none) {
            .mobile-app {
              min-height: -webkit-fill-available;
            }
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

          /* Clean black background */
          .cyberpunk-bg {
            background: #000000;
            position: relative;
          }
        `}
      </style>

      <motion.div
        className="cyberpunk-bg mobile-app ios-vh-fix android-fix"
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

        {/* Mobile-Responsive Main Content Area */}
        <main
          className="flex-1 relative w-full overflow-x-hidden"
          style={{
            minHeight: "calc(100vh - 120px)", // Responsive header height
            paddingBottom: "env(safe-area-inset-bottom)", // iOS safe area
          }}
        >
          {/* Professional transition overlay */}
          <AnimatePresence>
            <motion.div
              key={`overlay-${location.pathname}`}
              initial={{ scaleY: 0, transformOrigin: "top" }}
              animate={{ scaleY: 0, transformOrigin: "top" }}
              exit={{
                scaleY: 1,
                transformOrigin: "top",
                transition: {
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1],
                },
              }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "#000000",
                zIndex: 9999,
                pointerEvents: "none",
              }}
            />
          </AnimatePresence>

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
