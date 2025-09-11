// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { UserProvider, useUser } from "./UserContext";

// Public pages
import Layout from "./Layout";
import Homepage from "./Pages/Homepage";
import About from "./Pages/About";
import Login from "./Pages/Login";
import ContactUs from "./Pages/ContactUs";
import Rooms from "./Pages/Rooms";
import RoomDetails from "./Pages/RoomDetails";

// Dashboard pages
import DashboardLayout from "./Pages/Dashboard/DashboardLayout";
import Dashboard from "./Pages/Dashboard/Dashboard";
import FrontDesk from "./Pages/Dashboard/FrontDesk";
import Guests from "./Pages/Dashboard/Guests";
import RoomsDashboard from "./Pages/Dashboard/RoomsDashboard";
import Deals from "./Pages/Dashboard/Deals";
import Rate from "./Pages/Dashboard/Rate";

// Protected Route
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

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Homepage />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="rooms/:id" element={<RoomDetails />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<ContactUs />} />
      </Route>

      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Admin dashboard routes */}
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute requiredRole="ADMIN">
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
    <UserProvider>
      <Router>
        <AppRoutes />
      </Router>
    </UserProvider>
  );
}

export default App;
