import { useEffect, useRef } from "react";
import {
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  useSpring,
  MotionValue,
} from "framer-motion";

// Hook for scroll-linked reveals with customizable transforms
export const useScrollReveal = (
  offset: [string, string] = ["start end", "end start"],
) => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset as any,
  });

  // Common transforms for professional effects
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(
    scrollYProgress,
    [0, 0.3, 0.8, 1],
    [0.8, 1, 1, 1.1],
  );
  const y = useTransform(scrollYProgress, [0, 0.3, 0.8, 1], [50, 0, 0, -50]);
  const x = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0, 0]);
  const rotate = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0, 0]);

  return {
    ref,
    scrollYProgress,
    opacity,
    scale,
    y,
    x,
    rotate,
  };
};

// Hook for parallax effects
export const useParallax = (speed: number = 0.5) => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [-speed * 300, speed * 300]);

  return { ref, y };
};

// Hook for scroll-triggered counters and metrics
export const useScrollCounter = (
  endValue: number,
  options: {
    startValue?: number;
    duration?: number;
    triggerOnce?: boolean;
    threshold?: number;
  } = {},
) => {
  const {
    startValue = 0,
    duration = 2,
    triggerOnce = true,
    threshold = 0.1,
  } = options;

  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, {
    once: triggerOnce,
    margin: `-${(1 - threshold) * 100}% 0px`,
  });

  const motionValue = useMotionValue(startValue);
  const springValue = useSpring(motionValue, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    if (isInView) {
      const controls = motionValue.set(endValue);
      return () => controls;
    }
  }, [isInView, endValue, motionValue]);

  return { ref, value: springValue, isInView };
};

// Hook for scroll-based color transitions
export const useScrollColor = (
  colorStops: string[],
  positions: number[] = [0, 1],
) => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const color = useTransform(scrollYProgress, positions, colorStops);

  return { ref, color };
};

// Hook for scroll-based width/height animations
export const useScrollDimensions = (
  property: "width" | "height" = "width",
  fromValue: string = "0%",
  toValue: string = "100%",
) => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  });

  const dimension = useTransform(scrollYProgress, [0, 1], [fromValue, toValue]);

  return {
    ref,
    [property]: dimension,
    scrollYProgress,
  };
};

// Hook for complex scroll orchestration
export const useScrollOrchestrator = (
  elements: Array<{
    selector: string;
    effects: {
      opacity?: [number, number];
      scale?: [number, number];
      y?: [number, number];
      x?: [number, number];
      rotate?: [number, number];
    };
    timing?: [number, number];
  }>,
) => {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const animations = elements.map((element) => {
    const timing = element.timing || [0, 1];
    const effects: Record<string, MotionValue<any>> = {};

    Object.entries(element.effects).forEach(([key, values]) => {
      if (values) {
        effects[key] = useTransform(scrollYProgress, timing, values);
      }
    });

    return {
      selector: element.selector,
      effects,
    };
  });

  return { containerRef, animations, scrollYProgress };
};

// Hook for viewport-based animations
export const useViewportReveal = (
  options: {
    threshold?: number;
    triggerOnce?: boolean;
    rootMargin?: string;
  } = {},
) => {
  const { threshold = 0.1, triggerOnce = true, rootMargin = "0px" } = options;
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, {
    once: triggerOnce,
    amount: threshold,
    margin: rootMargin,
  });

  return { ref, isInView };
};

// Hook for scroll-based background effects
export const useScrollBackground = (
  gradientStops: string[],
  positions: number[] = [0, 1],
) => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const backgroundPosition = useTransform(
    scrollYProgress,
    [0, 1],
    ["0% 0%", "100% 100%"],
  );

  const backgroundSize = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    ["100% 100%", "120% 120%", "100% 100%"],
  );

  return {
    ref,
    backgroundPosition,
    backgroundSize,
    scrollYProgress,
  };
};
