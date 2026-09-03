import { useState, useEffect, useCallback, useRef } from "react";
import FaceSidebar from "../../components/ai/FaceSidebar";
import VideoPlayer from "../../components/livestream/VideoPlayer";
import BodyHead from "../../components/common/BodyHead";
import BodyContainer from "../../components/common/BodyContainer";
import { useLiveStreaming } from "../../context/LiveStreamingContext";
import { TbFaceId, TbInfoCircle } from "react-icons/tb";
import { MdOutlineSave, MdRestartAlt } from "react-icons/md";
import { IoReorderThreeOutline } from "react-icons/io5";
import { FaSyncAlt } from "react-icons/fa";
import DetectionOverlay from "../../components/common/DetectionOverlay";

function LiveClock() {
  const ref = useRef(null);

  useEffect(() => {
    const update = () => {
      if (ref.current) {
        const now = new Date();
        ref.current.textContent =
          now.toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }) +
          " " +
          now.toLocaleTimeString("en-US", { hour12: false });
      }
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span ref={ref} className="text-xs text-white font-medium tabular-nums" />
  );
}

function ToggleSwitch({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
        enabled ? "bg-[#3b82f6]" : "bg-gray-400"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
          enabled ? "translate-x-4.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function SelectField({ label, value, onChange, options, hasInfo }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 w-28 shrink-0">
        <label className="text-xs font-medium text-[var(--text-dark)]">
          {label}
        </label>
        {hasInfo && (
          <TbInfoCircle className="text-[var(--text-muted)] text-xs cursor-help" />
        )}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-44 px-2.5 py-1.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-dark)] text-xs focus:outline-none focus:border-[var(--primary-color)] select-arrow-bg appearance-none cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SliderField({ label, value, min, max, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 w-28 shrink-0">
        <label className="text-xs font-medium text-[var(--text-dark)]">
          {label}
        </label>
      </div>
      <div className="flex-1 max-w-xs flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--text-muted)] w-7 text-right shrink-0">
            {min}
          </span>
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 h-1.5 bg-[var(--border-color)] rounded-lg appearance-none cursor-pointer accent-[var(--primary-color)]"
          />
          <span className="text-[10px] text-[var(--text-muted)] w-7 shrink-0">
            {max}
          </span>
        </div>
        <div className="flex justify-start ml-9">
          <span className="px-2 py-0.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded text-[10px] text-[var(--text-dark)] font-medium">
            {value}
          </span>
        </div>
      </div>
    </div>
  );
}

function NumberField({ label, value, min, max, onChange, suffix }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 w-28 shrink-0">
        <label className="text-xs font-medium text-[var(--text-dark)]">
          {label}
        </label>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-20 px-2.5 py-1.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-dark)] text-xs focus:outline-none focus:border-[var(--primary-color)] appearance-none [&::-webkit-inner-spin-button]:appearance-auto [&::-webkit-outer-spin-button]:appearance-auto"
        />
        {suffix && (
          <span className="text-[10px] text-[var(--text-muted)]">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function FaceRecognition() {
  const { cameraList, cameraStreams, openGroups, toggleGroup } =
    useLiveStreaming();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [videoKey, setVideoKey] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [detectionAreaPoints, setDetectionAreaPoints] = useState([]);

  const handleSelectCamera = useCallback((cam) => {
    setSelectedCamera((prev) => (prev === cam ? null : cam));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setShowSidebar(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const defaultConfig = {
    enable: false,
    dynamicMarking: false,
    faceEnhance: false,
    faceFeatures: false,
    snapMode: "optimal",
    applyMode: "frontal",
    snapNum: 1,
    snapFrequency: 2,
    rollRange: 30,
    pitchRange: 30,
    yawRange: 45,
    pictureQuality: 100,
    minPixel: 64,
    maxPixel: 1080,
    detectionMode: "motion",
    triggerMode: "rectangle",
    detectionArea: "fullscreen",
  };

  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("vms_face_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.detectionAreaPoints)
          setDetectionAreaPoints(parsed.detectionAreaPoints);
        const { detectionAreaPoints: _, ...configOnly } = parsed;
        return { ...defaultConfig, ...configOnly };
      }
      return defaultConfig;
    } catch {
      return defaultConfig;
    }
  });

  const handleToggle = (key) => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectChange = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSliderChange = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: Number(value) }));
  };

  const handleSave = () => {
    localStorage.setItem(
      "vms_face_config",
      JSON.stringify({ ...config, detectionAreaPoints }),
    );
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setVideoKey((k) => k + 1);
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  const handleResetConfig = useCallback(() => {
    setConfig({
      enable: false,
      dynamicMarking: false,
      faceEnhance: false,
      faceFeatures: false,
      snapMode: "optimal",
      applyMode: "frontal",
      snapNum: 1,
      snapFrequency: 2,
      rollRange: 30,
      pitchRange: 30,
      yawRange: 45,
      pictureQuality: 100,
      minPixel: 64,
      maxPixel: 1080,
      detectionMode: "motion",
      triggerMode: "rectangle",
      detectionArea: "fullscreen",
    });
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setShowSidebar((prev) => !prev);
  }, []);

  return (
    <div className="h-full w-full flex bg-[var(--bg-color)] text-[var(--text-dark)] overflow-hidden relative">
      {/* Camera Sidebar - single select for Face Recognition */}
      <FaceSidebar
        isMobile={isMobile}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        cameraList={cameraList}
        openGroups={openGroups}
        toggleGroup={toggleGroup}
        onSelectCamera={handleSelectCamera}
        selectedCamera={selectedCamera}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <BodyHead className="gap-2">
          <div className="flex items-center gap-2 shrink-0 overflow-hidden">
            <button
              onClick={handleToggleSidebar}
              className="p-1.5 text-[var(--text-dark)] hover:bg-[var(--hover-bg)] rounded-lg transition-colors focus:outline-none"
            >
              <IoReorderThreeOutline
                size={22}
                className="text-[var(--text-dark)]"
              />
            </button>

            <div className=" flex-shrink-0 hidden sm:flex">
              <TbFaceId className="text-[var(--primary-color)] text-[22px]" />
            </div>

            <h2 className="text-[18px] md:text-[18px] font-bold tracking-tight text-[var(--text-dark)] leading-none truncate flex items-center gap-1.5 pb-[0.6px]">
              <span className="hidden sm:inline">Face Recognition</span>
              <span className="inline sm:hidden">Face Config</span>
            </h2>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            <button
              onClick={handleRefresh}
              className="hidden md:flex items-center justify-center w-8 h-8 text-[var(--text-dark)] hover:bg-[var(--hover-bg)] hover:text-[var(--primary-color)] rounded-lg transition-colors focus:outline-none"
            >
              <FaSyncAlt
                size={14}
                className={
                  isRefreshing ? "animate-spin text-[var(--primary-color)]" : ""
                }
              />
            </button>
          </div>
        </BodyHead>

        {/* Body Content */}
        <BodyContainer>
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col xl:flex-row gap-3 p-3">
              {/* Settings Form */}
              <div
                className={`flex-1 max-w-2xl space-y-2 transition-opacity duration-200 ${!config.enable ? "opacity-50 pointer-events-none select-none" : ""}`}
              >
                {/* Toggle Fields */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <div className="w-28 shrink-0">
                      <label className="text-xs font-medium text-[var(--text-dark)]">
                        Enable
                      </label>
                    </div>
                    <ToggleSwitch
                      enabled={config.enable}
                      onToggle={() => handleToggle("enable")}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-28 shrink-0">
                      <label className="text-xs font-medium text-[var(--text-dark)]">
                        Dynamic Marking
                      </label>
                    </div>
                    <ToggleSwitch
                      enabled={config.dynamicMarking}
                      onToggle={() => handleToggle("dynamicMarking")}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-28 shrink-0">
                      <label className="text-xs font-medium text-[var(--text-dark)]">
                        Face Enhance
                      </label>
                    </div>
                    <ToggleSwitch
                      enabled={config.faceEnhance}
                      onToggle={() => handleToggle("faceEnhance")}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-28 shrink-0">
                      <label className="text-xs font-medium text-[var(--text-dark)]">
                        Face Features
                      </label>
                    </div>
                    <div className="flex items-center gap-1.5 relative group">
                      <ToggleSwitch
                        enabled={config.faceFeatures}
                        onToggle={() => handleToggle("faceFeatures")}
                      />
                      <TbInfoCircle className="text-[var(--text-muted)] text-xs cursor-help" />
                      {/* Tooltip */}
                      <div className="absolute left-8 top-1/2 -translate-y-1/2 z-50 w-56 px-3 py-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-lg text-[10px] text-[var(--text-dark)] leading-relaxed opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                        It can detects whether the face is wearing masks and
                        glasses when enabled.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Select Fields */}
                <div className="space-y-1.5 pt-1">
                  <SelectField
                    label="Snap Mode"
                    value={config.snapMode}
                    onChange={(v) => handleSelectChange("snapMode", v)}
                    options={[
                      { value: "optimal", label: "Optimal Mode" },
                      { value: "realtime", label: "Realtime Mode" },
                      { value: "interval", label: "Interval Mode" },
                    ]}
                  />

                  {/* Conditional fields for Interval Mode */}
                  {config.snapMode === "interval" && (
                    <div className="space-y-1.5">
                      <NumberField
                        label="Snap Num"
                        value={config.snapNum}
                        min={1}
                        max={10}
                        onChange={(v) => handleSelectChange("snapNum", v)}
                      />
                      <NumberField
                        label="Snap Frequency"
                        value={config.snapFrequency}
                        min={1}
                        max={255}
                        onChange={(v) => handleSelectChange("snapFrequency", v)}
                        suffix="s/pic(1 ~ 255)"
                      />
                    </div>
                  )}

                  <SelectField
                    label="Apply Mode"
                    value={config.applyMode}
                    onChange={(v) => handleSelectChange("applyMode", v)}
                    options={[
                      { value: "frontal", label: "Frontal View" },
                      { value: "multi-angle", label: "Multi Angle" },
                      { value: "customize", label: "Customize" },
                    ]}
                  />

                  {/* Conditional fields for Customize */}
                  {config.applyMode === "customize" && (
                    <div className="space-y-1.5">
                      <NumberField
                        label="Snap Num"
                        value={config.snapNum}
                        min={1}
                        max={10}
                        onChange={(v) => handleSelectChange("snapNum", v)}
                      />
                      <NumberField
                        label="Snap Frequency"
                        value={config.snapFrequency}
                        min={1}
                        max={255}
                        onChange={(v) => handleSelectChange("snapFrequency", v)}
                        suffix="s/pic(1 ~ 255)"
                      />
                      <NumberField
                        label="Roll Range"
                        value={config.rollRange}
                        min={0}
                        max={180}
                        onChange={(v) => handleSelectChange("rollRange", v)}
                        suffix="(0 ~ 180)"
                      />
                      <NumberField
                        label="Pitch Range"
                        value={config.pitchRange}
                        min={0}
                        max={180}
                        onChange={(v) => handleSelectChange("pitchRange", v)}
                        suffix="(0 ~ 180)"
                      />
                      <NumberField
                        label="Yaw Range"
                        value={config.yawRange}
                        min={0}
                        max={180}
                        onChange={(v) => handleSelectChange("yawRange", v)}
                        suffix="(0 ~ 180)"
                      />
                      <NumberField
                        label="Picture Quality"
                        value={config.pictureQuality}
                        min={0}
                        max={100}
                        onChange={(v) =>
                          handleSelectChange("pictureQuality", v)
                        }
                        suffix="(0 ~ 100)"
                      />
                    </div>
                  )}
                </div>

                {/* Slider Fields */}
                <div className="space-y-2 pt-1">
                  <SliderField
                    label="Min Pixel"
                    value={config.minPixel}
                    min={32}
                    max={1080}
                    onChange={(v) => handleSliderChange("minPixel", v)}
                  />

                  <SliderField
                    label="Max Pixel"
                    value={config.maxPixel}
                    min={320}
                    max={1080}
                    onChange={(v) => handleSliderChange("maxPixel", v)}
                  />
                </div>

                {/* More Select Fields */}
                <div className="space-y-1.5 pt-1">
                  <SelectField
                    label="Detection Mode"
                    value={config.detectionMode}
                    onChange={(v) => handleSelectChange("detectionMode", v)}
                    options={[
                      { value: "motion", label: "Motion Mode" },
                      { value: "hybrid", label: "Hybrid Mode" },
                    ]}
                    hasInfo
                  />

                  <SelectField
                    label="Trigger Mode"
                    value={config.triggerMode}
                    onChange={(v) => handleSelectChange("triggerMode", v)}
                    options={[
                      { value: "rectangle", label: "Rectangle" },
                      { value: "line", label: "Line" },
                    ]}
                  />

                  <SelectField
                    label="Detection Area"
                    value={config.detectionArea}
                    onChange={(v) => handleSelectChange("detectionArea", v)}
                    options={[
                      { value: "fullscreen", label: "Full Screen" },
                      { value: "user-defined", label: "User-defined" },
                    ]}
                  />
                </div>
              </div>

              {/* Live Preview */}
              <div className="w-full xl:w-[480px] shrink-0">
                <div className="relative bg-[#000] rounded-xl overflow-hidden aspect-[4/3] border border-[var(--border-color)]">
                  {selectedCamera ? (
                    <>
                      <VideoPlayer
                        key={`${selectedCamera}-${videoKey}`}
                        url={cameraStreams[selectedCamera]}
                        muted={true}
                        objectFit="object-cover"
                      />
                      {config.enable &&
                        config.detectionArea === "user-defined" && (
                          <DetectionOverlay
                            enabled={config.enable}
                            points={detectionAreaPoints}
                            onPointsChange={setDetectionAreaPoints}
                          />
                        )}
                      {/* Top Bar - Camera Name */}
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent px-3 py-2 flex items-center justify-between z-10">
                        <span className="text-xs text-white font-medium">
                          {selectedCamera}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-[10px] text-white font-medium">
                            REC
                          </span>
                        </div>
                      </div>
                      {/* Bottom Bar - Timestamp */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 z-10">
                        <LiveClock />
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-5xl text-gray-500 mx-auto mb-3">
                          📹
                        </div>
                        <p className="text-sm text-gray-400">
                          Live Camera Feed
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Select a camera from the sidebar
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {/* Detection Area Controls */}
                {config.enable &&
                  config.detectionArea === "user-defined" &&
                  selectedCamera && (
                    <div className="flex items-center justify-center gap-2 py-2">
                      <button
                        onClick={() =>
                          setDetectionAreaPoints((prev) => prev.slice(0, -1))
                        }
                        disabled={detectionAreaPoints.length === 0}
                        className="px-4 py-1.5 bg-[var(--input-bg)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)] text-[var(--text-dark)] text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDetectionAreaPoints([])}
                        disabled={detectionAreaPoints.length === 0}
                        className="px-4 py-1.5 bg-[var(--input-bg)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)] text-[var(--text-dark)] text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Delete All
                      </button>
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-3 py-2 border-t border-[var(--border-color)] flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--primary-color)] hover:opacity-90 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <MdOutlineSave className="text-sm" />
              Save
            </button>
            {saveSuccess && (
              <span className="text-xs text-green-500 font-medium">
                Saved successfully!
              </span>
            )}
            <button
              onClick={handleResetConfig}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--input-bg)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)] text-[var(--text-dark)] text-xs font-medium rounded-lg transition-colors"
            >
              Reset
            </button>
          </div>
        </BodyContainer>
      </div>
    </div>
  );
}

export default FaceRecognition;
