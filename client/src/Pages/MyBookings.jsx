import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useUser } from "../UserContext";
import apiService from "../services/api";
import { FaPrint, FaCalendarAlt, FaDollarSign, FaCreditCard, FaCheckCircle, FaClock, FaTimesCircle, FaFileInvoice } from "react-icons/fa";
import moment from "moment";

function MyBookings() {
  const { user } = useUser();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const invoiceRefs = useRef({});

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Get user's own bookings (API now filters by userId for regular users)
        const userBookings = await apiService.getBookings();
        setBookings(userBookings);
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
        setError("Failed to load your bookings. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const getStatusColor = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800 border-green-300";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-300";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "CONFIRMED":
        return <FaCheckCircle className="text-green-600" />;
      case "PENDING":
        return <FaClock className="text-yellow-600" />;
      case "CANCELLED":
        return <FaTimesCircle className="text-red-600" />;
      case "COMPLETED":
        return <FaCheckCircle className="text-blue-600" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    return moment(dateString).format("MMM DD, YYYY");
  };

  const formatDateTime = (dateString) => {
    return moment(dateString).format("MMM DD, YYYY [at] hh:mm A");
  };

  const calculateNights = (startDate, endDate) => {
    const start = moment(startDate);
    const end = moment(endDate);
    return end.diff(start, "days");
  };

  const printInvoice = (bookingId) => {
    const printWindow = window.open("", "_blank");
    const booking = bookings.find((b) => b.id === bookingId);
    
    if (!booking) return;

    const nights = calculateNights(booking.startDate, booking.endDate);
    const invoiceContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - Booking #${booking.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #333;
            }
            .invoice-header {
              border-bottom: 3px solid #B89B5E;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .hotel-name {
              font-size: 32px;
              font-weight: bold;
              color: #B89B5E;
              margin-bottom: 10px;
            }
            .invoice-title {
              font-size: 24px;
              color: #666;
              margin-bottom: 20px;
            }
            .invoice-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .info-section {
              flex: 1;
            }
            .info-section h3 {
              color: #B89B5E;
              margin-bottom: 10px;
              font-size: 16px;
            }
            .info-section p {
              margin: 5px 0;
              color: #666;
            }
            .booking-details {
              background: #f8f6f1;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .booking-details h3 {
              color: #B89B5E;
              margin-bottom: 15px;
              font-size: 18px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #ddd;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: bold;
              color: #666;
            }
            .detail-value {
              color: #333;
            }
            .price-summary {
              background: #fff;
              border: 2px solid #B89B5E;
              padding: 20px;
              border-radius: 8px;
              margin-top: 20px;
            }
            .price-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
            }
            .price-row.total {
              border-top: 2px solid #B89B5E;
              margin-top: 10px;
              padding-top: 15px;
              font-size: 20px;
              font-weight: bold;
              color: #B89B5E;
            }
            .status-badge {
              display: inline-block;
              padding: 5px 15px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              margin-top: 10px;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-header">
            <div class="hotel-name">Four Seasons Hotel</div>
            <div class="invoice-title">Booking Invoice</div>
          </div>
          
          <div class="invoice-info">
            <div class="info-section">
              <h3>Booking Information</h3>
              <p><strong>Booking ID:</strong> #${booking.id}</p>
              <p><strong>Booking Date:</strong> ${formatDateTime(booking.createdAt)}</p>
              <p><strong>Status:</strong> 
                <span style="display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; background: ${booking.status === 'CONFIRMED' ? '#d1fae5' : booking.status === 'PENDING' ? '#fef3c7' : booking.status === 'CANCELLED' ? '#fee2e2' : '#dbeafe'}; color: ${booking.status === 'CONFIRMED' ? '#065f46' : booking.status === 'PENDING' ? '#92400e' : booking.status === 'CANCELLED' ? '#991b1b' : '#1e40af'};">
                  ${booking.status}
                </span>
              </p>
            </div>
            <div class="info-section">
              <h3>Guest Information</h3>
              <p><strong>Name:</strong> ${booking.customerFirstName} ${booking.customerLastName}</p>
              <p><strong>Email:</strong> ${booking.customerEmail || "N/A"}</p>
            </div>
          </div>

          <div class="booking-details">
            <h3>Room & Stay Details</h3>
            <div class="detail-row">
              <span class="detail-label">Room Type:</span>
              <span class="detail-value">${booking.room?.type || "N/A"}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Room Number:</span>
              <span class="detail-value">${booking.room?.roomNumber || "N/A"}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Check-in:</span>
              <span class="detail-value">${formatDate(booking.startDate)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Check-out:</span>
              <span class="detail-value">${formatDate(booking.endDate)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Duration:</span>
              <span class="detail-value">${nights} ${nights === 1 ? "night" : "nights"}</span>
            </div>
            ${booking.deal ? `
            <div class="detail-row">
              <span class="detail-label">Deal Applied:</span>
              <span class="detail-value">${booking.deal.name} (${booking.deal.discount}% off)</span>
            </div>
            ` : ""}
          </div>

          <div class="price-summary">
            <h3 style="color: #B89B5E; margin-bottom: 15px;">Payment Summary</h3>
            <div class="price-row">
              <span>Base Rate (per night):</span>
              <span>$${parseFloat(booking.baseRate || booking.room?.price || 0).toFixed(2)}</span>
            </div>
            <div class="price-row">
              <span>Number of Nights:</span>
              <span>${nights}</span>
            </div>
            ${booking.deal ? `
            <div class="price-row">
              <span>Discount (${booking.deal.discount}%):</span>
              <span>-$${((parseFloat(booking.baseRate || booking.room?.price || 0) * nights * booking.deal.discount) / 100).toFixed(2)}</span>
            </div>
            ` : ""}
            <div class="price-row total">
              <span>Total Amount:</span>
              <span>$${parseFloat(booking.finalPrice || 0).toFixed(2)}</span>
            </div>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
              <p><strong>Payment Method:</strong> ${booking.paymentType || "N/A"}</p>
              <p style="margin-top: 5px;">
                <strong>Payment Status:</strong> 
                <span style="display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; background: ${booking.paymentStatus === 'PAID' ? '#d1fae5' : booking.paymentStatus === 'PENDING' ? '#fef3c7' : '#fee2e2'}; color: ${booking.paymentStatus === 'PAID' ? '#065f46' : booking.paymentStatus === 'PENDING' ? '#92400e' : '#991b1b'};">
                  ${booking.paymentStatus}
                </span>
              </p>
            </div>
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
            <p>Thank you for choosing Four Seasons Hotel!</p>
            <p style="margin-top: 5px;">For any inquiries, please contact our customer service.</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(invoiceContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F6F1]">
        <motion.div
          className="w-16 h-16 border-4 border-[#B89B5E] border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view your bookings.</p>
          <a
            href="/login"
            className="inline-block bg-[#B89B5E] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#a0854d] transition"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            My Bookings
          </h1>
          <p className="text-gray-600 text-lg">
            View and manage all your hotel reservations
          </p>
        </motion.div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-12 text-center"
          >
            <FaFileInvoice className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              No Bookings Yet
            </h3>
            <p className="text-gray-600 mb-6">
              You haven't made any bookings yet. Start exploring our rooms!
            </p>
            <a
              href="/rooms"
              className="inline-block bg-[#B89B5E] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#a0854d] transition"
            >
              Browse Rooms
            </a>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking, index) => {
              const nights = calculateNights(booking.startDate, booking.endDate);
              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100"
                >
                  <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-gray-900">
                            Booking #{booking.id}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                              booking.status
                            )}`}
                          >
                            {getStatusIcon(booking.status)}
                            <span className="ml-1">{booking.status}</span>
                          </span>
                        </div>
                        <p className="text-gray-600">
                          {booking.room?.type} Room - Room {booking.room?.roomNumber}
                        </p>
                      </div>
                      <button
                        onClick={() => printInvoice(booking.id)}
                        className="flex items-center gap-2 bg-[#B89B5E] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#a0854d] transition whitespace-nowrap"
                      >
                        <FaPrint />
                        Print Invoice
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-[#B89B5E] mb-2">
                          <FaCalendarAlt />
                          <h4 className="font-semibold">Stay Dates</h4>
                        </div>
                        <p className="text-gray-700">
                          <strong>Check-in:</strong> {formatDate(booking.startDate)}
                        </p>
                        <p className="text-gray-700">
                          <strong>Check-out:</strong> {formatDate(booking.endDate)}
                        </p>
                        <p className="text-gray-600 text-sm mt-1">
                          {nights} {nights === 1 ? "night" : "nights"}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-[#B89B5E] mb-2">
                          <FaDollarSign />
                          <h4 className="font-semibold">Payment</h4>
                        </div>
                        <p className="text-gray-700">
                          <strong>Total:</strong> ${parseFloat(booking.finalPrice || 0).toFixed(2)}
                        </p>
                        <p className="text-gray-700">
                          <strong>Method:</strong> {booking.paymentType || "N/A"}
                        </p>
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold mt-1 ${getPaymentStatusColor(
                            booking.paymentStatus
                          )}`}
                        >
                          {booking.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {booking.deal && (
                      <div className="bg-gradient-to-r from-[#B89B5E]/10 to-[#C5A880]/10 rounded-lg p-4 mb-6 border border-[#B89B5E]/20">
                        <p className="text-sm text-gray-600">
                          <strong>Deal Applied:</strong> {booking.deal.name} - {booking.deal.discount}% discount
                        </p>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div>
                          <strong>Guest:</strong> {booking.customerFirstName} {booking.customerLastName}
                        </div>
                        {booking.customerEmail && (
                          <div>
                            <strong>Email:</strong> {booking.customerEmail}
                          </div>
                        )}
                        <div>
                          <strong>Booked on:</strong> {formatDateTime(booking.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyBookings;
