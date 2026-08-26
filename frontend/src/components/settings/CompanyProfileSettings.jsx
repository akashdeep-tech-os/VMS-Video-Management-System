import { useState, useRef, useEffect } from "react";
import BodyHead from "../common/BodyHead";
import defaultLogo from "../../assets/logo-new.png";
import { FaBuilding, FaSave, FaUndo } from "react-icons/fa";

const DEFAULT_PROFILE = {
  companyName: "Surakshit City",
  tagline: "Protection In Every Connection",
  description: "",
  address: "PALAM VIHAR SECTOR 2 GURUGRAM, HARYANA, INDIA",
  phone: "+91-7999999367",
  email: "connect@surakshitcity.com",
  website: "www.surakshitcity.com",
  logo: "",
};

function CompanyProfileSettings() {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem("vms_company_profile");
    return saved
      ? { ...DEFAULT_PROFILE, ...JSON.parse(saved) }
      : DEFAULT_PROFILE;
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);
  const logoInputRef = useRef(null);

  const updateConfig = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem("vms_company_profile", JSON.stringify(config));
    setHasChanges(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    localStorage.removeItem("vms_company_profile");
    setConfig({ ...DEFAULT_PROFILE });
    setHasChanges(true);
    setSaved(false);
  };

  const handleLogoUpload = (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Logo must be less than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => updateConfig("logo", e.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <BodyHead>
        <div className="flex items-center gap-2 min-w-[280px]">
          <div className="flex-shrink-0">
            <FaBuilding className="text-[var(--primary-color)] text-[22px]" />
          </div>
          <div className="leading-tight">
            <h2 className="text-xs md:text-[18px] font-bold tracking-tight text-[var(--text-dark)] leading-none">
              Company Profile Management
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
          {/* Logo */}
          <div>
            <label className="text-[11px] sm:text-xs font-semibold text-[var(--text-dark)] mb-2 block">
              Company Logo
            </label>
            <div className="flex items-center gap-4">
              <div
                onClick={() => logoInputRef.current?.click()}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-[var(--border-color)] hover:border-[var(--primary-color)] flex items-center justify-center cursor-pointer transition-colors overflow-hidden bg-[var(--bg-color)]"
              >
                {config.logo ? (
                  <img
                    src={config.logo}
                    alt="Logo"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <img
                    src={defaultLogo}
                    alt="Default"
                    className="w-full h-full object-contain p-2 opacity-60"
                  />
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleLogoUpload(e.target.files?.[0])}
              />
            </div>
          </div>

          {/* Company Name */}
          <div>
            <label className="text-[11px] sm:text-xs font-semibold text-[var(--text-dark)] mb-1.5 block">
              Company Name
            </label>
            <input
              type="text"
              value={config.companyName}
              onChange={(e) => updateConfig("companyName", e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-dark)] outline-none focus:border-[var(--primary-color)] transition-colors"
            />
          </div>

          {/* Tagline */}
          <div>
            <label className="text-[11px] sm:text-xs font-semibold text-[var(--text-dark)] mb-1.5 block">
              Tagline
            </label>
            <input
              type="text"
              value={config.tagline}
              onChange={(e) => updateConfig("tagline", e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-dark)] outline-none focus:border-[var(--primary-color)] transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] sm:text-xs font-semibold text-[var(--text-dark)] mb-1.5 block">
              About Company
            </label>
            <textarea
              value={config.description}
              onChange={(e) => updateConfig("description", e.target.value)}
              placeholder="Write about your company... Use **bold text** for emphasis."
              rows={5}
              className="w-full px-3 py-2.5 text-xs sm:text-sm bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl text-[var(--text-dark)] outline-none focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--primary-color)]/20 transition-all placeholder:text-[var(--text-muted)] resize-y min-h-[100px]"
            />
            <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
              Tip: Use **text** to make text bold. Press Enter for new lines.
            </p>
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
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-dark)] outline-none focus:border-[var(--primary-color)] transition-colors placeholder:text-[var(--text-muted)]"
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
                placeholder="contact@company.com"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-dark)] outline-none focus:border-[var(--primary-color)] transition-colors placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] sm:text-xs font-semibold text-[var(--text-dark)] mb-1.5 block">
              Address
            </label>
            <input
              type="text"
              value={config.address}
              onChange={(e) => updateConfig("address", e.target.value)}
              placeholder="Company address"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-dark)] outline-none focus:border-[var(--primary-color)] transition-colors placeholder:text-[var(--text-muted)]"
            />
          </div>

          <div>
            <label className="text-[11px] sm:text-xs font-semibold text-[var(--text-dark)] mb-1.5 block">
              Website
            </label>
            <input
              type="url"
              value={config.website}
              onChange={(e) => updateConfig("website", e.target.value)}
              placeholder="https://company.com"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-dark)] outline-none focus:border-[var(--primary-color)] transition-colors placeholder:text-[var(--text-muted)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyProfileSettings;
