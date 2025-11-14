import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, Users, BarChart3 } from "lucide-react";
import { ThemeContext } from "../context/ThemeContext";

const themeColors = {
  light: {
    pageBg: "from-blue-50 to-indigo-100",
    headerBg: "bg-white/80",
    headerText: "text-gray-900",
    cardBg: "bg-white",
    cardBorder: "border-gray-200",
    text: "text-gray-600",
    buttonPrimary: "bg-blue-600 text-white hover:bg-blue-700",
    buttonSecondary:
      "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
  },
  dark: {
    pageBg: "from-gray-800 to-gray-900",
    headerBg: "bg-gray-900/90",
    headerText: "text-white",
    cardBg: "bg-gray-800",
    cardBorder: "border-gray-700",
    text: "text-gray-300",
    buttonPrimary: "bg-blue-500 text-white hover:bg-blue-600",
    buttonSecondary:
      "bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600",
  },
};

function Home() {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const colors = isDark ? themeColors.dark : themeColors.light;

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${colors.pageBg} transition-colors duration-300`}
    >
      {/* Header */}
      <header
        className={`${colors.headerBg} backdrop-blur-sm border-b ${colors.cardBorder}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className={`text-2xl font-bold ${colors.headerText}`}>
                Time Manager
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/signin"
                className={`${colors.text} hover:text-gray-900 px-4 py-2`}
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className={`${colors.buttonPrimary} px-4 py-2 rounded-lg`}
              >
                Get Started
              </Link>
              <button
                onClick={toggleTheme}
                className="px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-700"
              >
                Toggle Theme
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <div className="text-center">
          <h1 className={`text-5xl font-bold mb-6 ${colors.headerText}`}>
            Efficient Time Management
            <br />
            <span className="text-blue-600">for Executives</span>
          </h1>
          <p
            className={`text-xl mb-8 max-w-2xl mx-auto ${colors.text}`}
          >
            Streamline your schedule, automate meeting coordination, and track
            productivity with our comprehensive time management system designed
            for busy executives.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/signup"
              className={`${colors.buttonPrimary} px-8 py-4 rounded-lg text-lg font-medium transition-colors`}
            >
              Start Free Trial
            </Link>
            <Link
              to="/signin"
              className={`${colors.buttonSecondary} px-8 py-4 rounded-lg text-lg font-medium transition-colors`}
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div
            className={`${colors.cardBg} rounded-xl p-8 border ${colors.cardBorder}`}
          >
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className={`text-xl font-semibold mb-3 ${colors.headerText}`}>
              Smart Scheduling
            </h3>
            <p className={colors.text}>
              Automatically find common open slots across multiple executives'
              schedules and coordinate meetings effortlessly.
            </p>
          </div>

          <div
            className={`${colors.cardBg} rounded-xl p-8 border ${colors.cardBorder}`}
          >
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <h3 className={`text-xl font-semibold mb-3 ${colors.headerText}`}>
              Time Tracking
            </h3>
            <p className={colors.text}>
              Track time spent on meetings, projects, and tasks. Get detailed
              insights into how your time is being utilized.
            </p>
          </div>

          <div
            className={`${colors.cardBg} rounded-xl p-8 border ${colors.cardBorder}`}
          >
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className={`text-xl font-semibold mb-3 ${colors.headerText}`}>
              Analytics & Reports
            </h3>
            <p className={colors.text}>
              Generate comprehensive reports on meeting statistics,
              productivity metrics, and time allocation across projects.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <h2 className={`text-3xl font-bold mb-6 ${colors.headerText}`}>
            Ready to Transform Your Time Management?
          </h2>
          <p className={`text-xl mb-8 ${colors.text}`}>
            Join executives who trust our platform to manage their busy
            schedules.
          </p>
          <Link
            to="/signup"
            className={`${colors.buttonPrimary} px-8 py-4 rounded-lg text-lg font-medium inline-flex items-center`}
          >
            <Users className="h-5 w-5 mr-2" />
            Get Started Today
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer
        className={`${colors.cardBg} border-t ${colors.cardBorder} py-12`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Calendar className="h-6 w-6 text-blue-600 mr-2" />
            <span className={`text-lg font-semibold ${colors.headerText}`}>
              Time Manager
            </span>
          </div>
          <p className={colors.text}>
            © 2024 Time Manager. Efficient scheduling for modern executives.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
