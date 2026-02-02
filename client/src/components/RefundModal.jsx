import { useState, useEffect } from "react";
import moment from "moment-timezone";

moment.tz.setDefault("Europe/Belgrade");

function RefundModal({ isOpen, onClose, onConfirm, booking, refundInfo, onRefundCalculated, isCancellation = false }) {
  const [earlyCheckoutDate, setEarlyCheckoutDate] = useState(
    moment.tz("Europe/Belgrade").format("YYYY-MM-DD")
  );
  const [calculatedRefund, setCalculatedRefund] = useState(null);
  const [loading, setLoading] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setEarlyCheckoutDate(moment.tz("Europe/Belgrade").format("YYYY-MM-DD"));
      setCalculatedRefund(null);
    }
  }, [isOpen]);

  // Calculate refund when date changes - only for early check-out
  useEffect(() => {
    if (!isOpen || !booking || isCancellation) {
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
  }, [earlyCheckoutDate, booking, isOpen, isCancellation]);

  if (!isOpen) return null;

  const originalEndDate = moment.tz(booking?.endDate, "Europe/Belgrade").startOf("day");
  const checkInDate = moment.tz(booking?.startDate, "Europe/Belgrade").startOf("day");
  const today = moment.tz("Europe/Belgrade").startOf("day");
  const daysUntilCheckIn = checkInDate.diff(today, "days");
  
  const selectedDate = moment.tz(earlyCheckoutDate, "Europe/Belgrade").startOf("day");
  const isEarlyCheckout = !isCancellation && selectedDate.isBefore(originalEndDate, "day");
  const unusedNights = isEarlyCheckout
    ? originalEndDate.diff(selectedDate, "days")
    : 0;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-slate-900 rounded-xl shadow-2xl p-6 w-full max-w-md border border-slate-800">
        <h2 className="text-xl font-semibold mb-4 text-white">
          {isCancellation ? "Cancel Booking & Refund" : "Early Check-Out & Refund"}
        </h2>

        {booking && (
          <div className="mb-4 space-y-2 text-sm text-slate-300">
            <p>
              <span className="font-medium text-slate-400">Guest:</span> {booking.customerFirstName}{" "}
              {booking.customerLastName}
            </p>
            <p>
              <span className="font-medium text-slate-400">Room:</span> {booking.room?.roomNumber || "N/A"}
            </p>
            {isCancellation ? (
              <>
                <p>
                  <span className="font-medium text-slate-400">Check-in Date:</span>{" "}
                  {checkInDate.format("MMM D, YYYY")}
                </p>
                <p>
                  <span className="font-medium text-slate-400">Days until check-in:</span> {daysUntilCheckIn}
                </p>
              </>
            ) : (
              <p>
                <span className="font-medium text-slate-400">Original Check-out:</span>{" "}
                {originalEndDate.format("MMM D, YYYY")}
              </p>
            )}
            <p>
              <span className="font-medium text-slate-400">Original Price:</span> $
              {parseFloat(booking.finalPrice || 0).toFixed(2)}
            </p>
          </div>
        )}

        {isCancellation ? (
          <div className="mb-4 space-y-3">
            {/* Show refund eligibility BEFORE confirmation */}
            {refundInfo && !refundInfo.isFinal && (
              <div className={`p-4 rounded-lg border ${
                refundInfo.refundable 
                  ? "bg-emerald-500/10 border-emerald-500/20" 
                  : "bg-rose-500/10 border-rose-500/20"
              }`}>
                <h3 className={`font-semibold mb-2 ${
                  refundInfo.refundable ? "text-emerald-400" : "text-rose-400"
                }`}>
                  {refundInfo.refundable ? "✓ Payment Will Be Refunded" : "✗ Payment Will NOT Be Refunded"}
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-300">
                    <span className="font-medium text-slate-400">Policy:</span> {refundInfo.policy || "N/A"}
                  </p>
                  <p className="text-slate-300">
                    <span className="font-medium text-slate-400">Days until check-in:</span> {refundInfo.daysUntilCheckIn || 0}
                  </p>
                  <p className={refundInfo.refundable ? "text-emerald-400 font-semibold" : "text-rose-400"}>
                    <span className="font-medium">Estimated Refund:</span> $
                    {refundInfo.estimatedRefund?.toFixed(2) || "0.00"}
                  </p>
                  <p className="text-slate-400 text-xs mt-2">
                    {refundInfo.refundMessage || "Refund eligibility based on cancellation policy"}
                  </p>
                  <p className="text-slate-500 text-xs mt-1 italic">
                    Final refund amount will be confirmed after cancellation.
                  </p>
                </div>
              </div>
            )}
            
            {/* Show general policy info if no refundInfo yet */}
            {!refundInfo && (
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <h3 className="font-semibold mb-2 text-slate-200">Cancellation Refund Policy</h3>
                <div className="space-y-2 text-sm text-slate-300">
                  <p>
                    Refund will be calculated based on the room's cancellation policy:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-400 ml-2">
                    <li><strong>Non-refundable:</strong> No refund</li>
                    <li><strong>Strict:</strong> Refund only if cancelled 7+ days before check-in</li>
                    <li><strong>Flexible:</strong> Full refund always available</li>
                  </ul>
                  <p className="text-xs text-slate-500 mt-2">
                    Refund eligibility will be calculated when you confirm cancellation.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Actual Check-out Date
            </label>
            <input
              type="date"
              value={earlyCheckoutDate}
              onChange={(e) => setEarlyCheckoutDate(e.target.value)}
              max={originalEndDate.format("YYYY-MM-DD")}
              className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        )}

        {isEarlyCheckout && (
          <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h3 className="font-semibold mb-2 text-slate-200">Refund Estimate</h3>
            {loading ? (
              <p className="text-sm text-slate-500 animate-pulse">Calculating...</p>
            ) : calculatedRefund ? (
              <div className="space-y-1 text-sm">
                <p className="text-slate-300">
                  <span className="font-medium text-slate-400">Unused Nights:</span> {unusedNights}
                </p>
                <p className="text-green-400 font-semibold">
                  <span className="font-medium text-green-500/80">Estimated Refund:</span> $
                  {calculatedRefund.estimatedRefund.toFixed(2)}
                </p>
                <p className="text-slate-500 text-xs mt-2 italic">
                  {calculatedRefund.note}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  Final amount depends on room refund policy
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Select a check-out date to see refund estimate</p>
            )}
          </div>
        )}

        {/* Show final refund amount AFTER confirmation */}
        {refundInfo && refundInfo.isFinal && (isCancellation || isEarlyCheckout) && (
          <div className="mb-4 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <h3 className="font-semibold mb-2 text-emerald-400">Final Refund Calculation</h3>
            <div className="space-y-1 text-sm">
              <p className="text-slate-300">
                <span className="font-medium text-slate-400">Policy:</span> {refundInfo.policy || "N/A"}
              </p>
              {isCancellation ? (
                <p className="text-slate-300">
                  <span className="font-medium text-slate-400">Days until check-in:</span> {refundInfo.daysUntilCheckIn || daysUntilCheckIn}
                </p>
              ) : (
                <p className="text-slate-300">
                  <span className="font-medium text-slate-400">Unused Nights:</span> {refundInfo.unusedNights || unusedNights}
                </p>
              )}
              <p className={refundInfo.refundable && refundInfo.refundAmount > 0 ? "text-emerald-400 font-semibold text-lg" : "text-rose-400 font-semibold"}>
                <span className="font-medium">Refund Amount:</span> $
                {refundInfo.refundAmount?.toFixed(2) || "0.00"}
              </p>
              <p className="text-slate-400 text-xs mt-2">{refundInfo.reason}</p>
            </div>
          </div>
        )}

        {!isCancellation && !isEarlyCheckout && (
          <div className="mb-4 p-3 bg-indigo-500/10 rounded-lg text-sm text-indigo-300 border border-indigo-500/20">
            This is a normal check-out. No refund will be issued.
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors border border-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(isCancellation ? null : earlyCheckoutDate)}
            className={`px-4 py-2 rounded-lg text-white transition-colors shadow-lg font-medium ${
              isCancellation 
                ? "bg-red-600 hover:bg-red-700 shadow-red-500/20"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
            }`}
          >
            {isCancellation ? "Confirm Cancellation" : "Confirm Check-Out"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RefundModal;
