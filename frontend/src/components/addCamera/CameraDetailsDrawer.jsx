import React from "react";
import { motion } from "framer-motion";
import { IoClose } from "react-icons/io5";
import {
  FiCpu,
  FiGlobe,
  FiMapPin,
  FiShield,
  FiCamera,
  FiUser,
  FiLock,
  FiVideo,
  FiServer,
  FiRadio,
  FiNavigation,
  FiDatabase,
  FiLayers,
} from "react-icons/fi";

function CameraDetailsDrawer({ camera, onClose }) {
  if (!camera) return null;

  const DetailRow = ({ icon: Icon, label, value, mono = false, masked = false }) => (
    <div className="space-y-1">
      <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider flex items-center gap-1.5">
        <Icon size={12} /> {label}
      </span>
      <p
        className={`text-xs bg-[var(--input-bg)]/50 px-3 py-2.5 rounded-xl border border-[var(--border-color)]/50 ${
          mono ? "font-mono text-[var(--primary-color)]" : "font-medium text-[var(--text-dark)]"
        } ${masked ? "tracking-widest" : ""}`}
      >
        {masked ? "••••••••" : value || "—"}
      </p>
    </div>
  );

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute right-0 top-0 bottom-0 w-full lg:w-2/7 bg-[var(--card-bg)] border-l border-[var(--border-color)] shadow-2xl z-20 flex flex-col overflow-hidden transition-colors duration-200"
    >
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border-color)]">
        <div>
          <h3 className="text-sm font-bold tracking-wide text-[var(--text-dark)]">
            Device Details
          </h3>
          <p className="text-[var(--text-muted)] text-[10px] mt-0.5">
            {camera.id} — {camera.name}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-dark)] hover:bg-[var(--hover-bg)] transition-colors"
        >
          <IoClose size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-5 space-y-4 text-sm pb-16">
        {/* Identity Section */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
            <FiCamera size={10} /> Identity
          </p>
          <div className="space-y-3">
            <DetailRow icon={FiCamera} label="Device Name" value={camera.name} />
            <DetailRow icon={FiCpu} label="Device Type" value={camera.cameraType} />
          </div>
        </div>

        {/* Location Section */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
            <FiMapPin size={10} /> Location
          </p>
          <div className="space-y-3">
            <DetailRow icon={FiLayers} label="Group" value={camera.group} />
            <DetailRow icon={FiMapPin} label="Site / Location" value={camera.subGroup || camera.location} />
          </div>
        </div>

        {/* Network Section */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
            <FiGlobe size={10} /> Network
          </p>
          <div className="space-y-3">
            <DetailRow icon={FiGlobe} label="Device/NVR IP" value={camera.ip} mono />
            <DetailRow icon={FiRadio} label="Port" value={camera.port || "80"} mono />
            <DetailRow icon={FiServer} label="Connection Type" value={camera.connectionType || "ONVIF"} />
          </div>
        </div>

        {/* Credentials Section */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
            <FiShield size={10} /> Credentials
          </p>
          <div className="space-y-3">
            <DetailRow icon={FiUser} label="Username" value={camera.userName} />
          </div>
        </div>

        {/* Recording Section */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
            <FiVideo size={10} /> Recording
          </p>
          <div className="space-y-3">
            <DetailRow icon={FiVideo} label="Recording Mode" value={camera.recordingMode || "On-Demand"} />
            <DetailRow icon={FiDatabase} label="Storage Path" value={camera.storagePath} />
          </div>
        </div>

        {/* RTSP Stream */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
            <FiRadio size={10} /> Stream
          </p>
          <div className="space-y-3">
            <DetailRow
              icon={FiRadio}
              label="RTSP Endpoint"
              value={camera.rtsp || `rtsp://${camera.userName || "admin"}:****@${camera.ip}:554/stream`}
              mono
            />
          </div>
        </div>
      </div>

      {/* Fixed Close Bar */}
      <div className="absolute bottom-0 left-0 right-0 px-5 py-3 border-t border-[var(--border-color)] bg-[var(--card-bg)] flex items-center justify-center z-10">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--hover-bg)] hover:bg-[var(--border-color)] text-[var(--text-dark)] text-xs font-semibold transition-colors w-full justify-center"
        >
          <IoClose size={16} />
          Close
        </button>
      </div>
    </motion.div>
  );
}

export default CameraDetailsDrawer;
