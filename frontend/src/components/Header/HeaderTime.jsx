import React, { useEffect, useState } from "react";

function getIndianDateTime() {
  const now = new Date();

  const formattedDate = now
    .toLocaleDateString("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, "-");

  const formattedTime = now
    .toLocaleTimeString("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
    .toUpperCase();

  return {
    date: formattedDate,
    time: formattedTime,
  };
}

function HeaderTime() {
  const [dateTime, setDateTime] = useState(getIndianDateTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setDateTime(getIndianDateTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="
        hidden sm:flex flex-col items-end
        px-3 py-2
        text-[var(--text-dark)]
        leading-tight
        min-w-[100px]
        select-none
      "
    >
      <span className="text-[16px] md:text-[18px] font-semibold tracking-wide tabular-nums">
        {dateTime.time}
      </span>

      <span className="text-[13px] md:text-[14px] text-[var(--text-muted)] tracking-wide">
        {dateTime.date}
      </span>
    </div>
  );
}

export default HeaderTime;
