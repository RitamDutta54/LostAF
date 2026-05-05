import { Navigate } from "react-router-dom";

// Redirects to /login if user is not authenticated
export default function ProtectedRoute({ user, children }) {
  if (user === undefined) {
    // Auth state still loading — show nothing (prevents flash)
    return null;
  }
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
}
