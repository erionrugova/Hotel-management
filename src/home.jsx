import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Homepage from "./Pages/Homepage";
import About from "./Pages/About"; 
import Login from "./Pages/Login";
import RoomDetails from "./Pages/RoomDetails";
import ContactUs from "./Pages/ContactUs";
import Rooms from "./Pages/Rooms";

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
        </Routes>
    </Router>
  );
}

export default App;
