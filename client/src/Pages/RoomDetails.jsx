// src/Pages/RoomDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import apiService from "../services/api";

// fallback images per type (keep your style)
import photo1 from "../Images/albert-vincent-wu-fupf3-xAUqw-unsplash.jpg";
import photo2 from "../Images/adam-winger-VGs8z60yT2c-unsplash.jpg";
import photo3 from "../Images/room3.jpg";
import photo6 from "../Images/natalia-gusakova-EYoK3eVKIiQ-unsplash.jpg";

const fallbackByType = {
  SINGLE: photo1,
  DOUBLE: photo6,
  SUITE: photo3,
  DELUXE: photo2,
};
const getFallback = (type) => fallbackByType[type] || photo1;

function RoomDetails() {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [form, setForm] = useState({
    customerFirstName: "",
    customerLastName: "",
    customerEmail: "",
    paymentType: "",
    startDate: "",
    endDate: "",
  });

  const todayISO = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiService.getRoom(id);
        const amenities = Array.isArray(data?.features)
          ? data.features.map((f) => f?.feature?.name).filter(Boolean)
          : data?.amenities || [];
        setRoom({ ...data, amenities });
      } catch {
        setMsg({ type: "error", text: "Room details not found." });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const validateForm = () => {
    if (!form.startDate || !form.endDate) {
      setMsg({ type: "error", text: "Please select start and end dates." });
      return false;
    }
    if (form.startDate < todayISO) {
      setMsg({ type: "error", text: "Start date must be in the future." });
      return false;
    }
    if (form.endDate <= form.startDate) {
      setMsg({ type: "error", text: "End date must be after start date." });
      return false;
    }
    if (
      !form.customerFirstName ||
      !form.customerLastName ||
      !form.customerEmail
    ) {
      setMsg({ type: "error", text: "Please fill in your name and email." });
      return false;
    }
    if (!form.paymentType) {
      setMsg({ type: "error", text: "Please select a payment method." });
      return false;
    }
    return true;
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    if (!validateForm()) return;

    try {
      await apiService.createBooking({
        roomId: Number(id),
        startDate: form.startDate,
        endDate: form.endDate,
        customerFirstName: form.customerFirstName,
        customerLastName: form.customerLastName,
        customerEmail: form.customerEmail,
        paymentType: form.paymentType, // CARD / CASH / PAYPAL
      });

      setMsg({ type: "success", text: "Booking successful!" });
      setShowForm(false);
      setForm({
        customerFirstName: "",
        customerLastName: "",
        customerEmail: "",
        paymentType: "",
        startDate: "",
        endDate: "",
      });
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Booking failed." });
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-20">
        <p className="text-2xl font-semibold text-gray-700">
          Loading room details...
        </p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="text-center mt-20">
        <p className="text-2xl font-semibold text-gray-700">
          Room details not found.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto space-y-16 p-8 md:p-16 lg:p-24">
        <div className="flex flex-col md:flex-row gap-20">
          <img
            src={room.image || getFallback(room.type)}
            alt={`${room.type} ${room.roomNumber}`}
            className="w-full md:w-1/2 h-auto rounded shadow-md"
            onError={(e) => {
              e.currentTarget.src = getFallback(room.type);
            }}
          />
          <div>
            <h1 className="text-3xl font-bold mb-4">
              {room.type?.replace("_", " ")} — Room {room.roomNumber}
            </h1>
            <p className="text-gray-700 mb-4">
              {room.description || "No description available."}
            </p>
            <p className="text-2xl font-semibold mb-6 text-[#C5A880]">
              ${room.price}/night
            </p>

            {room.amenities && room.amenities.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mb-2">Amenities:</h3>
                <ul className="list-disc list-inside text-gray-600">
                  {room.amenities.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </>
            )}

            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="mt-6 inline-block bg-[#C5A880] text-[#1F1F1F] px-4 py-2 rounded hover:bg-[#B9965D] transition duration-300"
              >
                Book Now
              </button>
            ) : (
              <form
                onSubmit={submitBooking}
                className="mt-6 bg-white border rounded-md p-4 space-y-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="customerFirstName"
                    placeholder="First Name"
                    value={form.customerFirstName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B89B5E]"
                    required
                  />
                  <input
                    type="text"
                    name="customerLastName"
                    placeholder="Last Name"
                    value={form.customerLastName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B89B5E]"
                    required
                  />
                </div>

                <input
                  type="email"
                  name="customerEmail"
                  placeholder="Email"
                  value={form.customerEmail}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B89B5E]"
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    min={todayISO}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B89B5E]"
                    required
                  />
                  <input
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    min={form.startDate || todayISO}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B89B5E]"
                    required
                  />
                </div>

                <select
                  name="paymentType"
                  value={form.paymentType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B89B5E]"
                  required
                >
                  <option value="">Select Payment Type</option>
                  <option value="CARD">Card</option>
                  <option value="CASH">Cash</option>
                  <option value="PAYPAL">PayPal</option>
                </select>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="inline-block bg-[#C5A880] text-[#1F1F1F] px-4 py-2 rounded hover:bg-[#B9965D] transition duration-300"
                  >
                    Confirm Booking
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="inline-block bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {msg.text && (
              <p
                className={`mt-3 text-sm ${
                  msg.type === "error" ? "text-red-600" : "text-green-700"
                }`}
              >
                {msg.text}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default RoomDetails;
