import { useEffect, useState } from "react";
import { Calendar, Clock, Users, BarChart3 } from "lucide-react";

function MainComponent() {
  const [redirecting, setRedirecting] = useState(false);
const [loading,setLoading]=useState(false)
 

  if (loading || redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (true) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Time Manager</h1>
              </div>
              <div className="flex items-center space-x-4">
                <a
                  href="/account/signin"
                  className="text-gray-600 hover:text-gray-900 px-4 py-2"
                >
                  Sign In
                </a>
                <a
                  href="/account/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Get Started
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Efficient Time Management<br />
              <span className="text-blue-600">for Executives</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Streamline your schedule, automate meeting coordination, and track productivity 
              with our comprehensive time management system designed for busy executives.
            </p>
            <div className="flex justify-center space-x-4">
              <a
                href="/account/signup"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Start Free Trial
              </a>
              <a
                href="/account/signin"
                className="bg-white text-gray-700 px-8 py-4 rounded-lg text-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Sign In
              </a>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Scheduling</h3>
              <p className="text-gray-600">
                Automatically find common open slots across multiple executives' schedules 
                and coordinate meetings effortlessly.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Time Tracking</h3>
              <p className="text-gray-600">
                Track time spent on meetings, projects, and tasks. Get detailed insights 
                into how your time is being utilized.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics & Reports</h3>
              <p className="text-gray-600">
                Generate comprehensive reports on meeting statistics, productivity metrics, 
                and time allocation across projects.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-20 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Ready to Transform Your Time Management?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join executives who trust our platform to manage their busy schedules.
            </p>
            <a
              href="/account/signup"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <Users className="h-5 w-5 mr-2" />
              Get Started Today
            </a>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-blue-600 mr-2" />
              <span className="text-lg font-semibold text-gray-900">Time Manager</span>
            </div>
            <p className="text-gray-600">
              © 2024 Time Manager. Efficient scheduling for modern executives.
            </p>
          </div>
        </footer>
      </div>
    );
  }

  return null;
}

export default MainComponent;
