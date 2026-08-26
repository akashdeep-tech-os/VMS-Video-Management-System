function Skeleton({ className = "", variant = "text", width, height }) {
  const variants = {
    text: "h-4 rounded",
    title: "h-6 rounded w-1/3",
    avatar: "rounded-full",
    thumbnail: "rounded-lg",
    card: "rounded-xl",
    button: "rounded-lg h-10",
  };

  const baseClass = "bg-[var(--hover-bg)] animate-pulse";
  const variantClass = variants[variant] || variants.text;

  return (
    <div
      className={`${baseClass} ${variantClass} ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonCard({ rows = 3 }) {
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton variant="avatar" className="w-10 h-10" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-1/3" />
          <Skeleton variant="text" className="w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} variant="text" className="w-full" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" className="flex-1 h-3" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={colIdx} variant="text" className="flex-1 h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4">
      <Skeleton variant="title" className="mb-4" />
      <div className="flex items-end gap-2 h-40">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="text"
            className="flex-1"
            height={`${30 + Math.random() * 70}%`}
          />
        ))}
      </div>
    </div>
  );
}

export default Skeleton;
