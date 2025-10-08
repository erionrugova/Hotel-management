import { useEffect, useState } from "react";
import moment from "moment";
import apiService from "../../services/api";
import { useUser } from "../../UserContext";

function Guests() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showActiveOnly, setShowActiveOnly] = useState(false);

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
      await fetchGuests();
    } catch (err) {
      console.error("Failed to update guest status:", err);
    }
  };

  const handlePaymentChange = async (id, newPaymentStatus) => {
    try {
      await apiService.updateGuestStatus(id, {
        paymentStatus: newPaymentStatus,
      });
      await fetchGuests();
    } catch (err) {
      console.error("Failed to update payment status:", err);
    }
  };

  if (loading) return <div className="p-6">Loading guests...</div>;

  const today = moment().startOf("day");

  const computedGuests = guests.map((g) => {
    const checkIn = moment(g.booking?.startDate || g.checkIn);
    const checkOut = moment(g.booking?.endDate || g.checkOut);

    let stayStatus = "UPCOMING";
    if (today.isBetween(checkIn, checkOut, "day", "[]")) stayStatus = "ACTIVE";
    else if (today.isAfter(checkOut, "day")) stayStatus = "CHECKED_OUT";

    return { ...g, stayStatus, checkIn, checkOut };
  });

  const orderedGuests = computedGuests.sort((a, b) => {
    const order = { UPCOMING: 1, ACTIVE: 2, CHECKED_OUT: 3 };
    return order[a.stayStatus] - order[b.stayStatus];
  });

  const filteredGuests = showActiveOnly
    ? orderedGuests.filter((g) => g.stayStatus === "ACTIVE")
    : orderedGuests;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Guests</h2>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm">
            Total Guests: <b>{filteredGuests.length}</b>
          </span>
          <label className="flex items-center text-sm text-gray-700">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={() => setShowActiveOnly((prev) => !prev)}
              className="mr-2"
            />
            Show only active
          </label>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 w-[60px] text-center">#</th>
              <th className="p-3">Full Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Room</th>
              <th className="p-3">Deal</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stay Status</th>
              <th className="p-3">Status</th>
              <th className="p-3">Payment</th>
            </tr>
          </thead>
          <tbody>
            {filteredGuests.length === 0 && (
              <tr>
                <td colSpan={9} className="p-4 text-center text-gray-500">
                  No guests found.
                </td>
              </tr>
            )}
            {filteredGuests.map((g, index) => (
              <tr
                key={g.id}
                className={`border-b transition ${
                  g.stayStatus === "CHECKED_OUT" ? "opacity-70" : ""
                } hover:bg-gray-50`}
              >
                <td className="p-3 text-center text-gray-600 font-medium">
                  {index + 1}.
                </td>
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
                  {g.stayStatus === "CHECKED_OUT" ? (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      Checked Out
                    </span>
                  ) : g.stayStatus === "ACTIVE" ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                      Upcoming
                    </span>
                  )}
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
