// src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

/**
 * ProtectedRoute
 * - requiredRole: optional (not used here, but you can add it later)
 * - If no token, redirect to /signin with { from: location } so signin can return user.
 * - If token exists, allow rendering the child routes (Outlet).
 *
 * Important: This component does NOT call /api/auth/me by default to avoid extra round-trip.
 * If you want stronger validation, add an optional server check.
 */
export default function ProtectedRoute({ requiredRole }) {
  const location = useLocation();
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;

    if (!token) {
      setAllowed(false);
      setChecked(true);
      return;
    }

  if (requiredRole && role !== requiredRole) {
      setAllowed(false);
      setChecked(true);
      return;
    }

    setAllowed(true);
    setChecked(true);
  }, [requiredRole]);

  // While checking token presence show nothing or a spinner
  if (!checked) return <div className="p-8 text-center">Checking authentication…</div>;

  // If no token -> redirect to sign-in; pass attempted location in state
  if (!allowed) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  // Allowed -> render protected children
  return <Outlet />;
}
