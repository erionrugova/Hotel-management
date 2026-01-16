import { useEffect, useState } from "react";
import moment from "moment-timezone";
import apiService from "../../services/api";

moment.tz.setDefault("Europe/Belgrade");

function Refunds() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRefunds = async () => {
      try {
        // Get all completed bookings (early check-outs)
        const bookings = await apiService.getBookings();
        if (!Array.isArray(bookings)) {
          console.warn("⚠️ Invalid bookings response");
          setLoading(false);
          return;
        }
        const completedBookings = bookings.filter(
          (b) => b.status === "COMPLETED"
        );

        // Calculate refund info for each
        const refundsData = completedBookings
          .map((booking) => {
            const originalEnd = moment.tz(booking.endDate, "Europe/Belgrade");
            const actualEnd = moment.tz(booking.updatedAt || booking.endDate, "Europe/Belgrade");
            const isEarlyCheckout = actualEnd.isBefore(originalEnd, "day");

            if (!isEarlyCheckout) return null;

            const start = moment.tz(booking.startDate, "Europe/Belgrade");
            const totalNights = originalEnd.diff(start, "days");
            const usedNights = actualEnd.diff(start, "days");
            const unusedNights = totalNights - usedNights;
            const pricePerNight =
              totalNights > 0 ? parseFloat(booking.finalPrice || 0) / totalNights : 0;

            // Estimate refund (actual calculation is on backend)
            // For display purposes, we'll show an estimate
            return {
              id: booking.id,
              guestName: `${booking.customerFirstName} ${booking.customerLastName}`,
              room: booking.room?.roomNumber || "N/A",
              roomType: booking.room?.type || "N/A",
              originalCheckout: originalEnd.format("MMM D, YYYY"),
              actualCheckout: actualEnd.format("MMM D, YYYY"),
              unusedNights,
              originalPrice: parseFloat(booking.finalPrice || 0),
              estimatedRefund: unusedNights * pricePerNight,
              paymentStatus: booking.paymentStatus,
              createdAt: booking.updatedAt || booking.createdAt,
            };
          })
          .filter((r) => r !== null);

        setRefunds(refundsData);
      } catch (err) {
        console.error("Failed to fetch refunds:", err);
        // Preserve existing refunds data on error
        if (refunds.length === 0) {
          setRefunds([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRefunds();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-lg animate-pulse text-gray-600">Loading refunds...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Refunds Management</h2>
        <p className="text-gray-600 text-sm">
          View and manage refunds for early check-outs
        </p>
      </div>

      {refunds.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500">No refunds to display.</p>
          <p className="text-gray-400 text-sm mt-2">
            Refunds will appear here when guests check out early.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3">Guest</th>
                  <th className="p-3">Room</th>
                  <th className="p-3">Original Check-out</th>
                  <th className="p-3">Actual Check-out</th>
                  <th className="p-3">Unused Nights</th>
                  <th className="p-3">Original Price</th>
                  <th className="p-3">Estimated Refund</th>
                  <th className="p-3">Payment Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((refund) => (
                  <tr
                    key={refund.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="p-3 font-medium">{refund.guestName}</td>
                    <td className="p-3">
                      {refund.room} ({refund.roomType})
                    </td>
                    <td className="p-3">{refund.originalCheckout}</td>
                    <td className="p-3 font-semibold text-blue-600">
                      {refund.actualCheckout}
                    </td>
                    <td className="p-3">{refund.unusedNights} nights</td>
                    <td className="p-3">${refund.originalPrice.toFixed(2)}</td>
                    <td className="p-3">
                      <span className="font-semibold text-green-600">
                        ${refund.estimatedRefund.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          refund.paymentStatus === "PAID"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {refund.paymentStatus || "PENDING"}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {moment.tz(refund.createdAt, "Europe/Belgrade").format("MMM D, YYYY")}
                    </td>
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

export default Refunds;
