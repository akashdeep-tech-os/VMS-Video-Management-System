import { useState } from "react";
import BodyHead from "../common/BodyHead";
import { FaHeadset, FaSave, FaUndo } from "react-icons/fa";

const DEFAULT_SUPPORT = {
  title: "SURAKSHIT VMS Support",
  description: "Need help? Reach out to our support team.",
  phone: "+91-7999999367",
  email: "connect@surakshitcity.com",
  website: "www.surakshitcity.com",
  address: "New Delhi, India",
  hours: "Monday - Saturday, 9:00 AM - 8:00 PM IST",
};

const inputClass =
  "w-full px-3 py-2 text-xs sm:text-sm bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-dark)] outline-none focus:border-[var(--primary-color)] transition-colors placeholder:text-[var(--text-muted)]";

function SupportContactSettings() {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem("vms_support_contact");
    return saved
      ? { ...DEFAULT_SUPPORT, ...JSON.parse(saved) }
      : DEFAULT_SUPPORT;
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);

  const updateConfig = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem("vms_support_contact", JSON.stringify(config));
    setHasChanges(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    localStorage.removeItem("vms_support_contact");
    setConfig({ ...DEFAULT_SUPPORT });
    setHasChanges(true);
    setSaved(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <BodyHead>
        <div className="flex items-center gap-2 min-w-[280px]">
          <div className=" flex-shrink-0">
            <FaHeadset className="text-[var(--primary-color)] text-[22px]" />
          </div>
          <div className="leading-tight">
            <h2 className="text-xs md:text-[18px] font-bold tracking-tight text-[var(--text-dark)] leading-none">
              Support & Contact Management
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

      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">
        <div className="max-w-2xl space-y-5">
          {/* Support Title */}
          <div>
            <label className="text-[11px] sm:text-xs font-semibold text-[var(--text-dark)] mb-1.5 block">
              Support Title
            </label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => updateConfig("title", e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] sm:text-xs font-semibold text-[var(--text-dark)] mb-1.5 block">
                Phone
              </label>
              <input
                type="tel"
                value={config.phone}
                onChange={(e) => updateConfig("phone", e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[11px] sm:text-xs font-semibold text-[var(--text-dark)] mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                value={config.email}
                onChange={(e) => updateConfig("email", e.target.value)}
                placeholder="support@company.com"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] sm:text-xs font-semibold text-[var(--text-dark)] mb-1.5 block">
                Website
              </label>
              <input
                type="url"
                value={config.website}
                onChange={(e) => updateConfig("website", e.target.value)}
                placeholder="www.company.com"
                className={inputClass}
              />
            </div>
          </div>

          {/* Support Hours */}
          <div>
            <label className="text-[11px] sm:text-xs font-semibold text-[var(--text-dark)] mb-1.5 block">
              Support Hours
            </label>
            <input
              type="text"
              value={config.hours}
              onChange={(e) => updateConfig("hours", e.target.value)}
              placeholder="Monday - Friday, 9:00 AM - 6:00 PM"
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupportContactSettings;
