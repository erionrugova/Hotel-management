import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment-timezone";
import apiService from "../../services/api";
import { useUser } from "../../UserContext";
import { Edit3, Trash2, Plus } from "lucide-react";
import photo1 from "../../Images/albert-vincent-wu-fupf3-xAUqw-unsplash.jpg";
import photo2 from "../../Images/adam-winger-VGs8z60yT2c-unsplash.jpg";
import photo3 from "../../Images/room3.jpg";
import photo6 from "../../Images/natalia-gusakova-EYoK3eVKIiQ-unsplash.jpg";

moment.tz.setDefault("Europe/Belgrade");

const fallbackByType = {
  SINGLE: photo1,
  DOUBLE: photo6,
  DELUXE: photo3,
  SUITE: photo2,
};

function RoomsDashboard() {
  const [roomTypes, setRoomTypes] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isNewRoomType, setIsNewRoomType] = useState(false);
  const [form, setForm] = useState({
    id: null,
    type: "",
    price: "",
    capacity: "",
    description: "",
    image: null,
    features: "", // Comma-separated list of features
  });
  const [addForm, setAddForm] = useState({
    floor: "",
    type: "SINGLE",
    price: "",
    capacity: "",
    description: "",
    cleanStatus: "CLEAN",
    features: "", // Comma-separated list of features
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const { isAdmin, isManager, triggerRefresh } = useUser();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const results = await Promise.allSettled([
          apiService.getRooms(),
          apiService.getBookings(),
        ]);
        
        const roomsResult = results[0];
        const bookingsResult = results[1];
        
        // If rooms request failed, preserve existing data and exit
        if (roomsResult.status !== "fulfilled") {
          console.error("Failed to fetch rooms:", roomsResult.reason);
          setError("Failed to load rooms. Preserving existing data.");
          setLoading(false);
          return;
        }
        
        const roomsData = roomsResult.value;
        const bookingsData = bookingsResult.status === "fulfilled" ? bookingsResult.value : [];
        
        // Update rooms state
        setAllRooms(roomsData);
        
        const today = moment.tz("Europe/Belgrade").startOf("day");
        const grouped = {};

        roomsData.forEach((room) => {
          if (!grouped[room.type]) {
            grouped[room.type] = {
              type: room.type,
              total: 0,
              occupied: 0,
              available: 0,
              price: room.price,
              capacity: room.capacity,
              description: room.description,
              features: room.features || [],
              imageUrl: room.imageUrl,
            };
          }
          grouped[room.type].total++;
        });

        // Count occupied rooms: booking starts on or before today AND ends after today
        // (check-out is exclusive - room is available on check-out day after checkout)
        bookingsData.forEach((b) => {
          const type = b.room?.type;
          if (!grouped[type] || b.status !== "CONFIRMED") return;
          
          const start = moment.tz(b.startDate, "Europe/Belgrade").startOf("day");
          const end = moment.tz(b.endDate, "Europe/Belgrade").startOf("day");
          
          // Room is occupied if: start <= today AND end > today
          if (start.isSameOrBefore(today, "day") && end.isAfter(today, "day")) {
            grouped[type].occupied++;
          }
        });

        Object.values(grouped).forEach((g) => {
          g.available = g.total - g.occupied;
        });

        if (roomsResult.status === "fulfilled") {
          setRoomTypes(Object.values(grouped));
        }
      } catch (err) {
        console.error("Error fetching rooms:", err);
        setError("Failed to load rooms.");
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const getImage = (roomType) => {
    const match = allRooms.find((r) => r.type === roomType);
    if (match?.imageUrl?.startsWith("/uploads")) {
      return `http://localhost:3000${match.imageUrl}`;
    }
    return match?.imageUrl || fallbackByType[roomType] || photo1;
  };

  const handleDeleteRoom = async (roomId, roomNumber) => {
    if (!window.confirm(`Are you sure you want to delete room ${roomNumber}?`))
      return;
    try {
      await apiService.deleteRoom(roomId);
      setAllRooms((prev) => prev.filter((r) => r.id !== roomId));
      setFeedback(`🗑️ Room ${roomNumber} deleted successfully.`);
      triggerRefresh();

      if (selectedType) {
        setSelectedType((prev) => ({
          ...prev,
          total: prev.total - 1,
          available: Math.max(prev.available - 1, 0),
        }));
      }

      setTimeout(() => setFeedback(""), 2500);
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete room.");
    }
  };

  const handleEditRoom = async () => {
    try {
      setError(""); // Clear any previous errors
      if (!form.id || !form.type) throw new Error("Invalid room ID or type");

      const formData = new FormData();
      
      // Only append fields that should be updated (exclude id, type, and null values)
      if (form.price !== undefined && form.price !== null && form.price !== "") {
        formData.append("price", form.price);
      }
      if (form.capacity !== undefined && form.capacity !== null && form.capacity !== "") {
        formData.append("capacity", form.capacity);
      }
      if (form.description !== undefined && form.description !== null && form.description !== "") {
        formData.append("description", form.description);
      }
      // Append features if provided
      if (form.features !== undefined && form.features !== null && form.features !== "") {
        formData.append("features", form.features);
      }
      // Only append image if a new file was selected
      if (form.image instanceof File) {
        formData.append("image", form.image);
      }

      // Update only the first room - backend will update all rooms of the same type
      // This prevents deadlocks from parallel transactions
      const firstRoomOfType = allRooms.find((r) => r.type === form.type);
      if (!firstRoomOfType) {
        throw new Error("No room found of this type");
      }
      
      await apiService.updateRoom(firstRoomOfType.id, formData);
      
      // Refetch rooms and bookings to get updated data
      const results = await Promise.allSettled([
        apiService.getRooms(),
        apiService.getBookings(),
      ]);
      
      const roomsResult = results[0];
      const bookingsResult = results[1];
      
      if (roomsResult.status === "fulfilled") {
        const updatedRooms = roomsResult.value;
        const bookingsData = bookingsResult.status === "fulfilled" ? bookingsResult.value : [];
        setAllRooms(updatedRooms);
        
        // Recalculate room types
        const today = moment.tz("Europe/Belgrade").startOf("day");
        const grouped = {};

        updatedRooms.forEach((room) => {
          if (!grouped[room.type]) {
            grouped[room.type] = {
              type: room.type,
              total: 0,
              occupied: 0,
              available: 0,
              price: room.price,
              capacity: room.capacity,
              description: room.description,
              features: room.features || [],
              imageUrl: room.imageUrl,
            };
          }
          grouped[room.type].total++;
        });

        bookingsData.forEach((b) => {
          const type = b.room?.type;
          if (!grouped[type] || b.status !== "CONFIRMED") return;
          
          const start = moment.tz(b.startDate, "Europe/Belgrade").startOf("day");
          const end = moment.tz(b.endDate, "Europe/Belgrade").startOf("day");
          
          if (start.isSameOrBefore(today, "day") && end.isAfter(today, "day")) {
            grouped[type].occupied++;
          }
        });

        Object.values(grouped).forEach((g) => {
          g.available = g.total - g.occupied;
        });

        const updatedRoomTypes = Object.values(grouped);
        setRoomTypes(updatedRoomTypes);
        
        // Update selectedType if it matches the edited room type
        if (selectedType?.type === form.type) {
          const updatedType = updatedRoomTypes.find((g) => g.type === form.type);
          if (updatedType) {
            setSelectedType(updatedType);
          }
        }
      }
      
      setShowEditModal(false);
      setImagePreview(null);
      setForm({
        id: null,
        type: "",
        price: "",
        capacity: "",
        description: "",
        image: null,
        features: "",
      });
      setFeedback("✏️ Room updated successfully!");
      triggerRefresh();
      setTimeout(() => setFeedback(""), 2500);
    } catch (err) {
      console.error("Edit room error:", err);
      setError(err.message || "Failed to update room");
    }
  };

  const handleAddRoom = async () => {
    try {
      setError(""); // Clear any previous errors
      
      // Validate required fields
      if (!addForm.type || !addForm.price || !addForm.capacity || !addForm.description) {
        setError("Please fill in all required fields (Type, Price, Capacity, Description)");
        return;
      }

      // Ensure type is uppercase and trimmed
      const roomType = addForm.type.trim().toUpperCase();
      
      // Validate type format (alphanumeric and underscores only)
      if (!/^[A-Z0-9_]+$/.test(roomType)) {
        setError("Room type must contain only uppercase letters, numbers, and underscores");
        return;
      }

      // If creating a new room type, check if it already exists
      if (isNewRoomType) {
        const existingTypes = roomTypes.map(rt => rt.type.toUpperCase());
        if (existingTypes.includes(roomType)) {
          setError(`Room type "${roomType}" already exists! Use the "Add" button next to that room type to add more rooms.`);
          return;
        }
      }

      const formData = new FormData();
      Object.entries(addForm).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          // Ensure type is uppercase
          if (key === "type") {
            formData.append(key, roomType);
          } else {
            formData.append(key, value);
          }
        }
      });

      console.log("Creating room with data:", {
        isNewRoomType,
        type: roomType,
        price: addForm.price,
        capacity: addForm.capacity,
        description: addForm.description,
        floor: addForm.floor,
        cleanStatus: addForm.cleanStatus,
      });

      const saved = await apiService.createRoom(formData);
      
      // Refetch rooms to get updated data
      const updatedRooms = await apiService.getRooms();
      setAllRooms(updatedRooms);
      
      // Recalculate room types
      const today = moment.tz("Europe/Belgrade").startOf("day");
      const bookings = await apiService.getBookings();
      const bookingsData = bookings || [];
      
      const grouped = {};
      updatedRooms.forEach((room) => {
        if (!grouped[room.type]) {
          grouped[room.type] = {
            type: room.type,
            total: 0,
            occupied: 0,
            available: 0,
            price: room.price,
            capacity: room.capacity,
            description: room.description,
            features: room.features || [],
            imageUrl: room.imageUrl,
          };
        }
        grouped[room.type].total++;
      });

      bookingsData.forEach((b) => {
        const type = b.room?.type;
        if (!grouped[type] || b.status !== "CONFIRMED") return;
        
        const start = moment.tz(b.startDate, "Europe/Belgrade").startOf("day");
        const end = moment.tz(b.endDate, "Europe/Belgrade").startOf("day");
        
        if (start.isSameOrBefore(today, "day") && end.isAfter(today, "day")) {
          grouped[type].occupied++;
        }
      });

      Object.values(grouped).forEach((g) => {
        g.available = g.total - g.occupied;
      });

      setRoomTypes(Object.values(grouped));

      if (selectedType?.type === saved.type) {
        const updatedType = Object.values(grouped).find((g) => g.type === saved.type);
        if (updatedType) {
          setSelectedType(updatedType);
        }
      }

      setShowAddModal(false);
      setIsNewRoomType(false);
      setAddForm({
        floor: "",
        type: "SINGLE",
        price: "",
        capacity: "",
        description: "",
        cleanStatus: "CLEAN",
        features: "",
      });
      setFeedback("✅ Room added successfully!");
      
      // Trigger refresh to update dashboard, rates, and all other components
      triggerRefresh();
      
      // Also refresh the rooms list to ensure new room types appear
      setTimeout(() => {
        const refreshRooms = async () => {
          try {
            const updatedRooms = await apiService.getRooms();
            setAllRooms(updatedRooms);
          } catch (err) {
            console.error("Failed to refresh rooms:", err);
          }
        };
        refreshRooms();
      }, 500);
      
      setTimeout(() => setFeedback(""), 2500);
    } catch (err) {
      console.error("Add room failed:", err);
      console.error("Error response:", err?.response?.data);
      console.error("Error details:", {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
      
      let errorMessage = "Failed to add room.";
      
      if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.response?.data?.errors) {
        // Handle array of errors from express-validator
        const errors = err.response.data.errors;
        if (Array.isArray(errors)) {
          errorMessage = errors.map(e => {
            const field = e.param || e.field || "";
            const msg = e.msg || e.message || "Invalid value";
            return field ? `${field}: ${msg}` : msg;
          }).join(", ");
        } else {
          errorMessage = errors.toString();
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center text-slate-400 text-lg animate-pulse">
        Loading rooms...
      </div>
    );

  return (
    <div className="p-4 sm:p-6 lg:p-10 min-h-screen bg-slate-950">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold text-white">
          Rooms Dashboard
        </h2>
        {(isAdmin() || isManager()) && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setError(""); // Clear errors when opening modal
                setIsNewRoomType(true);
                setShowAddModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 px-5 py-2 rounded-lg shadow transition-colors"
            >
              <Plus size={18} /> Create New Room Type
            </button>
          </div>
        )}
      </div>

      {feedback && (
        <div className="bg-emerald-900/30 text-emerald-400 border border-emerald-800 px-4 py-2 rounded mb-6 shadow">
          {feedback}
        </div>
      )}
      {error && (
        <div className="bg-red-900/30 text-red-400 border border-red-800 px-4 py-2 rounded mb-6 shadow">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
        <div className="lg:col-span-1 flex flex-col gap-6">
          {roomTypes.map((rt, index) => (
            <motion.div
              key={rt.type}
              className={`bg-slate-900 rounded-xl shadow-xl p-4 border-2 transition-all hover:scale-[1.02] ${
                selectedType?.type === rt.type
                  ? "border-indigo-500"
                  : "border-slate-800"
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: index * 0.1,
                ease: "easeOut",
              }}
            >
              <div 
                onClick={() => setSelectedType(rt)}
                className="cursor-pointer"
              >
                <div className="h-40 rounded-lg overflow-hidden mb-3">
                  <img
                    src={getImage(rt.type)}
                    alt={rt.type}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {rt.type} Room
                </h3>
                <p className="text-sm text-slate-400">
                  Total: <b className="text-slate-200">{rt.total}</b> | Occupied:{" "}
                  <b className="text-rose-500">{rt.occupied}</b> | Available:{" "}
                  <b className="text-emerald-500">{rt.available}</b>
                </p>
              </div>
              {(isAdmin() || isManager()) && (
                <div className="mt-3 pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const confirmMessage = `Are you sure you want to delete the entire "${rt.type}" room type?\n\nThis will permanently delete:\n- All ${rt.total} room(s) of this type\n- All features associated with this room type\n- All rates for these rooms\n\nThis action cannot be undone!`;
                      
                      if (!window.confirm(confirmMessage)) {
                        return;
                      }

                      try {
                        setError("");
                        await apiService.deleteRoomType(rt.type);
                        
                        // Remove from room types list
                        setRoomTypes((prev) => prev.filter((r) => r.type !== rt.type));
                        
                        // If this was the selected type, clear selection
                        if (selectedType?.type === rt.type) {
                          setSelectedType(null);
                        }
                        
                        // Refresh rooms list
                        const updatedRooms = await apiService.getRooms();
                        setAllRooms(updatedRooms);
                        
                        setFeedback(`✅ Room type "${rt.type}" deleted successfully!`);
                        triggerRefresh();
                        setTimeout(() => setFeedback(""), 3000);
                      } catch (err) {
                        console.error("Delete room type failed:", err);
                        const errorMessage = err?.response?.data?.error || err?.message || "Failed to delete room type.";
                        setError(errorMessage);
                        setTimeout(() => setError(""), 5000);
                      }
                    }}
                    className="text-rose-500 hover:text-rose-400 transition-colors flex items-center gap-1 text-sm"
                    title={`Delete ${rt.type} room type`}
                  >
                    <Trash2 size={16} />
                    Delete Type
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="lg:col-span-2 bg-slate-900 shadow-xl rounded-2xl p-8 border border-slate-800">
          {selectedType ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-semibold text-white">
                  {selectedType.type} Room Details
                </h3>
                {(isAdmin() || isManager()) && (
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          setError("");
                          const sampleRoom = allRooms.find(
                            (r) => r.type === selectedType.type
                          );
                          if (!sampleRoom) {
                            setError("No room found to use as template");
                            return;
                          }

                          const formData = new FormData();
                          formData.append("type", sampleRoom.type);
                          formData.append("price", sampleRoom.price?.toString() || "");
                          formData.append("capacity", sampleRoom.capacity?.toString() || "");
                          formData.append("description", sampleRoom.description || "");
                          if (sampleRoom.floor) formData.append("floor", sampleRoom.floor);
                          formData.append("cleanStatus", sampleRoom.cleanStatus || "CLEAN");

                          const saved = await apiService.createRoom(formData);
                          
                          // Refetch rooms
                          const updatedRooms = await apiService.getRooms();
                          setAllRooms(updatedRooms);
                          
                          // Recalculate room types
                          const today = moment.tz("Europe/Belgrade").startOf("day");
                          const bookings = await apiService.getBookings();
                          const bookingsData = bookings || [];
                          
                          const grouped = {};
                          updatedRooms.forEach((room) => {
                            if (!grouped[room.type]) {
                              grouped[room.type] = {
                                type: room.type,
                                total: 0,
                                occupied: 0,
                                available: 0,
                                price: room.price,
                                capacity: room.capacity,
                                description: room.description,
                                features: room.features || [],
                                imageUrl: room.imageUrl,
                              };
                            }
                            grouped[room.type].total++;
                          });

                          bookingsData.forEach((b) => {
                            const type = b.room?.type;
                            if (!grouped[type] || b.status !== "CONFIRMED") return;
                            
                            const start = moment.tz(b.startDate, "Europe/Belgrade").startOf("day");
                            const end = moment.tz(b.endDate, "Europe/Belgrade").startOf("day");
                            
                            if (start.isSameOrBefore(today, "day") && end.isAfter(today, "day")) {
                              grouped[type].occupied++;
                            }
                          });

                          Object.values(grouped).forEach((g) => {
                            g.available = g.total - g.occupied;
                          });

                          const updatedRoomTypes = Object.values(grouped);
                          setRoomTypes(updatedRoomTypes);
                          
                          const updatedType = updatedRoomTypes.find((g) => g.type === selectedType.type);
                          if (updatedType) {
                            setSelectedType(updatedType);
                          }

                          setFeedback(`✅ Added new ${selectedType.type} room successfully!`);
                          triggerRefresh();
                          setTimeout(() => setFeedback(""), 2500);
                        } catch (err) {
                          console.error("Add room failed:", err);
                          setError(err?.response?.data?.error || err?.message || "Failed to add room.");
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 px-4 py-1.5 rounded-md transition-colors"
                    >
                      <Plus size={16} /> Add
                    </button>
                    <button
                      onClick={() => {
                        const sampleRoom = allRooms.find(
                          (r) => r.type === selectedType.type
                        );
                        if (sampleRoom) {
                          setError(""); // Clear errors when opening modal
                          setImagePreview(null); // Clear image preview
                          
                          // Get features for this room type
                          const roomFeatures = sampleRoom.features || [];
                          const featuresString = roomFeatures
                            .map((f) => f?.feature?.name || f.name)
                            .join(", ");
                          
                          setForm({
                            id: sampleRoom.id,
                            type: sampleRoom.type,
                            price: sampleRoom.price?.toString() || "",
                            capacity: sampleRoom.capacity?.toString() || "",
                            description: sampleRoom.description || "",
                            image: null,
                            features: featuresString,
                          });
                          setShowEditModal(true);
                        }
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 px-4 py-1.5 rounded-md transition-colors"
                    >
                      <Edit3 size={16} /> Edit
                    </button>
                  </div>
                )}
              </div>

              <img
                src={getImage(selectedType.type)}
                alt={selectedType.type}
                className="w-full h-64 rounded-xl object-cover mb-6 border border-slate-700"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300 mb-6">
                <p>
                  <strong className="text-slate-100">Price:</strong> ${selectedType.price}/night
                </p>
                <p>
                  <strong className="text-slate-100">Capacity:</strong> {selectedType.capacity} guests
                </p>
                <p className="md:col-span-2">
                  <strong className="text-slate-100">Description:</strong> {selectedType.description}
                </p>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-700 text-slate-300">
                <p>
                  <strong className="text-slate-100">Total Rooms:</strong> {selectedType.total}
                </p>
                <p>
                  <strong className="text-slate-100">Occupied:</strong>{" "}
                  <span className="text-rose-500 font-medium">
                    {selectedType.occupied}
                  </span>
                </p>
                <p>
                  <strong className="text-slate-100">Available:</strong>{" "}
                  <span className="text-emerald-500 font-medium">
                    {selectedType.available}
                  </span>
                </p>
              </div>

              <div className="mb-6">
                <strong className="block mb-2 text-white">
                  Room Features:
                </strong>
                {selectedType.features?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedType.features.map((f, i) => (
                      <span
                        key={i}
                        className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-sm shadow-sm border border-slate-700"
                      >
                        {f?.feature?.name || f.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">
                    No features listed for this room type.
                  </p>
                )}
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-3 text-white">
                  Rooms in this Category
                </h4>
                <div className="overflow-x-auto border border-slate-700 rounded-lg">
                  <table className="min-w-full text-sm text-left">
                    <thead className="bg-slate-800 text-slate-300">
                      <tr>
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">Room Number</th>
                        <th className="px-3 py-2">Floor</th>
                        <th className="px-3 py-2">Status</th>
                        {(isAdmin() || isManager()) && (
                          <th className="px-3 py-2 text-right">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {allRooms
                        .filter((r) => r.type === selectedType.type)
                        .map((room, idx) => (
                          <tr
                            key={room.id}
                            className="hover:bg-slate-800 transition text-slate-300"
                          >
                            <td className="px-3 py-2">{idx + 1}</td>
                            <td className="px-3 py-2 text-white font-medium">{room.roomNumber}</td>
                            <td className="px-3 py-2">{room.floor}</td>
                            <td className="px-3 py-2">
                              <div
                                className={`inline-block cursor-pointer px-3 py-1 rounded-full text-sm font-medium ${
                                  room.cleanStatus === "CLEAN"
                                    ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800"
                                    : room.cleanStatus === "DIRTY"
                                    ? "bg-rose-900/30 text-rose-400 border border-rose-800"
                                    : "bg-yellow-900/30 text-yellow-400 border border-yellow-800"
                                }`}
                                onClick={(e) => {
                                  const dropdown = e.currentTarget.nextSibling;
                                  dropdown.classList.toggle("hidden");
                                }}
                              >
                                {room.cleanStatus}
                              </div>
                              <select
                                defaultValue={room.cleanStatus}
                                onChange={async (e) => {
                                  const newStatus = e.target.value;
                                  console.log(
                                    "🧹 Updating clean status for:",
                                    room.id,
                                    newStatus
                                  );

                                  try {
                                    await apiService.request(
                                      `/rooms/${room.id}/clean-status`,
                                      {
                                        method: "PATCH",
                                        body: JSON.stringify({
                                          cleanStatus: newStatus,
                                        }),
                                      }
                                    );
                                    setAllRooms((prev) =>
                                      prev.map((r) =>
                                        r.id === room.id
                                          ? { ...r, cleanStatus: newStatus }
                                          : r
                                      )
                                    );

                                    setFeedback(
                                      `🧹 Room ${room.roomNumber} marked as ${newStatus}.`
                                    );
                                    setTimeout(() => setFeedback(""), 2000);
                                  } catch (err) {
                                    console.error(
                                      "Failed to update cleaning status:",
                                      err
                                    );
                                    setError(
                                      "Failed to update cleaning status."
                                    );
                                  } finally {
                                    e.target.classList.add("hidden");
                                  }
                                }}
                                className="hidden absolute z-10 bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 mt-1 shadow-xl"
                              >
                                <option value="CLEAN">CLEAN</option>
                                <option value="DIRTY">DIRTY</option>
                                <option value="IN_PROGRESS">IN PROGRESS</option>
                              </select>
                            </td>
                            {(isAdmin() || isManager()) && (
                              <td className="px-3 py-2 text-right">
                                <button
                                  onClick={() =>
                                    handleDeleteRoom(room.id, room.roomNumber)
                                  }
                                  className="text-rose-500 hover:text-rose-400 transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <p className="text-slate-500 text-center mt-20">
              Select a room type to view details.
            </p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-900 rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-md border border-slate-800 max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-white">
                {isNewRoomType ? "Create New Room Type" : "Add New Room"}
              </h3>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded mb-3 text-sm">
                  {error}
                </div>
              )}

              <input
                type="text"
                placeholder="Floor"
                className="bg-slate-800 border border-slate-700 text-white p-2 w-full mb-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-500"
                value={addForm.floor}
                onChange={(e) =>
                  setAddForm({ ...addForm, floor: e.target.value })
                }
              />
              {isNewRoomType ? (
                <>
                  <input
                    type="text"
                    placeholder="Room Type (e.g., PRESIDENTIAL)"
                    className="bg-slate-800 border border-slate-700 text-white p-2 w-full mb-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-500"
                    value={addForm.type}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "");
                      setAddForm({ ...addForm, type: value });
                    }}
                  />
                  {addForm.type && roomTypes.some(rt => rt.type.toUpperCase() === addForm.type.toUpperCase()) && (
                    <p className="text-amber-400 text-xs mb-2">
                      ⚠️ This room type already exists. Use the "Add" button next to that room type instead.
                    </p>
                  )}
                </>
              ) : (
                <select
                  value={addForm.type}
                  onChange={(e) =>
                    setAddForm({ ...addForm, type: e.target.value })
                  }
                  className="bg-slate-800 border border-slate-700 text-white p-2 w-full mb-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="SINGLE">Single</option>
                  <option value="DOUBLE">Double</option>
                  <option value="DELUXE">Deluxe</option>
                  <option value="SUITE">Suite</option>
                </select>
              )}
              <input
                type="number"
                placeholder="Price"
                className="bg-slate-800 border border-slate-700 text-white p-2 w-full mb-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-500"
                value={addForm.price}
                onChange={(e) =>
                  setAddForm({ ...addForm, price: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Capacity"
                className="bg-slate-800 border border-slate-700 text-white p-2 w-full mb-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-500"
                value={addForm.capacity}
                onChange={(e) =>
                  setAddForm({ ...addForm, capacity: e.target.value })
                }
              />
              <textarea
                placeholder="Description"
                className="bg-slate-800 border border-slate-700 text-white p-2 w-full mb-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-500"
                value={addForm.description}
                onChange={(e) =>
                  setAddForm({ ...addForm, description: e.target.value })
                }
              />
              {isNewRoomType && (
                <input
                  type="text"
                  placeholder="Features (comma-separated, e.g., WiFi, TV, AC, Minibar, Sea View)"
                  className="bg-slate-800 border border-slate-700 text-white p-2 w-full mb-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-500"
                  value={addForm.features}
                  onChange={(e) =>
                    setAddForm({ ...addForm, features: e.target.value })
                  }
                />
              )}

              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setError("");
                    setIsNewRoomType(false);
                    setAddForm({
                      floor: "",
                      type: "SINGLE",
                      price: "",
                      capacity: "",
                      description: "",
                      cleanStatus: "CLEAN",
                      features: "",
                    });
                  }}
                  className="bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRoom}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-white">
                Edit All {form.type} Rooms
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Changes will apply to all {form.type} rooms
              </p>

              <input
                type="number"
                placeholder="Price"
                className="bg-slate-800 border border-slate-700 text-white p-2 w-full mb-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-500"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
              <input
                type="number"
                placeholder="Capacity"
                className="bg-slate-800 border border-slate-700 text-white p-2 w-full mb-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-500"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
              <textarea
                placeholder="Description"
                className="bg-slate-800 border border-slate-700 text-white p-2 w-full mb-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-500"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Features (comma-separated, e.g., WiFi, TV, AC, Minibar, Sea View)"
                className="bg-slate-800 border border-slate-700 text-white p-2 w-full mb-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-500"
                value={form.features}
                onChange={(e) =>
                  setForm({ ...form, features: e.target.value })
                }
              />

              <label className="block mb-2 text-sm font-medium text-slate-300">
                Change Room Image (applies to all {form.type} rooms)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  setForm({ ...form, image: file });
                  setImagePreview(URL.createObjectURL(file));
                }}
                className="bg-slate-800 border border-slate-700 text-white p-2 w-full mb-3 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded mb-3 border border-slate-700"
                />
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded mb-3 text-sm">
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setError("");
                    setImagePreview(null);
                    setForm({
                      id: null,
                      type: "",
                      price: "",
                      capacity: "",
                      description: "",
                      image: null,
                    });
                  }}
                  className="bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditRoom}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  Save All {form.type} Rooms
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default RoomsDashboard;
