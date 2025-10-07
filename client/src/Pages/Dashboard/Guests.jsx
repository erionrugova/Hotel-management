// src/Pages/Dashboard/Guests.jsx
import { useEffect, useState } from "react";
import apiService from "../../services/api";
import { useUser } from "../../UserContext";

function Guests() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { triggerRefresh } = useUser(); // 👈 refresh Dashboard stats too

  const fetchGuests = async () => {
    try {
      const data = await apiService.getGuests();
      setGuests(data || []);
    } catch (err) {
      console.error("Failed to fetch guests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await apiService.updateGuestStatus(id, { status: newStatus });
      await fetchGuests(); // 👈 reload after update
      triggerRefresh(); // 👈 force Dashboard to recalc occupancy
    } catch (err) {
      console.error("Failed to update guest status:", err);
    }
  };

  const handlePaymentChange = async (id, newPaymentStatus) => {
    try {
      await apiService.updateGuestStatus(id, {
        paymentStatus: newPaymentStatus,
      });
      await fetchGuests(); // 👈 reload after update
      triggerRefresh();
    } catch (err) {
      console.error("Failed to update payment status:", err);
    }
  };

  if (loading) return <div className="p-6">Loading guests...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Guests</h2>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Full Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Room</th>
              <th className="p-3">Deal</th>
              <th className="p-3">Price</th>
              <th className="p-3">Status</th>
              <th className="p-3">Payment</th>
            </tr>
          </thead>
          <tbody>
            {guests.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  No guests found.
                </td>
              </tr>
            )}
            {guests.map((g) => (
              <tr key={g.id} className="border-b">
                <td className="p-3">{g.fullName}</td>
                <td className="p-3">{g.email || "—"}</td>
                <td className="p-3">
                  {g.room?.roomNumber
                    ? `#${g.room.roomNumber} (${g.room.type})`
                    : "—"}
                </td>
                <td className="p-3">
                  {g.deal ? `${g.deal.name} (${g.deal.discount}%)` : "—"}
                </td>
                <td className="p-3">
                  {g.finalPrice ? `$${g.finalPrice}` : "—"}
                </td>
                <td className="p-3">
                  <select
                    value={g.status}
                    onChange={(e) => handleStatusChange(g.id, e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </td>
                <td className="p-3">
                  <select
                    value={g.paymentStatus || "PENDING"}
                    onChange={(e) => handlePaymentChange(g.id, e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Guests;
