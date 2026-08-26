import { useNavigate } from "react-router-dom";

const tabMapping = {
  "Total Users": "users",
  "Total Cameras": "total",
  "Online Cameras": "online",
  "Offline Cameras": "offline",
  Alerts: "alerts",
};

function TopCard({ dashboardData }) {
  const stats = dashboardData.stats || [];
  const navigate = useNavigate();

  const handleCardClick = (title) => {
    const tab = tabMapping[title];
    if (tab) {
      navigate(`/reports?tab=${tab}`);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-3 glass-stagger h-full">
      {stats.map((item, index) => (
        <div
          key={index}
          onClick={() => handleCardClick(item.title)}
          className={`group relative bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-sm hover:shadow-lg hover:shadow-[var(--primary-color)]/5 transition-all duration-300 cursor-pointer hover:border-[var(--primary-color)]/40 min-h-[100px] sm:min-h-[110px] glass-lift-sm card-glow-hover
            ${index === 4 ? "col-span-2 sm:col-span-1" : ""}
          `}
        >
          <div className="flex items-start justify-between mb-1 sm:mb-2">
            <span className="text-[9px] sm:text-[10px] md:text-[13px] led:text-xs font-semibold text-[var(--text-dark)] uppercase tracking-wide leading-tight transition-colors duration-300 group-hover:text-[var(--primary-color)]">
              {item.title}
            </span>
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 led:w-10 led:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
              style={{ backgroundColor: `${item.color}18` }}
            >
              {item.icon && (
                <item.icon
                  size={16}
                  className="sm:w-[18px] sm:h-[18px] led:w-5 led:h-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ color: item.color }}
                />
              )}
            </div>
          </div>

          <h3
            className="text-lg sm:text-xl md:text-2xl led:text-3xl font-bold text-[var(--text-dark)] mb-1 leading-none value-pop"
            style={{ animationDelay: `${0.3 + index * 0.08}s` }}
          >
            {item.value}
          </h3>
        </div>
      ))}
    </div>
  );
}

export default TopCard;
