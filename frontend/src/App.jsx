import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { Toaster } from "./components/ui/sonner";

// Non-app routes
import LandingPage from "./routes/index";
import LoginPage from "./routes/login";
import SignupPage from "./routes/signup"; // kept for admin/signup only
import ForgotPasswordPage from "./routes/forgot-password";
import AdminLoginPage from "./routes/admin.login";
import AdminSignupPage from "./routes/admin.signup";

// App layout and routes
import AppLayout from "./routes/_app";
import DashboardPage from "./routes/_app/dashboard";
import AttendancePage from "./routes/_app/attendance";
import LeavePage from "./routes/_app/leave";
import ProfilePage from "./routes/_app/profile";

// Admin layout and routes
import AdminDashboardPage from "./routes/_app/admin/index";
import AdminAttendancePage from "./routes/_app/admin/attendance";
import AdminEmployeesPage from "./routes/_app/admin/employees";
import AdminLeavesPage from "./routes/_app/admin/leaves";
import AdminReportsPage from "./routes/_app/admin/reports";
import AdminSettingsPage from "./routes/_app/admin/settings";

import { PageLoader } from "./components/PageLoader";

const queryClient = new QueryClient();

// Protected Route wrapper
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<Navigate to="/login" replace />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/signup" element={<AdminSignupPage />} />

            {/* Employee App Routes */}
            <Route element={
              <ProtectedRoute allowedRoles={["employee", "manager", "admin"]}>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/leave" element={<LeavePage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Admin App Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboardPage />} />
              <Route path="attendance" element={<AdminAttendancePage />} />
              <Route path="employees" element={<AdminEmployeesPage />} />
              <Route path="leaves" element={<AdminLeavesPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>
            
            <Route path="*" element={
              <div className="flex min-h-screen items-center justify-center bg-background px-4">
                <div className="max-w-md text-center">
                  <h1 className="text-7xl font-bold text-foreground">404</h1>
                  <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
                </div>
              </div>
            } />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
