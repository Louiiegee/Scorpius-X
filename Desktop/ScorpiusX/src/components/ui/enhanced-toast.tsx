import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Toast {
  id: string;
  title?: string;
  message: string;
  type: "success" | "error" | "warning" | "info" | "loading";
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center";
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// Toast variants for professional animations
const toastVariants = {
  initial: (position: string) => {
    const isRight = position.includes("right");
    const isLeft = position.includes("left");
    const isTop = position.includes("top");
    const isCenter = position.includes("center");

    return {
      opacity: 0,
      scale: 0.9,
      x: isRight ? 200 : isLeft ? -200 : isCenter ? 0 : 200,
      y: isTop ? -20 : 20,
    };
  },
  animate: {
    opacity: 1,
    scale: 1,
    x: 0,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
      duration: 0.3,
    },
  },
  exit: (position: string) => {
    const isRight = position.includes("right");
    const isLeft = position.includes("left");
    const isCenter = position.includes("center");

    return {
      opacity: 0,
      scale: 0.9,
      x: isRight ? 200 : isLeft ? -200 : isCenter ? 0 : 200,
      transition: {
        type: "spring",
        stiffness: 600,
        damping: 30,
        duration: 0.2,
      },
    };
  },
};

const containerVariants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const ToastComponent = ({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) => {
  const [isExiting, setIsExiting] = useState(false);

  const icons = {
    success: CheckCircle,
    error: AlertTriangle,
    warning: AlertCircle,
    info: Info,
    loading: Loader2,
  };

  const colors = {
    success: {
      bg: "bg-green-900/90",
      border: "border-green-500/50",
      icon: "text-green-400",
      text: "text-green-100",
    },
    error: {
      bg: "bg-red-900/90",
      border: "border-red-500/50",
      icon: "text-red-400",
      text: "text-red-100",
    },
    warning: {
      bg: "bg-yellow-900/90",
      border: "border-yellow-500/50",
      icon: "text-yellow-400",
      text: "text-yellow-100",
    },
    info: {
      bg: "bg-blue-900/90",
      border: "border-blue-500/50",
      icon: "text-blue-400",
      text: "text-blue-100",
    },
    loading: {
      bg: "bg-gray-900/90",
      border: "border-gray-500/50",
      icon: "text-gray-400",
      text: "text-gray-100",
    },
  };

  const Icon = icons[toast.type] || Info;
  const style = colors[toast.type] || colors.info;

  const handleRemove = useCallback(() => {
    if (!isExiting) {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 200);
    }
  }, [isExiting, onRemove, toast.id]);

  useEffect(() => {
    if (!toast.persistent && toast.duration !== 0) {
      const timer = setTimeout(handleRemove, toast.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [handleRemove, toast.duration, toast.persistent]);

  return (
    <motion.div
      layout
      custom={toast.position}
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm",
        "shadow-lg shadow-black/25 min-w-[300px] max-w-[500px]",
        style.bg,
        style.border,
      )}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      onHoverStart={() => {
        // Pause auto-dismiss on hover
      }}
    >
      {/* Icon */}
      <div className={cn("flex-shrink-0 mt-0.5", style.icon)}>
        {Icon &&
          (toast.type === "loading" ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Icon size={20} />
            </motion.div>
          ) : (
            <Icon size={20} />
          ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <div className={cn("font-semibold text-sm mb-1", style.text)}>
            {toast.title}
          </div>
        )}
        <div className={cn("text-sm leading-relaxed", style.text)}>
          {toast.message}
        </div>

        {toast.action && (
          <motion.button
            className={cn(
              "mt-3 px-3 py-1.5 text-xs font-medium rounded",
              "bg-white/10 hover:bg-white/20 transition-colors",
              style.text,
            )}
            onClick={toast.action.onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {toast.action.label}
          </motion.button>
        )}
      </div>

      {/* Close Button */}
      {!toast.persistent && (
        <motion.button
          className={cn(
            "flex-shrink-0 p-1 rounded opacity-70 hover:opacity-100",
            "transition-opacity",
            style.text,
          )}
          onClick={handleRemove}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X size={16} />
        </motion.button>
      )}

      {/* Progress Bar */}
      {!toast.persistent && toast.duration && toast.duration > 0 && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-b-lg"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{
            duration: (toast.duration || 5000) / 1000,
            ease: "linear",
          }}
        />
      )}
    </motion.div>
  );
};

const ToastContainer = ({
  position = "top-right",
}: {
  position?: Toast["position"];
}) => {
  const { toasts, removeToast } = useToast();

  const positionedToasts = toasts.filter(
    (toast) => (toast.position || "top-right") === position,
  );

  if (positionedToasts.length === 0) return null;

  const getPositionClasses = () => {
    switch (position) {
      case "top-left":
        return "top-4 left-4";
      case "top-center":
        return "top-4 left-1/2 transform -translate-x-1/2";
      case "top-right":
        return "top-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      case "bottom-center":
        return "bottom-4 left-1/2 transform -translate-x-1/2";
      case "bottom-right":
        return "bottom-4 right-4";
      default:
        return "top-4 right-4";
    }
  };

  return (
    <div
      className={cn(
        "fixed z-[100] flex flex-col gap-2 pointer-events-none",
        getPositionClasses(),
      )}
    >
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="flex flex-col gap-2"
      >
        <AnimatePresence mode="popLayout">
          {positionedToasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastComponent toast={toast} onRemove={removeToast} />
            </div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      ...toast,
      id,
      position: toast.position || "top-right",
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts((prev) =>
      prev.map((toast) => (toast.id === id ? { ...toast, ...updates } : toast)),
    );
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
    updateToast,
    clearAll,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Render toast containers for all positions */}
      {[
        "top-left",
        "top-center",
        "top-right",
        "bottom-left",
        "bottom-center",
        "bottom-right",
      ].map((position) => (
        <ToastContainer
          key={position}
          position={position as Toast["position"]}
        />
      ))}
    </ToastContext.Provider>
  );
};

// Simple EnhancedToast component for direct usage
interface EnhancedToastProps {
  message: string;
  type: "success" | "error" | "info" | "warning";
  onClose: () => void;
}

export const EnhancedToast = ({
  message,
  type,
  onClose,
}: EnhancedToastProps) => {
  const icons = {
    success: CheckCircle,
    error: AlertTriangle,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success: "#00ff88",
    error: "#ff4444",
    warning: "#ffaa00",
    info: "#00ffff",
  };

  // Ensure Icon is never undefined by providing fallback
  const Icon = icons[type] || Info;
  const color = colors[type] || "#00ffff";

  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      className="fixed top-6 right-6 z-[1000] flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-lg shadow-2xl min-w-[320px] max-w-[400px]"
      style={{
        background:
          "linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(42, 42, 42, 0.95) 100%)",
        border: `2px solid ${color}60`,
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px ${color}30`,
      }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${color}20, ${color}40)`,
          border: `2px solid ${color}60`,
          boxShadow: `0 0 15px ${color}30`,
        }}
      >
        {Icon && <Icon className="w-5 h-5" style={{ color }} />}
      </div>

      {/* Content */}
      <div className="flex-1 text-white font-mono">{message}</div>

      {/* Close Button */}
      <motion.button
        className="flex-shrink-0 p-1 rounded-lg opacity-70 hover:opacity-100 transition-opacity text-white"
        onClick={onClose}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <X className="w-4 h-4" />
      </motion.button>

      {/* Progress Bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 rounded-b-2xl"
        style={{ backgroundColor: `${color}80` }}
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{
          duration: 4,
          ease: "linear",
        }}
      />
    </motion.div>
  );
};

// Convenience hooks for different toast types
export const useToastActions = () => {
  const { addToast, removeToast, updateToast, clearAll } = useToast();

  return {
    success: (message: string, options?: Partial<Toast>) =>
      addToast({ type: "success", message, ...options }),

    error: (message: string, options?: Partial<Toast>) =>
      addToast({ type: "error", message, ...options }),

    warning: (message: string, options?: Partial<Toast>) =>
      addToast({ type: "warning", message, ...options }),

    info: (message: string, options?: Partial<Toast>) =>
      addToast({ type: "info", message, ...options }),

    loading: (message: string, options?: Partial<Toast>) =>
      addToast({
        type: "loading",
        message,
        persistent: true,
        ...options,
      }),

    promise: async <T,>(
      promise: Promise<T>,
      {
        loading: loadingMsg = "Loading...",
        success: successMsg = "Success!",
        error: errorMsg = "Something went wrong",
      }: {
        loading?: string;
        success?: string | ((data: T) => string);
        error?: string | ((error: any) => string);
      } = {},
    ) => {
      const toastId = addToast({
        type: "loading",
        message: loadingMsg,
        persistent: true,
      });

      try {
        const result = await promise;
        updateToast(toastId, {
          type: "success",
          message:
            typeof successMsg === "function" ? successMsg(result) : successMsg,
          persistent: false,
          duration: 5000,
        });
        return result;
      } catch (error) {
        updateToast(toastId, {
          type: "error",
          message: typeof errorMsg === "function" ? errorMsg(error) : errorMsg,
          persistent: false,
          duration: 7000,
        });
        throw error;
      }
    },

    remove: removeToast,
    update: updateToast,
    clear: clearAll,
  };
};
