import { useState, useEffect } from "react";
import moment from "moment-timezone";

moment.tz.setDefault("Europe/Belgrade");

function RefundModal({ isOpen, onClose, onConfirm, booking, refundInfo, onRefundCalculated }) {
  const [earlyCheckoutDate, setEarlyCheckoutDate] = useState(
    moment.tz("Europe/Belgrade").format("YYYY-MM-DD")
  );
  const [calculatedRefund, setCalculatedRefund] = useState(null);
  const [loading, setLoading] = useState(false);

  // Calculate refund when date changes - must be before early return
  useEffect(() => {
    if (!isOpen || !booking) {
      setCalculatedRefund(null);
      return;
    }

    const originalEndDate = moment.tz(booking.endDate, "Europe/Belgrade").startOf("day");
    const selectedDate = moment.tz(earlyCheckoutDate, "Europe/Belgrade").startOf("day");
    const isEarlyCheckout = selectedDate.isBefore(originalEndDate, "day");

    if (!isEarlyCheckout) {
      setCalculatedRefund(null);
      return;
    }

    setLoading(true);
    
    // Calculate estimated refund
    const totalNights = originalEndDate.diff(
      moment.tz(booking.startDate, "Europe/Belgrade").startOf("day"),
      "days"
    );
    const unusedNights = originalEndDate.diff(selectedDate, "days");
    const pricePerNight = totalNights > 0 
      ? parseFloat(booking.finalPrice || 0) / totalNights 
      : 0;
    
    // This is just an estimate - actual calculation happens on backend
    setCalculatedRefund({
      unusedNights,
      estimatedRefund: unusedNights * pricePerNight,
      note: "Final refund amount will be calculated based on room policy",
    });
    
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [earlyCheckoutDate, booking, isOpen]);

  if (!isOpen) return null;

  const originalEndDate = moment.tz(booking?.endDate, "Europe/Belgrade").startOf("day");
  const selectedDate = moment.tz(earlyCheckoutDate, "Europe/Belgrade").startOf("day");
  const isEarlyCheckout = selectedDate.isBefore(originalEndDate, "day");
  const unusedNights = isEarlyCheckout
    ? originalEndDate.diff(selectedDate, "days")
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Early Check-Out & Refund</h2>

        {booking && (
          <div className="mb-4 space-y-2 text-sm">
            <p>
              <span className="font-medium">Guest:</span> {booking.customerFirstName}{" "}
              {booking.customerLastName}
            </p>
            <p>
              <span className="font-medium">Room:</span> {booking.room?.roomNumber || "N/A"}
            </p>
            <p>
              <span className="font-medium">Original Check-out:</span>{" "}
              {originalEndDate.format("MMM D, YYYY")}
            </p>
            <p>
              <span className="font-medium">Original Price:</span> $
              {parseFloat(booking.finalPrice || 0).toFixed(2)}
            </p>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Actual Check-out Date
          </label>
          <input
            type="date"
            value={earlyCheckoutDate}
            onChange={(e) => setEarlyCheckoutDate(e.target.value)}
            max={originalEndDate.format("YYYY-MM-DD")}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {isEarlyCheckout && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
            <h3 className="font-semibold mb-2">Refund Estimate</h3>
            {loading ? (
              <p className="text-sm text-gray-600">Calculating...</p>
            ) : calculatedRefund ? (
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Unused Nights:</span> {unusedNights}
                </p>
                <p className="text-blue-600">
                  <span className="font-medium">Estimated Refund:</span> $
                  {calculatedRefund.estimatedRefund.toFixed(2)}
                </p>
                <p className="text-gray-600 text-xs mt-2">
                  {calculatedRefund.note}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Final amount depends on room refund policy (Flexible/Strict/Non-refundable)
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-600">Select a check-out date to see refund estimate</p>
            )}
          </div>
        )}

        {refundInfo && isEarlyCheckout && (
          <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold mb-2 text-green-800">Final Refund Calculation</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Policy:</span> {refundInfo.policy || "N/A"}
              </p>
              <p>
                <span className="font-medium">Unused Nights:</span> {refundInfo.unusedNights || unusedNights}
              </p>
              <p className={refundInfo.refundable ? "text-green-600 font-semibold" : "text-red-600"}>
                <span className="font-medium">Refund Amount:</span> $
                {refundInfo.refundAmount?.toFixed(2) || "0.00"}
              </p>
              <p className="text-gray-600 text-xs mt-2">{refundInfo.reason}</p>
            </div>
          </div>
        )}

        {!isEarlyCheckout && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            This is a normal check-out. No refund will be issued.
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(earlyCheckoutDate)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Confirm Check-Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default RefundModal;
