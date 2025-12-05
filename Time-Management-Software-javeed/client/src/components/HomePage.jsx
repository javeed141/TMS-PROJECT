import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, Users, BarChart3 } from "lucide-react";
import { ThemeContext } from "../context/ThemeContext";

const theme = {
  light: {
    bg: "from-blue-50 via-indigo-50 to-white",
    text: "text-gray-700",
    heading: "text-gray-900",
    cardBg: "bg-white",
    cardBorder: "border-gray-200",
    glass: "bg-white/70 backdrop-blur-xl shadow-lg",
    primaryBtn: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondaryBtn: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100",
  },
  dark: {
    bg: "from-gray-900 via-gray-800 to-gray-900",
    text: "text-gray-300",
    heading: "text-white",
    cardBg: "bg-gray-800",
    cardBorder: "border-gray-700",
    glass: "bg-gray-800/50 backdrop-blur-xl shadow-lg",
    primaryBtn: "bg-indigo-500 text-white hover:bg-indigo-600",
    secondaryBtn: "bg-gray-700 border border-gray-600 text-gray-200 hover:bg-gray-600",
  },
};

export default function Home() {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const colors = isDark ? theme.dark : theme.light;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.bg} transition duration-300`}>

      {/* HEADER */}
      <header className={`sticky top-0 z-20 ${colors.glass} ${colors.cardBorder}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md">
              <Calendar className="h-5 w-5" />
            </div>
            <h1 className={`text-xl font-bold ${colors.heading}`}>Time Manager</h1>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <Link to="/signin" className={`hidden sm:block text-sm ${colors.text}`}>
              Sign In
            </Link>

            <Link
              to="/signup"
              className={`hidden sm:block ${colors.primaryBtn} px-4 py-2 rounded-lg text-sm`}
            >
              Get Started
            </Link>

            <button
              onClick={toggleTheme}
              className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm"
            >
              {isDark ? "🌞" : "🌙"}
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 pt-16 pb-10 text-center">

        {/* Main Heading */}
        <h1
          className={`text-3xl sm:text-5xl font-extrabold leading-tight mb-4 ${colors.heading}`}
        >
          Manage Time Smartly <br />
          <span className="text-indigo-600">Like a Leader</span>
        </h1>

        {/* Subtitle */}
        <p className={`text-base sm:text-xl max-w-md mx-auto mb-8 ${colors.text}`}>
          Smart scheduling, automated planning and executive-level productivity tools —
          all in one sleek time management system.
        </p>

        {/* BUTTONS — PERFECT MOBILE CENTERING */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 w-full">
          <Link
            to="/signup"
            className={`${colors.primaryBtn} w-full sm:w-auto px-6 py-3 rounded-xl text-lg shadow-md text-center`}
          >
            Start Free
          </Link>

          <Link
            to="/signin"
            className={`${colors.secondaryBtn} w-full sm:w-auto px-6 py-3 rounded-xl text-lg shadow-md text-center`}
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8 mt-4">

        {[
          {
            icon: <Calendar className="h-7 w-7 text-indigo-600" />,
            title: "Smart Scheduling",
            desc: "AI-assisted scheduling to eliminate conflicts across teams.",
            color: "bg-indigo-100 dark:bg-indigo-900/40",
          },
          {
            icon: <Clock className="h-7 w-7 text-green-600" />,
            title: "Time Insights",
            desc: "See daily, weekly and monthly time usage instantly.",
            color: "bg-green-100 dark:bg-green-900/40",
          },
          {
            icon: <BarChart3 className="h-7 w-7 text-purple-600" />,
            title: "Advanced Analytics",
            desc: "Detailed executive-level performance and productivity metrics.",
            color: "bg-purple-100 dark:bg-purple-900/40",
          },
        ].map((card, i) => (
          <div
            key={i}
            className={`${colors.glass} p-6 rounded-2xl transition hover:scale-[1.02]`}
          >
            {/* Icon */}
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${card.color}`}>
              {card.icon}
            </div>

            {/* Title */}
            <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${colors.heading}`}>
              {card.title}
            </h3>

            {/* Desc */}
            <p className={`${colors.text} text-sm sm:text-base`}>
              {card.desc}
            </p>
          </div>
        ))}

      </section>

      {/* CTA SECTION */}
      <section className="max-w-7xl mx-auto px-4 text-center py-14 mt-4">
        <h2 className={`text-2xl sm:text-4xl font-bold ${colors.heading}`}>
          Boost Productivity Starting Today
        </h2>

        <p className={`text-base sm:text-lg mt-3 mb-6 max-w-md mx-auto ${colors.text}`}>
          Join thousands of executives who trust Time Manager for daily planning.
        </p>

        <Link
          to="/signup"
          className={`${colors.primaryBtn} px-8 py-4 rounded-xl text-lg shadow-lg inline-flex items-center gap-2`}
        >
          <Users className="h-5 w-5" /> Get Started
        </Link>
      </section>

      {/* FOOTER */}
      <footer className={`${colors.cardBg} border-t ${colors.cardBorder} py-10 mt-6`}>
        <div className="text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            <span className={`text-lg font-semibold ${colors.heading}`}>
              Time Manager
            </span>
          </div>

          <p className={`${colors.text} text-sm`}>
            © 2024 Time Manager — All Rights Reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
