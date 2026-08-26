import { useState, useRef, useEffect, useCallback } from "react";
import BodyHead from "../common/BodyHead";
import ColorPicker from "./ColorPicker";
import {
  FaUpload,
  FaTimes,
  FaEye,
  FaFilm,
  FaUndo,
  FaSave,
  FaTrash,
  FaCheck,
  FaPlus,
  FaEdit,
  FaPlay,
  FaArrowLeft,
  FaHeading,
} from "react-icons/fa";
import { Image, Type, Video, Tag, CheckCircle, Clock } from "lucide-react";

const DEFAULT_CONFIG = {
  headerMode: "background",
  headerName: "",
  headerNameColor: "",
  subtitle: "",
  subtitleColor: "",
  logo: "",
  festivalVideo: "",
  festivalBanner: "",
  backgroundVideo: "",
  backgroundBanner: "",
  festivalName: "",
};

function HeaderSettings({ department, onUpdateDepartment, onBack }) {
  const deptTheme = department?.theme || {};
  const [config, setConfig] = useState(() => ({
    ...DEFAULT_CONFIG,
    ...deptTheme,
    headerMode: "background",
  }));
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);
  const [initialConfig] = useState(() => ({
    ...DEFAULT_CONFIG,
    ...deptTheme,
  }));

  const logoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const bgVideoInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const festivalBannerInputRef = useRef(null);
  const headerColorRef = useRef(null);
  const subtitleColorRef = useRef(null);
  const [openHeaderColor, setOpenHeaderColor] = useState(false);
  const [openSubtitleColor, setOpenSubtitleColor] = useState(false);

  useEffect(() => {
    const deptTheme = department?.theme || {};
    setConfig({ ...DEFAULT_CONFIG, ...deptTheme, headerMode: "background" });
    setHasChanges(false);
    setSaved(false);
  }, [department?.id]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        headerColorRef.current &&
        !headerColorRef.current.contains(e.target)
      ) {
        setOpenHeaderColor(false);
      }
      if (
        subtitleColorRef.current &&
        !subtitleColorRef.current.contains(e.target)
      ) {
        setOpenSubtitleColor(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateConfig = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setSaved(false);
  };

  const handleFileUpload = (key, file, maxSizeMB = 2) => {
    if (!file) return;
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File size must be less than ${maxSizeMB}MB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      updateConfig(key, e.target.result);
    };
    reader.onerror = () => {
      alert("Failed to read file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const updatedDept = {
      ...department,
      theme: { ...config },
    };
    onUpdateDepartment(updatedDept);
    localStorage.setItem("vms_active_department", JSON.stringify(updatedDept));
    setHasChanges(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (config.headerMode === "festival") {
      setConfig((prev) => ({
        ...prev,
        festivalVideo: "",
        festivalBanner: "",
        festivalName: "",
      }));
    } else {
      setConfig({ ...DEFAULT_CONFIG, headerMode: "background" });
    }
    setHasChanges(true);
    setSaved(false);
  };

  const handleRemoveFile = (key) => {
    updateConfig(key, "");
  };

  const getDeptFestKey = () =>
    department
      ? `vms_festival_configs_${department.id}`
      : "vms_festival_configs";

  const resolveFestivalMedia = (fest) => {
    if (!fest) return { videoUrl: "", bannerUrl: "" };
    if (fest.sharedFromDeptId && fest.sharedFestivalId) {
      try {
        const sourceKey = `vms_festival_configs_${fest.sharedFromDeptId}`;
        const sourceConfigs = JSON.parse(
          localStorage.getItem(sourceKey) || "[]",
        );
        const source = sourceConfigs.find(
          (f) => f.id === fest.sharedFestivalId,
        );
        if (source) {
          return {
            videoUrl: source.videoUrl || "",
            bannerUrl: source.bannerUrl || "",
          };
        }
      } catch {}
      return { videoUrl: "", bannerUrl: "" };
    }
    return { videoUrl: fest.videoUrl || "", bannerUrl: fest.bannerUrl || "" };
  };

  const [festivalConfigs, setFestivalConfigs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(getDeptFestKey()) || "[]");
    } catch {
      return [];
    }
  });

  const [activeFestivalId, setActiveFestivalId] = useState(() => {
    const configs = JSON.parse(localStorage.getItem(getDeptFestKey()) || "[]");
    const active = configs.find((f) => f.isActive);
    return active ? active.id : null;
  });

  const [editingFestivalId, setEditingFestivalId] = useState(null);

  // Reload festival configs when department changes
  useEffect(() => {
    if (!department?.id) return;
    const key = `vms_festival_configs_${department.id}`;
    try {
      const configs = JSON.parse(localStorage.getItem(key) || "[]");
      setFestivalConfigs(configs);
      const active = configs.find((f) => f.isActive);
      setActiveFestivalId(active ? active.id : null);
    } catch {
      setFestivalConfigs([]);
      setActiveFestivalId(null);
    }
    setEditingFestivalId(null);
  }, [department?.id]);

  const [departments] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("vms_departments") || "[]");
    } catch {
      return [];
    }
  });

  const [sharedWithDepts, setSharedWithDepts] = useState([]);

  const saveFestivalConfigs = (configs) => {
    localStorage.setItem(getDeptFestKey(), JSON.stringify(configs));
    setFestivalConfigs(configs);
    const active = configs.find((f) => f.isActive);
    setActiveFestivalId(active ? active.id : null);
    window.dispatchEvent(new Event("storage"));
  };

  const currentFestival = editingFestivalId
    ? festivalConfigs.find((f) => f.id === editingFestivalId)
    : festivalConfigs.find((f) => f.isActive) ||
      festivalConfigs.find((f) => f.id === "new");

  const festivalForm = currentFestival || {
    festivalName: "",
    mediaType: "video",
    videoUrl: "",
    bannerUrl: "",
  };

  const updateFestivalForm = (key, value) => {
    if (editingFestivalId) {
      setFestivalConfigs((prev) =>
        prev.map((f) =>
          f.id === editingFestivalId
            ? {
                ...f,
                [key]: value,
                updatedAt: new Date().toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }),
              }
            : f,
        ),
      );
    } else {
      setFestivalConfigs((prev) => {
        const existing = prev.find((f) => f.id === "new");
        if (existing) {
          return prev.map((f) => (f.id === "new" ? { ...f, [key]: value } : f));
        }
        return [
          ...prev,
          {
            id: "new",
            festivalName: "",
            mediaType: "video",
            videoUrl: "",
            bannerUrl: "",
            isActive: false,
            createdAt: new Date().toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            updatedAt: new Date().toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            [key]: value,
          },
        ];
      });
    }
  };

  const startNewFestival = () => {
    if (festivalConfigs.length >= 5) {
      alert(
        "You can save only 5 festival configurations. Please delete an existing festival before adding a new one.",
      );
      return;
    }
    setEditingFestivalId(null);
    setFestivalConfigs((prev) => {
      if (prev.find((f) => f.id === "new")) return prev;
      return [
        ...prev,
        {
          id: "new",
          festivalName: "",
          mediaType: "video",
          videoUrl: "",
          bannerUrl: "",
          isActive: false,
          createdAt: new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          updatedAt: new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
        },
      ];
    });
  };

  const saveFestival = () => {
    const draft = festivalConfigs.find(
      (f) => f.id === "new" || f.id === editingFestivalId,
    );
    if (!draft) {
      alert("No festival to save.");
      return;
    }
    if (!draft.festivalName.trim()) {
      alert("Festival Name is required.");
      return;
    }
    if (!draft.videoUrl && !draft.bannerUrl) {
      alert("Either a Video or Banner must be selected.");
      return;
    }

    const now = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const finalId = draft.id === "new" ? `fest_${Date.now()}` : draft.id;

    const finalFestival = {
      ...draft,
      id: finalId,
      updatedAt: now,
      createdAt: draft.id === "new" ? now : draft.createdAt,
    };

    const finalConfigs = festivalConfigs.map((f) => {
      if (f.id === draft.id) return finalFestival;
      return f;
    });

    // Save to current department
    saveFestivalConfigs(finalConfigs);

    // Propagate to shared departments
    const shareAll = sharedWithDepts.includes("*");
    const otherDepts = departments.filter((d) => d.id !== department.id);
    const targetDepts = shareAll
      ? otherDepts
      : otherDepts.filter((d) => sharedWithDepts.includes(d.id));

    targetDepts.forEach((targetDept) => {
      const targetKey = `vms_festival_configs_${targetDept.id}`;
      const targetConfigs = (() => {
        try {
          return JSON.parse(localStorage.getItem(targetKey) || "[]");
        } catch {
          return [];
        }
      })();
      const existingIdx = targetConfigs.findIndex(
        (f) =>
          (f.sharedFestivalId === finalId &&
            f.sharedFromDeptId === department.id) ||
          (f.sharedFromDeptId === department.id &&
            f.festivalName === finalFestival.festivalName),
      );
      const sharedFestival = {
        id: `shared_${department.id}_${finalId}`,
        festivalName: finalFestival.festivalName,
        mediaType: finalFestival.mediaType,
        isActive: false,
        readOnly: true,
        sharedFromDeptId: department.id,
        sharedFromDeptName: department.name,
        sharedFestivalId: finalId,
        createdAt: finalFestival.createdAt,
        updatedAt: finalFestival.updatedAt,
      };
      if (existingIdx >= 0) {
        targetConfigs[existingIdx] = sharedFestival;
      } else {
        targetConfigs.push(sharedFestival);
      }
      try {
        localStorage.setItem(targetKey, JSON.stringify(targetConfigs));
      } catch (e) {
        console.error("Failed to save shared festival:", e);
        alert(
          "Could not share festival to " +
            targetDept.name +
            ". Storage quota exceeded.",
        );
      }
    });

    setEditingFestivalId(null);
    setSharedWithDepts([]);
    setHasChanges(true);
  };

  const activateFestival = (id) => {
    const updated = festivalConfigs.map((f) => ({
      ...f,
      isActive: f.id === id,
    }));
    saveFestivalConfigs(updated);
    setEditingFestivalId(null);
    setHasChanges(true);
  };

  const editFestival = (id) => {
    setEditingFestivalId(id);
  };

  const deleteFestival = (id) => {
    if (
      !confirm("Are you sure you want to delete this festival configuration?")
    )
      return;
    const updated = festivalConfigs.filter((f) => f.id !== id);
    saveFestivalConfigs(updated);
    if (editingFestivalId === id) setEditingFestivalId(null);
    setHasChanges(true);
  };

  const cancelEditing = () => {
    if (editingFestivalId) {
      setEditingFestivalId(null);
    } else {
      setFestivalConfigs((prev) => prev.filter((f) => f.id !== "new"));
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <BodyHead>
        <div className="flex items-center gap-2 min-w-[280px]">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-dark)] transition-colors"
          >
            <FaArrowLeft size={14} />
          </button>
          <div className=" flex-shrink-0">
            <FaHeading className="text-[var(--primary-color)] text-[20px]" />
          </div>
          <div className="leading-tight">
            <h2 className="text-xs md:text-[18px] font-bold tracking-tight text-[var(--text-dark)] leading-none">
              Header Settings — {department?.name || "this department"}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] sm:text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text-dark)] hover:bg-[var(--hover-bg)] rounded-lg transition-colors cursor-pointer"
          >
            <FaUndo size={11} />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-[13px] sm:text-[13px] font-medium rounded-lg transition-all cursor-pointer ${
              hasChanges
                ? "bg-[var(--primary-color)] text-white hover:opacity-90 shadow-sm"
                : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
            }`}
          >
            <FaSave size={11} />
            {saved ? "Saved!" : "Save"}
          </button>
        </div>
      </BodyHead>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 space-y-5">
        {/* Mode Toggle */}
        <div className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-1 flex gap-1">
          <button
            onClick={() => updateConfig("headerMode", "background")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-lg text-[13px] sm:text-[16px] font-semibold transition-all cursor-pointer ${
              config.headerMode === "background"
                ? "bg-[var(--primary-color)] text-white shadow-sm"
                : "text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
            }`}
          >
            <FaFilm size={13} />
            Background Mode
          </button>
          <button
            onClick={() => updateConfig("headerMode", "festival")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-lg text-[13px] sm:text-[16px] font-semibold transition-all cursor-pointer ${
              config.headerMode === "festival"
                ? "bg-[var(--primary-color)] text-white shadow-sm"
                : "text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
            }`}
          >
            <Tag size={13} />
            Festival Mode
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-start">
          {/* Left: Config Form */}
          <div className="space-y-4">
            {config.headerMode === "background" ? (
              <div className="space-y-4">
                {/* Logo Upload */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--text-dark)] mb-2">
                    <Image size={12} />
                    Logo
                  </label>
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-[var(--border-color)] hover:border-[var(--primary-color)] flex items-center justify-center cursor-pointer transition-colors overflow-hidden bg-[var(--bg-color)]"
                    >
                      {config.logo ? (
                        <img
                          src={config.logo}
                          alt="Logo"
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <FaUpload
                          className="text-[var(--text-muted)]"
                          size={18}
                        />
                      )}
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFileUpload("logo", e.target.files?.[0])
                      }
                    />
                    {config.logo && (
                      <button
                        onClick={() => handleRemoveFile("logo")}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                        title="Remove logo"
                      >
                        <FaTrash size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Header Text */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--text-dark)] mb-1.5">
                    <Type size={12} />
                    Header Text
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={config.headerName}
                      onChange={(e) =>
                        updateConfig("headerName", e.target.value)
                      }
                      placeholder="e.g. SURAKSHIT VMS"
                      className="flex-1 min-w-0 px-3 py-2 text-xs sm:text-sm bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-dark)] outline-none focus:border-[var(--primary-color)] transition-colors placeholder:text-[var(--text-muted)]"
                    />
                    <div className="relative shrink-0" ref={headerColorRef}>
                      <button
                        onClick={() => setOpenHeaderColor(!openHeaderColor)}
                        className="w-7 h-7 rounded-lg border-2 border-[var(--border-color)] flex items-center justify-center transition-all hover:border-[var(--primary-color)] cursor-pointer"
                        style={{
                          backgroundColor: config.headerNameColor || "#ffffff",
                        }}
                        title="Pick text color"
                      >
                        {config.headerNameColor && (
                          <FaCheck
                            size={10}
                            className="text-white drop-shadow-sm"
                          />
                        )}
                      </button>
                      {openHeaderColor && (
                        <div className="absolute right-0 top-9 z-50">
                          <ColorPicker
                            value={config.headerNameColor || "#ffffff"}
                            onChange={(c) => updateConfig("headerNameColor", c)}
                            onSave={() => {
                              setOpenHeaderColor(false);
                            }}
                            onReset={() => {
                              updateConfig("headerNameColor", "");
                              setOpenHeaderColor(false);
                            }}
                            showReset={!!config.headerNameColor}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subtitle */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--text-dark)] mb-1.5">
                    <Type size={12} />
                    Subtitle
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={config.subtitle}
                      onChange={(e) => updateConfig("subtitle", e.target.value)}
                      placeholder="e.g. Surveillance & Monitoring System"
                      className="flex-1 min-w-0 px-3 py-2 text-xs sm:text-sm bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-dark)] outline-none focus:border-[var(--primary-color)] transition-colors placeholder:text-[var(--text-muted)]"
                    />
                    <div className="relative shrink-0" ref={subtitleColorRef}>
                      <button
                        onClick={() => setOpenSubtitleColor(!openSubtitleColor)}
                        className="w-7 h-7 rounded-lg border-2 border-[var(--border-color)] flex items-center justify-center transition-all hover:border-[var(--primary-color)] cursor-pointer"
                        style={{
                          backgroundColor: config.subtitleColor || "#94a3b8",
                        }}
                        title="Pick text color"
                      >
                        {config.subtitleColor && (
                          <FaCheck
                            size={10}
                            className="text-white drop-shadow-sm"
                          />
                        )}
                      </button>
                      {openSubtitleColor && (
                        <div className="absolute right-0 bottom-9 z-50">
                          <ColorPicker
                            value={config.subtitleColor || "#94a3b8"}
                            onChange={(c) => updateConfig("subtitleColor", c)}
                            onSave={() => {
                              setOpenSubtitleColor(false);
                            }}
                            onReset={() => {
                              updateConfig("subtitleColor", "");
                              setOpenSubtitleColor(false);
                            }}
                            showReset={!!config.subtitleColor}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Festival Form Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-semibold text-[var(--text-dark)]">
                    {editingFestivalId ? "Edit Festival" : "New Festival"}
                  </h3>
                  <div className="flex items-center gap-2">
                    {(editingFestivalId ||
                      festivalConfigs.find((f) => f.id === "new")) && (
                      <button
                        onClick={cancelEditing}
                        className="px-2.5 py-1.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    {!editingFestivalId &&
                      !festivalConfigs.find((f) => f.id === "new") && (
                        <button
                          onClick={startNewFestival}
                          disabled={festivalConfigs.length >= 5}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium rounded-lg transition-all cursor-pointer ${
                            festivalConfigs.length >= 5
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
                              : "bg-[var(--primary-color)]/10 text-[var(--primary-color)] hover:bg-[var(--primary-color)]/20"
                          }`}
                        >
                          <FaPlus size={10} />
                          Add Festival
                        </button>
                      )}
                  </div>
                </div>

                {/* Festival Form */}
                {(editingFestivalId ||
                  festivalConfigs.find((f) => f.id === "new")) && (
                  <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-3 sm:p-4 space-y-3">
                    {/* Festival Name */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--text-dark)] mb-1.5">
                        <Tag size={11} />
                        Festival Name
                      </label>
                      <input
                        type="text"
                        value={festivalForm.festivalName}
                        onChange={(e) =>
                          updateFestivalForm("festivalName", e.target.value)
                        }
                        placeholder="e.g. Diwali, Holi, Christmas"
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-dark)] outline-none focus:border-[var(--primary-color)] transition-colors placeholder:text-[var(--text-muted)]"
                      />
                    </div>

                    {/* Media Type Toggle */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--text-dark)] mb-2">
                        <FaPlay size={10} />
                        Active Media
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            updateFestivalForm("mediaType", "video")
                          }
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                            festivalForm.mediaType === "video"
                              ? "bg-[var(--primary-color)] text-white shadow-sm ring-2 ring-[var(--primary-color)]/30"
                              : "bg-[var(--input-bg)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)]"
                          }`}
                        >
                          <Video size={12} />
                          Video
                        </button>
                        <button
                          onClick={() =>
                            updateFestivalForm("mediaType", "banner")
                          }
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                            festivalForm.mediaType === "banner"
                              ? "bg-[var(--primary-color)] text-white shadow-sm ring-2 ring-[var(--primary-color)]/30"
                              : "bg-[var(--input-bg)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)]"
                          }`}
                        >
                          <Image size={12} />
                          Banner
                        </button>
                      </div>
                    </div>

                    {/* Festival Video Upload */}
                    {festivalForm.mediaType === "video" && (
                      <div>
                        <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--text-dark)] mb-2">
                          <Video size={11} />
                          Festival Video
                        </label>
                        <div
                          onClick={() => videoInputRef.current?.click()}
                          className="w-full h-28 sm:h-32 rounded-xl border-2 border-dashed border-[var(--border-color)] hover:border-[var(--primary-color)] flex items-center justify-center cursor-pointer transition-colors overflow-hidden bg-[var(--bg-color)]"
                        >
                          {festivalForm.videoUrl ? (
                            <video
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="w-full h-full object-cover"
                              src={festivalForm.videoUrl}
                            />
                          ) : (
                            <div className="text-center">
                              <FaUpload
                                className="mx-auto text-[var(--text-muted)] mb-2"
                                size={18}
                              />
                              <span className="text-[11px] sm:text-xs text-[var(--text-muted)] font-medium">
                                Upload festival video
                              </span>
                              <br />
                              <span className="text-[9px] text-[var(--text-muted)]">
                                MP4, WebM, max 50MB. 2-5s loop preferred
                              </span>
                            </div>
                          )}
                        </div>
                        <input
                          ref={videoInputRef}
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              const file = e.target.files[0];
                              if (file.size > 50 * 1024 * 1024) {
                                alert("File size must be less than 50MB");
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (ev) =>
                                updateFestivalForm(
                                  "videoUrl",
                                  ev.target.result,
                                );
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        {festivalForm.videoUrl && (
                          <button
                            onClick={() => updateFestivalForm("videoUrl", "")}
                            className="mt-2 flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                          >
                            <FaTrash size={10} />
                            Remove video
                          </button>
                        )}
                      </div>
                    )}

                    {/* Festival Banner Upload */}
                    {festivalForm.mediaType === "banner" && (
                      <div>
                        <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--text-dark)] mb-2">
                          <Image size={11} />
                          Festival Banner
                        </label>
                        <div
                          onClick={() =>
                            festivalBannerInputRef.current?.click()
                          }
                          className="w-full h-28 sm:h-32 rounded-xl border-2 border-dashed border-[var(--border-color)] hover:border-[var(--primary-color)] flex items-center justify-center cursor-pointer transition-colors overflow-hidden bg-[var(--bg-color)]"
                        >
                          {festivalForm.bannerUrl ? (
                            <img
                              src={festivalForm.bannerUrl}
                              alt="Banner"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center">
                              <FaUpload
                                className="mx-auto text-[var(--text-muted)] mb-2"
                                size={18}
                              />
                              <span className="text-[11px] sm:text-xs text-[var(--text-muted)] font-medium">
                                Upload festival banner
                              </span>
                              <br />
                              <span className="text-[9px] text-[var(--text-muted)]">
                                PNG/JPG/WebP, max 5MB. 1920x100px recommended
                              </span>
                            </div>
                          )}
                        </div>
                        <input
                          ref={festivalBannerInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              const file = e.target.files[0];
                              if (file.size > 5 * 1024 * 1024) {
                                alert("File size must be less than 5MB");
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (ev) =>
                                updateFestivalForm(
                                  "bannerUrl",
                                  ev.target.result,
                                );
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        {festivalForm.bannerUrl && (
                          <button
                            onClick={() => updateFestivalForm("bannerUrl", "")}
                            className="mt-2 flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                          >
                            <FaTrash size={10} />
                            Remove banner
                          </button>
                        )}
                      </div>
                    )}

                    {/* Share with Departments */}
                    {departments.length > 1 && (
                      <div className="border-t border-[var(--border-color)] pt-3">
                        <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--text-dark)] mb-2">
                          <FaPlay size={10} />
                          Share with Departments
                        </label>
                        <p className="text-[9px] text-[var(--text-muted)] mb-2">
                          Only the festival video/banner will be shared. Header
                          text, logo, and subtitle remain per-department.
                        </p>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--hover-bg)] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sharedWithDepts.includes("*")}
                              onChange={(e) =>
                                setSharedWithDepts(
                                  e.target.checked ? ["*"] : [],
                                )
                              }
                              className="w-3.5 h-3.5 rounded border-[var(--border-color)] text-[var(--primary-color)] focus:ring-[var(--primary-color)]/30 cursor-pointer"
                            />
                            <span className="text-[10px] font-medium text-[var(--text-dark)]">
                              All Departments
                            </span>
                          </label>
                          {!sharedWithDepts.includes("*") &&
                            departments
                              .filter((d) => d.id !== department.id)
                              .map((dept) => (
                                <label
                                  key={dept.id}
                                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--hover-bg)] cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={sharedWithDepts.includes(dept.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSharedWithDepts((prev) => [
                                          ...prev,
                                          dept.id,
                                        ]);
                                      } else {
                                        setSharedWithDepts((prev) =>
                                          prev.filter((id) => id !== dept.id),
                                        );
                                      }
                                    }}
                                    className="w-3.5 h-3.5 rounded border-[var(--border-color)] text-[var(--primary-color)] focus:ring-[var(--primary-color)]/30 cursor-pointer"
                                  />
                                  <span className="text-[10px] text-[var(--text-dark)]">
                                    {dept.name}
                                  </span>
                                </label>
                              ))}
                        </div>
                      </div>
                    )}

                    {/* Save Button */}
                    <button
                      onClick={saveFestival}
                      className="w-full flex items-center justify-center gap-2 py-2 text-[11px] font-semibold bg-[var(--primary-color)] text-white hover:opacity-90 rounded-lg transition-all cursor-pointer shadow-sm"
                    >
                      <FaSave size={11} />
                      {editingFestivalId ? "Update Festival" : "Save Festival"}
                    </button>
                  </div>
                )}

                {/* Quick Test (when no festival form is open) */}
                {!editingFestivalId &&
                  !festivalConfigs.find((f) => f.id === "new") &&
                  !festivalConfigs.find((f) => f.isActive) && (
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-3 sm:p-4">
                      <p className="text-[10px] text-[var(--text-muted)] mb-2">
                        No active festival. Add a festival configuration or
                        activate one from the saved list below.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            updateConfig("festivalVideo", "/festival-test.mp4");
                            updateConfig("festivalBanner", "");
                          }}
                          className="flex-1 px-2 py-1.5 text-[10px] font-medium text-[var(--primary-color)] bg-[var(--primary-color)]/10 hover:bg-[var(--primary-color)]/20 rounded-lg transition-colors cursor-pointer border border-[var(--primary-color)]/20"
                        >
                          Quick Test Video
                        </button>
                        <button
                          onClick={() => {
                            updateConfig(
                              "festivalBanner",
                              "/festival-gradient.mp4",
                            );
                            updateConfig("festivalVideo", "");
                          }}
                          className="flex-1 px-2 py-1.5 text-[10px] font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 rounded-lg transition-colors cursor-pointer border border-purple-200 dark:border-purple-800/30"
                        >
                          Quick Test Banner
                        </button>
                      </div>
                    </div>
                  )}

                {/* Saved Festivals Section */}
                {festivalConfigs.filter((f) => f.id !== "new").length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--text-dark)]">
                        <CheckCircle size={12} />
                        Saved Festivals (
                        {festivalConfigs.filter((f) => f.id !== "new").length}
                        /5)
                      </label>
                    </div>
                    <div className="space-y-2">
                      {festivalConfigs
                        .filter((f) => f.id !== "new")
                        .map((fest) => (
                          <div
                            key={fest.id}
                            className={`bg-[var(--card-bg)] border rounded-xl p-3 transition-all ${
                              fest.isActive
                                ? "border-[var(--primary-color)] ring-1 ring-[var(--primary-color)]/20"
                                : "border-[var(--border-color)] hover:border-[var(--primary-color)]/40"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Preview Thumbnail */}
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 bg-[var(--bg-color)] border border-[var(--border-color)]">
                                {(() => {
                                  const thumbMedia = resolveFestivalMedia(fest);
                                  return fest.mediaType === "video" &&
                                    thumbMedia.videoUrl ? (
                                    <video
                                      className="w-full h-full object-cover"
                                      src={thumbMedia.videoUrl}
                                      muted
                                    />
                                  ) : fest.mediaType === "banner" &&
                                    thumbMedia.bannerUrl ? (
                                    <img
                                      src={thumbMedia.bannerUrl}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                                      <Tag size={14} />
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[12px] sm:text-[13px] font-bold text-[var(--text-dark)] truncate">
                                    {fest.festivalName}
                                  </span>
                                  {fest.isActive && (
                                    <span className="px-1.5 py-0.5 text-[8px] font-bold text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 rounded-full shrink-0">
                                      Active
                                    </span>
                                  )}
                                  {fest.readOnly && (
                                    <span className="px-1.5 py-0.5 text-[8px] font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 rounded-full shrink-0 whitespace-nowrap">
                                      Shared
                                      {fest.sharedFromDeptName
                                        ? `: ${fest.sharedFromDeptName}`
                                        : ""}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span
                                    className={`px-1.5 py-0.5 text-[8px] font-medium rounded-full ${
                                      fest.mediaType === "video"
                                        ? "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
                                        : "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400"
                                    }`}
                                  >
                                    {fest.mediaType === "video"
                                      ? "Video"
                                      : "Banner"}
                                  </span>
                                  <span className="text-[9px] text-[var(--text-muted)]">
                                    Updated: {fest.updatedAt}
                                  </span>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 shrink-0">
                                {!fest.isActive && (
                                  <button
                                    onClick={() => activateFestival(fest.id)}
                                    className="p-1.5 text-[10px] font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors cursor-pointer"
                                    title="Activate"
                                  >
                                    <FaPlay size={10} />
                                  </button>
                                )}
                                {!fest.readOnly && (
                                  <button
                                    onClick={() => editFestival(fest.id)}
                                    className={`p-1.5 text-[10px] font-medium rounded-lg transition-colors cursor-pointer ${
                                      editingFestivalId === fest.id
                                        ? "text-[var(--primary-color)] bg-[var(--primary-color)]/10"
                                        : "text-[var(--text-muted)] hover:text-[var(--text-dark)] hover:bg-[var(--hover-bg)]"
                                    }`}
                                    title="Edit"
                                  >
                                    <FaEdit size={10} />
                                  </button>
                                )}
                                {!fest.readOnly && (
                                  <button
                                    onClick={() => deleteFestival(fest.id)}
                                    className="p-1.5 text-[10px] font-medium text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                                    title="Delete"
                                  >
                                    <FaTrash size={10} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Festival Mode Info */}
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg p-3">
                  <p className="text-[11px] sm:text-xs text-amber-700 dark:text-amber-400">
                    <strong>Festival mode</strong> displays a looping video or a
                    static banner in the header alongside the logo and
                    department name. You can save up to 5 festival
                    configurations and activate one at a time.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Live Preview */}
          <div className="lg:sticky lg:top-0">
            <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--text-dark)] mb-2">
              <FaEye size={12} />
              Preview
            </label>
            <div className="border border-[var(--border-color)] rounded-xl overflow-hidden bg-[var(--card-bg)]">
              {/* Simulated Header */}
              <div className="px-3 md:px-6 h-[60px] md:h-16 flex items-center gap-2 md:gap-4 border-b border-[var(--border-color)] bg-[var(--header-bg)] backdrop-blur-md">
                {config.headerMode === "festival" ? (
                  (() => {
                    const activeFest = festivalConfigs.find((f) => f.isActive);
                    const resolvedMedia = resolveFestivalMedia(activeFest);
                    const hasMedia =
                      activeFest?.mediaType === "video"
                        ? resolvedMedia.videoUrl
                        : resolvedMedia.bannerUrl;
                    return (
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0 overflow-hidden">
                        {/* Logo */}
                        {config.logo ? (
                          <img
                            src={config.logo}
                            alt=""
                            className="w-8 h-8 md:w-10 md:h-10 shrink-0"
                          />
                        ) : null}
                        {/* Text */}
                        <div className="flex flex-col min-w-0 shrink-0 max-w-[180px] md:max-w-[240px]">
                          <h1
                            className="text-[13px] sm:text-[16px] md:text-[20px] font-black tracking-tighter leading-none truncate"
                            style={{
                              color: config.headerNameColor || undefined,
                            }}
                          >
                            {config.headerName}
                          </h1>
                          <h2
                            className="text-[9px] md:text-[11px] font-semibold tracking-widest mt-0.5 truncate"
                            style={{ color: config.subtitleColor || undefined }}
                          >
                            {config.subtitle}
                          </h2>
                        </div>
                        {/* Festival Media */}
                        {activeFest && hasMedia ? (
                          activeFest.mediaType === "video" ? (
                            <video
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="h-9 md:h-11 rounded-lg object-cover flex-1 min-w-0"
                              src={resolvedMedia.videoUrl}
                            />
                          ) : (
                            <img
                              src={resolvedMedia.bannerUrl}
                              alt=""
                              className="h-9 md:h-11 rounded-lg object-cover flex-1 min-w-0"
                            />
                          )
                        ) : config.festivalVideo || config.festivalBanner ? (
                          config.festivalVideo ? (
                            <video
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="h-9 md:h-11 rounded-lg object-cover flex-1 min-w-0"
                              src={config.festivalVideo}
                            />
                          ) : (
                            <img
                              src={config.festivalBanner}
                              alt=""
                              className="h-9 md:h-11 rounded-lg object-cover flex-1 min-w-0"
                            />
                          )
                        ) : null}
                      </div>
                    );
                  })()
                ) : config.headerMode === "background" &&
                  (config.backgroundVideo || config.backgroundBanner) ? (
                  <div className="flex items-center gap-2.5 md:gap-4 select-none relative rounded-xl overflow-hidden flex-1 h-full">
                    {config.backgroundVideo ? (
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                        src={config.backgroundVideo}
                      />
                    ) : config.backgroundBanner ? (
                      <img
                        src={config.backgroundBanner}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-black/40 z-0" />
                    {config.logo ? (
                      <img
                        src={config.logo}
                        alt=""
                        className="w-10 h-10 md:w-12 md:h-12 shrink-0 relative z-10"
                      />
                    ) : (
                      <FaUpload
                        className="text-white/50 w-10 h-10 shrink-0 relative z-10"
                        size={16}
                      />
                    )}
                    <div className="flex flex-col min-w-0 flex-1 relative z-10">
                      <h1
                        className="text-[13px] sm:text-[18px] md:text-[22px] font-black tracking-tighter leading-none truncate"
                        style={{
                          color: config.headerNameColor || "var(--text-dark)",
                        }}
                      >
                        {config.headerName}
                      </h1>
                      <h2 className="text-[8px] sm:text-[10px] md:text-[12px] font-semibold tracking-widest mt-0.5 truncate text-white/70">
                        {config.subtitle}
                      </h2>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 md:gap-4 select-none relative rounded-xl overflow-hidden">
                    {config.logo ? (
                      <img
                        src={config.logo}
                        alt=""
                        className="w-10 h-10 md:w-12 md:h-12 shrink-0 relative z-10"
                      />
                    ) : null}
                    <div className="flex flex-col min-w-0 flex-1 relative z-10">
                      <h1
                        className="text-[13px] sm:text-[18px] md:text-[22px] font-black tracking-tighter leading-none truncate"
                        style={{
                          color: config.headerNameColor || "var(--text-dark)",
                        }}
                      >
                        {config.headerName}
                      </h1>
                      <h2
                        className="text-[8px] sm:text-[10px] md:text-[12px] font-semibold tracking-widest mt-0.5 truncate"
                        style={{
                          color: config.subtitleColor || "var(--text-muted)",
                        }}
                      >
                        {config.subtitle}
                      </h2>
                    </div>
                  </div>
                )}
              </div>

              {/* Preview body with config info */}
              <div className="px-3 py-2.5 bg-[var(--bg-color)] border-t border-[var(--border-color)]">
                <p className="text-xs sm:text-sm font-semibold text-[var(--text-dark)] mb-1">
                  Current Configuration
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                    <span className="text-[var(--text-muted)]">Mode:</span>
                    <span className="font-medium text-[var(--text-dark)] capitalize">
                      {config.headerMode}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                    <span className="text-[var(--text-muted)]">Name:</span>
                    <span
                      className="font-medium truncate max-w-[120px]"
                      style={{
                        color: config.headerNameColor || "var(--text-dark)",
                      }}
                    >
                      {config.headerName || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                    <span className="text-[var(--text-muted)]">Subtitle:</span>
                    <span
                      className="font-medium truncate max-w-[120px]"
                      style={{
                        color: config.subtitleColor || "var(--text-muted)",
                      }}
                    >
                      {config.subtitle || "—"}
                    </span>
                  </div>
                  {config.headerMode === "festival" &&
                    (() => {
                      const active = festivalConfigs.find((f) => f.isActive);
                      const draft = festivalConfigs.find((f) => f.id === "new");
                      const show = active || draft;
                      if (
                        !show &&
                        !config.festivalVideo &&
                        !config.festivalBanner
                      )
                        return null;
                      const name = show?.festivalName || "Quick Test";
                      const media = show
                        ? show.mediaType === "video"
                          ? "Video"
                          : "Banner"
                        : config.festivalVideo
                          ? "Video"
                          : "Banner";
                      return (
                        <>
                          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                            <span className="text-[var(--text-muted)]">
                              Festival:
                            </span>
                            <span className="font-medium text-[var(--text-dark)]">
                              {name}
                            </span>
                            {show?.isActive && (
                              <span className="px-1 py-0.5 text-[7px] font-bold text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                            <span className="text-[var(--text-muted)]">
                              Media:
                            </span>
                            <span
                              className={`font-medium ${media === "Video" ? "text-blue-600" : "text-purple-600"}`}
                            >
                              {media}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  {config.headerMode === "background" &&
                    config.backgroundVideo && (
                      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                        <span className="text-[var(--text-muted)]">Video:</span>
                        <span className="font-medium text-green-600">
                          Active
                        </span>
                      </div>
                    )}
                  {config.headerMode === "background" &&
                    config.backgroundBanner && (
                      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                        <span className="text-[var(--text-muted)]">
                          Banner:
                        </span>
                        <span className="font-medium text-blue-600">
                          Active
                        </span>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Background Banner & Video Upload - Below Preview */}
            {config.headerMode === "background" && (
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  {/* Background Banner Upload */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--text-dark)] mb-1.5">
                      <Image size={11} />
                      Banner
                    </label>
                    <div
                      onClick={() => bannerInputRef.current?.click()}
                      className="w-full h-24 sm:h-28 rounded-xl border-2 border-dashed border-[var(--border-color)] hover:border-[var(--primary-color)] flex items-center justify-center cursor-pointer transition-colors overflow-hidden bg-[var(--bg-color)]"
                    >
                      {config.backgroundBanner ? (
                        <img
                          src={config.backgroundBanner}
                          alt="Banner"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center px-1">
                          <FaUpload
                            className="mx-auto text-[var(--text-muted)] mb-1"
                            size={16}
                          />
                          <span className="text-[11px] sm:text-xs text-[var(--text-muted)] font-medium block">
                            Upload banner
                          </span>
                          <span className="text-[9px] text-[var(--text-muted)]">
                            PNG/JPG, max 2MB
                          </span>
                        </div>
                      )}
                    </div>
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(
                            "backgroundBanner",
                            e.target.files[0],
                            2,
                          );
                          updateConfig("backgroundVideo", "");
                        }
                      }}
                    />
                    {config.backgroundBanner && (
                      <button
                        onClick={() => handleRemoveFile("backgroundBanner")}
                        className="mt-1.5 flex items-center gap-1 px-2 py-1 text-[9px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                      >
                        <FaTrash size={9} /> Remove
                      </button>
                    )}
                  </div>

                  {/* Background Video Upload */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--text-dark)] mb-1.5">
                      <Video size={11} />
                      Video
                    </label>
                    <div
                      onClick={() => bgVideoInputRef.current?.click()}
                      className="w-full h-24 sm:h-28 rounded-xl border-2 border-dashed border-[var(--border-color)] hover:border-[var(--primary-color)] flex items-center justify-center cursor-pointer transition-colors overflow-hidden bg-[var(--bg-color)]"
                    >
                      {config.backgroundVideo ? (
                        <video
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                          src={config.backgroundVideo}
                        />
                      ) : (
                        <div className="text-center px-1">
                          <FaUpload
                            className="mx-auto text-[var(--text-muted)] mb-1"
                            size={16}
                          />
                          <span className="text-[11px] sm:text-xs text-[var(--text-muted)] font-medium block">
                            Upload video
                          </span>
                          <span className="text-[9px] text-[var(--text-muted)]">
                            MP4/WebM, max 2MB
                          </span>
                        </div>
                      )}
                    </div>
                    <input
                      ref={bgVideoInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(
                            "backgroundVideo",
                            e.target.files[0],
                            2,
                          );
                          updateConfig("backgroundBanner", "");
                        }
                      }}
                    />
                    {config.backgroundVideo && (
                      <button
                        onClick={() => handleRemoveFile("backgroundVideo")}
                        className="mt-1.5 flex items-center gap-1 px-2 py-1 text-[9px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                      >
                        <FaTrash size={9} /> Remove
                      </button>
                    )}
                  </div>
                </div>

                {!config.backgroundVideo && !config.backgroundBanner && (
                  <div>
                    <p className="text-[11px] sm:text-xs font-semibold text-[var(--text-muted)] mb-1">
                      Quick Test:
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          updateConfig("backgroundVideo", "/festival-test.mp4");
                          updateConfig("backgroundBanner", "");
                        }}
                        className="flex-1 px-2 py-1.5 text-[9px] font-medium text-[var(--primary-color)] bg-[var(--primary-color)]/10 hover:bg-[var(--primary-color)]/20 rounded-lg transition-colors cursor-pointer border border-[var(--primary-color)]/20"
                      >
                        Color Cycle
                      </button>
                      <button
                        onClick={() => {
                          updateConfig(
                            "backgroundVideo",
                            "/festival-gradient.mp4",
                          );
                          updateConfig("backgroundBanner", "");
                        }}
                        className="flex-1 px-2 py-1.5 text-[9px] font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 rounded-lg transition-colors cursor-pointer border border-purple-200 dark:border-purple-800/30"
                      >
                        Animated Gradient
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeaderSettings;
