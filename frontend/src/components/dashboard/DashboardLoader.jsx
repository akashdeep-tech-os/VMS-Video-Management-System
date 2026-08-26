import { motion } from "framer-motion";
import { Activity, Camera, Wifi, Shield, Bell } from "lucide-react";

const shimmer = {
  initial: { backgroundPosition: "-200% 0" },
  animate: {
    backgroundPosition: "200% 0",
    transition: { duration: 1.5, repeat: Infinity, ease: "linear" },
  },
};

function SkeletonBox({ className = "" }) {
  return (
    <motion.div
      className={`
        rounded-xl
        bg-gradient-to-r from-[var(--hover-bg)] via-[var(--card-bg)] to-[var(--hover-bg)]
        bg-[length:200%_100%]
        ${className}
      `}
      style={{
        backgroundImage: `linear-gradient(90deg, var(--hover-bg) 25%, var(--card-bg) 50%, var(--hover-bg) 75%)`,
      }}
      variants={shimmer}
      initial="initial"
      animate="animate"
    />
  );
}

function StatCardSkeleton({ index }) {
  const icons = [Shield, Camera, Wifi, Wifi, Bell];
  const Icon = icons[index] || Camera;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="
        bg-[var(--card-bg)] border border-[var(--border-color)]
        rounded-xl sm:rounded-2xl p-3 sm:p-4
        shadow-sm
      "
    >
      <div className="flex items-start justify-between mb-3">
        <SkeletonBox className="w-16 h-3" />
        <div className="
          w-9 h-9 sm:w-10 sm:h-10
          rounded-xl
          flex items-center justify-center
          bg-[var(--hover-bg)]
        ">
          <Icon size={18} className="text-[var(--text-muted)] opacity-30" />
        </div>
      </div>
      <SkeletonBox className="w-12 h-7 mb-2" />
      <SkeletonBox className="w-20 h-3" />
    </motion.div>
  );
}

function ChartSkeleton({ delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      className="
        bg-[var(--card-bg)] border border-[var(--border-color)]
        rounded-xl sm:rounded-2xl p-4
        shadow-sm h-full flex flex-col
      "
    >
      <SkeletonBox className="w-40 h-4 mb-4" />

      {/* Chart Area */}
      <div className="flex-1 flex items-end gap-2 px-2 pb-6">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="flex-1 flex flex-col items-center gap-1"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: delay + i * 0.05, duration: 0.4 }}
            style={{ transformOrigin: "bottom" }}
          >
            <SkeletonBox
              className="w-full rounded-t-md"
              style={{ height: `${30 + Math.random() * 60}%` }}
            />
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pt-2 border-t border-[var(--border-color)]">
        <SkeletonBox className="w-16 h-3" />
        <SkeletonBox className="w-16 h-3" />
      </div>
    </motion.div>
  );
}

function MapSkeleton({ delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      className="
        bg-[var(--card-bg)] border border-[var(--border-color)]
        rounded-xl sm:rounded-2xl p-4
        shadow-sm h-full flex flex-col
      "
    >
      <div className="flex items-center justify-between mb-3">
        <SkeletonBox className="w-28 h-4" />
        <div className="flex gap-2">
          <SkeletonBox className="w-16 h-3" />
          <SkeletonBox className="w-16 h-3" />
        </div>
      </div>

      {/* Search Bar */}
      <SkeletonBox className="w-full h-9 rounded-lg mb-3" />

      {/* Map Area */}
      <div className="flex-1 relative rounded-xl overflow-hidden bg-[var(--hover-bg)]">
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(5)].map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute left-0 right-0 h-[1px] bg-[var(--border-color)]"
              style={{ top: `${(i + 1) * 20}%` }}
            />
          ))}
          {[...Array(5)].map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute top-0 bottom-0 w-[1px] bg-[var(--border-color)]"
              style={{ left: `${(i + 1) * 20}%` }}
            />
          ))}
        </div>

        {/* Map markers */}
        {[
          { x: "30%", y: "40%" },
          { x: "50%", y: "35%" },
          { x: "45%", y: "55%" },
          { x: "60%", y: "45%" },
          { x: "35%", y: "60%" },
        ].map((pos, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3"
            style={{ left: pos.x, top: pos.y }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: [0, 1, 0.7, 1] }}
            transition={{ delay: delay + 0.3 + i * 0.1, duration: 0.5 }}
          >
            <div className="w-3 h-3 rounded-full bg-green-500/30 animate-ping" />
            <div className="absolute inset-1 rounded-full bg-green-500" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function BottomStatSkeleton({ index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
      className="
        bg-[var(--card-bg)] border border-[var(--border-color)]
        rounded-xl sm:rounded-2xl p-3 sm:p-4
        shadow-sm
      "
    >
      <div className="flex items-center gap-3">
        <SkeletonBox className="w-10 h-10 rounded-xl" />
        <div className="flex-1">
          <SkeletonBox className="w-20 h-3 mb-2" />
          <SkeletonBox className="w-16 h-5 mb-1" />
          <SkeletonBox className="w-12 h-3" />
        </div>
      </div>
    </motion.div>
  );
}

function DashboardLoader() {
  return (
    <div className="h-full w-full flex flex-col gap-2 sm:gap-3 p-1.5 sm:p-3 lg:p-4 bg-[var(--bg-color)]">
      {/* Loading Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center gap-3 py-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Activity size={20} className="text-[var(--primary-color)]" />
        </motion.div>
        <span className="text-sm font-medium text-[var(--text-muted)]">
          Initializing Dashboard...
        </span>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[var(--primary-color)]"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Top Stats Skeleton */}
      <div className="shrink-0 xl:flex-[1] xl:min-h-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-3">
          {[...Array(5)].map((_, i) => (
            <StatCardSkeleton key={i} index={i} />
          ))}
        </div>
      </div>

      {/* Charts Skeleton */}
      <div className="flex flex-col md:grid md:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3 md:gap-4 flex-[4] min-h-0">
        <div className="h-[300px] sm:h-[340px] md:h-auto md:min-h-0">
          <ChartSkeleton delay={0.2} />
        </div>
        <div className="h-[300px] sm:h-[340px] md:h-auto md:min-h-0">
          <ChartSkeleton delay={0.3} />
        </div>
        <div className="h-[300px] sm:h-[340px] md:h-auto md:min-h-0">
          <MapSkeleton delay={0.4} />
        </div>
      </div>

      {/* Bottom Stats Skeleton */}
      <div className="shrink-0 xl:flex-[1] xl:min-h-0">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-3">
          {[...Array(4)].map((_, i) => (
            <BottomStatSkeleton key={i} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardLoader;
