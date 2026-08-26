import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import ProtectedRoute from "./ProtectedRoute";
import { LiveStreamingProvider } from "../Context/LiveStreamingContext";
import { GridFullscreenProvider } from "../Context/GridFullscreenContext";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import LiveStreaming from "../pages/LiveStreaming";
import Playback from "../pages/Playback";
import Addcamera from "../pages/Addcamera";
import FaceRecognition from "../pages/FaceRecognition";
import PeopleCounting from "../pages/PeopleCounting";
import LineCrossing from "../pages/LineCrossing";
import ObjectDetection from "../pages/ObjectDetection";
import AnprDashboard from "../pages/AnprDashboard";
import VehicleTracking from "../pages/VehicleTracking";
import BlacklistVehicles from "../pages/BlacklistVehicles";
import Settings from "../pages/Settings";
import Reports from "../pages/Reports";
import AnprReports from "../pages/AnprReports";
import About from "../pages/About";

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
          {/* <Route element={<ProtectedRoute />}> */}
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/live" element={<LiveStreaming />} />
              <Route path="/playback" element={<Playback />} />
              <Route path="/add-camera" element={<Addcamera />} />
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
          {/* </Route> */}

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
