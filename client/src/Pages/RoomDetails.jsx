import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import apiService from "../services/api";
import { useUser } from "../UserContext";
import { GoogleLogin } from "@react-oauth/google";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";

import photo1 from "../Images/albert-vincent-wu-fupf3-xAUqw-unsplash.jpg";
import photo2 from "../Images/adam-winger-VGs8z60yT2c-unsplash.jpg";
import photo3 from "../Images/room3.jpg";
import photo6 from "../Images/natalia-gusakova-EYoK3eVKIiQ-unsplash.jpg";

import {
  Wifi,
  Tv,
  AirVent,
  Bath,
  Briefcase,
  Sun,
  Droplet,
  ShowerHead,
  Snowflake,
  Wine,
  ConciergeBell,
  Waves,
} from "lucide-react";

const fallbackByType = {
  SINGLE: photo1,
  DOUBLE: photo6,
  SUITE: photo3,
  DELUXE: photo2,
};
const getFallback = (type) => fallbackByType[type] || photo1;

const featureIcons = {
  wifi: Wifi,
  tv: Tv,
  ac: AirVent,
  "a/c": AirVent,
  aircon: Snowflake,
  "air conditioner": Snowflake,
  "air conditioning": Snowflake,
  minibar: Wine,
  "mini bar": Wine,
  "room service": ConciergeBell,
  "sea view": Waves,
  bathtub: Bath,
  water: Droplet,
  workspace: Briefcase,
  balcony: Sun,
  shower: ShowerHead,
};

function RoomDetails() {
  const { id } = useParams();
  const { user, refreshKey } = useUser();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [deals, setDeals] = useState([]);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [finalPrice, setFinalPrice] = useState(null);
  const [availabilityCount, setAvailabilityCount] = useState(null);
  const [nextAvailableDate, setNextAvailableDate] = useState(null);
  const bookingFormRef = useRef(null);

  const [form, setForm] = useState({
    customerFirstName: "",
    customerLastName: "",
    customerEmail: "",
    paymentType: "",
    startDate: "",
    endDate: "",
    dealId: "",
  });

  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    cardExpiry: "",
    cardCVV: "",
    cardName: "",
    paypalEmail: "",
  });

  const todayISO = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const load = async () => {
      const roomId = parseInt(id, 10);
      if (isNaN(roomId)) {
        setMsg({ type: "error", text: "Invalid room ID." });
        setLoading(false);
        return;
      }

      try {
        const data = await apiService.getRoom(roomId);
        const dealData = await apiService.getDeals();

        const amenities = Array.isArray(data?.features)
          ? data.features
              .map((f) => f?.feature?.name?.toLowerCase())
              .filter(Boolean)
          : [];

        setRoom({ ...data, amenities });
        setDeals(
          dealData.filter(
            (d) =>
              d.status === "ONGOING" &&
              (d.roomType === "ALL" || d.roomType === data.type)
          )
        );
      } catch (err) {
        console.error("❌ Error fetching room:", err);
        setMsg({ type: "error", text: "Room details not found." });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, refreshKey]);

  const recalcPrice = (formData, dealId) => {
    if (!room?.price || !formData.startDate || !formData.endDate) return;

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end <= start) return setFinalPrice(null);

    const msPerDay = 1000 * 60 * 60 * 24;
    const nights = Math.ceil((end - start) / msPerDay);
    let nightlyRate = parseFloat(room.price);

    if (dealId) {
      const deal = deals.find((d) => d.id === parseInt(dealId, 10));
      if (deal) nightlyRate = nightlyRate - (nightlyRate * deal.discount) / 100;
    }

    setFinalPrice((nightlyRate * nights).toFixed(2));
  };

  const checkAvailability = async (startDate, endDate) => {
    if (!room?.type || !startDate || !endDate) return;

    try {
      const res = await apiService.getRooms({
        type: room.type,
        startDate,
        endDate,
      });
      setAvailabilityCount(res.length);

      // Reset next available date when new check is made
      setNextAvailableDate(null);
      if (res.length === 0) {
        // Try to get next available date via backend booking route
        const bookingsRes = await apiService
          .createBooking({
            roomId: Number(id),
            startDate,
            endDate,
            customerFirstName: "temp",
            customerLastName: "temp",
            customerEmail: "temp@email.com",
            paymentType: "CASH",
          })
          .catch((err) => {
            // if backend returns nextAvailable, capture it
            const msg = err?.response?.data?.nextAvailable;
            if (msg && msg.includes("from")) {
              const next = msg.replace("Next available from ", "");
              setNextAvailableDate(next);
            }
          });
      }
    } catch (err) {
      console.error("❌ Error checking availability:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...form, [name]: value };
    setForm(updatedForm);
    if (["startDate", "endDate"].includes(name)) {
      recalcPrice(updatedForm, selectedDeal);
      checkAvailability(updatedForm.startDate, updatedForm.endDate);
    }
  };

  // Format card number with spaces (e.g., "1234 5678 9012 3456")
  const formatCardNumber = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");
    // Limit to 16 digits
    const limited = digits.slice(0, 16);
    // Add space every 4 digits
    return limited.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  // Format expiry date with automatic "/" (e.g., "12/25")
  const formatExpiry = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");
    // Limit to 4 digits
    const limited = digits.slice(0, 4);
    // Add "/" after 2 digits
    if (limited.length >= 2) {
      return limited.slice(0, 2) + "/" + limited.slice(2);
    }
    return limited;
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number
    if (name === "cardNumber") {
      formattedValue = formatCardNumber(value);
    }
    // Format expiry date
    else if (name === "cardExpiry") {
      formattedValue = formatExpiry(value);
    }
    // Only allow digits for CVV
    else if (name === "cardCVV") {
      formattedValue = value.replace(/\D/g, "").slice(0, 4);
    }

    setPaymentDetails((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const handleDealChange = (e) => {
    const dealId = e.target.value;
    setSelectedDeal(dealId || null);
    const updatedForm = { ...form, dealId };
    setForm(updatedForm);
    recalcPrice(updatedForm, dealId);
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    // Validate dates
    if (form.startDate && form.endDate) {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      if (end <= start) {
        setMsg({ type: "error", text: "Check-out date must be after check-in date." });
        return;
      }
    }

    // Validate payment details if card or paypal
    if (form.paymentType === "CARD") {
      if (!paymentDetails.cardNumber || !paymentDetails.cardExpiry || !paymentDetails.cardCVV || !paymentDetails.cardName) {
        setMsg({ type: "error", text: "Please fill in all card payment details." });
        return;
      }
      // Basic card number validation (should be exactly 16 digits)
      const cardNumberDigits = paymentDetails.cardNumber.replace(/\s/g, "");
      if (cardNumberDigits.length !== 16 || !/^\d{16}$/.test(cardNumberDigits)) {
        setMsg({ type: "error", text: "Please enter a valid 16-digit card number." });
        return;
      }
      // Basic expiry validation (MM/YY format)
      if (!/^\d{2}\/\d{2}$/.test(paymentDetails.cardExpiry)) {
        setMsg({ type: "error", text: "Please enter expiry date in MM/YY format." });
        return;
      }
      // CVV validation (3-4 digits)
      if (!/^\d{3,4}$/.test(paymentDetails.cardCVV)) {
        setMsg({ type: "error", text: "Please enter a valid CVV (3-4 digits)." });
        return;
      }
    } else if (form.paymentType === "PAYPAL") {
      if (!paymentDetails.paypalEmail || !/\S+@\S+\.\S+/.test(paymentDetails.paypalEmail)) {
        setMsg({ type: "error", text: "Please enter a valid PayPal email address." });
        return;
      }
    }

    try {
      await apiService.createBooking({
        roomId: Number(id),
        ...form,
        dealId: selectedDeal ? Number(selectedDeal) : null,
        finalPrice: finalPrice ? Number(finalPrice) : room.price,
      });

      setMsg({ type: "success", text: "Booking successful!" });
      
      // Scroll to the booking form to show success message
      if (bookingFormRef.current) {
        bookingFormRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      
      // Reset form after a delay to show success message
      setTimeout(() => {
        setShowForm(false);
        setForm({
          customerFirstName: "",
          customerLastName: "",
          customerEmail: "",
          paymentType: "",
          startDate: "",
          endDate: "",
          dealId: "",
        });
        setPaymentDetails({
          cardNumber: "",
          cardExpiry: "",
          cardCVV: "",
          cardName: "",
          paypalEmail: "",
        });
        setSelectedDeal(null);
        setFinalPrice(null);
        setAvailabilityCount(null);
        setNextAvailableDate(null);
      }, 3000);
    } catch (err) {
      console.error("❌ Booking error:", err);
      const nextAvail = err?.response?.data?.nextAvailable;
      if (nextAvail)
        setMsg({
          type: "error",
          text: `${err.response.data.error} (${nextAvail})`,
        });
      else
        setMsg({
          type: "error",
          text: "Booking failed. Please try again later.",
        });
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const result = await apiService.googleLogin(
        credentialResponse.credential
      );
      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
      window.location.reload();
    } catch {
      setMsg({ type: "error", text: "Google login failed." });
    }
  };

  const getImageUrl = (imgPath, type) => {
    if (imgPath?.startsWith("/uploads")) {
      return `http://localhost:3000${imgPath}`;
    }
    return imgPath || getFallback(type);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <motion.div
          className="w-12 h-12 border-4 border-[#C5A880] border-t-transparent rounded-full animate-spin"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      </div>
    );

  if (msg.type === "error" && !room)
    return (
      <div className="text-center mt-20">
        <p className="text-2xl font-semibold text-red-600">{msg.text}</p>
      </div>
    );

  if (!room)
    return (
      <div className="text-center mt-20">
        <p className="text-2xl font-semibold text-gray-700">Room not found.</p>
      </div>
    );

  const renderAvailabilityMessage = () => {
    if (availabilityCount === null) return null;
    if (availabilityCount === 0)
      return (
        <div className="mt-2">
          <p className="text-red-600 font-semibold">
            ❌ Fully booked for selected dates
          </p>
          {nextAvailableDate && (
            <p className="text-sm text-gray-600">
              📅 Next available from{" "}
              <span className="font-semibold text-[#B9965D]">
                {nextAvailableDate}
              </span>
            </p>
          )}
        </div>
      );
    if (availabilityCount === 1)
      return (
        <p className="text-red-500 font-semibold mt-2">🔥 Only 1 room left!</p>
      );
    if (availabilityCount === 2)
      return (
        <p className="text-orange-500 font-semibold mt-2">
          ⚠️ Only 2 rooms left!
        </p>
      );
    return (
      <p className="text-green-600 font-medium mt-2">
        ✅ {availabilityCount} rooms available
      </p>
    );
  };

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-[#F8F6F1]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <main className="flex-1 container mx-auto px-6 md:px-16 lg:px-24 py-16 space-y-20">
        <motion.div
          className="flex flex-col md:flex-row gap-14"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.img
            src={getImageUrl(room.imageUrl, room.type)}
            alt={`${room.type} ${room.roomNumber}`}
            className="w-full md:w-1/2 h-auto rounded-2xl shadow-2xl object-cover"
            whileHover={{ scale: 1.03 }}
            onError={(e) => (e.currentTarget.src = getFallback(room.type))}
          />

          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-3 text-[#B89B5E]">
              {room.type?.replace("_", " ")} — Room {room.roomNumber}
            </h1>
            <p className="text-gray-700 leading-relaxed mb-6">
              {room.description}
            </p>
            <p className="text-3xl font-semibold mb-2 text-[#C5A880]">
              ${room.price}/night
            </p>
            {renderAvailabilityMessage()}

            {room.amenities?.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white/70 p-6 rounded-lg shadow-md mt-6"
              >
                <h2 className="text-lg font-semibold mb-4 text-[#B89B5E]">
                  Room Features
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {room.amenities.map((f, i) => {
                    const Icon = featureIcons[f] || null;
                    return (
                      <motion.div
                        key={i}
                        className="flex items-center gap-2 text-gray-700"
                        whileHover={{ scale: 1.05 }}
                      >
                        {Icon && <Icon className="w-5 h-5 text-[#C5A880]" />}
                        <span className="capitalize">{f}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {!user ? (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-8 bg-yellow-50 border border-yellow-300 p-6 rounded-md"
                >
                  <p className="text-lg font-semibold mb-6 text-yellow-800 text-center">
                    ⚠️ You need to be logged in to book this room.
                  </p>
                  <div className="flex flex-col items-center gap-4">
                    <button
                      onClick={() => (window.location.href = "/login")}
                      className="bg-[#C5A880] text-white w-56 py-2 rounded-md font-medium hover:bg-[#a0854d] transition"
                    >
                      Log in with Username
                    </button>
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() =>
                        setMsg({ type: "error", text: "Google login failed." })
                      }
                    />
                  </div>
                </motion.div>
              ) : !showForm ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowForm(true)}
                  className="mt-8 inline-block bg-[#C5A880] text-[#1F1F1F] px-6 py-3 rounded-lg hover:bg-[#B9965D] transition duration-300 shadow-md"
                >
                  Book Now
                </motion.button>
              ) : (
                <motion.form
                  ref={bookingFormRef}
                  onSubmit={submitBooking}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-8 bg-white border rounded-lg p-6 shadow-md space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      name="customerFirstName"
                      placeholder="First Name"
                      value={form.customerFirstName}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="text"
                      name="customerLastName"
                      placeholder="Last Name"
                      value={form.customerLastName}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <input
                    type="email"
                    name="customerEmail"
                    placeholder="Email"
                    value={form.customerEmail}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <input
                        type="date"
                        name="startDate"
                        value={form.startDate}
                        min={todayISO}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <input
                        type="date"
                        name="endDate"
                        value={form.endDate}
                        min={form.startDate || todayISO}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      {form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate) && (
                        <p className="text-red-600 text-sm mt-1">Check-out must be after check-in date</p>
                      )}
                    </div>
                  </div>
                  <select
                    name="paymentType"
                    value={form.paymentType}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Payment Type</option>
                    <option value="CARD">Card</option>
                    <option value="CASH">Cash</option>
                    <option value="PAYPAL">PayPal</option>
                  </select>

                  {/* Payment Form - Card */}
                  <AnimatePresence>
                    {form.paymentType === "CARD" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200"
                      >
                        <h4 className="font-semibold text-gray-700 mb-3">Card Payment Details</h4>
                        <input
                          type="text"
                          name="cardName"
                          placeholder="Name on Card"
                          value={paymentDetails.cardName}
                          onChange={handlePaymentChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <input
                          type="text"
                          name="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={paymentDetails.cardNumber}
                          onChange={handlePaymentChange}
                          maxLength="19"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            name="cardExpiry"
                            placeholder="MM/YY"
                            value={paymentDetails.cardExpiry}
                            onChange={handlePaymentChange}
                            maxLength="5"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                          <input
                            type="text"
                            name="cardCVV"
                            placeholder="CVV"
                            value={paymentDetails.cardCVV}
                            onChange={handlePaymentChange}
                            maxLength="4"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Payment Form - PayPal */}
                  <AnimatePresence>
                    {form.paymentType === "PAYPAL" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200"
                      >
                        <h4 className="font-semibold text-gray-700 mb-3">PayPal Payment Details</h4>
                        <input
                          type="email"
                          name="paypalEmail"
                          placeholder="PayPal Email Address"
                          value={paymentDetails.paypalEmail}
                          onChange={handlePaymentChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <select
                    name="dealId"
                    value={selectedDeal || ""}
                    onChange={handleDealChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">No Deal</option>
                    {deals.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} – {d.discount}% ({d.roomType})
                      </option>
                    ))}
                  </select>

                  {finalPrice && (
                    <p className="text-lg font-semibold text-green-700">
                      Total Price: ${finalPrice}
                    </p>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      className="bg-[#C5A880] text-[#1F1F1F] px-6 py-2 rounded-lg hover:bg-[#B9965D] transition"
                    >
                      Confirm Booking
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {msg.text && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`mt-4 text-sm font-medium ${
                  msg.type === "error"
                    ? "text-red-600 bg-red-50 border border-red-300 p-2 rounded"
                    : "text-green-700 bg-green-50 border border-green-300 p-2 rounded"
                }`}
              >
                {msg.text}
              </motion.p>
            )}
          </div>
        </motion.div>
      </main>
    </motion.div>
  );
}

export default RoomDetails;
