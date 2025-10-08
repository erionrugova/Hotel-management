import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import apiService from "../../services/api";
import { useUser } from "../../UserContext";
import { Edit3, Trash2, Plus } from "lucide-react";

import photo1 from "../../Images/albert-vincent-wu-fupf3-xAUqw-unsplash.jpg";
import photo2 from "../../Images/adam-winger-VGs8z60yT2c-unsplash.jpg";
import photo3 from "../../Images/room3.jpg";
import photo6 from "../../Images/natalia-gusakova-EYoK3eVKIiQ-unsplash.jpg";

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
  const [form, setForm] = useState({
    id: null,
    type: "",
    price: "",
    capacity: "",
    description: "",
    image: null,
  });
  const [addForm, setAddForm] = useState({
    floor: "",
    type: "SINGLE",
    price: "",
    capacity: "",
    description: "",
    cleanStatus: "CLEAN",
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const { isAdmin, isManager, triggerRefresh } = useUser();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const [roomsData, bookingsData] = await Promise.all([
          apiService.getRooms(),
          apiService.getBookings(),
        ]);
        setAllRooms(roomsData);

        const today = moment().startOf("day");
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

        bookingsData.forEach((b) => {
          const type = b.room?.type;
          const start = moment(b.startDate);
          const end = moment(b.endDate);
          if (
            grouped[type] &&
            b.status === "CONFIRMED" &&
            start.isSameOrBefore(today) &&
            end.isSameOrAfter(today)
          ) {
            grouped[type].occupied++;
          }
        });

        Object.values(grouped).forEach((g) => {
          g.available = g.total - g.occupied;
        });

        setRoomTypes(Object.values(grouped));
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
      if (!form.id) throw new Error("Invalid room ID");

      const formData = new FormData();
      for (const key in form) {
        if (form[key] !== undefined && form[key] !== null) {
          formData.append(key, form[key]);
        }
      }

      await apiService.updateRoom(form.id, formData);
      setShowEditModal(false);
      setFeedback("✏️ Room updated successfully!");
      triggerRefresh();
      setTimeout(() => setFeedback(""), 2500);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update room");
    }
  };

  const handleAddRoom = async () => {
    try {
      const formData = new FormData();
      Object.entries(addForm).forEach(([key, value]) =>
        formData.append(key, value)
      );

      const saved = await apiService.createRoom(formData);
      setAllRooms((prev) => [...prev, saved]);
      setFeedback("✅ Room added successfully!");
      triggerRefresh();

      setRoomTypes((prev) =>
        prev.map((rt) =>
          rt.type === saved.type
            ? {
                ...rt,
                total: rt.total + 1,
                available: rt.available + 1,
              }
            : rt
        )
      );

      if (selectedType?.type === saved.type) {
        setSelectedType((prev) => ({
          ...prev,
          total: prev.total + 1,
          available: prev.available + 1,
        }));
      }

      setShowAddModal(false);
      setAddForm({
        floor: "",
        type: "SINGLE",
        price: "",
        capacity: "",
        description: "",
        cleanStatus: "CLEAN",
      });
      setTimeout(() => setFeedback(""), 2500);
    } catch (err) {
      console.error("Add room failed:", err);
      setError("Failed to add room.");
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center text-gray-600 text-lg animate-pulse">
        Loading rooms...
      </div>
    );

  return (
    <div className="p-10 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-semibold text-gray-800">
          Rooms Dashboard
        </h2>
        {(isAdmin() || isManager()) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#B89B5E] hover:bg-[#9c8246] text-white flex items-center gap-2 px-5 py-2 rounded-lg shadow"
          >
            <Plus size={18} /> Add Room
          </button>
        )}
      </div>

      {feedback && (
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-6 shadow">
          {feedback}
        </div>
      )}
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-6 shadow">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 flex flex-col gap-6">
          {roomTypes.map((rt, index) => (
            <motion.div
              key={rt.type}
              onClick={() => setSelectedType(rt)}
              className={`bg-white rounded-xl shadow-md p-4 border-2 cursor-pointer transition-all hover:scale-[1.02] ${
                selectedType?.type === rt.type
                  ? "border-[#B89B5E]"
                  : "border-transparent"
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: index * 0.1,
                ease: "easeOut",
              }}
            >
              <div className="h-40 rounded-lg overflow-hidden mb-3">
                <img
                  src={getImage(rt.type)}
                  alt={rt.type}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                {rt.type} Room
              </h3>
              <p className="text-sm text-gray-500">
                Total: <b>{rt.total}</b> | Occupied:{" "}
                <b className="text-red-600">{rt.occupied}</b> | Available:{" "}
                <b className="text-green-600">{rt.available}</b>
              </p>
            </motion.div>
          ))}
        </div>

        <div className="lg:col-span-2 bg-white shadow-md rounded-2xl p-8">
          {selectedType ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-semibold text-gray-800">
                  {selectedType.type} Room Details
                </h3>
                {(isAdmin() || isManager()) && (
                  <button
                    onClick={() => {
                      const sampleRoom = allRooms.find(
                        (r) => r.type === selectedType.type
                      );
                      if (sampleRoom) {
                        setForm(sampleRoom);
                        setShowEditModal(true);
                      }
                    }}
                    className="bg-[#B89B5E] hover:bg-[#9c8246] text-white flex items-center gap-1 px-4 py-1.5 rounded-md"
                  >
                    <Edit3 size={16} /> Edit
                  </button>
                )}
              </div>

              <img
                src={getImage(selectedType.type)}
                alt={selectedType.type}
                className="w-full h-64 rounded-xl object-cover mb-6"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700 mb-6">
                <p>
                  <strong>Price:</strong> ${selectedType.price}/night
                </p>
                <p>
                  <strong>Capacity:</strong> {selectedType.capacity} guests
                </p>
                <p className="md:col-span-2">
                  <strong>Description:</strong> {selectedType.description}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 border">
                <p>
                  <strong>Total Rooms:</strong> {selectedType.total}
                </p>
                <p>
                  <strong>Occupied:</strong>{" "}
                  <span className="text-red-600 font-medium">
                    {selectedType.occupied}
                  </span>
                </p>
                <p>
                  <strong>Available:</strong>{" "}
                  <span className="text-green-600 font-medium">
                    {selectedType.available}
                  </span>
                </p>
              </div>

              <div className="mb-6">
                <strong className="block mb-2 text-gray-800">
                  Room Features:
                </strong>
                {selectedType.features?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedType.features.map((f, i) => (
                      <span
                        key={i}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm shadow-sm"
                      >
                        {f?.feature?.name || f.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    No features listed for this room type.
                  </p>
                )}
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-3 text-gray-800">
                  Rooms in this Category
                </h4>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-700">
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
                    <tbody>
                      {allRooms
                        .filter((r) => r.type === selectedType.type)
                        .map((room, idx) => (
                          <tr
                            key={room.id}
                            className="border-t hover:bg-gray-50 transition"
                          >
                            <td className="px-3 py-2">{idx + 1}</td>
                            <td className="px-3 py-2">{room.roomNumber}</td>
                            <td className="px-3 py-2">{room.floor}</td>
                            <td className="px-3 py-2">
                              <div
                                className={`inline-block cursor-pointer px-3 py-1 rounded-full text-sm font-medium ${
                                  room.cleanStatus === "CLEAN"
                                    ? "bg-green-100 text-green-800"
                                    : room.cleanStatus === "DIRTY"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
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
                                className="hidden absolute z-10 bg-white border rounded px-2 py-1 mt-1 shadow"
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
                                  className="text-red-600 hover:text-red-800"
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
            <p className="text-gray-500 text-center mt-20">
              Select a room type to view details.
            </p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl p-6 w-[420px]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                Add New Room
              </h3>

              <input
                type="text"
                placeholder="Floor"
                className="border p-2 w-full mb-2 rounded"
                value={addForm.floor}
                onChange={(e) =>
                  setAddForm({ ...addForm, floor: e.target.value })
                }
              />
              <select
                value={addForm.type}
                onChange={(e) =>
                  setAddForm({ ...addForm, type: e.target.value })
                }
                className="border p-2 w-full mb-2 rounded"
              >
                <option value="SINGLE">Single</option>
                <option value="DOUBLE">Double</option>
                <option value="DELUXE">Deluxe</option>
                <option value="SUITE">Suite</option>
              </select>
              <input
                type="number"
                placeholder="Price"
                className="border p-2 w-full mb-2 rounded"
                value={addForm.price}
                onChange={(e) =>
                  setAddForm({ ...addForm, price: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Capacity"
                className="border p-2 w-full mb-2 rounded"
                value={addForm.capacity}
                onChange={(e) =>
                  setAddForm({ ...addForm, capacity: e.target.value })
                }
              />
              <textarea
                placeholder="Description"
                className="border p-2 w-full mb-2 rounded"
                value={addForm.description}
                onChange={(e) =>
                  setAddForm({ ...addForm, description: e.target.value })
                }
              />

              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRoom}
                  className="bg-[#B89B5E] text-white px-4 py-2 rounded hover:bg-[#a18448]"
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
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl p-6 w-[420px]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                Edit {form.type} Room
              </h3>

              <input
                type="number"
                placeholder="Price"
                className="border p-2 w-full mb-2 rounded"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
              <input
                type="number"
                placeholder="Capacity"
                className="border p-2 w-full mb-2 rounded"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
              <textarea
                placeholder="Description"
                className="border p-2 w-full mb-2 rounded"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />

              <label className="block mb-2 text-sm font-medium text-gray-700">
                Change Room Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  setForm({ ...form, image: file });
                  setImagePreview(URL.createObjectURL(file));
                }}
                className="border p-2 w-full mb-3 rounded"
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded mb-3"
                />
              )}

              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditRoom}
                  className="bg-[#B89B5E] text-white px-4 py-2 rounded hover:bg-[#a18448]"
                >
                  Save
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
