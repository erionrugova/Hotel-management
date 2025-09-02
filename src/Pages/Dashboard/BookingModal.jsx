import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

function BookingModal({ isOpen, onClose, onSave, booking, groups = [] }) {
  const [formData, setFormData] = useState({
    guestName: "",
    room: "",
    checkIn: "",
    checkOut: "",
  });

  // Prefill for edit, reset for create
  useEffect(() => {
    if (!isOpen) return;
    if (booking) {
      setFormData({
        guestName: booking.guestName || "",
        room: String(booking.group ?? booking.room ?? ""),
        checkIn: booking.checkIn
          ? new Date(booking.checkIn).toISOString().slice(0, 10)
          : "",
        checkOut: booking.checkOut
          ? new Date(booking.checkOut).toISOString().slice(0, 10)
          : "",
      });
    } else {
      setFormData({ guestName: "", room: "", checkIn: "", checkOut: "" });
    }
  }, [isOpen, booking]);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      id: booking?.id ?? Date.now(),
      guestName: formData.guestName.trim(),
      group: Number(formData.room),
      checkIn: new Date(formData.checkIn).toISOString(),
      checkOut: new Date(formData.checkOut).toISOString(),
    };
    onSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      style={{ zIndex: 9999 }}
    >
      <div
        className="bg-white rounded-xl shadow-xl p-6 w-[420px] max-w-[90vw]"
        style={{ zIndex: 10000 }}
      >
        <h3 className="text-xl font-semibold mb-4">
          {booking ? "Edit Booking" : "Create Booking"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Guest name</label>
            <input
              type="text"
              name="guestName"
              value={formData.guestName}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Room</label>
            <select
              name="room"
              value={formData.room}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
              required
            >
              <option value="">Select room</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Check-in</label>
              <input
                type="date"
                name="checkIn"
                value={formData.checkIn}
                onChange={handleChange}
                className="w-full border rounded-lg p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Check-out
              </label>
              <input
                type="date"
                name="checkOut"
                value={formData.checkOut}
                onChange={handleChange}
                className="w-full border rounded-lg p-2"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white"
            >
              {booking ? "Save changes" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default BookingModal;
