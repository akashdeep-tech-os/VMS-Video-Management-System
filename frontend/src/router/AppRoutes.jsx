import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import ProtectedRoute from "./ProtectedRoute";
import { LiveStreamingProvider } from "../context/LiveStreamingContext";
import { GridFullscreenProvider } from "../context/GridFullscreenContext";

import Login from "../pages/auth/Login";
import Dashboard from "../pages/dashboard/Dashboard";
import LiveStreaming from "../pages/video/LiveStreaming";
import Playback from "../pages/video/Playback";
import AddCamera from "../pages/settings/AddCamera";
import FaceRecognition from "../pages/ai/FaceRecognition";
import PeopleCounting from "../pages/ai/PeopleCounting";
import LineCrossing from "../pages/ai/LineCrossing";
import ObjectDetection from "../pages/ai/ObjectDetection";
import AnprDashboard from "../pages/anpr/AnprDashboard";
import VehicleTracking from "../pages/anpr/VehicleTracking";
import BlacklistVehicles from "../pages/anpr/BlacklistVehicles";
import Settings from "../pages/settings/Settings";
import Reports from "../pages/video/Reports";
import AnprReports from "../pages/anpr/AnprReports";
import About from "../pages/about/About";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <GridFullscreenProvider>
      <LiveStreamingProvider>
        <Routes>
          {/* ================= PUBLIC ROUTES ================= */}
          {/* The Login page sits OUTSIDE the MainLayout so it takes up the full screen */}
          <Route path="/" element={<Login />} />

          {/* ================= PROTECTED ROUTES ================= */}
          {/* Requires a token (vms_token); unauthenticated users go to Login. */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/live" element={<LiveStreaming />} />
              <Route path="/playback" element={<Playback />} />
              <Route path="/add-camera" element={<AddCamera />} />
              <Route path="/face" element={<FaceRecognition />} />
              <Route path="/people" element={<PeopleCounting />} />
              <Route path="/line-crossing" element={<LineCrossing />} />
              <Route path="/object-detection" element={<ObjectDetection />} />
              <Route path="/anpr-dashboard" element={<AnprDashboard />} />
              <Route path="/tracking" element={<VehicleTracking />} />
              <Route path="/blacklist-vehicles" element={<BlacklistVehicles />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/anpr-reports" element={<AnprReports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/about" element={<About />} />
            </Route>
          </Route>

          {/* ================= CATCH-ALL ROUTE ================= */}
          {/* If a user types a random URL (like /fakepage), automatically redirect them to the Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LiveStreamingProvider>
      </GridFullscreenProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;
