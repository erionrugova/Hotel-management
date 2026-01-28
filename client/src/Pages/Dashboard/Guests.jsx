import { useEffect, useState } from "react";
import moment from "moment-timezone";
import apiService from "../../services/api";
import { useUser } from "../../UserContext";
import RefundModal from "../../components/RefundModal";

moment.tz.setDefault("Europe/Belgrade");

function Guests() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [refundModal, setRefundModal] = useState({ isOpen: false, guest: null, refundInfo: null, isCancellation: false });
  const { triggerRefresh, refreshFlag } = useUser();

  const fetchGuests = async () => {
    try {
      const data = await apiService.getGuests();
      if (data && Array.isArray(data)) {
        setGuests(data);
      }
      // If request fails, preserve existing guests data
    } catch (err) {
      console.error("Failed to fetch guests:", err);
      // Don't clear existing data on error
      if (guests.length === 0) {
        setGuests([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, [refreshFlag]); // Refresh when refreshFlag changes (when bookings are created/updated)

  const handleStatusChange = async (id, newStatus) => {
    try {
      const guest = guests.find((g) => g.id === id);
      
      // If changing to CANCELLED, show refund modal for cancellation refund
      if (newStatus === "CANCELLED" && guest?.booking && guest.booking.status !== "CANCELLED") {
        // Show refund modal for cancellation
        setRefundModal({ 
          isOpen: true, 
          guest: { ...guest, booking: guest.booking },
          refundInfo: null, // Will be calculated on backend
          isCancellation: true, // Flag to indicate this is a cancellation
        });
        return; // Don't update yet, wait for modal confirmation
      }
      
      // If changing to COMPLETED, check if it's an early check-out (active booking checking out early)
      if (newStatus === "COMPLETED" && guest?.booking && guest.booking.status !== "COMPLETED") {
        const today = moment.tz("Europe/Belgrade").startOf("day");
        const originalEnd = moment.tz(guest.booking.endDate, "Europe/Belgrade").startOf("day");
        const checkIn = moment.tz(guest.booking.startDate, "Europe/Belgrade").startOf("day");
        
        // Check if booking is active (today is on or after check-in and before check-out)
        const isActiveBooking = today.isSameOrAfter(checkIn, "day") && today.isBefore(originalEnd, "day");
        
        // Check if it's early check-out (checking out before scheduled check-out date)
        const isEarlyCheckout = today.isBefore(originalEnd, "day");
        
        // Show refund modal for early check-out if booking is active and checking out early
        if (isActiveBooking && isEarlyCheckout) {
          // Pre-calculate refund estimate for display
          const totalNights = originalEnd.diff(checkIn, "days");
          const unusedNights = originalEnd.diff(today, "days");
          const pricePerNight = totalNights > 0 
            ? parseFloat(guest.booking.finalPrice || 0) / totalNights 
            : 0;
          
          setRefundModal({ 
            isOpen: true, 
            guest: { ...guest, booking: guest.booking },
            refundInfo: {
              unusedNights,
              estimatedRefund: unusedNights * pricePerNight,
            },
            isCancellation: false, // This is early check-out, not cancellation
          });
          return; // Don't update yet, wait for modal confirmation
        }
        
        // Regular checkout (on or after scheduled check-out date) - automatically set to COMPLETED
        // No modal needed, just update status directly
        await apiService.updateGuestStatus(id, { status: "COMPLETED" });
        await fetchGuests();
        triggerRefresh(); // Refresh dashboard data
        return;
      }
      
      // Normal status change
      await apiService.updateGuestStatus(id, { status: newStatus });
      await fetchGuests();
      triggerRefresh(); // Refresh dashboard data
    } catch (err) {
      console.error("Failed to update guest status:", err);
    }
  };

  const handleConfirmCancellation = async () => {
    try {
      const { guest } = refundModal;
      
      const response = await apiService.updateGuestStatus(guest.id, {
        status: "CANCELLED",
      });

      // Show refund info if available
      if (response && response.refund) {
        const refund = response.refund;
        
        // Show success message
        const message = refund.refundable
          ? `Booking cancelled!\n\nRefund Amount: $${refund.refundAmount.toFixed(2)}\nPolicy: ${refund.policy}\nDays until check-in: ${refund.daysUntilCheckIn}\n\n${refund.reason}`
          : `Booking cancelled!\n\n${refund.reason}`;
        
        alert(message);
      } else {
        alert("Booking cancelled!");
      }
      
      setRefundModal({ isOpen: false, guest: null, refundInfo: null, isCancellation: false });
      // Refresh guests and trigger dashboard refresh
      await fetchGuests();
      triggerRefresh(); // Refresh dashboard and front desk data
    } catch (err) {
      console.error("Failed to process cancellation:", err);
      alert("Failed to process cancellation. Please try again.");
    }
  };

  const handleConfirmCheckout = async (earlyCheckoutDate) => {
    try {
      const { guest } = refundModal;
      
      const response = await apiService.updateGuestStatus(guest.id, {
        status: "COMPLETED",
        earlyCheckoutDate,
      });

      // Show refund info if available
      if (response && response.refund) {
        const refund = response.refund;
        
        // Update modal with final refund info
        setRefundModal(prev => ({ 
          ...prev, 
          refundInfo: {
            ...refund,
            refundAmount: refund.refundAmount || 0,
            policy: refund.policy || "N/A",
            unusedNights: refund.unusedNights || 0,
            reason: refund.reason || "",
            refundable: refund.refundable || false,
          }
        }));
        
        // Show success message
        const message = refund.refundable
          ? `Check-out confirmed!\n\nRefund Amount: $${refund.refundAmount.toFixed(2)}\nPolicy: ${refund.policy}\nUnused Nights: ${refund.unusedNights}\n\n${refund.reason}`
          : `Check-out confirmed!\n\n${refund.reason}`;
        
        alert(message);
      } else {
        alert("Check-out confirmed!");
      }
      
      setRefundModal({ isOpen: false, guest: null, refundInfo: null, isCancellation: false });
      // Refresh guests and trigger dashboard refresh
      await fetchGuests();
      triggerRefresh(); // Refresh dashboard and front desk data
    } catch (err) {
      console.error("Failed to process check-out:", err);
      alert("Failed to process check-out. Please try again.");
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

  if (loading) return (
    <div className="p-10 min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-lg animate-pulse text-indigo-400 font-medium">Loading guests...</div>
      </div>
    </div>
  );

  const today = moment.tz("Europe/Belgrade").startOf("day");

  const computedGuests = guests.map((g) => {
    const checkIn = moment.tz(g.booking?.startDate || g.checkIn, "Europe/Belgrade");
    const checkOut = moment.tz(g.booking?.endDate || g.checkOut, "Europe/Belgrade");

    let stayStatus = "UPCOMING";
    // If status is COMPLETED or CANCELLED, consider it checked out
    if (g.status === "COMPLETED" || g.booking?.status === "COMPLETED") {
      stayStatus = "CHECKED_OUT";
    } else if (g.status === "CANCELLED" || g.booking?.status === "CANCELLED") {
      stayStatus = "CHECKED_OUT";
    } else if (today.isSameOrBefore(checkOut, "day") && today.isSameOrAfter(checkIn, "day")) {
      stayStatus = "ACTIVE";
    } else if (today.isAfter(checkOut, "day")) {
      stayStatus = "CHECKED_OUT";
    }

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
    <div className="p-10 min-h-screen bg-slate-950 text-slate-100">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-semibold text-white">Guests</h2>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">
            Total Guests: <b className="text-white">{filteredGuests.length}</b>
          </span>
          <label className="flex items-center text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={() => setShowActiveOnly((prev) => !prev)}
              className="mr-2 accent-indigo-600"
            />
            Show only active
          </label>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 shadow-xl rounded-xl overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-800 text-slate-200">
            <tr>
              <th className="p-4 w-[60px] text-center font-semibold">#</th>
              <th className="p-4 font-semibold">Full Name</th>
              <th className="p-4 font-semibold">Email</th>
              <th className="p-4 font-semibold">Room</th>
              <th className="p-4 font-semibold">Deal</th>
              <th className="p-4 font-semibold">Price</th>
              <th className="p-4 font-semibold">Stay Status</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Payment</th>
              <th className="p-4 font-semibold">Refund</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredGuests.length === 0 && (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-500">
                  No guests found.
                </td>
              </tr>
            )}
            {filteredGuests.map((g, index) => (
              <tr
                key={g.id}
                className={`transition-colors hover:bg-slate-800/50 ${
                  g.stayStatus === "CHECKED_OUT" ? "opacity-60" : ""
                }`}
              >
                <td className="p-4 text-center text-slate-500 font-medium">
                  {index + 1}.
                </td>
                <td className="p-4 text-slate-200 font-medium">{g.fullName}</td>
                <td className="p-4 text-slate-400">{g.email || "—"}</td>
                <td className="p-4 text-slate-300">
                  {g.room?.roomNumber
                    ? `#${g.room.roomNumber} (${g.room.type})`
                    : "—"}
                </td>
                <td className="p-4 text-slate-300">
                  {g.deal ? `${g.deal.name} (${g.deal.discount}%)` : "—"}
                </td>
                <td className="p-4 text-slate-300 font-medium">
                  {g.finalPrice ? `$${g.finalPrice}` : "—"}
                </td>

                <td className="p-4">
                  {g.stayStatus === "CHECKED_OUT" ? (
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-medium">
                      Checked Out
                    </span>
                  ) : g.stayStatus === "ACTIVE" ? (
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-medium">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-medium">
                      Upcoming
                    </span>
                  )}
                </td>

                <td className="p-4">
                  <select
                    value={g.status}
                    onChange={(e) => handleStatusChange(g.id, e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </td>

                <td className="p-4">
                  <select
                    value={g.paymentStatus || "PENDING"}
                    onChange={(e) => handlePaymentChange(g.id, e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                  </select>
                </td>
                <td className="p-4">
                  {g.status === "CANCELLED" && g.booking && (() => {
                    const refundAmount = parseFloat(g.booking.refundAmount || 0);
                    if (refundAmount > 0) {
                      return (
                        <span className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-medium">
                          Refunded ${refundAmount.toFixed(2)}
                        </span>
                      );
                    }
                    return (
                      <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-medium">
                        No Refund
                      </span>
                    );
                  })()}
                  {g.status === "COMPLETED" && g.booking && (() => {
                    const refundAmount = parseFloat(g.booking.refundAmount || 0);
                    const originalEnd = moment.tz(g.booking.endDate, "Europe/Belgrade");
                    const actualEnd = moment.tz(g.booking.updatedAt || g.booking.endDate, "Europe/Belgrade");
                    const isEarlyCheckout = actualEnd.isBefore(originalEnd, "day");
                    
                    // Show "Early Check-out" for all early check-outs, with refund amount if applicable
                    if (isEarlyCheckout) {
                      if (refundAmount > 0) {
                        return (
                          <div className="flex flex-col gap-1">
                            <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-medium w-fit">
                              Early Check-out
                            </span>
                            <span className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-medium w-fit">
                              Refunded ${refundAmount.toFixed(2)}
                            </span>
                          </div>
                        );
                      } else {
                        return (
                          <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-medium">
                            Early Check-out
                          </span>
                        );
                      }
                    }
                    return (
                      <span className="px-2 py-1 bg-slate-800 text-slate-500 rounded-full text-xs">
                        —
                      </span>
                    );
                  })()}
                  {g.status !== "CANCELLED" && g.status !== "COMPLETED" && (
                    <span className="px-2 py-1 bg-slate-800 text-slate-500 rounded-full text-xs">
                      —
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RefundModal
        isOpen={refundModal.isOpen}
        onClose={() => setRefundModal({ isOpen: false, guest: null, refundInfo: null, isCancellation: false })}
        onConfirm={refundModal.isCancellation ? handleConfirmCancellation : handleConfirmCheckout}
        booking={refundModal.guest?.booking}
        refundInfo={refundModal.refundInfo}
        isCancellation={refundModal.isCancellation}
      />
    </div>
  );
}

export default Guests;
