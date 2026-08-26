import React, { useState, useCallback, useEffect } from "react";
import {
  FaUsers,
  FaCamera,
  FaHeading,
  FaPalette,
  FaUserCircle,
  FaBuilding,
  FaHeadset,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import UserSettings from "../../components/settings/UserSettings";
import AddCameraSettings from "../../components/settings/AddCameraSettings";
import ThemeSettings from "../../theme/components/ThemeSettings";
import HeaderSettings from "../../components/settings/HeaderSettings";
import CompanyProfileSettings from "../../components/settings/CompanyProfileSettings";
import SupportContactSettings from "../../components/settings/SupportContactSettings";

const Settings = () => {
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem("vms_settings_active_tab");
    if (["adddepartments", "centraldata", "switchdept", "groups"].includes(saved)) {
      return "users";
    }
    return saved || "users";
  });

  const [department, setDepartment] = useState(() => {
    try {
      const active = localStorage.getItem("vms_active_department");
      if (active) return JSON.parse(active);
      const departments = JSON.parse(localStorage.getItem("vms_departments") || "[]");
      return departments[0] || null;
    } catch {
      return null;
    }
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(false);
  const [profileOpen, setProfileOpen] = useState(() => {
    return ["companyprofile", "support"].includes(activeTab);
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setShowSidebar(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setShowSidebar(false);
    }
  }, [activeTab, isMobile]);

  useEffect(() => {
    if (["companyprofile", "support"].includes(activeTab)) {
      setProfileOpen(true);
    }
  }, [activeTab]);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    localStorage.setItem("vms_settings_active_tab", tabId);
  }, []);

  const handleUpdateDepartment = useCallback((updatedDept) => {
    setDepartment(updatedDept);
    try {
      localStorage.setItem("vms_active_department", JSON.stringify(updatedDept));
      localStorage.setItem("vms_settings_selected_dept", JSON.stringify(updatedDept));
      const departments = JSON.parse(localStorage.getItem("vms_departments") || "[]");
      const updated = departments.map((d) =>
        d.id === updatedDept.id ? updatedDept : d,
      );
      localStorage.setItem("vms_departments", JSON.stringify(updated));
      localStorage.setItem("vms_departments_version", String(Date.now()));
    } catch (e) {
      console.warn("Could not update department in localStorage", e);
    }
  }, []);

  const handleBack = useCallback(() => {
    setActiveTab("users");
    localStorage.setItem("vms_settings_active_tab", "users");
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "users":
        return (
          <UserSettings
            department={department}
            onUpdateDepartment={handleUpdateDepartment}
            onBack={handleBack}
          />
        );
      case "devices":
        return (
          <AddCameraSettings
            department={department}
            onBack={handleBack}
          />
        );
      case "companyprofile":
        return <CompanyProfileSettings />;
      case "support":
        return <SupportContactSettings />;
      case "header":
        return (
          <HeaderSettings
            department={department}
            onUpdateDepartment={handleUpdateDepartment}
            onBack={handleBack}
          />
        );
      case "theme":
        return (
          <ThemeSettings
            department={department}
            onUpdateDepartment={handleUpdateDepartment}
            onBack={handleBack}
          />
        );
      default:
        return (
          <UserSettings
            department={department}
            onUpdateDepartment={handleUpdateDepartment}
            onBack={handleBack}
          />
        );
    }
  };

  const getTabLabel = () => {
    const tabLabels = {
      users: "User Management",
      devices: "Device Management",
      companyprofile: "Company Profile",
      support: "Support & Contact",
      header: "Header Settings",
      theme: "Theme",
    };
    return tabLabels[activeTab] || "Settings";
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-3 py-1.5 border-b border-[var(--border-color)] flex items-center gap-2">
        {isMobile && (
          <button
            onClick={() => setShowSidebar(false)}
            className="p-[1.4rem] rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--danger)] hover:text-white transition-colors text-[var(--text-muted)]"
          >
            <FaTimes size={14} />
          </button>
        )}
        <span className="text-[18px] font-bold text-[var(--text-dark)]">
          Settings
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* User Management */}
        <button
          onClick={() => {
            handleTabChange("users");
            if (isMobile) setShowSidebar(false);
          }}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap w-full text-left
            ${
              activeTab === "users"
                ? "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30"
                : "text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-dark)] border border-transparent"
            }`}
        >
          <FaUsers size={15} className="shrink-0" />
          <span>User Management</span>
        </button>

        {/* Device Management */}
        <button
          onClick={() => {
            handleTabChange("devices");
            if (isMobile) setShowSidebar(false);
          }}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap w-full text-left
            ${
              activeTab === "devices"
                ? "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30"
                : "text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-dark)] border border-transparent"
            }`}
        >
          <FaCamera size={15} className="shrink-0" />
          <span>Device Management</span>
        </button>

        {/* Profile Management (Collapsible) */}
        <div>
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap w-full text-left text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-dark)] border border-transparent"
          >
            <FaUserCircle size={15} className="shrink-0" />
            <span>Profile Management</span>
            <span className="ml-auto text-[10px] transition-transform duration-200">
              {profileOpen ? "\u25BC" : "\u25B6"}
            </span>
          </button>

          <AnimatePresence initial={false}>
            {profileOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="ml-2 mt-1 border-l-2 border-[var(--border-color)] pl-2 space-y-0.5">
                  <button
                    onClick={() => {
                      handleTabChange("companyprofile");
                      if (isMobile) setShowSidebar(false);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 w-full text-left
                      ${
                        activeTab === "companyprofile"
                          ? "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30"
                          : "text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-dark)] border border-transparent"
                      }`}
                  >
                    <FaBuilding size={12} className="shrink-0" />
                    <span>Company Profile Management</span>
                  </button>

                  <button
                    onClick={() => {
                      handleTabChange("support");
                      if (isMobile) setShowSidebar(false);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 w-full text-left
                      ${
                        activeTab === "support"
                          ? "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30"
                          : "text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-dark)] border border-transparent"
                      }`}
                  >
                    <FaHeadset size={12} className="shrink-0" />
                    <span>Support & Contact Management</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Header Settings */}
        <button
          onClick={() => {
            handleTabChange("header");
            if (isMobile) setShowSidebar(false);
          }}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap w-full text-left
            ${
              activeTab === "header"
                ? "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30"
                : "text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-dark)] border border-transparent"
            }`}
        >
          <FaHeading size={15} className="shrink-0" />
          <span>Header Settings</span>
        </button>

        {/* Theme */}
        <button
          onClick={() => {
            handleTabChange("theme");
            if (isMobile) setShowSidebar(false);
          }}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap w-full text-left
            ${
              activeTab === "theme"
                ? "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30"
                : "text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-dark)] border border-transparent"
            }`}
        >
          <FaPalette size={15} className="shrink-0" />
          <span>Theme</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full w-full bg-[var(--bg-color)] text-[var(--text-dark)] p-2 md:p-3 overflow-hidden">
      <div className="h-full w-full flex flex-col md:flex-row gap-3">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-60 shrink-0 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-2 overflow-hidden">
          {sidebarContent}
        </div>

        {/* Mobile Sidebar - Slider */}
        {isMobile && (
          <>
            <AnimatePresence>
              {showSidebar && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
                  onClick={() => setShowSidebar(false)}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showSidebar && (
                <motion.aside
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="fixed left-0 top-0 bottom-0 w-[280px] z-[100] bg-[var(--card-bg)] border-r border-[var(--border-color)] shadow-2xl"
                >
                  {sidebarContent}
                </motion.aside>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Right Content Area */}
        <div className="flex-1 min-h-0 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl overflow-hidden flex flex-col">
          {/* Mobile Header */}
          {isMobile && (
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border-color)] shrink-0">
              <button
                onClick={() => setShowSidebar(true)}
                className="p-2 rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--primary-color)]/10 text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors"
              >
                <FaBars size={16} />
              </button>
              <span className="text-sm font-bold text-[var(--text-dark)] truncate">
                {getTabLabel()}
              </span>
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
