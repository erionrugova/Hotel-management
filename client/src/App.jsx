import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { UserProvider, useUser } from "./UserContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

import SessionExpiredModal from "./components/SessionExpiredModal";

import Layout from "./Layout";
import Homepage from "./Pages/Homepage";
import About from "./Pages/About";
import Login from "./Pages/Login";
import ContactUs from "./Pages/ContactUs";
import Rooms from "./Pages/Rooms";
import RoomDetails from "./Pages/RoomDetails";
import LoginSuccess from "./Pages/LoginSuccess";

import DashboardLayout from "./Pages/Dashboard/DashboardLayout";
import Dashboard from "./Pages/Dashboard/Dashboard";
import FrontDesk from "./Pages/Dashboard/FrontDesk";
import Guests from "./Pages/Dashboard/Guests";
import RoomsDashboard from "./Pages/Dashboard/RoomsDashboard";
import Deals from "./Pages/Dashboard/Deals";
import Rate from "./Pages/Dashboard/Rate";

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
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Homepage />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="rooms/:id" element={<RoomDetails />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<ContactUs />} />
      </Route>

      <Route path="/login" element={<Login />} />
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
      </Route>
    </Routes>
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
