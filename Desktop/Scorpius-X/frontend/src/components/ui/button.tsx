import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { motion, useReducedMotion, MotionProps } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        cyberpunk:
          "bg-gradient-to-r from-green-500 to-cyan-500 text-black font-semibold hover:from-green-400 hover:to-cyan-400 shadow-lg shadow-green-500/25",
        danger:
          "bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold hover:from-red-400 hover:to-pink-400 shadow-lg shadow-red-500/25",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

// Professional micro-interaction variants
const microInteractionVariants = {
  idle: {
    scale: 1,
    rotate: 0,
    y: 0,
  },
  hover: {
    scale: 1.05,
    y: -2,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
      duration: 0.15,
    },
  },
  tap: {
    scale: 0.98,
    rotate: -1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 600,
      damping: 30,
      duration: 0.1,
    },
  },
  disabled: {
    scale: 1,
    opacity: 0.6,
    transition: {
      duration: 0.2,
    },
  },
};

// Reduced motion fallback for accessibility
const reducedMotionVariants = {
  idle: { opacity: 1 },
  hover: { opacity: 0.9 },
  tap: { opacity: 0.8 },
  disabled: { opacity: 0.6 },
};

export interface ButtonProps
  extends Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      "onAnimationStart" | "onDrag" | "onDragEnd" | "onDragStart"
    >,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  // Expose Framer Motion props for advanced use cases
  whileHover?: MotionProps["whileHover"];
  whileTap?: MotionProps["whileTap"];
  animate?: MotionProps["animate"];
  initial?: MotionProps["initial"];
  exit?: MotionProps["exit"];
  transition?: MotionProps["transition"];
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText = "Loading...",
      icon,
      rightIcon,
      children,
      disabled,
      whileHover,
      whileTap,
      animate,
      initial,
      exit,
      transition,
      ...props
    },
    ref,
  ) => {
    const shouldReduceMotion = useReducedMotion();
    const isDisabled = disabled || loading;

    // Choose animation variants based on accessibility preferences
    const variants = shouldReduceMotion
      ? reducedMotionVariants
      : microInteractionVariants;

    // Professional loading spinner
    const LoadingSpinner = () => (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
        className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
      />
    );

    const buttonContent = (
      <>
        {loading ? <LoadingSpinner /> : icon}
        <span className={loading ? "opacity-75" : ""}>
          {loading ? loadingText : children}
        </span>
        {!loading && rightIcon}
      </>
    );

    const motionProps = {
      variants,
      initial: initial || "idle",
      animate: isDisabled ? "disabled" : animate || "idle",
      whileHover: !isDisabled ? whileHover || "hover" : undefined,
      whileTap: !isDisabled ? whileTap || "tap" : undefined,
      exit,
      transition: transition || undefined,
    };

    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          <motion.div {...motionProps}>{children}</motion.div>
        </Slot>
      );
    }

    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        {...motionProps}
        {...props}
      >
        {buttonContent}
      </motion.button>
    );
  },
);

Button.displayName = "Button";

// Additional specialized button components for common use cases
const PulseButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        animate={{
          boxShadow: [
            "0 0 0 0 rgba(0, 255, 136, 0.4)",
            "0 0 0 10px rgba(0, 255, 136, 0)",
            "0 0 0 0 rgba(0, 255, 136, 0)",
          ],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        {...props}
      >
        {children}
      </Button>
    );
  },
);

const FloatingActionButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size="icon"
        className={cn(
          "rounded-full shadow-lg fixed bottom-6 right-6 z-50",
          "bg-gradient-to-r from-green-500 to-cyan-500 text-black",
          "hover:shadow-xl hover:shadow-green-500/25",
          className,
        )}
        whileHover={{
          scale: 1.1,
          rotate: 5,
          y: -5,
        }}
        whileTap={{
          scale: 0.95,
          rotate: -5,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
        }}
        {...props}
      >
        {children}
      </Button>
    );
  },
);

PulseButton.displayName = "PulseButton";
FloatingActionButton.displayName = "FloatingActionButton";

export { Button, PulseButton, FloatingActionButton, buttonVariants };
