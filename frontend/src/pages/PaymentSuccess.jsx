import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, Calendar, MapPin, Users, ArrowRight, Loader, Home, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AuthAPI from "../services/AuthAPI";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchBookings } = useAuth();
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState(false);

  const verifyPayment = async (retryCount = 0) => {
    try {
      const encodedData = searchParams.get("data");

      if (!encodedData) {
        setStatus("error");
        setError("No payment data received from eSewa. Please contact support if you were charged.");
        return;
      }

      console.log('Verifying payment with data:', encodedData.substring(0, 20) + '...');

      // Call backend verify endpoint
      const result = await AuthAPI.verifyEsewaPayment(encodedData);

      if (result.success && result.booking) {
        console.log('Payment verified successfully:', result.booking);
        setBooking(result.booking);
        setStatus("success");
        
        // Refresh user's bookings in auth context
        try {
          await fetchBookings();
        } catch (fetchErr) {
          console.warn('Could not refresh bookings:', fetchErr.message);
        }
      } else {
        console.error('Payment verification failed:', result.message);
        setStatus("error");
        setError(result.message || "Payment verification failed. Please contact support.");
      }
    } catch (err) {
      console.error('Verify payment error:', err);
      setStatus("error");
      setError(err.message || "An unexpected error occurred during verification.");
    }
  };

  useEffect(() => {
    verifyPayment();
  }, [searchParams]);

  const handleRetry = async () => {
    setRetrying(true);
    setStatus("verifying");
    await verifyPayment();
    setRetrying(false);
  };

  if (status === "verifying") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center px-4">
        <div className="text-center space-y-6">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-30" />
            <div className="relative w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <Loader size={36} className="text-green-600 animate-spin" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Verifying Payment...</h1>
            <p className="text-gray-600 mt-2">Please wait while we confirm your payment with eSewa.</p>
            <p className="text-xs text-gray-500 mt-3">This may take a few seconds. Please don't close this page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Error Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-600 px-8 py-10 text-center text-white">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <AlertCircle size={44} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold">Verification Failed</h1>
              <p className="text-red-100 mt-2 text-sm">We couldn't verify your payment</p>
            </div>

            {/* Error Content */}
            <div className="p-8 space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-5 text-sm text-red-800">
                <p className="font-semibold mb-2">What happened?</p>
                <p>{error}</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5 text-sm text-yellow-800">
                <p className="font-semibold mb-2">⚠️ Important</p>
                <p>If money was deducted from your account, it will be refunded within 24-48 hours. Check your eSewa account balance.</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 text-sm text-blue-800">
                <p className="font-semibold mb-2">💡 What to do next?</p>
                <ul className="space-y-2">
                  <li>• Check your bookings to see the current status</li>
                  <li>• Try the payment process again</li>
                  <li>• Contact support if the issue persists</li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleRetry}
                  disabled={retrying}
                  className="w-full px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {retrying ? <Loader size={18} className="animate-spin" /> : '↻'}
                  {retrying ? 'Retrying...' : 'Retry Verification'}
                </button>
                <button
                  onClick={() => navigate("/bookings")}
                  className="w-full px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold transition-colors"
                >
                  View My Bookings
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-10 text-center text-white">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <CheckCircle size={44} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold">Booking Confirmed!</h1>
            <p className="text-green-100 mt-2 text-sm">Your payment was successful and your booking is confirmed</p>
          </div>

          {/* Booking Details */}
          <div className="p-8 space-y-6">
            {booking && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-500 text-sm font-medium">Hotel</span>
                    <span className="font-bold text-gray-900">{booking.hotelName}</span>
                  </div>
                  {booking.roomType && (
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-500 text-sm font-medium">Room Type</span>
                      <span className="font-semibold text-gray-900">{booking.roomType}</span>
                    </div>
                  )}
                  {booking.checkIn && (
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-500 text-sm font-medium">Check-in</span>
                      <span className="font-semibold text-gray-900">{new Date(booking.checkIn).toLocaleDateString()}</span>
                    </div>
                  )}
                  {booking.checkOut && (
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-500 text-sm font-medium">Check-out</span>
                      <span className="font-semibold text-gray-900">{new Date(booking.checkOut).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-500 text-sm font-medium">Amount Paid</span>
                    <span className="font-bold text-green-600 text-lg">NPR {Number(booking.totalPrice).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-gray-500 text-sm font-medium">Status</span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      <CheckCircle size={14} />
                      Confirmed
                    </span>
                  </div>
                  {booking.transactionId && (
                    <div className="flex items-center justify-between py-3 border-t border-gray-100 mt-3">
                      <span className="text-gray-500 text-xs">Transaction ID</span>
                      <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{booking.transactionId}</span>
                    </div>
                  )}
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                  <p className="font-semibold mb-1">📧 Confirmation email sent!</p>
                  <p>A detailed booking confirmation with receipt has been sent to your registered email address.</p>
                </div>
              </>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => navigate("/bookings")}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Calendar size={18} />
                View My Bookings
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full px-6 py-3 border border-green-300 text-green-700 rounded-xl hover:bg-green-50 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Home size={18} />
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
