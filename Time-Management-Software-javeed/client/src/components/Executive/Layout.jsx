"use client";
import { useNavigate } from "react-router-dom";
import React, { useState, useContext, useEffect } from "react";
import {
  Sun,
  Moon,
  LogOut,
  Home,
  Calendar,
  Users,
  ClipboardList,
  BarChart2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ThemeContext } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";

import Dashboard from "./Dashboard";
import Schedule from "./Schedule";
import Meetings from "./Meetings";
import Engagements from "./Engagements";
import Reports from "./Reports";

export default function ExecutiveLayout() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useContext(ThemeContext);

  const [activeView, setActiveView] = useState("Dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== "undefined" ? window.innerWidth >= 768 : true);

  // user info state
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = "https://tms-project-w5jz.onrender.com";
  const API_USER_URL = `${API_BASE}/api/executive/info`;

  // ✅ Fetch current user info
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }

    async function fetchUser() {
      setLoadingUser(true);
      setError(null);
      try {
        const res = await fetch(API_USER_URL, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          navigate("/signin");
          return;
        }

        const data = await res.json();
        const userData = data?.user ?? data;

  setUser(userData);
  if (userData?.email) localStorage.setItem("userEmail", userData.email);
  if (userData?._id) localStorage.setItem("userId", userData._id);
  if (userData?.role) localStorage.setItem("role", userData.role);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setError("Failed to fetch user info");
      } finally {
        setLoadingUser(false);
      }
    }

    fetchUser();
  }, [navigate]);

  // Responsive width listener
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
  localStorage.removeItem("role");
  navigate("/signin");
  };

  const navItems = [
    { name: "Dashboard", icon: Home },
    { name: "Schedule", icon: Calendar },
    { name: "Meetings", icon: Users },
    { name: "Engagements", icon: ClipboardList },
    { name: "Reports", icon: BarChart2 },
  ];

  // Layout size styling
  const sidebarExpanded = "md:w-64";
  const sidebarCollapsed = "md:w-20";
  const mainMarginExpanded = "md:ml-64";
  const mainMarginCollapsed = "md:ml-20";

  return (
    <div className={`flex flex-col md:flex-row min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-800 text-gray-100" : "bg-gray-100 text-gray-700"}`}>
      {/* Sidebar */}
      <aside className={`hidden md:flex flex-col p-6 transition-all duration-300 ease-in-out ${collapsed ? sidebarCollapsed : sidebarExpanded} md:fixed md:top-0 md:left-0 md:h-screen overflow-auto`}>
        {/* Brand + User info */}
        <div className={`mb-8 flex flex-col items-start ${collapsed ? "items-center" : ""}`}>
          <h1 className={`font-extrabold text-3xl tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text ${collapsed ? "text-2xl" : "text-3xl"}`}>TMS</h1>
          {!collapsed && <span className="text-sm text-gray-500 mt-1">Role: Executive</span>}

          {/* Show user details */}
  {!collapsed && (
            <div
              className={`mt-4 w-full p-3 rounded-lg border transition-colors duration-200 ${
                isDark ? "bg-gradient-to-r from-slate-800 to-indigo-900 border-slate-700 text-slate-50 shadow-sm" : "bg-white border-slate-200 text-gray-900"
              }`}
            >
              {loadingUser ? (
                <div className="text-xs text-gray-400">Loading user...</div>
              ) : error ? (
                <div className="text-xs text-red-400">{error}</div>
              ) : user ? (
                <div>
                  <div className="text-sm font-semibold">{user.name ?? "Unnamed Executive"}</div>
                  <div className="text-xs text-gray-300">{user.email}</div>
                  {user.department && <div className="text-xs text-gray-300 mt-1">Dept: {user.department}</div>}
                </div>
              ) : (
                <div className="text-xs text-gray-400">No user info</div>
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
                className={`flex items-center gap-3 transition-all duration-200 rounded-xl select-none ${
                  collapsed ? "justify-center py-3 px-0" : "px-4 py-2.5"
                } ${
                  active
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md scale-[1.02]"
                    : isDark
                    ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                    : "text-gray-700 hover:bg-gray-100 hover:text-indigo-600"
                }`}
              >
                <Icon className="w-5 h-5" />
                {!collapsed && <span className="font-medium text-sm">{item.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom buttons */}
        <div className={`mt-auto flex flex-col gap-3 pt-6 ${collapsed ? "items-center" : "items-stretch"}`}>
          <Button onClick={toggleTheme} variant="outline" className="flex items-center gap-2 justify-center">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {!collapsed && (isDark ? "Light Mode" : "Dark Mode")}
          </Button>

          <Button onClick={handleLogout} variant="destructive" className={`flex items-center gap-2 justify-center ${collapsed ? "px-0" : ""}`}>
            <LogOut className="w-4 h-4" />
            {!collapsed && "Logout"}
          </Button>
        </div>

        {/* Collapse toggle */}
        <div
          role="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
          onClick={() => setCollapsed((s) => !s)}
          tabIndex={0}
          className="absolute top-0 right-0 h-full flex items-center z-40 cursor-pointer"
          style={{ width: 16, transform: "translateX(50%)" }}
        >
          <div className="h-10 w-6 rounded-l-full flex items-center justify-center">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </div>
        </div>
      </aside>

      {/* Main section */}
      <div className={`flex-1 flex flex-col ${isDesktop ? (collapsed ? mainMarginCollapsed : mainMarginExpanded) : ""}`}>
        {/* Header */}
        <header className={`md:hidden flex justify-between items-center p-4 border-b ${isDark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white shadow-sm"}`}>
          <div>
            <h1 className="font-bold text-xl text-indigo-600">TMS - Executive</h1>
            {user && <span className="text-sm text-gray-500">{user.name} · {user.email}</span>}
          </div>
          <div className="flex gap-2">
            <Button onClick={toggleTheme} variant="outline" size="sm" className="p-2 rounded-full">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button onClick={handleLogout} variant="destructive" size="sm" className="p-2 rounded-full">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {activeView === "Dashboard" && <Dashboard user={user} />}
          {activeView === "Schedule" && <Schedule user={user} />}
          {activeView === "Meetings" && <Meetings user={user} />}
          {activeView === "Engagements" && <Engagements user={user} />}
          {activeView === "Reports" && <Reports user={user} />}
        </main>
      </div>
      {/* Mobile bottom tab navigation (appears on small screens only) */}
      <nav
        className={`fixed bottom-3 left-3 right-3 md:hidden rounded-2xl z-50 shadow-lg transition-all duration-200 ${
          isDark ? "bg-gradient-to-r from-indigo-900/95 via-slate-900/95 to-rose-900/95 border border-slate-700 text-slate-100" : "bg-white/95 border border-gray-200 text-gray-900"
        }`}
        role="tablist"
        aria-label="Primary Navigation"
      >
        <div className="flex justify-between items-center px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveView(item.name)}
                role="tab"
                aria-selected={active}
                title={item.name}
                className={`flex-1 py-2 px-1 flex flex-col items-center justify-center text-xs transition-all duration-150 ${
                  active
                    ? "scale-[1.03] font-semibold"
                    : "opacity-90"
                }`}
              >
                <div className={`p-2 rounded-md ${active ? (isDark ? "bg-amber-500/10" : "bg-indigo-50") : ""}`}>
                  <Icon className={`w-5 h-5 ${active ? (isDark ? "text-amber-300" : "text-indigo-600") : ""}`} />
                </div>
                <span className={`mt-1 ${active ? (isDark ? "text-amber-200" : "text-indigo-600") : "text-xs text-muted-foreground"}`}>{item.name}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
