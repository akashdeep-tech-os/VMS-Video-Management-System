import React from "react";

function BodyHead({ children, className = "" }) {
  return (
    <div
      className={`flex flex-row justify-between items-center h-auto md:h-12 py-2 md:py-0 px-3 md:px-4 border-b border-[var(--border-color)] bg-[var(--card-bg)] flex-shrink-0 gap-1 md:gap-2 relative ${className}`}
    >
      {children}
    </div>
  );
}

export default BodyHead;
