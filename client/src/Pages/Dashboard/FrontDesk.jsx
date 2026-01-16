import { useEffect, useState } from "react";
import moment from "moment-timezone";
import BookingModal from "./BookingModal";
import apiService from "../../services/api";
import { useUser } from "../../UserContext";

moment.tz.setDefault("Europe/Belgrade");

const statusColor = (checkInISO, checkOutISO, bookingStatus) => {
  const today = moment.tz("Europe/Belgrade").startOf("day");
  const ci = moment.tz(checkInISO, "Europe/Belgrade").startOf("day");
  const co = moment.tz(checkOutISO, "Europe/Belgrade").startOf("day");

  // If booking is COMPLETED, show as checked out
  if (bookingStatus === "COMPLETED") return "#3b82f6"; // checked out

  if (today.isBefore(ci, "day")) return "#facc15"; // future booking
  if (today.isSame(co, "day")) return "#ef4444"; // due out today
  if (today.isAfter(co, "day")) return "#3b82f6"; // checked out
  // Active booking: today is on or after check-in AND on or before check-out
  if (today.isSameOrAfter(ci, "day") && today.isSameOrBefore(co, "day"))
    return "#4ade80"; // active - green
  return "#9ca3af"; // fallback
};

function FrontDesk() {
  const [groups, setGroups] = useState([]);
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { triggerRefresh } = useUser();
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [currentDate, setCurrentDate] = useState(moment.tz("Europe/Belgrade"));
  const [viewMode, setViewMode] = useState("week"); // Default to week view for better fit
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await Promise.allSettled([
          apiService.getRooms(),
          apiService.getBookings(),
        ]);

        const roomsResult = results[0];
        const bookingsResult = results[1];

        // Only update state if requests succeeded
        if (roomsResult.status === "fulfilled") {
          setGroups(
            roomsResult.value
              .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))
              .map((r) => ({
                id: r.id,
                title: `Room ${r.roomNumber}`,
                type: r.type,
              }))
          );
        } else {
          console.error("Failed to fetch rooms:", roomsResult.reason);
        }

        if (bookingsResult.status === "fulfilled") {
          // Only show CONFIRMED bookings in Front Desk calendar
          setItems(
            bookingsResult.value
              .filter((b) => b.status === "CONFIRMED")
              .map((b) => ({
                id: b.id,
                group: b.roomId,
                title: `${b.customerFirstName || ""} ${
                  b.customerLastName || ""
                }`.trim(),
                start_time: moment.tz(b.startDate, "Europe/Belgrade"),
                end_time: moment.tz(b.endDate, "Europe/Belgrade"),
                customerFirstName: b.customerFirstName,
                customerLastName: b.customerLastName,
                customerEmail: b.customerEmail,
                paymentType: b.paymentType,
                checkIn: b.startDate,
                checkOut: b.endDate,
                room: b.room
                  ? { roomNumber: b.room.roomNumber, type: b.room.type }
                  : { roomNumber: "Unknown", type: "—" },
                status: b.status,
                paymentStatus: b.paymentStatus,
              }))
          );
        } else {
          console.error("Failed to fetch bookings:", bookingsResult.reason);
        }
      } catch (err) {
        console.error("Failed to load front desk data", err);
      }
    };

    fetchData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setError("");
    setIsModalOpen(true);
  };

  const openEdit = (id) => {
    const found = items.find((b) => b.id === id);
    if (found) {
      setEditing(found);
      setError("");
      setIsModalOpen(true);
    }
  };

  const handleSave = async (booking) => {
    setError("");
    try {
      let saved;
      if (editing) {
        saved = await apiService.updateBooking(editing.id, booking);
        // Check if saved is false (error case)
        if (!saved || !saved.id) {
          throw new Error("Booking update failed - no data returned");
        }
        // Only update if booking is CONFIRMED (to show in calendar)
        if (saved.status === "CONFIRMED") {
          setItems((prev) =>
            prev.map((i) =>
              i.id === editing.id
                ? {
                    ...i,
                    ...saved,
                    start_time: moment.tz(saved.startDate, "Europe/Belgrade"),
                    end_time: moment.tz(saved.endDate, "Europe/Belgrade"),
                    checkIn: saved.startDate,
                    checkOut: saved.endDate,
                    room:
                      saved.room && typeof saved.room === "object"
                        ? saved.room
                        : i.room,
                    status: saved.status,
                    dealId: saved.dealId, // Ensure dealId is updated
                  }
                : i
            )
          );
        } else {
          // If status changed from CONFIRMED to something else, remove from calendar
          setItems((prev) => prev.filter((i) => i.id !== editing.id));
        }
      } else {
        saved = await apiService.createBooking(booking);
        // Check if saved is false (error case)
        if (!saved || !saved.id) {
          throw new Error("Booking creation failed - no data returned");
        }
        // Bookings are now automatically CONFIRMED, so always add to calendar
        setItems((prev) => [
          ...prev,
          {
            id: saved.id,
            group: saved.roomId,
            title: `${saved.customerFirstName} ${saved.customerLastName}`,
            start_time: moment.tz(saved.startDate, "Europe/Belgrade"),
            end_time: moment.tz(saved.endDate, "Europe/Belgrade"),
            checkIn: saved.startDate,
            checkOut: saved.endDate,
            customerFirstName: saved.customerFirstName,
            customerLastName: saved.customerLastName,
            customerEmail: saved.customerEmail,
            paymentType: saved.paymentType,
            room: saved.room
              ? { roomNumber: saved.room.roomNumber, type: saved.room.type }
              : { roomNumber: "Unknown", type: "—" },
            status: saved.status,
            paymentStatus: saved.paymentStatus,
          },
        ]);
      }

      // Only close modal and refresh if booking was successful
      triggerRefresh();
      setIsModalOpen(false);
      setEditing(null);
      setError("");
      // Refresh data to ensure calendar is up to date
      const results = await Promise.allSettled([
        apiService.getRooms(),
        apiService.getBookings(),
      ]);
      
      if (results[0].status === "fulfilled") {
        setGroups(
          results[0].value
            .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))
            .map((r) => ({
              id: r.id,
              title: `Room ${r.roomNumber}`,
              type: r.type,
            }))
        );
      }
      
      if (results[1].status === "fulfilled") {
        setItems(
          results[1].value
            .filter((b) => b.status === "CONFIRMED")
            .map((b) => ({
              id: b.id,
              group: b.roomId,
              title: `${b.customerFirstName || ""} ${
                b.customerLastName || ""
              }`.trim(),
              start_time: moment.tz(b.startDate, "Europe/Belgrade"),
              end_time: moment.tz(b.endDate, "Europe/Belgrade"),
              customerFirstName: b.customerFirstName,
              customerLastName: b.customerLastName,
              customerEmail: b.customerEmail,
              paymentType: b.paymentType,
              checkIn: b.startDate,
              checkOut: b.endDate,
              room: b.room
                ? { roomNumber: b.room.roomNumber, type: b.room.type }
                : { roomNumber: "Unknown", type: "—" },
              status: b.status,
              paymentStatus: b.paymentStatus,
            }))
        );
      }
    } catch (err) {
      console.error("Failed to save booking", err);
      const errorMessage =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to save booking. Please try again.";
      const nextAvailable = err?.response?.data?.nextAvailable;
      setError(
        nextAvailable ? `${errorMessage} (${nextAvailable})` : errorMessage
      );
      // Don't close modal on error - keep it open so user can see the error and try again
      // setIsModalOpen(false); // Removed - keep modal open on error
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking?"))
      return;
    try {
      await apiService.deleteBooking(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      triggerRefresh();
    } catch (err) {
      console.error("Failed to delete booking", err);
    }
  };

  const filteredItems = showActiveOnly
    ? items.filter((b) => {
        // Don't show COMPLETED bookings in active filter
        if (b.status === "COMPLETED") return false;
        const today = moment.tz("Europe/Belgrade").startOf("day");
        const start = b.start_time.clone().startOf("day");
        const end = b.end_time.clone().startOf("day");
        return (
          today.isSameOrBefore(end, "day") && today.isSameOrAfter(start, "day")
        );
      })
    : items;

  const sortedItems = [...filteredItems].sort((a, b) => {
    const today = moment.tz("Europe/Belgrade").startOf("day");
    const aStart = moment.tz(a.checkIn, "Europe/Belgrade").startOf("day");
    const aEnd = moment.tz(a.checkOut, "Europe/Belgrade").startOf("day");
    const bStart = moment.tz(b.checkIn, "Europe/Belgrade").startOf("day");
    const bEnd = moment.tz(b.checkOut, "Europe/Belgrade").startOf("day");

    const aActive =
      today.isSameOrBefore(aEnd, "day") && today.isSameOrAfter(aStart, "day");
    const bActive =
      today.isSameOrBefore(bEnd, "day") && today.isSameOrAfter(bStart, "day");
    const aCheckedOut = today.isAfter(aEnd, "day");
    const bCheckedOut = today.isAfter(bEnd, "day");

    const rank = (active, checkedOut) => (active ? 0 : checkedOut ? 2 : 1);
    return rank(aActive, aCheckedOut) - rank(bActive, bCheckedOut);
  });

  // Calendar rendering - get days for current view
  const getDaysInView = () => {
    if (viewMode === "week") {
      const start = currentDate.clone().startOf("week");
      return Array.from({ length: 7 }, (_, i) => start.clone().add(i, "days"));
    } else {
      // Month view - show only current week for compactness
      const start = currentDate.clone().startOf("week");
      return Array.from({ length: 7 }, (_, i) => start.clone().add(i, "days"));
    }
  };

  const days = getDaysInView();
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const navigateDate = (direction) => {
    if (viewMode === "week") {
      setCurrentDate(currentDate.clone().add(direction, "weeks"));
    } else {
      setCurrentDate(currentDate.clone().add(direction, "weeks"));
    }
  };

  const goToToday = () => {
    setCurrentDate(moment.tz("Europe/Belgrade"));
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen max-w-full overflow-x-hidden">
      {/* Fixed Header - Always visible */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 sticky top-0 z-20">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-2xl font-semibold">Front Desk</h2>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <label className="flex items-center text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={() => setShowActiveOnly((prev) => !prev)}
                className="mr-2"
              />
              Show only active bookings
            </label>
            <button
              onClick={openCreate}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium whitespace-nowrap"
            >
              + Create Booking
            </button>
          </div>
        </div>

        {/* Calendar Navigation - Compact */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate(-1)}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded transition"
            >
              ←
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded transition text-sm"
            >
              Today
            </button>
            <button
              onClick={() => navigateDate(1)}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded transition"
            >
              →
            </button>
            <h3 className="ml-2 text-base sm:text-lg font-semibold">
              {days[0]?.format("MMM D")} -{" "}
              {days[days.length - 1]?.format("MMM D, YYYY")}
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1 rounded transition text-sm ${
                viewMode === "week"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Legend - Compact */}
      <div className="flex gap-2 mb-4 text-xs sm:text-sm flex-wrap">
        <span className="px-2 py-1 rounded-lg bg-yellow-100 text-yellow-700 font-medium">
          Upcoming
        </span>
        <span className="px-2 py-1 rounded-lg bg-green-100 text-green-700 font-medium">
          Active
        </span>
        <span className="px-2 py-1 rounded-lg bg-red-100 text-red-700 font-medium">
          Due Out Today
        </span>
        <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700 font-medium">
          Checked Out
        </span>
      </div>

      {/* Compact Calendar Grid - Fits in viewport */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="overflow-y-auto max-h-[500px]">
          {/* Header with days - Fixed width columns */}
          <div className="grid grid-cols-[140px_repeat(7,minmax(0,1fr))] border-b bg-gray-50 sticky top-0 z-10">
            <div className="p-2 font-semibold border-r text-sm">Room</div>
            {days.map((dayDate, idx) => {
              const isToday = dayDate.isSame(
                moment.tz("Europe/Belgrade"),
                "day"
              );
              return (
                <div
                  key={idx}
                  className={`p-2 text-center border-r font-semibold text-xs sm:text-sm ${
                    isToday ? "bg-blue-100" : ""
                  }`}
                >
                  <div className="text-gray-500">{weekDays[dayDate.day()]}</div>
                  <div
                    className={`text-sm sm:text-base ${
                      isToday ? "text-blue-600 font-bold" : ""
                    }`}
                  >
                    {dayDate.format("D")}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Room rows - Scrollable vertically only */}
          {groups.map((room) => {
            const roomBookings = filteredItems.filter(
              (item) => item.group === room.id
            );

            return (
              <div
                key={room.id}
                className="grid grid-cols-[140px_repeat(7,minmax(0,1fr))] border-b hover:bg-gray-50 transition"
              >
                <div className="p-2 border-r font-medium bg-gray-50 sticky left-0 z-5 text-xs sm:text-sm">
                  <div className="font-semibold truncate">{room.title}</div>
                  <div className="text-gray-500 text-xs truncate">
                    {room.type}
                  </div>
                </div>
                {days.map((day, dayIdx) => {
                  const isToday = day.isSame(
                    moment.tz("Europe/Belgrade"),
                    "day"
                  );

                  // Get bookings that start on this day
                  const dayStartBookings = roomBookings.filter((booking) => {
                    const start = booking.start_time.clone().startOf("day");
                    return day.isSame(start, "day");
                  });

                  return (
                    <div
                      key={dayIdx}
                      className={`p-1 border-r min-h-[60px] sm:min-h-[80px] relative ${
                        isToday ? "bg-blue-50" : ""
                      }`}
                    >
                      {dayStartBookings.map((booking, bookingIdx) => {
                        const start = booking.start_time.clone().startOf("day");
                        const end = booking.end_time.clone().startOf("day");
                        const span = end.diff(start, "days") + 1;
                        const remainingDays = days.length - dayIdx;
                        const actualSpan = Math.min(span, remainingDays);
                        const bgColor = statusColor(
                          booking.checkIn,
                          booking.checkOut,
                          booking.status
                        );

                        // Calculate width based on remaining days
                        const widthPercent = (actualSpan / 7) * 100;

                        return (
                          <div
                            key={booking.id}
                            onClick={() => openEdit(booking.id)}
                            className="cursor-pointer hover:opacity-80 transition rounded mb-1 text-xs"
                            style={{
                              backgroundColor: bgColor,
                              color: "#fff",
                              borderRadius: "3px",
                              padding: "2px 4px",
                              fontSize: "0.7rem",
                              fontWeight: "500",
                              position: "absolute",
                              left: "2px",
                              top: `${bookingIdx * 20 + 2}px`,
                              width: `calc(${widthPercent}% - 4px)`,
                              zIndex: 1,
                              minWidth: "50px",
                              maxWidth: `calc(${widthPercent}% - 4px)`,
                            }}
                            title={`${booking.title} - ${moment
                              .tz(booking.checkIn, "Europe/Belgrade")
                              .format("MMM D")} to ${moment
                              .tz(booking.checkOut, "Europe/Belgrade")
                              .format("MMM D")} (${span} nights)`}
                          >
                            <div className="truncate font-semibold">
                              {booking.title}
                            </div>
                            <div className="text-xs opacity-90 truncate">
                              {moment
                                .tz(booking.checkIn, "Europe/Belgrade")
                                .format("MMM D")}
                              {span > 1 && "..."}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bookings List - Compact */}
      <div className="bg-white shadow-md rounded-lg p-4 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">Bookings List</h3>

        {["Active", "Upcoming", "Checked Out"].map((status) => {
          const filteredByStatus = sortedItems.filter((b) => {
            const today = moment.tz("Europe/Belgrade").startOf("day");
            const ci = moment.tz(b.checkIn, "Europe/Belgrade").startOf("day");
            const co = moment.tz(b.checkOut, "Europe/Belgrade").startOf("day");

            // COMPLETED bookings should show as checked out
            const isCompleted = b.status === "COMPLETED";

            if (status === "Active")
              return (
                !isCompleted &&
                today.isSameOrBefore(co, "day") &&
                today.isSameOrAfter(ci, "day")
              );
            if (status === "Upcoming")
              return !isCompleted && today.isBefore(ci, "day");
            if (status === "Checked Out")
              return isCompleted || today.isAfter(co, "day");
            return false;
          });

          if (filteredByStatus.length === 0) return null;

          const colorClass =
            status === "Active"
              ? "bg-green-100 text-green-800"
              : status === "Upcoming"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-blue-100 text-blue-800";

          return (
            <div key={status} className="mb-6">
              <h4
                className={`text-sm font-semibold px-3 py-2 rounded ${colorClass}`}
              >
                {status} Bookings ({filteredByStatus.length})
              </h4>
              <div className="overflow-x-auto">
                <table className="table-auto border-collapse text-sm w-full mt-2 min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="p-2 border text-xs">Guest</th>
                      <th className="p-2 border text-xs">Email</th>
                      <th className="p-2 border text-xs">Room</th>
                      <th className="p-2 border text-xs">Check-In</th>
                      <th className="p-2 border text-xs">Check-Out</th>
                      <th className="p-2 border text-xs">Status</th>
                      <th className="p-2 border text-xs">Payment</th>
                      <th className="p-2 border text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredByStatus.map((b) => {
                      const today = moment.tz("Europe/Belgrade").startOf("day");
                      const ci = moment
                        .tz(b.checkIn, "Europe/Belgrade")
                        .startOf("day");
                      const co = moment
                        .tz(b.checkOut, "Europe/Belgrade")
                        .startOf("day");
                      const isCompleted = b.status === "COMPLETED";
                      const isActive =
                        !isCompleted &&
                        today.isSameOrBefore(co, "day") &&
                        today.isSameOrAfter(ci, "day");
                      const isCheckedOut =
                        isCompleted || today.isAfter(co, "day");

                      return (
                        <tr
                          key={b.id}
                          className={`border-b hover:bg-gray-50 transition ${
                            isCheckedOut ? "opacity-70" : ""
                          }`}
                        >
                          <td className="p-2 border whitespace-nowrap text-xs">
                            {b.customerFirstName} {b.customerLastName}
                          </td>
                          <td className="p-2 border whitespace-nowrap text-xs">
                            {b.customerEmail}
                          </td>
                          <td className="p-2 border text-xs">
                            {b.room && typeof b.room === "object"
                              ? `${b.room.roomNumber || "?"} (${
                                  b.room.type || "?"
                                })`
                              : b.room || "—"}
                          </td>
                          <td className="p-2 border whitespace-nowrap text-xs">
                            {moment
                              .tz(b.checkIn, "Europe/Belgrade")
                              .format("MMM D, YYYY")}
                          </td>
                          <td className="p-2 border whitespace-nowrap text-xs">
                            {moment
                              .tz(b.checkOut, "Europe/Belgrade")
                              .format("MMM D, YYYY")}
                          </td>
                          <td className="p-2 border">
                            {isCheckedOut ? (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                Checked Out
                              </span>
                            ) : isActive ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                Upcoming
                              </span>
                            )}
                          </td>
                          <td className="p-2 border text-xs">
                            {b.paymentType || "—"}
                          </td>
                          <td className="p-2 border">
                            <div className="flex gap-1">
                              <button
                                onClick={() => openEdit(b.id)}
                                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(b.id)}
                                className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditing(null);
          setError(""); // Clear error when closing modal
        }}
        onSave={handleSave}
        booking={editing}
        groups={groups}
      />
    </div>
  );
}

export default FrontDesk;
