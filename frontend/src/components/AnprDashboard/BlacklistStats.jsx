import { useNavigate } from "react-router-dom";

// Custom SVG Icons
const AnprCameraIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const TotalBlacklistedIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2L4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" />
    <path d="M12 7v6" />
    <circle cx="12" cy="17" r="1" />
  </svg>
);

const ActiveBlacklistedIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2L4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" />
    <path d="M12 7v6" />
    <circle cx="12" cy="17" r="1" />
  </svg>
);

const FoundVehiclesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
    <circle cx="11" cy="11" r="2" />
  </svg>
);

const stats = [
  {
    title: "Total ANPR Cameras",
    value: "600",
    subtitle: "Cameras",
    icon: <AnprCameraIcon />,

    iconColor: "text-blue-500",
    link: "/anpr-reports?tab=cameras",
  },
  {
    title: "Total Detected Vehicles",
    value: "1,248,000,00",
    subtitle: "Vehicles",
    icon: <TotalBlacklistedIcon />,

    iconColor: "text-red-500",
    link: "/anpr-reports?tab=vehicles",
  },
  {
    title: "Blacklisted Vehicles",
    value: "1,102",
    subtitle: "Vehicles",
    icon: <ActiveBlacklistedIcon />,

    iconColor: "text-amber-500",
    link: "/anpr-reports?tab=blacklisted",
  },
  {
    title: "Founded Vehicles",
    value: "214",
    subtitle: "17.1% of total",
    icon: <FoundVehiclesIcon />,

    iconColor: "text-green-500",
    link: "/anpr-reports?tab=founded",
  },
];

function BlacklistStats() {
  const navigate = useNavigate();

  const handleCardClick = (s) => {
    if (s.link) {
      navigate(s.link);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2 md:gap-3">
      {stats.map((s) => (
        <div
          key={s.title}
          onClick={() => handleCardClick(s)}
          className="relative rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-2.5 md:p-3 min-h-[90px] md:min-h-[100px] shadow-sm transition-all duration-300 overflow-hidden cursor-pointer hover:shadow-md hover:border-[var(--primary-color)] glass-lift-sm"
        >
          <div className="absolute inset-0 opacity-[0.03] bg-gradient-to-br from-[var(--primary-color)] to-transparent pointer-events-none" />

          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-start justify-between gap-1 md:gap-2 flex-1">
              <div className="min-w-0 flex-1">
                <h4 className="text-[9px] md:text-[10px] uppercase tracking-wide font-semibold text-[var(--text-muted)] line-clamp-1">
                  {s.title}
                </h4>
                <h2 className="text-xl md:text-3xl leading-none font-bold text-[var(--text-dark)] mt-1.5 md:mt-2">
                  {s.value}
                </h2>
              </div>

              <div className={`h-7 w-7 md:h-9 md:w-9 min-w-[28px] md:min-w-[36px] rounded-xl flex justify-center text-xs md:text-sm ${s.iconColor}`}>
                {s.icon}
              </div>
            </div>
            <p className="mt-auto text-[9px] md:text-[10px] font-medium text-[var(--text-muted)]">
              {s.subtitle}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default BlacklistStats;
