import { useEffect, useState } from "react";
import moment from "moment-timezone";
import apiService from "../../services/api";
import { useUser } from "../../UserContext";
import RefundModal from "../../components/RefundModal";
import BookingModal from "./BookingModal";

moment.tz.setDefault("Europe/Belgrade");

function Guests() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [refundModal, setRefundModal] = useState({ isOpen: false, guest: null, refundInfo: null, isCancellation: false });
  const [bookingModal, setBookingModal] = useState({ isOpen: false, booking: null });
  const [rooms, setRooms] = useState([]);
  const { triggerRefresh, refreshFlag } = useUser();

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const data = await apiService.getGuests();
      if (data && Array.isArray(data)) {
        // Filter out guests with deleted bookings (booking is null)
        const validGuests = data.filter((g) => g.booking !== null && g.booking !== undefined);
        setGuests(validGuests);
      } else {
        setGuests([]);
      }
    } catch (err) {
      console.error("Failed to fetch guests:", err);
      // On error, still try to filter existing data to remove deleted bookings
      setGuests((prev) => prev.filter((g) => g.booking !== null && g.booking !== undefined));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, [refreshFlag]); // Refresh when refreshFlag changes (when bookings are created/updated)

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const roomsData = await apiService.getRooms();
        setRooms(roomsData.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber)));
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
      }
    };
    fetchRooms();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const guest = guests.find((g) => g.id === id);
      
      // If changing to CANCELLED, show refund modal for cancellation refund
      if (newStatus === "CANCELLED" && guest?.booking && guest.booking.status !== "CANCELLED") {
        // Calculate refund eligibility before showing modal
        try {
          const rates = await apiService.getRates();
          const roomRate = rates.find((r) => r.roomId === guest.booking.roomId);
          const policy = roomRate?.policy || "NON_REFUNDABLE";
          
          const today = moment.tz("Europe/Belgrade").startOf("day");
          const checkInDate = moment.tz(guest.booking.startDate, "Europe/Belgrade").startOf("day");
          const daysUntilCheckIn = checkInDate.diff(today, "days");
          const originalPrice = parseFloat(guest.booking.finalPrice || 0);
          
          let refundable = false;
          let estimatedRefund = 0;
          let refundMessage = "";
          
          switch (policy) {
            case "NON_REFUNDABLE":
              refundable = false;
              estimatedRefund = 0;
              refundMessage = "No refund - Non-refundable policy";
              break;
            case "FLEXIBLE":
              refundable = true;
              estimatedRefund = originalPrice;
              refundMessage = "Full refund available - Flexible policy";
              break;
            case "STRICT":
              if (daysUntilCheckIn >= 7) {
                refundable = true;
                estimatedRefund = originalPrice;
                refundMessage = `Full refund available - Strict policy (cancelled ${daysUntilCheckIn} days before check-in)`;
              } else {
                refundable = false;
                estimatedRefund = 0;
                refundMessage = `No refund - Strict policy requires 7+ days (cancelled ${daysUntilCheckIn} days before check-in)`;
              }
              break;
            default:
              refundable = false;
              estimatedRefund = 0;
              refundMessage = "No refund - Unknown policy";
          }
          
          // Show refund modal with eligibility info
          setRefundModal({ 
            isOpen: true, 
            guest: { ...guest, booking: guest.booking },
            refundInfo: {
              policy,
              daysUntilCheckIn,
              refundable,
              estimatedRefund,
              refundMessage,
              originalPrice,
            },
            isCancellation: true, // Flag to indicate this is a cancellation
          });
        } catch (err) {
          console.error("Failed to calculate refund eligibility:", err);
          // Show modal without refund info if calculation fails
          setRefundModal({ 
            isOpen: true, 
            guest: { ...guest, booking: guest.booking },
            refundInfo: null,
            isCancellation: true,
          });
        }
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
      const { guest, refundInfo } = refundModal;
      
      const response = await apiService.updateGuestStatus(guest.id, {
        status: "CANCELLED",
      });

      // Update modal with final refund info from backend
      if (response && response.refund) {
        const refund = response.refund;
        
        // Update modal to show final refund amount
        setRefundModal(prev => ({ 
          ...prev, 
          refundInfo: {
            ...prev.refundInfo,
            refundAmount: refund.refundAmount || 0,
            policy: refund.policy || prev.refundInfo?.policy,
            daysUntilCheckIn: refund.daysUntilCheckIn || prev.refundInfo?.daysUntilCheckIn,
            reason: refund.reason || "",
            refundable: refund.refundable || false,
            isFinal: true, // Flag to show this is the final amount
          }
        }));
        
        // Show success message with actual refund amount
        const message = refund.refundable && refund.refundAmount > 0
          ? `Booking cancelled successfully!\n\nRefund Amount: $${refund.refundAmount.toFixed(2)}\nPolicy: ${refund.policy}\nDays until check-in: ${refund.daysUntilCheckIn}\n\n${refund.reason}`
          : `Booking cancelled successfully!\n\n${refund.reason}`;
        
        alert(message);
      } else {
        alert("Booking cancelled successfully!");
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

  // Filter out guests with deleted bookings (booking is null/undefined)
  const validGuests = guests.filter((g) => g.booking !== null && g.booking !== undefined);

  const computedGuests = validGuests.map((g) => {
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
    <div className="p-2 sm:p-4 min-h-screen bg-slate-950 text-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
        <h2 className="text-2xl sm:text-3xl font-semibold text-white">Guests</h2>
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

      <div className="bg-slate-900 border border-slate-800 shadow-xl rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-left table-fixed" style={{ tableLayout: 'auto' }}>
            <thead className="bg-slate-800 text-slate-200">
              <tr>
                <th className="p-2 w-[35px] text-center font-semibold text-xs">#</th>
                <th className="p-2 w-[75px] font-semibold text-xs">Booking ID</th>
                <th className="p-2 w-[110px] font-semibold text-xs">Full Name</th>
                <th className="p-2 w-[130px] font-semibold text-xs">Email</th>
                <th className="p-2 w-[90px] font-semibold text-xs">Room</th>
                <th className="p-2 w-[90px] font-semibold text-xs">Deal</th>
                <th className="p-2 w-[70px] font-semibold text-xs">Price</th>
                <th className="p-2 w-[90px] font-semibold text-xs">Stay Status</th>
                <th className="p-2 w-[90px] font-semibold text-xs">Status</th>
                <th className="p-2 w-[80px] font-semibold text-xs">Payment</th>
                <th className="p-2 w-[90px] font-semibold text-xs">Refund</th>
                <th className="p-2 w-[110px] font-semibold text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredGuests.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-500">
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
                  <td className="p-2 text-center text-slate-500 font-medium text-xs">
                    {index + 1}.
                  </td>
                  <td className="p-2 text-center font-mono text-xs font-semibold text-indigo-400">
                    {g.booking?.id ? `#${g.booking.id}` : "N/A"}
                  </td>
                  <td className="p-2 text-slate-200 font-medium text-sm truncate max-w-[120px]" title={g.fullName}>
                    {g.fullName}
                  </td>
                  <td className="p-2 text-slate-400 text-xs truncate max-w-[140px]" title={g.email || ""}>
                    {g.email || "—"}
                  </td>
                  <td className="p-2 text-slate-300 text-xs">
                    {g.room?.roomNumber
                      ? `#${g.room.roomNumber} (${g.room.type})`
                      : "—"}
                  </td>
                  <td className="p-2 text-slate-300 text-xs truncate max-w-[100px]" title={g.deal ? `${g.deal.name} (${g.deal.discount}%)` : ""}>
                    {g.deal ? `${g.deal.name} (${g.deal.discount}%)` : "—"}
                  </td>
                  <td className="p-2 text-slate-300 font-medium text-xs">
                    {g.finalPrice ? `$${g.finalPrice}` : "—"}
                  </td>

                  <td className="p-2">
                    {g.stayStatus === "CHECKED_OUT" ? (
                      <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-medium whitespace-nowrap">
                        Checked Out
                      </span>
                    ) : g.stayStatus === "ACTIVE" ? (
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-medium whitespace-nowrap">
                        Active
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-medium whitespace-nowrap">
                        Upcoming
                      </span>
                    )}
                  </td>

                  <td className="p-2">
                    <select
                      value={g.status}
                      onChange={(e) => handleStatusChange(g.id, e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-1.5 py-1 text-xs focus:ring-2 focus:ring-indigo-500 outline-none w-full"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </td>

                  <td className="p-2">
                    <select
                      value={g.paymentStatus || "PENDING"}
                      onChange={(e) => handlePaymentChange(g.id, e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-1.5 py-1 text-xs focus:ring-2 focus:ring-indigo-500 outline-none w-full"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PAID">Paid</option>
                    </select>
                  </td>
                  <td className="p-2">
                    {g.status === "CANCELLED" && g.booking && (() => {
                      const refundAmount = parseFloat(g.booking.refundAmount || 0);
                      if (refundAmount > 0) {
                        return (
                          <span className="px-1.5 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-medium whitespace-nowrap">
                            ${refundAmount.toFixed(2)}
                          </span>
                        );
                      }
                      return (
                        <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-medium whitespace-nowrap">
                          No Refund
                        </span>
                      );
                    })()}
                    {g.status === "COMPLETED" && g.booking && (() => {
                      const refundAmount = parseFloat(g.booking.refundAmount || 0);
                      const originalEnd = moment.tz(g.booking.endDate, "Europe/Belgrade");
                      const actualEnd = moment.tz(g.booking.updatedAt || g.booking.endDate, "Europe/Belgrade");
                      const isEarlyCheckout = actualEnd.isBefore(originalEnd, "day");
                      
                      if (isEarlyCheckout) {
                        if (refundAmount > 0) {
                          return (
                            <span className="px-1.5 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-medium whitespace-nowrap">
                              ${refundAmount.toFixed(2)}
                            </span>
                          );
                        } else {
                          return (
                            <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-medium whitespace-nowrap">
                              Early
                            </span>
                          );
                        }
                      }
                      return (
                        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-500 rounded-full text-xs">
                          —
                        </span>
                      );
                    })()}
                    {g.status !== "CANCELLED" && g.status !== "COMPLETED" && (
                      <span className="px-1.5 py-0.5 bg-slate-800 text-slate-500 rounded-full text-xs">
                        —
                      </span>
                    )}
                  </td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          if (g.booking) {
                            setBookingModal({
                              isOpen: true,
                              booking: {
                                id: g.booking.id,
                                group: g.booking.roomId,
                                roomId: g.booking.roomId,
                                customerFirstName: g.booking.customerFirstName || g.fullName.split(" ")[0],
                                customerLastName: g.booking.customerLastName || g.fullName.split(" ").slice(1).join(" "),
                                customerEmail: g.booking.customerEmail || g.email,
                                paymentType: g.booking.paymentType,
                                start_time: g.booking.startDate,
                                end_time: g.booking.endDate,
                                checkIn: g.booking.startDate,
                                checkOut: g.booking.endDate,
                                dealId: g.booking.dealId,
                                status: g.booking.status,
                              },
                            });
                          }
                        }}
                        className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 transition whitespace-nowrap"
                        disabled={!g.booking}
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (!g.booking?.id) return;
                          if (!window.confirm(`Are you sure you want to delete booking #${g.booking.id}? This will also delete the guest record.`))
                            return;
                          try {
                            await apiService.deleteBooking(g.booking.id);
                            triggerRefresh();
                            fetchGuests();
                          } catch (err) {
                            console.error("Failed to delete booking:", err);
                            alert(`Failed to delete booking: ${err?.response?.data?.error || err?.message || "Unknown error"}`);
                          }
                        }}
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition whitespace-nowrap"
                        disabled={!g.booking}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
              </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <BookingModal
        isOpen={bookingModal.isOpen}
        onClose={() => setBookingModal({ isOpen: false, booking: null })}
        onSave={async (bookingData) => {
          try {
            if (bookingModal.booking?.id) {
              await apiService.updateBooking(bookingModal.booking.id, bookingData);
              triggerRefresh();
              fetchGuests();
              setBookingModal({ isOpen: false, booking: null });
            }
          } catch (err) {
            console.error("Failed to update booking:", err);
            alert(`Failed to update booking: ${err?.response?.data?.error || err?.message || "Unknown error"}`);
          }
        }}
        booking={bookingModal.booking}
        groups={rooms.map((r) => ({ id: r.id, title: `Room ${r.roomNumber}` }))}
      />

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
