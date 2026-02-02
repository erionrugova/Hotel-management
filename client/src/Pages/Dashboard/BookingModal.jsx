import { useEffect, useState } from "react";
import moment from "moment";
import apiService from "../../services/api";

function BookingModal({ isOpen, onClose, onSave, booking, groups }) {
  const [form, setForm] = useState({
    roomId: "",
    customerFirstName: "",
    customerLastName: "",
    customerEmail: "",
    paymentType: "",
    startDate: "",
    endDate: "",
    dealId: "",
  });

  const [deals, setDeals] = useState([]);
  const [roomRate, setRoomRate] = useState(0);
  const [nights, setNights] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);

  useEffect(() => {
    if (booking) {
      setForm({
        roomId: booking.group || booking.roomId || "",
        customerFirstName: booking.customerFirstName || "",
        customerLastName: booking.customerLastName || "",
        customerEmail: booking.customerEmail || "",
        paymentType: booking.paymentType || "",
        startDate: moment(booking.start_time || booking.checkIn).format(
          "YYYY-MM-DD"
        ),
        endDate: moment(booking.end_time || booking.checkOut).format(
          "YYYY-MM-DD"
        ),
        dealId: booking.dealId || "",
      });
    } else {
      setForm({
        roomId: "",
        customerFirstName: "",
        customerLastName: "",
        customerEmail: "",
        paymentType: "",
        startDate: "",
        endDate: "",
        dealId: "",
      });
      setRoomRate(0);
      setNights(0);
      setFinalPrice(0);
    }
  }, [booking]);

  useEffect(() => {
    const fetchRoomRate = async () => {
      if (form.roomId) {
        try {
          const room = await apiService.getRoom(form.roomId);
          const numericRate = parseFloat(room.price) || 0;
          setRoomRate(numericRate);
        } catch (err) {
          console.error("Failed to fetch room rate:", err);
          setRoomRate(0);
        }
      } else {
        setRoomRate(0);
      }
    };
    fetchRoomRate();
  }, [form.roomId]);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const allDeals = await apiService.getDeals();
        const activeDeals = allDeals.filter((d) => d.status === "ONGOING");
        setDeals(activeDeals);
      } catch (err) {
        console.error("Failed to load deals:", err);
      }
    };
    fetchDeals();
  }, []);

  useEffect(() => {
    if (form.startDate && form.endDate && roomRate > 0) {
      const start = moment(form.startDate);
      const end = moment(form.endDate);
      const diff = end.diff(start, "days");
      const validNights = diff > 0 ? diff : 0;

      let total = validNights * roomRate;

      const selectedDeal = deals.find((d) => d.id === parseInt(form.dealId));
      if (selectedDeal && selectedDeal.discount > 0) {
        total -= (total * selectedDeal.discount) / 100;
      }

      setNights(validNights);
      setFinalPrice(total);
    } else {
      setNights(0);
      setFinalPrice(0);
    }
  }, [form.startDate, form.endDate, roomRate, form.dealId, deals]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate dates
    if (form.startDate && form.endDate) {
      const start = moment(form.startDate);
      const end = moment(form.endDate);
      if (end.isSameOrBefore(start)) {
        alert("Check-out date must be after check-in date.");
        return;
      }
    }
    
    onSave(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-lg animate-fadeIn text-slate-100 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 text-white">
          {booking ? "Edit Booking" : "New Booking"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Room
            </label>
            <select
              value={form.roomId}
              onChange={(e) => setForm({ ...form, roomId: e.target.value })}
              required
              className="bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 w-full focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Select room</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Deal (optional)
            </label>
            <select
              value={form.dealId}
              onChange={(e) => setForm({ ...form, dealId: e.target.value })}
              className="bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 w-full focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">No deal</option>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.discount}% off
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={form.customerFirstName}
                onChange={(e) =>
                  setForm({ ...form, customerFirstName: e.target.value })
                }
                className="bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 w-full focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={form.customerLastName}
                onChange={(e) =>
                  setForm({ ...form, customerLastName: e.target.value })
                }
                className="bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 w-full focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={form.customerEmail}
              onChange={(e) =>
                setForm({ ...form, customerEmail: e.target.value })
              }
              className="bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 w-full focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Check-In
              </label>
              <input
                type="date"
                value={form.startDate}
                min={moment().format("YYYY-MM-DD")}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                required
                className="bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 w-full focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Check-Out
              </label>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate || moment().format("YYYY-MM-DD")}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
                className="bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 w-full focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          {form.startDate && form.endDate && moment(form.endDate).isSameOrBefore(moment(form.startDate)) && (
            <div className="bg-red-900/30 text-red-400 border border-red-800 px-4 py-2 rounded text-sm">
              Check-out date must be after check-in date.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Payment Type
            </label>
            <select
              value={form.paymentType}
              onChange={(e) =>
                setForm({ ...form, paymentType: e.target.value })
              }
              className="bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 w-full focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Select</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="ONLINE">Online</option>
            </select>
          </div>

          {Number(roomRate) > 0 && (
            <div className="p-3 mt-2 bg-slate-800/50 rounded-md border border-slate-700 text-sm text-slate-300">
              <p>
                <b>Rate:</b> ${Number(roomRate).toFixed(2)} / night
              </p>
              <p>
                <b>Nights:</b> {nights}
              </p>
              <p className="text-indigo-400 font-semibold mt-1">
                Total: ${Number(finalPrice).toFixed(2)}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20"
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
