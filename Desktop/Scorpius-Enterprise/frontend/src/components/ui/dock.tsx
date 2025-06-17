"use client";

import React, { PropsWithChildren, forwardRef, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export interface DockProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
  direction?: "top" | "middle" | "bottom";
}

const Dock = forwardRef<HTMLDivElement, DockProps>(
  ({ className, children, direction = "bottom", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto w-max h-[58px] p-2 flex items-center justify-center gap-2",
          "rounded-2xl border border-neutral-200 dark:border-neutral-800",
          "bg-white/80 dark:bg-black/80 backdrop-blur-md",
          "shadow-lg",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Dock.displayName = "Dock";

export interface DockItemProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const DockItem = forwardRef<HTMLDivElement, DockItemProps>(
  ({ className, children, onClick, ...props }, ref) => {
    const mouseX = useMotionValue(Infinity);

    return (
      <motion.div
        ref={ref}
        className={cn(
          "aspect-square cursor-pointer rounded-full flex items-center justify-center",
          "relative",
          className,
        )}
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        onClick={onClick}
        {...props}
      >
        <DockIcon mouseX={mouseX}>{children}</DockIcon>
      </motion.div>
    );
  },
);
DockItem.displayName = "DockItem";

interface DockIconProps {
  mouseX: any;
  className?: string;
  children: React.ReactNode;
}

const DockIcon = ({ mouseX, className, children }: DockIconProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      className={cn(
        "flex aspect-square cursor-pointer items-center justify-center rounded-full",
        "bg-neutral-400/40 dark:bg-neutral-800/40",
        "border border-neutral-300 dark:border-neutral-700",
        "backdrop-blur-md transition-colors hover:bg-neutral-300/60 dark:hover:bg-neutral-700/60",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export interface DockLabelProps {
  children: React.ReactNode;
  className?: string;
}

const DockLabel = forwardRef<HTMLDivElement, DockLabelProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap",
          "rounded-md bg-black/75 px-2 py-1 text-xs text-white",
          "opacity-0 transition-opacity group-hover:opacity-100",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
DockLabel.displayName = "DockLabel";

export { Dock, DockItem, DockIcon, DockLabel };
