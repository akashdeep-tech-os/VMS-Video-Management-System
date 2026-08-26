import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Camera,
  Car,
  BarChart3,
  Lock,
  AlertTriangle,
} from "lucide-react";

import login_image from "../assets/login.jpeg";
import logo from "../assets/logo-new.png";
import userService from "../api/userService";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("vms_token")) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await userService.login(userId, password);
      localStorage.setItem("vms_token", data.token);
      localStorage.setItem("vms_user", JSON.stringify({
        username: data.username,
        first_name: data.first_name,
        last_name: data.last_name,
        full_name: data.full_name,
        role: data.role,
        rights: data.rights,
      }));
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B1020]">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center login-bg"
        style={{
          backgroundImage: `url(${login_image})`,
        }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-[#0B1020]/80" />

      {/* Purple Glow */}
      <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-violet-700/20 blur-[120px]" />
      <div className="absolute -right-40 bottom-20 h-96 w-96 rounded-full bg-purple-700/20 blur-[120px]" />

      <div className="relative z-10 flex min-h-screen">
        {/* Left Section */}
        <div className="hidden lg:flex flex-1 flex-col justify-end gap-8 xl:gap-10 p-8 xl:p-12">
          <div className="w-full max-w-[550px]">
            <div className="flex items-center gap-4 text-white">
              <img src={logo} alt="logo" className="h-12 xl:h-16 pb-2" />
              <h1 className="text-4xl xl:text-6xl font-bold tracking-tight text-white">
                SURAKSHIT
                <span className="text-violet-500"> VMS</span>
              </h1>
            </div>

            <div className="mt-5 flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-500/80"></div>
              <p className="text-base xl:text-xl text-slate-300 tracking-wide whitespace-nowrap">
                Surveillance & AI Platform
              </p>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-500/80"></div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid max-w-4xl grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard icon={<Camera size={28} />} value="Live Monitoring" />

            <StatCard icon={<Car size={28} />} value="Vehicle Tracking" />

            <StatCard
              icon={<AlertTriangle size={28} />}
              value="Incident Alerts"
            />

            <StatCard icon={<BarChart3 size={28} />} value="AI Analytics" />
          </div>
        </div>

        {/* Login Panel */}
        <div className="flex w-full items-center justify-center p-6 lg:w-[440px] xl:w-[520px]">
          <div
            className="
            w-full
            rounded-[32px]
            border
            border-violet-500/30
            bg-slate-900/70
            p-8
            backdrop-blur-xl
            shadow-[0_0_40px_rgba(124,58,237,0.25)]
          "
          >
            <div className="mb-8 text-center">
              <img src={logo} alt="logo" className="mx-auto mb-4 h-20" />

              <p className="mt-2 text-slate-400">Sign in to continue</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              {/* Error Message */}
              {error && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* User ID */}
              <div className="mb-5">
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm text-slate-300 cursor-pointer"
                >
                  User ID
                </label>

                <input
                  id="email"
                  type="text"
                  placeholder="Enter your user id"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-700
                    bg-[#0F172A]
                    px-4
                    py-3
                    text-white
                    outline-none
                    transition
                    focus:border-violet-500
                  "
                />
              </div>

              {/* Password */}
              <div className="mb-5">
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm text-slate-300 cursor-pointer"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-700
                      bg-[#0F172A]
                      px-4
                      py-3
                      pr-12
                      text-white
                      outline-none
                      transition
                      focus:border-violet-500
                    "
                  />

                  <button
                    type="button"
                    className="absolute right-4 top-3 text-slate-400 hover:text-white transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <div className="mb-6 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-slate-300 transition-colors">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-700 bg-[#0F172A] accent-violet-600"
                  />
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-gradient-to-r
                from-violet-600
                to-purple-500
                py-3.5
                font-semibold
                text-white
                transition
                hover:scale-[1.02]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              "
              >
                <Lock size={18} />
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>

            <div className="mt-8 text-center text-xs text-slate-500">
              © 2026 Surakshit City | All Rights Reserved
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value }) {
  return (
    <div className="rounded-2xl border border-violet-500/20 bg-slate-900/60 p-4 xl:p-5 backdrop-blur">
      <div className="mb-3 text-violet-400">{icon}</div>
      <div className="text-lg xl:text-xl font-bold text-white">{value}</div>
    </div>
  );
}
