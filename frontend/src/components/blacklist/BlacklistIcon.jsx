export const BlacklistIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Car body */}
    <path d="M3 14.5h18v3a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-3z" />
    <path d="M5.5 14.5l2-5.5a1 1 0 0 1 1-.5h7a1 1 0 0 1 1 .5l2 5.5" />
    {/* Wheels */}
    <circle cx="7" cy="19" r="1.2" />
    <circle cx="17" cy="19" r="1.2" />
    {/* Windshield line */}
    <line x1="9.5" y1="10" x2="14.5" y2="10" />
    {/* Shield / ban badge */}
    <circle cx="18" cy="6" r="4.5" strokeWidth="1.6" />
    <line x1="15.5" y1="6" x2="20.5" y2="6" strokeWidth="1.8" />
  </svg>
);
