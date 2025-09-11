// src/Pages/Dashboard/BookingModal.jsx
import { useState, useEffect } from "react";

function BookingModal({ isOpen, onClose, onSave, booking, groups }) {
  const [form, setForm] = useState({
    roomId: "",
    startDate: "",
    endDate: "",
    customerFirstName: "",
    customerLastName: "",
    customerEmail: "",
    paymentType: "CARD",
  });

  useEffect(() => {
    if (booking) {
      setForm({
        roomId: booking.group,
        startDate: booking.checkIn?.slice(0, 10),
        endDate: booking.checkOut?.slice(0, 10),
        customerFirstName: booking.customerFirstName || "",
        customerLastName: booking.customerLastName || "",
        customerEmail: booking.customerEmail || "",
        paymentType: booking.paymentType || "CARD",
      });
    }
  }, [booking]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          {booking ? "Edit Booking" : "Create Booking"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room Select */}
          <div>
            <label className="block text-sm font-medium">Room</label>
            <select
              name="roomId"
              value={form.roomId}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
              required
            >
              <option value="">Select a room</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Check-in</label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                className="mt-1 block w-full border rounded p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Check-out</label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                className="mt-1 block w-full border rounded p-2"
                required
              />
            </div>
          </div>

          {/* Guest Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">First Name</label>
              <input
                type="text"
                name="customerFirstName"
                value={form.customerFirstName}
                onChange={handleChange}
                className="mt-1 block w-full border rounded p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Last Name</label>
              <input
                type="text"
                name="customerLastName"
                value={form.customerLastName}
                onChange={handleChange}
                className="mt-1 block w-full border rounded p-2"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              name="customerEmail"
              value={form.customerEmail}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
              required
            />
          </div>

          {/* Payment */}
          <div>
            <label className="block text-sm font-medium">Payment Type</label>
            <select
              name="paymentType"
              value={form.paymentType}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
            >
              <option value="CARD">Card</option>
              <option value="CASH">Cash</option>
              <option value="PAYPAL">PayPal</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingModal;
