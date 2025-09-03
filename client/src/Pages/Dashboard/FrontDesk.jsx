import { useEffect, useMemo, useState } from "react";
import moment from "moment";
import Timeline from "react-calendar-timeline";
import "react-calendar-timeline/dist/style.css";
import BookingModal from "./BookingModal";

// Utility: color by status
const statusColor = (checkInISO, checkOutISO) => {
  const today = moment().startOf("day");
  const ci = moment(checkInISO);
  const co = moment(checkOutISO);

  if (today.isBefore(ci, "day")) return "#facc15"; // yellow: due in
  if (today.isSame(co, "day")) return "#ef4444"; // red: due out
  if (today.isAfter(co, "day")) return "#3b82f6"; // blue: checked out
  if (today.isBetween(ci, co, "day", "[]")) return "#4ade80"; // green: checked in
  return "#4ade80";
};

function FrontDesk() {
  // Rooms (groups)
  const groups = useMemo(
    () => [
      { id: 1, title: "Room 001" },
      { id: 2, title: "Room 002" },
      { id: 3, title: "Room 003" },
      { id: 4, title: "Room 004" },
      { id: 5, title: "Room 005" },
    ],
    []
  );

  // Bookings (items) from localStorage
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("bookings");
    return saved ? JSON.parse(saved) : [];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Persist whenever items change
  useEffect(() => {
    localStorage.setItem("bookings", JSON.stringify(items));
  }, [items]);

  // Build timeline items with styles
  const timelineItems = useMemo(
    () =>
      items.map((b) => ({
        id: b.id,
        group: b.group, // must match groups[].id
        title: b.guestName,
        start_time: moment(b.checkIn),
        end_time: moment(b.checkOut),
        itemProps: {
          style: {
            background: statusColor(b.checkIn, b.checkOut),
            color: "#fff",
            borderRadius: 6,
            textAlign: "center",
          },
        },
      })),
    [items]
  );

  // Create
  const openCreate = () => {
    setEditing(null);
    setIsModalOpen(true);
  };

  // Edit
  const openEdit = (id) => {
    const found = items.find((b) => b.id === id);
    if (found) {
      setEditing(found);
      setIsModalOpen(true);
    }
  };

  // Save (create or update)
  const handleSave = (booking) => {
    if (booking.id && items.some((b) => b.id === booking.id)) {
      // update existing
      setItems((prev) =>
        prev.map((item) => (item.id === booking.id ? booking : item))
      );
    } else {
      // create new
      const newBooking = {
        ...booking,
        id: Date.now(), // unique id
      };
      setItems((prev) => [...prev, newBooking]);
    }
    setIsModalOpen(false); // close modal after save
  };

  // Delete
  const handleDelete = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
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
      <div>
        <Timeline
          groups={groups}
          items={timelineItems}
          defaultTimeStart={moment().add(-1, "month")}
          defaultTimeEnd={moment().add(1, "month")}
          lineHeight={48}
          itemHeightRatio={0.85}
          onItemClick={(itemId) => openEdit(itemId)}
        />
      </div>

      {/* Bookings List with Edit/Delete */}
      <div className="mt-8 bg-white shadow-md rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Bookings List</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Guest</th>
              <th className="p-2 border">Room</th>
              <th className="p-2 border">Check-In</th>
              <th className="p-2 border">Check-Out</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td className="p-3 border text-gray-500" colSpan={5}>
                  No bookings yet.
                </td>
              </tr>
            )}
            {items.map((b) => (
              <tr key={b.id} className="border-b hover:bg-gray-50">
                <td className="p-2 border">{b.guestName}</td>
                <td className="p-2 border">
                  {groups.find((g) => g.id === b.group)?.title ||
                    `Room ${b.group}`}
                </td>
                <td className="p-2 border">
                  {moment(b.checkIn).format("YYYY-MM-DD")}
                </td>
                <td className="p-2 border">
                  {moment(b.checkOut).format("YYYY-MM-DD")}
                </td>
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
