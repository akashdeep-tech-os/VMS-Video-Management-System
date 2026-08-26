import { Activity, Cpu, MemoryStick, Database } from "lucide-react";

// Static fallback shown before /system/health resolves or if it errors.
const FALLBACK = {
  health: { mainText: "—", subText: "System Health" },
  cpu: { mainText: "—", subText: "Usage" },
  ram: { mainText: "—", subText: "Memory" },
  storage: { mainText: "—", subText: "Storage" },
};

// Map the backend /system/health payload into the four display cards.
function buildStats(health) {
  const f = FALLBACK;
  const cpu = health?.cpu;
  const ram = health?.ram;
  const storage = health?.storage;
  const overall = health?.overall;

  return [
    {
      title: "System Health",
      icon: Activity,
      mainText: overall
        ? overall === "operational"
          ? "All Systems"
          : overall.replace(/_/g, " ")
        : f.health.mainText,
      subText: overall
        ? overall === "operational"
          ? "Operational"
          : "Check"
        : f.health.subText,
      bgClass: "bg-green-100 dark:bg-green-900/20",
      iconClass: "text-green-600 dark:text-green-400",
      textClass: "text-green-600 dark:text-green-400",
    },
    {
      title: "CPU",
      icon: Cpu,
      mainText: cpu ? `${cpu.usage_pct}%` : f.cpu.mainText,
      subText: "Usage",
      bgClass: "bg-indigo-100 dark:bg-indigo-900/20",
      iconClass: "text-indigo-600 dark:text-indigo-400",
      textClass: "text-indigo-600 dark:text-indigo-400",
    },
    {
      title: "RAM",
      icon: MemoryStick,
      mainText: ram ? `${ram.used_gb} GB / ${ram.total_gb} GB` : f.ram.mainText,
      subText: ram ? `${ram.used_pct}% Used` : f.ram.subText,
      bgClass: "bg-amber-100 dark:bg-amber-900/20",
      iconClass: "text-amber-600 dark:text-amber-400",
      textClass: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "Storage Status",
      icon: Database,
      mainText: storage ? `${storage.used_pct}% Used` : f.storage.mainText,
      subText: storage ? `${storage.free_pct}% Free` : f.storage.subText,
      bgClass: "bg-purple-100 dark:bg-purple-900/20",
      iconClass: "text-purple-600 dark:text-purple-400",
      textClass: "text-purple-600 dark:text-purple-400",
    },
  ];
}

function BottomStats({ health }) {
  const stats = buildStats(health);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-3 h-full">
      {stats.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={index}
            className={`bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-sm hover:shadow-lg hover:shadow-[var(--primary-color)]/5 transition-all duration-300 min-h-[72px] sm:min-h-0 card-glow-hover stat-item-enter
              ${index === 4 ? "col-span-2 sm:col-span-1" : ""}
              ${index === 1 ? "stat-item-enter-delay-1" : ""}
              ${index === 2 ? "stat-item-enter-delay-2" : ""}
              ${index === 3 ? "stat-item-enter-delay-3" : ""}
            `}
          >
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div
                className={`min-w-[36px] min-h-[36px] sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:scale-110 hover:rotate-3 ${item.bgClass}`}
              >
                <Icon
                  size={16}
                  className={`sm:w-[18px] sm:h-[18px] sm:w-5 sm:h-5 ${item.iconClass}`}
                />
              </div>
              <div className="min-w-0">
                <h4 className="text-[9px] sm:text-[10px] md:text-[13px] led:text-xs font-semibold text-[var(--text-dark)] uppercase tracking-wide mb-0.5 sm:mb-1">
                  {item.title}
                </h4>
                <p className="text-xs sm:text-sm md:text-base led:text-lg font-bold text-[var(--text-dark)] leading-tight capitalize">
                  {item.mainText}
                </p>
                <p
                  className={`text-[10px] sm:text-[12px] font-medium mt-0.5 ${item.textClass}`}
                >
                  {item.subText}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default BottomStats;
