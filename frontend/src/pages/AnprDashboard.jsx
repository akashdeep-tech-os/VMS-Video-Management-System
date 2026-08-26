import { useState, useEffect } from "react";
import BodyHead from "../components/common/BodyHead";
import BodyContainer from "../components/common/BodyContainer";

import { BsFillGridFill } from "react-icons/bs";
import { FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

import BlacklistStats from "../components/AnprDashboard/BlacklistStats";
import LPRContainer from "../components/AnprDashboard/LPRContainer";

import DetectionChart from "../components/AnprDashboard/DetectionChart";
import DetectionsByVehicleType from "../components/AnprDashboard/DetectionsByVehicleType";
import DetectionsByVehicleColor from "../components/AnprDashboard/DetectionsByVehicleColor";
import TopCamerasByDetections from "../components/AnprDashboard/TopCamerasByDetections";

function AnprDashboard() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showLPR, setShowLPR] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setShowLPR(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[var(--bg-color)] relative">
      {/* ================= HEADER ================= */}
      <BodyHead>
        <div className="flex items-center gap-2 min-w-0 w-full">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex-shrink-0">
              <BsFillGridFill className="text-[var(--primary-color)] text-[22px]" />
            </div>
            <div className="leading-tight min-w-0">
              <h2 className="text-[18px] md:text-[18px] font-bold tracking-tight text-[var(--text-dark)] leading-none">
                ANPR Dashboard
              </h2>
            </div>
          </div>
          {/* Mobile LPR toggle */}
          {isMobile && (
            <button
              onClick={() => setShowLPR(!showLPR)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all shrink-0 ${
                showLPR
                  ? "bg-[var(--primary-color)] text-white"
                  : "bg-[var(--hover-bg)] text-[var(--text-dark)] border border-[var(--border-color)]"
              }`}
            >
              LPR Feed
            </button>
          )}
        </div>
      </BodyHead>

      {/* ================= BODY ================= */}
      <BodyContainer className="flex-1 min-h-0 overflow-hidden p-2">
        <div
          className={`h-full min-h-0 w-full flex gap-2 overflow-hidden transition-all duration-300 ${isMobile ? "flex-col overflow-y-auto" : "flex-row"}`}
        >
          {/* ================= LEFT SECTION ================= */}
          <div
            className={`min-w-0 min-h-0 ${isMobile ? "min-h-0" : "h-full"} flex flex-col gap-2 ${isMobile ? "" : "overflow-hidden"} relative ${isMobile ? "flex-1" : "flex-1"}`}
          >
            {/* ================= TOP STATS ================= */}
            <div className="shrink-0">
              <BlacklistStats />
            </div>

            {/* ================= CHARTS + BOTTOM ================= */}
            <div
              className={`flex-1 min-h-0 flex flex-col gap-2 ${isMobile ? "" : "overflow-hidden"}`}
            >
              {/* CHARTS ROW */}
              <div
                className={`${isMobile ? "" : "flex-1 min-h-0"} grid grid-cols-1 md:grid-cols-3 gap-2 ${isMobile ? "" : "overflow-hidden"}`}
              >
                {/* 2/3 Width on desktop, full on mobile */}
                <div className="md:col-span-2 min-w-0 min-h-[280px] md:min-h-0 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden shadow-sm">
                  <DetectionChart />
                </div>

                {/* 1/3 Width on desktop, full on mobile */}
                <div className="md:col-span-1 min-w-0 min-h-[200px] md:min-h-0 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden shadow-sm">
                  <DetectionsByVehicleType />
                </div>
              </div>

              {/* BOTTOM ROW */}
              <div
                className={`${isMobile ? "" : "flex-1 min-h-0"} grid grid-cols-1 md:grid-cols-3 gap-2 ${isMobile ? "" : "overflow-hidden"}`}
              >
                {/* 2/3 Width on desktop, full on mobile */}
                <div className="md:col-span-2 min-w-0 min-h-[280px] md:min-h-0 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden shadow-sm">
                  <TopCamerasByDetections />
                </div>

                {/* 1/3 Width on desktop, full on mobile */}
                <div className="md:col-span-1 min-w-0 min-h-[200px] md:min-h-0 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden shadow-sm">
                  <DetectionsByVehicleColor />
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT SIDEBAR - LPR ================= */}
          {!isMobile && (
            <div className="w-[350px] min-w-[350px] h-full min-h-0 overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm">
              <LPRContainer />
            </div>
          )}
        </div>
      </BodyContainer>

      {/* Mobile LPR Drawer */}
      <AnimatePresence>
        {isMobile && showLPR && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 w-[300px] bg-[var(--card-bg)] shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
              <span className="text-sm font-bold text-[var(--text-dark)]">
                LPR Feed
              </span>
              <button
                onClick={() => setShowLPR(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)]"
              >
                <FaTimes size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <LPRContainer />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile LPR Backdrop */}
      <AnimatePresence>
        {isMobile && showLPR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLPR(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default AnprDashboard;
