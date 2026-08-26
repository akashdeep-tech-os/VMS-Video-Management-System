import { useState, useCallback } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./MainLayout.css";
import { Outlet } from "react-router-dom";
import { useGridFullscreen } from "../../context/GridFullscreenContext";

const MainLayout = () => {
  const { isGridFullscreen } = useGridFullscreen();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = useCallback(() => {
    setMobileSidebarOpen((prev) => !prev);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  return (
    <div className="main-layout">
      {!isGridFullscreen && (
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onClose={closeMobileSidebar}
        />
      )}

      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-md"
          onClick={closeMobileSidebar}
        />
      )}

      <div className="main-content">
        {!isGridFullscreen && (
          <Header onMenuClick={toggleMobileSidebar} />
        )}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
