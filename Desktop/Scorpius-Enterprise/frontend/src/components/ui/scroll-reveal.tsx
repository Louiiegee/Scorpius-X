import React from "react";
import { motion, useInView } from "framer-motion";
import {
  useScrollReveal,
  useParallax,
  useScrollCounter,
} from "@/hooks/useScrollReveal";
import { LiveCounter } from "./live-counter";
import { MetricCard } from "./metric-card";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  once?: boolean;
  threshold?: number;
}

export const ScrollReveal = ({
  children,
  className,
  delay = 0,
  duration = 0.6,
  direction = "up",
  distance = 50,
  once = true,
  threshold = 0.1,
}: ScrollRevealProps) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, {
    once,
    amount: threshold,
    margin: "-10% 0px",
  });

  const getInitial = () => {
    switch (direction) {
      case "up":
        return { opacity: 0, y: distance };
      case "down":
        return { opacity: 0, y: -distance };
      case "left":
        return { opacity: 0, x: distance };
      case "right":
        return { opacity: 0, x: -distance };
      default:
        return { opacity: 0, y: distance };
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={getInitial()}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : getInitial()}
      transition={{
        duration,
        delay,
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const ParallaxSection = ({
  children,
  speed = 0.5,
  className,
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) => {
  const { ref, y } = useParallax(speed);

  return (
    <motion.div ref={ref as any} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
};

export const StaggeredReveal = ({
  children,
  staggerDelay = 0.15,
  className,
}: {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

export const ScrollLinkedScale = ({
  children,
  className,
  scaleRange = [0.8, 1.2],
}: {
  children: React.ReactNode;
  className?: string;
  scaleRange?: [number, number];
}) => {
  const { ref, scale } = useScrollReveal();

  return (
    <motion.div ref={ref as any} style={{ scale }} className={className}>
      {children}
    </motion.div>
  );
};

export const ScrollCounter = ({
  endValue,
  duration = 2,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: {
  endValue: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) => {
  const { ref, value, isInView } = useScrollCounter(endValue, {
    duration,
    triggerOnce: true,
    threshold: 0.3,
  });

  return (
    <div ref={ref as any} className={className}>
      <LiveCounter
        value={isInView ? endValue : 0}
        duration={duration}
        decimals={decimals}
        prefix={prefix}
        suffix={suffix}
        className="text-4xl font-bold"
      />
    </div>
  );
};

export const MorphingCard = ({
  title,
  description,
  metric,
  icon,
  color = "green",
  className,
}: {
  title: string;
  description: string;
  metric: number;
  icon?: React.ReactNode;
  color?: "green" | "blue" | "purple" | "orange";
  className?: string;
}) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const colors = {
    green: {
      gradient: "from-green-500/20 to-emerald-500/20",
      border: "border-green-500/30",
      text: "text-green-400",
      glow: "shadow-green-500/25",
    },
    blue: {
      gradient: "from-blue-500/20 to-cyan-500/20",
      border: "border-blue-500/30",
      text: "text-blue-400",
      glow: "shadow-blue-500/25",
    },
    purple: {
      gradient: "from-purple-500/20 to-pink-500/20",
      border: "border-purple-500/30",
      text: "text-purple-400",
      glow: "shadow-purple-500/25",
    },
    orange: {
      gradient: "from-orange-500/20 to-red-500/20",
      border: "border-orange-500/30",
      text: "text-orange-400",
      glow: "shadow-orange-500/25",
    },
  };

  const colorScheme = colors[color];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8, rotateX: 45 }}
      animate={
        isInView
          ? {
              opacity: 1,
              scale: 1,
              rotateX: 0,
            }
          : {
              opacity: 0,
              scale: 0.8,
              rotateX: 45,
            }
      }
      whileHover={{
        scale: 1.05,
        rotateY: 5,
        z: 50,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.6,
      }}
      className={cn(
        "p-6 rounded-xl border backdrop-blur-sm relative overflow-hidden",
        "bg-gradient-to-br",
        colorScheme.gradient,
        colorScheme.border,
        colorScheme.glow,
        "shadow-lg hover:shadow-xl transition-shadow duration-300",
        className,
      )}
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      {/* Animated background pattern */}
      <motion.div
        className="absolute inset-0 opacity-5"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, currentColor 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
          {icon && (
            <motion.div
              animate={{
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={cn("text-2xl", colorScheme.text)}
            >
              {icon}
            </motion.div>
          )}
        </div>

        <div className="flex items-end justify-between">
          <ScrollCounter
            endValue={metric}
            duration={2}
            decimals={0}
            className={cn("text-3xl font-bold", colorScheme.text)}
          />

          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: "100%" } : { width: 0 }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className={cn(
              "h-1 rounded-full ml-4",
              colorScheme.text.replace("text-", "bg-"),
            )}
            style={{ maxWidth: "60px" }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export const FloatingElements = ({
  children,
  intensity = 1,
  className,
}: {
  children: React.ReactNode;
  intensity?: number;
  className?: string;
}) => {
  return (
    <motion.div
      animate={{
        y: [0, -10 * intensity, 0],
        rotate: [0, 1 * intensity, 0],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const PulsingGlow = ({
  children,
  color = "green",
  intensity = 0.5,
  className,
}: {
  children: React.ReactNode;
  color?: string;
  intensity?: number;
  className?: string;
}) => {
  return (
    <motion.div
      animate={{
        boxShadow: [
          `0 0 ${20 * intensity}px rgba(0, 255, 136, ${0.3 * intensity})`,
          `0 0 ${40 * intensity}px rgba(0, 255, 136, ${0.6 * intensity})`,
          `0 0 ${20 * intensity}px rgba(0, 255, 136, ${0.3 * intensity})`,
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Example usage component showcasing all effects
export const ScrollShowcase = () => {
  return (
    <div className="space-y-32 py-16">
      {/* Staggered reveal cards */}
      <section>
        <ScrollReveal>
          <h2 className="text-3xl font-bold text-center mb-16 text-white">
            Professional Scroll Effects
          </h2>
        </ScrollReveal>

        <StaggeredReveal className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <MorphingCard
            title="Security Threats"
            description="Detected this month"
            metric={1247}
            icon="🚨"
            color="orange"
          />
          <MorphingCard
            title="Scans Completed"
            description="Automated analysis"
            metric={8934}
            icon="🔍"
            color="blue"
          />
          <MorphingCard
            title="Vulnerabilities Fixed"
            description="Resolved issues"
            metric={567}
            icon="✅"
            color="green"
          />
        </StaggeredReveal>
      </section>

      {/* Parallax section */}
      <section className="relative h-96 flex items-center justify-center">
        <ParallaxSection speed={0.3} className="absolute inset-0">
          <div className="w-full h-full bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-3xl" />
        </ParallaxSection>

        <ScrollReveal className="relative z-10 text-center">
          <h3 className="text-4xl font-bold text-white mb-4">
            Parallax Background
          </h3>
          <p className="text-xl text-gray-300">
            Background moves at different speed for depth
          </p>
        </ScrollReveal>
      </section>

      {/* Floating elements */}
      <section className="text-center">
        <ScrollReveal>
          <h3 className="text-2xl font-bold text-white mb-8">
            Floating Elements
          </h3>
        </ScrollReveal>

        <div className="flex justify-center space-x-8">
          <FloatingElements intensity={1}>
            <PulsingGlow>
              <div className="w-16 h-16 bg-green-500/20 rounded-full border border-green-500/50" />
            </PulsingGlow>
          </FloatingElements>

          <FloatingElements intensity={1.5}>
            <PulsingGlow color="blue">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg border border-blue-500/50" />
            </PulsingGlow>
          </FloatingElements>

          <FloatingElements intensity={0.8}>
            <PulsingGlow color="purple">
              <div className="w-20 h-20 bg-purple-500/20 rounded-2xl border border-purple-500/50" />
            </PulsingGlow>
          </FloatingElements>
        </div>
      </section>
    </div>
  );
};
