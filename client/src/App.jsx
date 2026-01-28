import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { UserProvider, useUser } from "./UserContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

import SessionExpiredModal from "./components/SessionExpiredModal";

// Lazy load components for code splitting
const Layout = lazy(() => import("./Layout"));
const Homepage = lazy(() => import("./Pages/Homepage"));
const About = lazy(() => import("./Pages/About"));
const Login = lazy(() => import("./Pages/Login"));
const Signup = lazy(() => import("./Pages/Signup"));
const ContactUs = lazy(() => import("./Pages/ContactUs"));
const Rooms = lazy(() => import("./Pages/Rooms"));
const RoomDetails = lazy(() => import("./Pages/RoomDetails"));
const LoginSuccess = lazy(() => import("./Pages/LoginSuccess"));

const DashboardLayout = lazy(() => import("./Pages/Dashboard/DashboardLayout"));
const Dashboard = lazy(() => import("./Pages/Dashboard/Dashboard"));
const FrontDesk = lazy(() => import("./Pages/Dashboard/FrontDesk"));
const Guests = lazy(() => import("./Pages/Dashboard/Guests"));
const RoomsDashboard = lazy(() => import("./Pages/Dashboard/RoomsDashboard"));
const Deals = lazy(() => import("./Pages/Dashboard/Deals"));
const Rate = lazy(() => import("./Pages/Dashboard/Rate"));
const Invoices = lazy(() => import("./Pages/Dashboard/Refunds"));
const Settings = lazy(() => import("./Pages/Dashboard/Settings"));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B89B5E]"></div>
  </div>
);

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user && !requiredRole.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Homepage />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="rooms/:id" element={<RoomDetails />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<ContactUs />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login-success" element={<LoginSuccess />} />

        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute requiredRole={["ADMIN", "MANAGER"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="frontdesk" element={<FrontDesk />} />
          <Route path="guests" element={<Guests />} />
          <Route path="rooms" element={<RoomsDashboard />} />
          <Route path="deals" element={<Deals />} />
          <Route path="rates" element={<Rate />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <UserProvider>
        <SessionExpiredModal />
        <Router>
          <AppRoutes />
        </Router>
      </UserProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
