import { useEffect, useState } from "react";
import moment from "moment-timezone";
import apiService from "../../services/api";
import { Search, Filter, Receipt, RefreshCw } from "lucide-react";
import { useUser } from "../../UserContext";

moment.tz.setDefault("Europe/Belgrade");

function Invoices() {
  const { refreshFlag } = useUser();
  const [activeTab, setActiveTab] = useState("all"); // 'all' or 'refunds'
  const [bookings, setBookings] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'active', 'non-active'
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, [refreshFlag]); // Refresh when global refresh flag changes

  const fetchData = async () => {
    setLoading(true);
    try {
      const allBookings = await apiService.getBookings();
      if (!Array.isArray(allBookings)) {
        console.warn("⚠️ Invalid bookings response");
        setLoading(false);
        return;
      }

      // Process for All Invoices
      setBookings(
        allBookings.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        ),
      );

      // Process for Refunds (Cancelled bookings and Early check-outs)
      // Show cancelled bookings with refunds (refundAmount > 0)
      const cancelledBookings = allBookings.filter(
        (b) => b.status === "CANCELLED" && b.refundAmount !== null && parseFloat(b.refundAmount || 0) > 0,
      );

      const completedBookings = allBookings.filter(
        (b) => b.status === "COMPLETED",
      );

      // Process cancelled bookings with refunds
      const cancelledRefunds = cancelledBookings.map((booking) => {
        const checkIn = moment.tz(booking.startDate, "Europe/Belgrade");
        const checkOut = moment.tz(booking.endDate, "Europe/Belgrade");
        const totalNights = checkOut.diff(checkIn, "days");

        return {
          id: booking.id,
          guestName: `${booking.customerFirstName} ${booking.customerLastName}`,
          room: booking.room?.roomNumber || "N/A",
          roomType: booking.room?.type || "N/A",
          originalCheckout: checkOut.format("MMM D, YYYY"),
          actualCheckout: "Cancelled",
          unusedNights: totalNights,
          originalPrice: parseFloat(booking.finalPrice || 0),
          estimatedRefund: parseFloat(booking.refundAmount || 0),
          paymentStatus: booking.paymentStatus,
          createdAt: booking.updatedAt || booking.createdAt,
          type: "cancellation",
        };
      });

      // Process early check-outs (only show if refundAmount > 0)
      const earlyCheckoutRefunds = completedBookings
        .map((booking) => {
          const originalEnd = moment.tz(booking.endDate, "Europe/Belgrade");
          const actualEnd = moment.tz(
            booking.updatedAt || booking.endDate,
            "Europe/Belgrade",
          );
          const isEarlyCheckout = actualEnd.isBefore(originalEnd, "day");
          const refundAmount = parseFloat(booking.refundAmount || 0);

          // Only show early check-outs with refunds
          if (!isEarlyCheckout || refundAmount === 0) return null;

          const start = moment.tz(booking.startDate, "Europe/Belgrade");
          const totalNights = originalEnd.diff(start, "days");
          const usedNights = actualEnd.diff(start, "days");
          const unusedNights = totalNights - usedNights;

          return {
            id: booking.id,
            guestName: `${booking.customerFirstName} ${booking.customerLastName}`,
            room: booking.room?.roomNumber || "N/A",
            roomType: booking.room?.type || "N/A",
            originalCheckout: originalEnd.format("MMM D, YYYY"),
            actualCheckout: actualEnd.format("MMM D, YYYY"),
            unusedNights,
            originalPrice: parseFloat(booking.finalPrice || 0),
            estimatedRefund: refundAmount, // Use actual refundAmount from backend
            paymentStatus: booking.paymentStatus,
            createdAt: booking.updatedAt || booking.createdAt,
            type: "early_checkout",
          };
        })
        .filter((r) => r !== null);

      // Combine both types of refunds
      const refundsData = [...cancelledRefunds, ...earlyCheckoutRefunds].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setRefunds(refundsData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBookings = () => {
    let filtered = bookings;

    // Filter by status
    if (filter === "active") {
      filtered = filtered.filter((b) => b.status === "CONFIRMED");
    } else if (filter === "non-active") {
      filtered = filtered.filter(
        (b) => b.status === "COMPLETED" || b.status === "CANCELLED",
      );
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.customerFirstName?.toLowerCase().includes(term) ||
          b.customerLastName?.toLowerCase().includes(term) ||
          b.room?.roomNumber?.toString().includes(term) ||
          String(b.id).toLowerCase().includes(term),
      );
    }

    return filtered;
  };

  const filteredBookings = getFilteredBookings();

  if (loading) {
    return (
      <div className="p-10 min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg animate-pulse text-indigo-400 font-medium">
            Loading invoices...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-10 min-h-screen bg-slate-950 text-slate-100">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-semibold mb-2 text-white">
            Invoices & Refunds
          </h2>
          <p className="text-slate-400">
            Manage all booking invoices and process refunds
          </p>
        </div>

        <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "all"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All Invoices
          </button>
          <button
            onClick={() => setActiveTab("refunds")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === "refunds"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Refunds
            {refunds.length > 0 && (
              <span className="bg-indigo-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {refunds.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === "all" ? (
        <div className="bg-slate-900 rounded-xl shadow-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-800 text-slate-200">
                <tr>
                  <th className="p-4 font-semibold">Booking ID</th>
                  <th className="p-4 font-semibold">Guest</th>
                  <th className="p-4 font-semibold">Room</th>
                  <th className="p-4 font-semibold">Dates</th>
                  <th className="p-4 font-semibold">Amount</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Payment</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="p-4 font-mono text-xs text-slate-400">
                      {booking?.id ? booking.id : "N/A"}
                    </td>
                    <td className="p-4">
                      {booking.customerFirstName} {booking.customerLastName}
                    </td>
                    <td className="p-4">
                      #{booking.room?.roomNumber || "N/A"}
                    </td>
                    <td className="p-4">
                      {moment(booking.startDate).format("MMM D")} -{" "}
                      {moment(booking.endDate).format("MMM D")}
                    </td>
                    <td className="p-4">
                      ${parseFloat(booking.finalPrice || 0).toFixed(2)}
                    </td>
                    <td className="p-4">{booking.status}</td>
                    <td className="p-4">
                      {booking.paymentStatus || "PENDING"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-xl shadow-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-800 text-slate-200">
                <tr>
                  <th className="p-4 font-semibold">Guest</th>
                  <th className="p-4 font-semibold">Room</th>
                  <th className="p-4 font-semibold">Type</th>
                  <th className="p-4 font-semibold">Dates</th>
                  <th className="p-4 font-semibold">Unused Nights</th>
                  <th className="p-4 font-semibold">Original Price</th>
                  <th className="p-4 font-semibold">Refund Amount</th>
                  <th className="p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((refund) => (
                  <tr key={refund.id}>
                    <td className="p-4">{refund.guestName}</td>
                    <td className="p-4">#{refund.room}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        refund.type === "cancellation" 
                          ? "bg-red-500/10 text-red-400" 
                          : "bg-blue-500/10 text-blue-400"
                      }`}>
                        {refund.type === "cancellation" ? "Cancellation" : "Early Check-out"}
                      </span>
                    </td>
                    <td className="p-4">
                      {refund.type === "cancellation" 
                        ? `${moment(refund.createdAt).format("MMM D, YYYY")} (Cancelled)`
                        : `${refund.originalCheckout} → ${refund.actualCheckout}`
                      }
                    </td>
                    <td className="p-4">{refund.unusedNights}</td>
                    <td className="p-4">${refund.originalPrice.toFixed(2)}</td>
                    <td className="p-4 font-medium text-green-400">
                      ${refund.estimatedRefund.toFixed(2)}
                    </td>
                    <td className="p-4">{refund.paymentStatus || "PENDING"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Invoices;
