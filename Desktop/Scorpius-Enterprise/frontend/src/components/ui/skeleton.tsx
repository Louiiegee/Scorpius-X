import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: "text" | "circular" | "rectangular" | "card";
  animated?: boolean;
}

const Skeleton = ({
  className,
  width,
  height,
  variant = "rectangular",
  animated = true,
  ...props
}: SkeletonProps) => {
  const baseClasses = cn(
    "bg-gradient-to-r from-gray-800/30 via-gray-700/50 to-gray-800/30",
    "bg-[length:200px_100%] bg-no-repeat",
    animated && "shimmer",
    {
      "rounded-full": variant === "circular",
      "rounded-md": variant === "rectangular" || variant === "card",
      "rounded-sm h-4": variant === "text",
    },
    className,
  );

  const style = {
    width,
    height,
    ...(variant === "text" && { height: "1rem" }),
    ...(variant === "circular" && { aspectRatio: "1" }),
  };

  return (
    <motion.div
      className={baseClasses}
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      {...props}
    />
  );
};

// Pre-built skeleton components for common use cases
const SkeletonCard = ({ className, ...props }: { className?: string }) => (
  <motion.div
    className={cn(
      "p-6 border border-gray-800 rounded-xl bg-black/40 backdrop-blur-sm",
      className,
    )}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    {...props}
  >
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="space-y-2 flex-1">
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton width="100%" height={12} />
        <Skeleton width="85%" height={12} />
        <Skeleton width="70%" height={12} />
      </div>
    </div>
  </motion.div>
);

const SkeletonTable = ({
  rows = 5,
  columns = 4,
  className,
  ...props
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) => (
  <motion.div
    className={cn("space-y-4", className)}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.4 }}
    {...props}
  >
    {/* Table Header */}
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={`header-${i}`} height={20} width="80%" />
      ))}
    </div>

    {/* Table Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <motion.div
        key={`row-${rowIndex}`}
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.3,
          delay: rowIndex * 0.1,
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton
            key={`cell-${rowIndex}-${colIndex}`}
            height={16}
            width={`${60 + Math.random() * 30}%`}
          />
        ))}
      </motion.div>
    ))}
  </motion.div>
);

const SkeletonDashboard = ({ className, ...props }: { className?: string }) => (
  <motion.div
    className={cn("space-y-6 p-6", className)}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
    {...props}
  >
    {/* Header */}
    <div className="space-y-4">
      <Skeleton width="300px" height={32} />
      <Skeleton width="500px" height={16} />
    </div>

    {/* Stats Grid */}
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      variants={{
        show: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      initial="hidden"
      animate="show"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={`stat-${i}`}
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 },
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <SkeletonCard />
        </motion.div>
      ))}
    </motion.div>

    {/* Charts and Tables */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="p-6 border border-gray-800 rounded-xl bg-black/40 backdrop-blur-sm"
      >
        <Skeleton width="200px" height={24} className="mb-4" />
        <Skeleton width="100%" height={200} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="p-6 border border-gray-800 rounded-xl bg-black/40 backdrop-blur-sm"
      >
        <Skeleton width="200px" height={24} className="mb-4" />
        <SkeletonTable rows={6} columns={3} />
      </motion.div>
    </div>
  </motion.div>
);

const SkeletonList = ({
  items = 8,
  showAvatar = true,
  className,
  ...props
}: {
  items?: number;
  showAvatar?: boolean;
  className?: string;
}) => (
  <motion.div
    className={cn("space-y-3", className)}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.4 }}
    {...props}
  >
    {Array.from({ length: items }).map((_, i) => (
      <motion.div
        key={`list-item-${i}`}
        className="flex items-center space-x-4 p-4 border border-gray-800 rounded-lg bg-black/20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          delay: i * 0.05,
          type: "spring",
          stiffness: 400,
          damping: 25,
        }}
      >
        {showAvatar && <Skeleton variant="circular" width={48} height={48} />}
        <div className="space-y-2 flex-1">
          <Skeleton width="70%" height={16} />
          <Skeleton width="50%" height={12} />
        </div>
        <Skeleton width={80} height={32} />
      </motion.div>
    ))}
  </motion.div>
);

export {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonDashboard,
  SkeletonList,
};
