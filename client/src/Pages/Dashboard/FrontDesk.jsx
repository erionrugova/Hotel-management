// src/Pages/Dashboard/FrontDesk.jsx
import { useEffect, useState } from "react";
import moment from "moment";
import Timeline from "react-calendar-timeline";
import "react-calendar-timeline/dist/style.css";
import BookingModal from "./BookingModal";
import apiService from "../../services/api";

// Utility: color by status
const statusColor = (checkInISO, checkOutISO) => {
  const today = moment().startOf("day");
  const ci = moment(checkInISO);
  const co = moment(checkOutISO);

  if (today.isBefore(ci, "day")) return "#facc15"; // yellow: future booking
  if (today.isSame(co, "day")) return "#ef4444"; // red: due out today
  if (today.isAfter(co, "day")) return "#3b82f6"; // blue: already checked out
  if (today.isBetween(ci, co, "day", "[]")) return "#4ade80"; // green: active
  return "#9ca3af"; // default gray
};

function FrontDesk() {
  const [groups, setGroups] = useState([]); // rooms
  const [items, setItems] = useState([]); // bookings
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Load rooms & bookings
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsRes, bookingsRes] = await Promise.all([
          apiService.getRooms(),
          apiService.getBookings(),
        ]);

        // Rooms -> timeline groups
        setGroups(
          roomsRes.map((r) => ({
            id: r.id,
            title: `Room ${r.roomNumber}`,
          }))
        );

        // Bookings -> timeline items
        setItems(
          bookingsRes.map((b) => ({
            id: b.id,
            group: b.roomId,
            title: `${b.customerFirstName || ""} ${
              b.customerLastName || ""
            }`.trim(),
            start_time: moment(b.startDate),
            end_time: moment(b.endDate),
            customerFirstName: b.customerFirstName,
            customerLastName: b.customerLastName,
            customerEmail: b.customerEmail,
            paymentType: b.paymentType,
            checkIn: b.startDate,
            checkOut: b.endDate,
            room: b.room.roomNumber,
            itemProps: {
              style: {
                background: statusColor(b.startDate, b.endDate),
                color: "#fff",
                borderRadius: 6,
                textAlign: "center",
              },
            },
          }))
        );
      } catch (err) {
        console.error("Failed to load front desk data", err);
      }
    };

    fetchData();
  }, []);

  // Modal open
  const openCreate = () => {
    setEditing(null);
    setIsModalOpen(true);
  };

  const openEdit = (id) => {
    const found = items.find((b) => b.id === id);
    if (found) {
      setEditing(found);
      setIsModalOpen(true);
    }
  };

  // Save booking (create or update)
  const handleSave = async (booking) => {
    try {
      let saved;
      if (editing) {
        saved = await apiService.updateBooking(editing.id, booking);
        setItems((prev) =>
          prev.map((i) => (i.id === editing.id ? { ...i, ...saved } : i))
        );
      } else {
        saved = await apiService.createBooking(booking);
        setItems((prev) => [
          ...prev,
          {
            id: saved.id,
            group: saved.roomId,
            title: `${saved.customerFirstName} ${saved.customerLastName}`,
            start_time: moment(saved.startDate),
            end_time: moment(saved.endDate),
            customerFirstName: saved.customerFirstName,
            customerLastName: saved.customerLastName,
            customerEmail: saved.customerEmail,
            paymentType: saved.paymentType,
            checkIn: saved.startDate,
            checkOut: saved.endDate,
            room: saved.room.roomNumber,
            itemProps: {
              style: {
                background: statusColor(saved.startDate, saved.endDate),
                color: "#fff",
                borderRadius: 6,
                textAlign: "center",
              },
            },
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to save booking", err);
    }
    setIsModalOpen(false);
    setEditing(null);
  };

  // Delete booking
  const handleDelete = async (id) => {
    try {
      await apiService.deleteBooking(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Failed to delete booking", err);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Front Desk</h2>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white"
        >
          Create booking
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-4 text-sm">
        <span className="px-3 py-1 rounded-lg bg-yellow-100 text-yellow-700">
          Due in
        </span>
        <span className="px-3 py-1 rounded-lg bg-green-100 text-green-700">
          Checked in
        </span>
        <span className="px-3 py-1 rounded-lg bg-red-100 text-red-700">
          Due out
        </span>
        <span className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700">
          Checked out
        </span>
      </div>

      {/* Timeline */}
      <div className="mb-8">
        <Timeline
          groups={groups}
          items={items}
          defaultTimeStart={moment().add(-1, "month")}
          defaultTimeEnd={moment().add(1, "month")}
          lineHeight={48}
          itemHeightRatio={0.85}
          onItemClick={(itemId) => openEdit(itemId)}
        />
      </div>

      {/* Bookings List */}
      <div className="bg-white shadow-md rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Bookings List</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Guest</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Room</th>
              <th className="p-2 border">Check-In</th>
              <th className="p-2 border">Check-Out</th>
              <th className="p-2 border">Payment</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center p-3 text-gray-500">
                  No bookings found.
                </td>
              </tr>
            )}
            {items.map((b) => (
              <tr key={b.id} className="border-b hover:bg-gray-50">
                <td className="p-2 border">
                  {b.customerFirstName} {b.customerLastName}
                </td>
                <td className="p-2 border">{b.customerEmail}</td>
                <td className="p-2 border">{b.room}</td>
                <td className="p-2 border">
                  {moment(b.checkIn).format("YYYY-MM-DD")}
                </td>
                <td className="p-2 border">
                  {moment(b.checkOut).format("YYYY-MM-DD")}
                </td>
                <td className="p-2 border">{b.paymentType}</td>
                <td className="p-2 border">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(b.id)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
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

      {/* Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        booking={editing}
        groups={groups}
      />
    </div>
  );
}

export default FrontDesk;
