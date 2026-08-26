import { useEffect, useState } from "react";

import { FaCarSide, FaExclamationTriangle, FaCrown } from "react-icons/fa";

import { MdSpeed } from "react-icons/md";

function getTagStyle(type) {
  switch (type) {
    case "Blacklist":
      return {
        icon: <FaExclamationTriangle />,
        className: "bg-red-500/10 text-red-500",
      };

    case "VIP":
      return {
        icon: <FaCrown />,
        className: "bg-yellow-500/10 text-yellow-500",
      };

    case "Overspeed":
      return {
        icon: <MdSpeed />,
        className: "bg-orange-500/10 text-orange-500",
      };

    default:
      return {
        icon: <FaCarSide />,
        className: "bg-[var(--primary-color)]/10 text-[var(--primary-color)]",
      };
  }
}

function LPRContainer() {
  const [recentPlates, setRecentPlates] = useState([]);

  const [selectedImage, setSelectedImage] = useState(null);

  // =====================================================
  // LIVE FETCH
  // =====================================================

  useEffect(() => {
    fetchPlates();

    const interval = setInterval(() => {
      fetchPlates();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // =====================================================
  // FETCH API
  // =====================================================

  const fetchPlates = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/plates");

      const data = await response.json();

      setRecentPlates(data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden bg-[var(--card-bg)]">
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="h-[58px] min-h-[58px] px-4 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-[var(--primary-color)]/10 flex items-center justify-center">
              <FaCarSide className="text-[var(--primary-color)] text-sm" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[var(--text-dark)]">
                Recent Detection
              </h3>

              <p className="text-[10px] text-[var(--text-muted)]">
                Live ANPR feed
              </p>
            </div>
          </div>

          {/* LIVE STATUS */}

          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />

            <span className="text-[11px] text-green-500 font-medium">Live</span>
          </div>
        </div>

        {/* ================================================= */}
        {/* BODY */}
        {/* ================================================= */}

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 space-y-2.5">
          {recentPlates.map((item) => {
            const tag = getTagStyle(item.type);

            return (
              <div
                key={item.id}
                className="
                  group
                  rounded-2xl
                  border border-[var(--border-color)]
                  bg-[var(--bg-color)]
                  overflow-hidden
                "
              >
                <div className="flex gap-2 p-2">
                  {/* ========================================= */}
                  {/* IMAGE */}
                  {/* ========================================= */}

                  <div className="relative w-[88px] min-w-[88px] h-[72px] rounded-xl overflow-hidden bg-black">
                    <img
                      src={item.image}
                      alt={item.plate}
                      onClick={() => setSelectedImage(item.image)}
                      className="
                        w-full
                        h-full
                        object-cover
                        cursor-pointer
                        hover:scale-110
                        transition-all
                        duration-300
                      "
                    />
                  </div>

                  {/* ========================================= */}
                  {/* DETAILS */}
                  {/* ========================================= */}

                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          {/* CAMERA */}

                          <h4 className="text-[9px] font-semibold text-[var(--text-muted)] uppercase">
                            {item.camera}
                          </h4>

                          {/* PLATE */}

                          <h2 className="text-[22px] leading-none font-bold tracking-wide text-[var(--text-dark)] mt-1.5 truncate">
                            {item.plate}
                          </h2>
                        </div>

                        {/* TIME */}

                        <span className="text-[9px] text-[var(--text-muted)]">
                          {item.time}
                        </span>
                      </div>

                      {/* ===================================== */}
                      {/* CONFIDENCE */}
                      {/* ===================================== */}

                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full bg-[var(--border-color)] overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{
                              width: item.confidence,
                            }}
                          />
                        </div>

                        <span className="text-[9px] text-green-500 font-semibold">
                          {item.confidence}
                        </span>
                      </div>
                    </div>

                    {/* ===================================== */}
                    {/* TYPE */}
                    {/* ===================================== */}

                    <div className="flex items-center justify-between mt-2">
                      <div
                        className={`
                          flex items-center gap-1
                          px-2 py-1
                          rounded-lg
                          text-[9px]
                          font-medium
                          ${tag.className}
                        `}
                      >
                        {tag.icon}

                        <span>{item.type}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================================================= */}
      {/* IMAGE PREVIEW MODAL */}
      {/* ================================================= */}

      {selectedImage && (
        <div
          className="
            fixed
            inset-0
            z-50
            bg-black/85
            flex
            items-center
            justify-center
            backdrop-blur-sm
          "
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Preview"
            className="
              max-w-[90%]
              max-h-[90vh]
              rounded-2xl
              shadow-2xl
              object-contain
              animate-[zoomIn_0.3s_ease]
            "
          />
        </div>
      )}
    </>
  );
}

export default LPRContainer;
