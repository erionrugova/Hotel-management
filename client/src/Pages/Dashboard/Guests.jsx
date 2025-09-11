// src/Pages/Dashboard/Guests.jsx
import { useEffect, useState } from "react";
import apiService from "../../services/api";

function Guests() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const fetchGuests = async () => {
      try {
        const data = await apiService.getGuests();
        setGuests(data);
      } catch (err) {
        console.error("Failed to fetch guests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGuests();
  }, []);

  // Filtering logic
  const filteredGuests = guests.filter((g) => {
    const matchesSearch =
      g.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (g.email && g.email.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || g.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="p-6">Loading guests...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Guests</h2>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="ALL">All Statuses</option>
          <option value="Reserved">Reserved</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* Guests Table */}
      <div className="bg-white shadow-md rounded-lg p-4 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Room</th>
              <th className="p-2 border">Check-In</th>
              <th className="p-2 border">Check-Out</th>
              <th className="p-2 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredGuests.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center p-3 text-gray-500">
                  No guests found.
                </td>
              </tr>
            )}
            {filteredGuests.map((g) => (
              <tr key={g.id} className="border-b hover:bg-gray-50">
                <td className="p-2 border">{g.fullName}</td>
                <td className="p-2 border">{g.email || "-"}</td>
                <td className="p-2 border">{g.booking.room?.roomNumber}</td>
                <td className="p-2 border">
                  {new Date(g.booking.startDate).toLocaleDateString()}
                </td>
                <td className="p-2 border">
                  {new Date(g.booking.endDate).toLocaleDateString()}
                </td>
                <td className="p-2 border">{g.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Guests;
