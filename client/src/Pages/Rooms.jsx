// src/Pages/Rooms.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiService from "../services/api";

// keep your original fallback images by type, used only if DB has no image
import photo1 from "../Images/albert-vincent-wu-fupf3-xAUqw-unsplash.jpg";
import photo2 from "../Images/adam-winger-VGs8z60yT2c-unsplash.jpg";
import photo3 from "../Images/room3.jpg";
import photo6 from "../Images/natalia-gusakova-EYoK3eVKIiQ-unsplash.jpg";

const fallbackByType = {
  SINGLE: photo1,
  DOUBLE: photo6,
  SUITE: photo3,
  DELUXE: photo2,
};

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    minPrice: "",
    maxPrice: "",
  });

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const roomsData = await apiService.getRooms(filters);
        setRooms(roomsData || []);
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const getRoomImage = (room) => {
    // prefer DB image; otherwise fall back to your original image-by-type
    return room?.image || fallbackByType[room?.type] || photo1;
  };

  const getRoomDescription = (room) => {
    // prefer DB description; otherwise keep your original short default
    return room?.description || "Comfortable room with modern amenities.";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading rooms...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto space-y-8 p-8">
        <h1 className="text-3xl font-semibold mb-6 text-[#B89B5E]">
          Our Rooms
        </h1>

        {/* Filters (unchanged styling) */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Filter Rooms</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room Type
              </label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B89B5E]"
              >
                <option value="">All Types</option>
                <option value="SINGLE">Single</option>
                <option value="DOUBLE">Double</option>
                <option value="SUITE">Suite</option>
                <option value="DELUXE">Deluxe</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B89B5E]"
              >
                <option value="">All Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OUT_OF_ORDER">Out of Order</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Price
              </label>
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="Min price"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B89B5E]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Price
              </label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="Max price"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B89B5E]"
              />
            </div>
          </div>
        </div>

        {/* Rooms Grid (same card styling) */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <img
                src={getRoomImage(room)}
                alt={room.type}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold">
                    {room.type?.replace("_", " ")}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      room.status === "AVAILABLE"
                        ? "bg-green-100 text-green-800"
                        : room.status === "OCCUPIED"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {room.status}
                  </span>
                </div>
                <p className="text-gray-600 mb-2">Room #{room.roomNumber}</p>
                <p className="text-[#B89B5E] font-bold text-lg">
                  ${room.price}/night
                </p>
                <p className="text-gray-600 text-sm mt-2 mb-4">
                  {getRoomDescription(room)}
                </p>
                <Link
                  to={`/rooms/${room.id}`}
                  className="inline-block bg-[#B89B5E] text-white px-4 py-2 rounded hover:bg-[#a0854d] transition duration-300"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">
              No rooms found matching your criteria.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Rooms;
