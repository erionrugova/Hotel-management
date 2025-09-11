// src/Pages/Dashboard/RoomsDashboard.jsx
import { useEffect, useState } from "react";
import apiService from "../../services/api";

function RoomsDashboard() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await apiService.getRooms();
        setRooms(data);
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const statusColors = {
    AVAILABLE: "bg-blue-100 text-blue-800",
    OCCUPIED: "bg-red-100 text-red-800",
    MAINTENANCE: "bg-yellow-100 text-yellow-800",
    OUT_OF_ORDER: "bg-gray-200 text-gray-800",
  };

  if (loading) {
    return <div className="p-6">Loading rooms...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Rooms</h2>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Room Number</th>
              <th className="p-3">Type</th>
              <th className="p-3">Price</th>
              <th className="p-3">Status</th>
              <th className="p-3">Description</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id} className="border-b">
                <td className="p-3">{room.roomNumber}</td>
                <td className="p-3">{room.type}</td>
                <td className="p-3">${room.price}</td>
                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      statusColors[room.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {room.status}
                  </span>
                </td>
                <td className="p-3">{room.description || "No description"}</td>
              </tr>
            ))}
            {rooms.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center p-4 text-gray-500">
                  No rooms found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RoomsDashboard;
