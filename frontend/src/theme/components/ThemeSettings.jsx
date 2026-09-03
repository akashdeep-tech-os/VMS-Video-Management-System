import { useState, useEffect } from "react";
import { useGlassTheme } from "../glass/GlassThemeProvider";
import BodyHead from "../../components/common/BodyHead";
import { FaPalette, FaSave, FaUndo, FaArrowLeft } from "react-icons/fa";

const ThemeSettings = ({ onBack }) => {
  const { isGlassTheme } = useGlassTheme();

  const [deptGlassTheme, setDeptGlassTheme] = useState(isGlassTheme);
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDeptGlassTheme(isGlassTheme);
    setHasChanges(false);
    setSaved(false);
  }, [isGlassTheme]);

  const handleToggle = () => {
    const newValue = !deptGlassTheme;
    setDeptGlassTheme(newValue);
    setHasChanges(true);
    setSaved(false);
  };

  const [initialGlassTheme] = useState(() => isGlassTheme);

  const handleSave = () => {
    localStorage.setItem("vms_glass_theme", JSON.stringify(deptGlassTheme));
    setHasChanges(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setDeptGlassTheme(initialGlassTheme);
    setHasChanges(true);
    setSaved(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <BodyHead>
        <div className="flex items-center gap-2 min-w-[280px]">
          <div className=" flex-shrink-0">
            <FaPalette className="text-[var(--primary-color)] text-[20px]" />
          </div>
          <div className="leading-tight">
            <h2 className="text-xs md:text-[18px] font-bold tracking-tight text-[var(--text-dark)] leading-none">
              Theme
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] sm:text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-dark)] hover:bg-[var(--hover-bg)] rounded-lg transition-colors cursor-pointer"
          >
            <FaUndo size={11} />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-medium rounded-lg transition-all cursor-pointer ${
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

      <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
        <div className="max-w-md mx-auto space-y-4">
          {/* Glass Theme Toggle */}
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-dark)]">
                  Glass Theme
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {deptGlassTheme ? "Glass effects active" : "Classic layout"}
                </p>
              </div>
              <button
                onClick={handleToggle}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 cursor-pointer ${
                  deptGlassTheme ? "bg-blue-600" : "bg-[var(--border-color)]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                    deptGlassTheme ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
