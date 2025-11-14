"use client";

import React, { useState, useContext, useEffect } from "react";
import {
  Sun,
  Moon,
  LogOut,
  Home,
  Calendar,
  Users,
  BarChart2,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ThemeContext } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";

// Secretary Pages
import SecretaryDashboard from "./SecretaryDashboard";
import ScheduleMeeting from "./ScheduleMeeting";
import RearrangeAppointments from "./RearrangeAppointments";
import Reports from "./Reports";
import Notifications from "./Notifications";
import { useNavigate } from "react-router-dom";

export default function SecretaryLayout() {
    const navigate = useNavigate();

  const { isDark, toggleTheme } = useContext(ThemeContext);
  const [activeView, setActiveView] = useState("Dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [userError, setUserError] = useState(null);

  const API_BASE = "https://tms-project-w5jz.onrender.com";

  // keep track of viewport >= md
  const [isDesktop, setIsDesktop] = useState(typeof window !== "undefined" ? window.innerWidth >= 768 : true);
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/signin');
      return;
    }

    async function fetchSecretary() {
      setLoadingUser(true);
      setUserError(null);
      try {
        const res = await fetch(`${API_BASE}/api/secretary/me`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          navigate('/signin');
          return;
        }

        const data = await res.json();
        const secretaryData = data?.secretary ?? data;
        setUser(secretaryData);
        if (secretaryData?.email) localStorage.setItem('userEmail', secretaryData.email);
        if (secretaryData?._id) localStorage.setItem('userId', secretaryData._id);
        localStorage.setItem('role', 'secretary');
      } catch (err) {
        console.error('Failed to fetch secretary profile', err);
        setUserError('Unable to fetch secretary profile');
      } finally {
        setLoadingUser(false);
      }
    }

    fetchSecretary();
  }, [API_BASE, navigate]);
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const navItems = [
    { name: "Dashboard", icon: Home },
    { name: "Rearrange Appointments", icon: Users },
    { name: "Reports", icon: BarChart2 },
    { name: "Notifications", icon: Bell },
  ];

  const handleLogout = () => 
  {
    console.log("Logout clicked");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userId");
      navigate("/signin");
  }

  // Tailwind classes for widths/margins (keep consistent with ExecutiveLayout)
  const sidebarExpanded = "md:w-64";
  const sidebarCollapsed = "md:w-20";
  const mainMarginExpanded = "md:ml-64";
  const mainMarginCollapsed = "md:ml-20";

  return (
    <div className={`flex flex-col md:flex-row min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-950 text-gray-100" : "bg-gray-100 text-gray-900"}`}>
      {/* Sidebar: hidden on small screens, fixed on md+ */}
      <aside
        className={`hidden md:flex flex-col p-6 transition-all duration-300 ease-in-out ${collapsed ? sidebarCollapsed : sidebarExpanded} md:fixed md:top-0 md:left-0 md:h-screen overflow-auto`}
        aria-label="Secretary sidebar"
      >
        {/* Brand */}
        <div className={`mb-8 flex flex-col items-start ${collapsed ? "items-center" : ""}`}>
          <h1 className={`font-extrabold tracking-tight transition-all duration-300 ${collapsed ? "text-2xl" : "text-3xl"}`}>
            TMS
          </h1>
          {!collapsed && <span className="text-sm text-gray-500 mt-1">Role: Secretary</span>}

          {!collapsed && (
            <div className={`mt-4 w-full p-3 rounded-lg border ${isDark ? "bg-slate-900/60 border-slate-700" : "bg-white border-slate-200"}`}>
              {loadingUser ? (
                <p className="text-xs text-gray-400">Loading profile…</p>
              ) : userError ? (
                <p className="text-xs text-red-500">{userError}</p>
              ) : user ? (
                <div>
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-400">No profile info</p>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveView(item.name)}
                title={item.name}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 transition-all duration-200 rounded-xl select-none ${collapsed ? "justify-center py-3 px-0" : "px-4 py-2.5"} ${active ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md scale-[1.02]" : (isDark ? "text-gray-300 hover:bg-gray-800 hover:text-white" : "text-gray-700 hover:bg-gray-100 hover:text-indigo-600")}`}
              >
                <Icon className={`w-5 h-5 ${active ? "" : (isDark ? "text-gray-300" : "text-gray-600")}`} />
                {!collapsed && <span className="font-medium text-sm">{item.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className={`mt-auto flex flex-col gap-3 pt-6 ${collapsed ? "items-center" : "items-stretch"}`}>
          <Button onClick={toggleTheme} variant="outline" className="flex items-center gap-2 w-full justify-center font-medium">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {!collapsed && (isDark ? "Light Mode" : "Dark Mode")}
          </Button>

          <Button onClick={handleLogout} variant="destructive" className={`flex items-center gap-2 w-full justify-center font-medium ${collapsed ? "px-0" : ""}`}>
            <LogOut className="w-4 h-4" />
            {!collapsed && "Logout"}
          </Button>
        </div>

        {/* Toggle handle */}
        <div
          role="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
          onClick={() => setCollapsed((s) => !s)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setCollapsed((s) => !s); }}
          tabIndex={0}
          className="absolute top-0 right-0 h-full flex items-center z-40"
          style={{ width: 16, transform: "translateX(50%)", cursor: "pointer" }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <div className="h-10 w-6 rounded-l-full flex items-center justify-center transition-all duration-200">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </div>
        </div>
      </aside>

      {/* Main Section: apply md margin so it doesn't hide under fixed sidebar */}
      <div className={`flex-1 flex flex-col ${isDesktop ? (collapsed ? mainMarginCollapsed : mainMarginExpanded) : ""}`}>
        {/* Mobile Header */}
        <header className={`md:hidden flex justify-between items-center p-4 border-b transition-all ${isDark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white shadow-sm"}`}>
          <div className="flex flex-col">
            <h1 className="font-bold text-xl text-indigo-600">TMS - Secretary</h1>
            <span className="text-sm text-gray-500 mt-1">{user?.name ? user.name : 'Role: Secretary'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={toggleTheme} variant="outline" size="sm" className="p-2 rounded-full">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button onClick={handleLogout} variant="destructive" size="sm" className="p-2 rounded-full">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Main content area (scrollable) */}
        <main className={`flex-1 p-4 md:p-6 overflow-y-auto`}>
          {activeView === "Dashboard" && <SecretaryDashboard user={user} loading={loadingUser} />}
          {activeView === "Schedule Meeting" && <ScheduleMeeting user={user} loading={loadingUser} />}
          {activeView === "Rearrange Appointments" && <RearrangeAppointments user={user} loading={loadingUser} />}
          {activeView === "Reports" && <Reports />}
          {activeView === "Notifications" && <Notifications />}
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 w-full border-t md:hidden flex justify-around py-2 backdrop-blur-md bg-opacity-90 transition-colors duration-300">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => setActiveView(item.name)}
                className={`flex flex-col items-center text-xs font-medium transition-all ${activeView === item.name ? "text-indigo-600 scale-105" : "text-gray-500 hover:text-indigo-500"}`}
              >
                <Icon className="w-6 h-6 mb-1" />
                {item.name.length > 10 ? item.name.slice(0, 10) : item.name}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
