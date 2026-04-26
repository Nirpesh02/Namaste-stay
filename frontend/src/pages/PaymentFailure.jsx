import { useSearchParams, useNavigate } from "react-router-dom";
import { XCircle, ArrowLeft, Home, RefreshCw, AlertTriangle, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";

export default function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchBookings, deleteIncompleteBooking } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // When mounting, see if we have a bookingId and delete it.
  // We don't block the UI for this, we just trigger it in the background.
  useEffect(() => {
    const bookingId = localStorage.getItem('pendingEsewaBookingId');
    if (bookingId) {
      deleteIncompleteBooking(bookingId).catch(err => {
        console.error('Failed to clean up incomplete booking:', err);
      });
      localStorage.removeItem('pendingEsewaBookingId');
    }
  }, [deleteIncompleteBooking]);

  const handleRefreshBookings = async () => {
    setRefreshing(true);
    try {
      await fetchBookings();
    } catch (err) {
      console.error('Error refreshing bookings:', err);
    }
    setRefreshing(false);
  };

  const handleRetryPayment = () => {
    navigate("/stays");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Failure Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-600 px-8 py-10 text-center text-white">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <XCircle size={44} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold">Payment Not Completed</h1>
            <p className="text-red-100 mt-2 text-sm">Your payment could not be processed</p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-5">
                <div className="flex gap-3">
                  <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">What happened?</h3>
                    <p className="text-sm text-red-800 leading-relaxed">
                      The payment was either cancelled by you, could not be processed by eSewa, 
                      or an error occurred. Your booking has been marked as failed and no money has been charged.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                <div className="flex gap-3">
                  <Clock className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">⏱️ If money was deducted</h3>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      If you were charged despite the payment failing, the amount will be refunded 
                      to your eSewa account within 24-48 hours. Check your eSewa transaction history.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
                <h3 className="font-semibold text-yellow-900 mb-3">💡 What you can do</h3>
                <ul className="text-sm text-yellow-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 font-bold">•</span>
                    <span>Verify your eSewa account balance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 font-bold">•</span>
                    <span>Ensure your eSewa account is fully verified</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 font-bold">•</span>
                    <span>Check your internet connection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 font-bold">•</span>
                    <span>Try again with your correct eSewa credentials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 font-bold">•</span>
                    <span>Contact eSewa support if the issue persists</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={handleRetryPayment}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Try Booking Again
              </button>
              <button
                onClick={handleRefreshBookings}
                disabled={refreshing}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} />
                {refreshing ? 'Refreshing...' : 'View My Bookings'}
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full px-6 py-3 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Home size={18} />
                Back to Home
              </button>
            </div>

            <div className="bg-gray-100 rounded-lg p-4 text-center text-sm text-gray-600">
              <p>Need help? <a href="mailto:support@namastestay.com" className="text-blue-600 hover:underline font-semibold">Contact Support</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
