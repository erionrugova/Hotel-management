import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Layout from "./Layout";

// Pages
import Homepage from "./Pages/Homepage";
import About from "./Pages/About";
import Login from "./Pages/Login";
import RoomDetails from "./Pages/RoomDetails";
import ContactUs from "./Pages/ContactUs";
import Rooms from "./Pages/Rooms";

// Dashboard
import Dashboard from "./Pages/Dashboard/Dashboard";
import FrontDesk from "./Pages/Dashboard/FrontDesk";
import Guests from "./Pages/Dashboard/Guests";
import RoomsDashboard from "./Pages/Dashboard/RoomsDashboard";
import Deals from "./Pages/Dashboard/Deals";
import Rate from "./Pages/Dashboard/Rate";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/rooms/:id" element={<RoomDetails />} />
        <Route path="/rooms" element={<Rooms />} />

        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="frontdesk" element={<FrontDesk />} />
          <Route path="guests" element={<Guests />} />
          <Route path="roomsDashboard" element={<RoomsDashboard />} />
          <Route path="deals" element={<Deals />} />
          <Route path="rate" element={<Rate />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
