import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import apiService from "../services/api";
import { useUser } from "../UserContext";

import photo1 from "../Images/albert-vincent-wu-fupf3-xAUqw-unsplash.jpg";
import photo2 from "../Images/adam-winger-VGs8z60yT2c-unsplash.jpg";
import photo3 from "../Images/room3.jpg";
import photo6 from "../Images/natalia-gusakova-EYoK3eVKIiQ-unsplash.jpg";

const fallbackByType = {
  SINGLE: photo1,
  DOUBLE: photo6,
  DELUXE: photo3,
  SUITE: photo2,
};

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [filters, setFilters] = useState({
    type: "",
    startDate: "",
    endDate: "",
    guests: "",
  });
  const { refreshKey } = useUser();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await apiService.getRooms(filters);
        setRooms(data || []);
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [filters, refreshKey]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const getRoomImage = (room) => {
    if (room?.imageUrl?.startsWith("/uploads")) {
      return `http://localhost:3000${room.imageUrl}`;
    }
    return room?.imageUrl || fallbackByType[room?.type] || photo1;
  };

  const uniqueRooms = Object.values(
    rooms.reduce((acc, room) => {
      if (!acc[room.type]) acc[room.type] = room;
      return acc;
    }, {})
  );

  const order = { SINGLE: 1, DOUBLE: 2, DELUXE: 3, SUITE: 4 };
  const orderedRooms = uniqueRooms.sort(
    (a, b) => (order[a.type] || 99) - (order[b.type] || 99)
  );

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-[#B9965D] text-xl">
        Loading rooms...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8F6F1] overflow-hidden">
      <div className="relative h-[320px] md:h-[380px] bg-gradient-to-b from-[#B9965D]/70 via-[#C5A880]/50 to-[#F8F6F1] flex items-center justify-center">
        <motion.div
          className="text-center text-white px-4"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-5xl md:text-6xl font-extrabold mb-3 tracking-wide drop-shadow-lg">
            Our Rooms
          </h1>
          <p className="text-lg md:text-xl italic font-light">
            Discover your perfect stay — where comfort meets elegance.
          </p>
        </motion.div>
      </div>

      <motion.div
        className="max-w-5xl mx-auto bg-white mt-[-50px] shadow-xl rounded-2xl p-8 z-10 relative"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h2 className="text-2xl font-semibold text-[#B9965D] mb-6 text-center">
          Filter Rooms
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <select
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            className="border p-3 rounded-md focus:ring-2 focus:ring-[#C5A880]"
          >
            <option value="">All Types</option>
            <option value="SINGLE">Single</option>
            <option value="DOUBLE">Double</option>
            <option value="DELUXE">Deluxe</option>
            <option value="SUITE">Suite</option>
          </select>

          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="border p-3 rounded-md focus:ring-2 focus:ring-[#C5A880]"
          />

          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="border p-3 rounded-md focus:ring-2 focus:ring-[#C5A880]"
          />

          <input
            type="number"
            name="guests"
            placeholder="Guests"
            value={filters.guests}
            onChange={handleFilterChange}
            className="border p-3 rounded-md focus:ring-2 focus:ring-[#C5A880]"
          />
        </div>
      </motion.div>

      <main className="container mx-auto space-y-24 px-8 py-20 flex flex-col items-center">
        {orderedRooms.map((room, index) => {
          const parallaxShift = (scrollY * 0.1 * (index + 1)) % 40;

          return (
            <motion.div
              key={room.id}
              className="bg-white border rounded-3xl shadow-lg overflow-hidden w-full max-w-[550px] mx-auto relative group transition-all duration-700"
              style={{
                background:
                  "linear-gradient(to bottom right, rgba(255,255,255,0.98), rgba(250,250,250,0.96))",
              }}
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 1,
                delay: index * 0.2,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              viewport={{ once: true }}
            >
              <div className="absolute inset-0 rounded-3xl border border-transparent group-hover:border-[#C5A880]/90 group-hover:shadow-[0_0_25px_rgba(197,168,128,0.35)] transition-all duration-700 pointer-events-none"></div>

              <div
                className="relative w-full h-[340px] overflow-hidden shadow-[0_6px_20px_rgba(0,0,0,0.15)]"
                style={{
                  transform: `translateY(${parallaxShift}px)`,
                  transition: "transform 0.3s ease-out",
                }}
              >
                <motion.img
                  src={getRoomImage(room)}
                  alt={room.type}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) =>
                    (e.currentTarget.src = fallbackByType[room.type] || photo1)
                  }
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white text-xl font-semibold tracking-wider">
                  {room.type?.replace("_", " ")}
                </div>
              </div>

              <div className="p-10 text-center">
                <motion.h3
                  className="text-3xl font-bold tracking-widest text-[#B89B5E] uppercase mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  {room.type?.replace("_", " ")}
                </motion.h3>

                <motion.p
                  className="text-[#B89B5E] font-extrabold text-2xl tracking-wide mb-5"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  ${room.price}/night
                </motion.p>

                <motion.p
                  className="text-gray-700 text-lg leading-relaxed mb-8 px-2"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  {room.description}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <Link
                    to={`/rooms/${room.id}`}
                    className="inline-block bg-[#B89B5E] text-white text-lg px-8 py-3 rounded-lg font-semibold hover:bg-[#a0854d] transition duration-300 shadow-md"
                  >
                    View Details
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          );
        })}

        {rooms.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-lg">
            No rooms found.
          </div>
        )}
      </main>
    </div>
  );
}

export default Rooms;
