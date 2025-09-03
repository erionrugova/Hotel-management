// src/pages/Rooms.js
import { useState } from "react";

function RoomsDashboard() {
  const [rooms] = useState([
    {
      number: "#001",
      bed: "Double sharing",
      floor: "Floor 1",
      facility: "AC, shower, Double bed, towel, bathtub, TV",
      status: "Available",
    },
    {
      number: "#002",
      bed: "Single sharing",
      floor: "Floor 1",
      facility: "AC, shower, Single bed, towel, bathtub, TV",
      status: "Booked",
    },
    {
      number: "#003",
      bed: "Presidential suite",
      floor: "Floor 3",
      facility: "AC, shower, Double bed, towel, bathtub, TV",
      status: "Booked",
    },
    {
      number: "#004",
      bed: "Family suite",
      floor: "Floor 2",
      facility: "AC, shower, Double bed, towel, bathtub, TV",
      status: "Reserved",
    },
    {
      number: "#005",
      bed: "Triple bed",
      floor: "Floor 1",
      facility: "AC, shower, Double bed, towel, bathtub, TV",
      status: "Reserved",
    },
    {
      number: "#006",
      bed: "Deluxe Double",
      floor: "Floor 1",
      facility: "AC, shower, Double bed, towel, bathtub, TV",
      status: "Waitlist",
    },
    {
      number: "#007",
      bed: "Family suite",
      floor: "Floor 2",
      facility: "AC, shower, Double bed, towel, bathtub, TV",
      status: "Reserved",
    },
    {
      number: "#008",
      bed: "Single bed",
      floor: "Floor 1",
      facility: "AC, shower, Double bed, towel, bathtub, TV",
      status: "Blocked",
    },
  ]);

  const statusColors = {
    Available: "bg-blue-100 text-blue-800",
    Booked: "bg-red-100 text-red-800",
    Reserved: "bg-green-100 text-green-800",
    Waitlist: "bg-yellow-100 text-yellow-800",
    Blocked: "bg-gray-200 text-gray-800",
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Rooms</h2>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Room Number</th>
              <th className="p-3">Bed Type</th>
              <th className="p-3">Floor</th>
              <th className="p-3">Facilities</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room, i) => (
              <tr key={i} className="border-b">
                <td className="p-3">{room.number}</td>
                <td className="p-3">{room.bed}</td>
                <td className="p-3">{room.floor}</td>
                <td className="p-3">{room.facility}</td>
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
