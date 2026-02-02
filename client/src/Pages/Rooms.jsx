import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaArrowRight, FaBed, FaUsers, FaWifi, FaSwimmingPool, FaParking } from "react-icons/fa";
import { Sparkles, Heart } from "lucide-react";
import apiService from "../services/api";
import { useUser } from "../UserContext";
import LazyImage from "../components/LazyImage";

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

// FadeInSection Component
const FadeInSection = ({ children, delay = 0, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]); // Store all rooms for image reference
  const [loading, setLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [filters, setFilters] = useState({
    type: "",
    startDate: "",
    endDate: "",
    guests: "",
  });
  const { refreshKey } = useUser();

  // Fetch all rooms once to get image URLs for each room type
  useEffect(() => {
    const fetchAllRooms = async () => {
      try {
        const data = await apiService.getRooms({});
        setAllRooms(data || []);
      } catch (error) {
        console.error("Failed to fetch all rooms:", error);
      }
    };
    fetchAllRooms();
  }, [refreshKey]);

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
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Helper function to check if imageUrl is a valid uploaded image (not default.jpg)
  const isValidUploadedImage = useCallback((imageUrl) => {
    if (!imageUrl) return false;
    return imageUrl.startsWith("/uploads/rooms/") && !imageUrl.includes("default.jpg");
  }, []);

  const getRoomImage = useCallback((room) => {
    // First, try to get image from the room itself (but exclude default.jpg)
    if (isValidUploadedImage(room?.imageUrl)) {
      return `http://localhost:3000${room.imageUrl}`;
    }
    
    // If room doesn't have uploaded image, look for any room of the same type with uploaded image
    if (room?.type && allRooms.length > 0) {
      const roomWithImage = allRooms.find(
        (r) => r.type === room.type && isValidUploadedImage(r?.imageUrl)
      );
      if (roomWithImage?.imageUrl) {
        return `http://localhost:3000${roomWithImage.imageUrl}`;
      }
    }
    
    // Fallback to default images
    return fallbackByType[room?.type] || photo1;
  }, [allRooms, isValidUploadedImage]);

  // Get standard room data for each type from allRooms (for consistent display)
  // Then filter to only show room types that match the filter criteria
  const orderedRooms = useMemo(() => {
    // First, get standard representative room for each type from allRooms
    const standardRoomsByType = {};
    if (allRooms.length > 0) {
      allRooms.forEach((room) => {
        if (!room || !room.type) return;
        
        // If we haven't seen this type, add it
        if (!standardRoomsByType[room.type]) {
          standardRoomsByType[room.type] = room;
        } else {
          // Prioritize rooms with uploaded images (not default.jpg)
          const currentHasUpload = isValidUploadedImage(room?.imageUrl);
          const existingHasUpload = isValidUploadedImage(standardRoomsByType[room.type]?.imageUrl);
          
          // If current room has uploaded image and existing doesn't, replace it
          // Otherwise, prefer the first room encountered (standard capacity)
          if (currentHasUpload && !existingHasUpload) {
            standardRoomsByType[room.type] = room;
          }
        }
      });
    }
    
    // Apply filters to determine which room types should be shown
    const roomsArray = Array.isArray(rooms) ? rooms : [];
    
    // If no filters are applied (or only date filters), show all standard room types
    const hasTypeFilter = filters.type && filters.type !== "";
    const hasGuestsFilter = filters.guests && filters.guests !== "";
    
    let result = Object.values(standardRoomsByType);
    
    // If guests filter is applied, check if standard room capacity matches
    if (hasGuestsFilter) {
      const minGuests = parseInt(filters.guests, 10);
      result = result.filter((room) => {
        const capacity = parseInt(room.capacity, 10) || 0;
        return capacity >= minGuests;
      });
    }
    
    // If type filter is applied, filter by type
    if (hasTypeFilter) {
      result = result.filter((room) => room.type === filters.type);
    }
    
    // If date filters are applied, only show types that have available rooms
    if (filters.startDate && filters.endDate) {
      const availableTypes = new Set(roomsArray.map((room) => room?.type).filter(Boolean));
      result = result.filter((room) => availableTypes.has(room.type));
    }
    
    const order = { SINGLE: 1, DOUBLE: 2, DELUXE: 3, SUITE: 4 };
    return result.sort((a, b) => (order[a.type] || 99) - (order[b.type] || 99));
  }, [rooms, allRooms, filters, isValidUploadedImage]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F6F1]">
        <motion.div
          className="w-16 h-16 border-4 border-[#B89B5E] border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8F6F1] overflow-hidden">
      {/* Enhanced Hero Section */}
      <div className="relative h-[400px] md:h-[500px] bg-gradient-to-b from-[#B89B5E]/80 via-[#C5A880]/60 to-[#F8F6F1] flex items-center justify-center overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <motion.div
          className="text-center text-white px-4 relative z-10"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            className="inline-flex items-center gap-2 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className="text-white" size={20} />
            <span className="text-sm font-semibold uppercase tracking-wider text-white/90">
              Luxury Accommodations
            </span>
          </motion.div>
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold mb-4 tracking-tight drop-shadow-2xl">
            Our Rooms
          </h1>
          <p className="text-xl md:text-2xl italic font-light text-white/95 max-w-2xl mx-auto">
            Discover your perfect stay — where comfort meets elegance.
          </p>
        </motion.div>
      </div>

      {/* Enhanced Filter Section */}
      <FadeInSection delay={0.2}>
        <div className="max-w-6xl mx-auto px-8 md:px-16 lg:px-24 -mt-16 relative z-20">
          <motion.div
            className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-100"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-2 text-[#B89B5E] font-semibold text-sm uppercase tracking-wider mb-6">
              <Heart className="text-[#B89B5E]" size={16} />
              <span>Find Your Perfect Room</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Room Type</label>
                <select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#B89B5E] focus:border-[#B89B5E] transition-all duration-300 bg-gray-50 focus:bg-white text-gray-900"
                >
                  <option value="">All Types</option>
                  <option value="SINGLE">Single</option>
                  <option value="DOUBLE">Double</option>
                  <option value="DELUXE">Deluxe</option>
                  <option value="SUITE">Suite</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Check-In</label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#B89B5E] focus:border-[#B89B5E] transition-all duration-300 bg-gray-50 focus:bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Check-Out</label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#B89B5E] focus:border-[#B89B5E] transition-all duration-300 bg-gray-50 focus:bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Guests</label>
                <input
                  type="number"
                  name="guests"
                  placeholder="Number of guests"
                  value={filters.guests}
                  onChange={handleFilterChange}
                  min="1"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#B89B5E] focus:border-[#B89B5E] transition-all duration-300 bg-gray-50 focus:bg-white text-gray-900"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </FadeInSection>

      {/* Enhanced Rooms Grid */}
      <main className="container mx-auto px-8 md:px-16 lg:px-24 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {orderedRooms.map((room, index) => {
            return (
              <motion.div
                key={room.id}
                className="group relative bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-500"
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.15,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              >
                {/* Hover Border Effect */}
                <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-[#B89B5E]/50 transition-all duration-500 pointer-events-none z-10"></div>

                {/* Image Section */}
                <div className="relative h-[400px] overflow-hidden">
                  <LazyImage
                    src={getRoomImage(room)}
                    alt={room.type}
                    placeholder={fallbackByType[room.type] || photo1}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  
                  {/* Room Type Badge */}
                  <div className="absolute top-6 left-6">
                    <div className="bg-gradient-to-br from-[#B89B5E] to-[#C5A880] text-white px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider shadow-lg">
                      {room.type?.replace("_", " ")}
                    </div>
                  </div>

                  {/* Price Badge */}
                  <div className="absolute bottom-6 right-6">
                    <div className="bg-white/95 backdrop-blur-sm text-[#B89B5E] px-6 py-3 rounded-xl font-extrabold text-xl shadow-xl">
                      ${room.price}/night
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-8 md:p-10">
                  <motion.h3
                    className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                  >
                    {room.type?.replace("_", " ")} Room
                  </motion.h3>

                  <motion.p
                    className="text-gray-600 text-lg leading-relaxed mb-6 line-clamp-3"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                  >
                    {room.description}
                  </motion.p>

                  {/* Room Features Icons */}
                  <motion.div
                    className="flex items-center gap-4 mb-6 flex-wrap"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaBed className="text-[#B89B5E]" />
                      <span className="text-sm font-medium">Luxury Bedding</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaWifi className="text-[#B89B5E]" />
                      <span className="text-sm font-medium">Free WiFi</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaUsers className="text-[#B89B5E]" />
                      <span className="text-sm font-medium">{room.capacity} Guests</span>
                    </div>
                  </motion.div>

                  {/* View Details Button */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                  >
                    <Link
                      to={`/rooms/${room.id}`}
                      className="group inline-flex items-center gap-3 bg-gradient-to-r from-[#B89B5E] to-[#C5A880] text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl hover:shadow-[#B89B5E]/30 transition-all duration-300 transform hover:-translate-y-1"
                    >
                      View Details
                      <FaArrowRight className="group-hover:translate-x-2 transition-transform" />
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {orderedRooms.length === 0 && !loading && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-gray-500 text-xl font-medium">No rooms found matching your criteria.</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your filters to see more options.</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default Rooms;
