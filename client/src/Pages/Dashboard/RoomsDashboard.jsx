// src/pages/Rooms.js
import { useState } from "react";

function RoomsDashboard() {
  const [rooms] = useState([
    {
      number: "#001",
      type: "Double Sharing",
      capacity: "2",
      bed_type: "Double",
      bed_count: "1",
      status: "Available",
    },
    {
      number: "#002",
      type: "Single Sharing",
      capacity: "1",
      bed_type: "Single",
      bed_count: "1",
      status: "Booked",
    },
    {
      number: "#003",
      type: "Presidential Suite",
      capacity: "5",
      bed_type: "King",
      bed_count: "1",
      status: "Booked",
    },
    {
      number: "#004",
      type: "Family Suite",
      capacity: "4",
      bed_type: "Double",
      bed_count: "2",
      status: "Reserved",
    },
    {
      number: "#005",
      type: "Triple Sharing",
      capacity: "3",
      bed_type: "Single",
      bed_count: "3",
      status: "Reserved",
    },
    {
      number: "#006",
      type: "Deluxe Double",
      capacity: "2",
      bed_type: "Queen",
      bed_count: "1",
      status: "Waitlist",
    },
    {
      number: "#007",
      type: "Family Suite",
      capacity: "4",
      bed_type: "Double",
      bed_count: "2",
      status: "Reserved",
    },
    {
      number: "#008",
      type: "Single Sharing",
      capacity: "1",
      bed_type: "Single",
      bed_count: "1",
      status: "Booked",
    },
  ]);

  const statusColors = {
    Available: "bg-blue-100 text-blue-800",
    Booked: "bg-red-100 text-red-800",
    Reserved: "bg-green-100 text-green-800",
    Waitlist: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Rooms</h2>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Room Number</th>
              <th className="p-3">Room Type</th>
              <th className="p-3">Capacity</th>
              <th className="p-3">Bed Type</th>
              <th className="p-3">Bed Count</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room, i) => (
              <tr key={i} className="border-b">
                <td className="p-3">{room.number}</td>
                <td className="p-3">{room.type}</td>
                <td className="p-3">{room.capacity}</td>
                <td className="p-3">{room.bed_type}</td>
                <td className="p-3">{room.bed_count}</td>
                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      statusColors[room.status]
                    }`}
                  >
                    {room.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RoomsDashboard;
