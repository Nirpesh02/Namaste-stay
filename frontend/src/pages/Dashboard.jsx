import { useNavigate } from "react-router-dom";
import { LogOut, Calendar, MapPin, Users, X, Loader } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, bookings, fetchBookings, cancelBooking, loading } = useAuth();
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user, fetchBookings]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Please log in first</h1>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleCancel = async (bookingId) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setCancelling(bookingId);
    await cancelBooking(bookingId);
    setCancelling(null);
  };

  const activeBookings = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'failed');
  const totalSpent = activeBookings.reduce((sum, b) => sum + (b.totalPrice || b.pricePerNight || 0), 0);
  const districts = new Set(activeBookings.map(b => b.district).filter(Boolean));

  return (
    <div className="min-h-screen bg-linear-to-br from-red-50 via-white to-red-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4 sm:gap-6 w-full sm:w-auto">
              <img
                src={user.profilePicture || user.picture || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.name)}
                alt={user.name}
                className="w-16 sm:w-20 h-16 sm:h-20 rounded-full object-cover border-4 border-red-100 shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{user.name}</h1>
                <p className="text-gray-600 text-sm truncate">{user.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Member since {new Date(user.loginTime || user.createdAt || "2000-01-01T00:00:00.000Z").toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold whitespace-nowrap w-full sm:w-auto justify-center"
            >
              <LogOut size={18} />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>

        {/* Bookings Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader size={36} className="animate-spin text-red-600" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="space-y-4">
                <Calendar size={48} className="mx-auto text-gray-300" />
                <h3 className="text-2xl font-bold text-gray-700">No bookings yet</h3>
                <p className="text-gray-600">
                  Start exploring and book your perfect stay in Nepal!
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="mt-4 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold inline-block"
                >
                  Explore Stays
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookings.map((booking) => (
                <div
                  key={booking._id || booking.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Image */}
                  {booking.image && (
                    <div className="h-48 overflow-hidden bg-gray-200">
                      <img
                        src={booking.image}
                        alt={booking.hotelName}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{booking.hotelName}</h3>
                    </div>

                    {/* Booking Details */}
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-red-600" />
                        <span>{booking.district}{booking.province ? `, ${booking.province}` : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-red-600" />
                        <span>
                          {booking.checkIn ? new Date(booking.checkIn).toLocaleDateString() : '-'} to{' '}
                          {booking.checkOut ? new Date(booking.checkOut).toLocaleDateString() : '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-red-600" />
                        <span>{booking.guests} guests</span>
                      </div>
                      {booking.roomType && (
                        <div className="flex items-center gap-2 text-xs bg-blue-50 px-2 py-1 rounded">
                          <span className="text-blue-600 font-semibold">{booking.roomType}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <span className="font-bold text-gray-900">
                          NPR {(booking.totalPrice || booking.pricePerNight || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center justify-between pt-2 border-t gap-2 flex-wrap">
                      <div className="flex gap-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          booking.status === 'failed' ? 'bg-gray-100 text-gray-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {booking.status}
                        </span>
                        {booking.paymentStatus && (
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                            booking.paymentStatus === 'completed' ? 'bg-green-50 text-green-600' :
                            booking.paymentStatus === 'failed' ? 'bg-red-50 text-red-600' :
                            'bg-yellow-50 text-yellow-600'
                          }`}>
                            💳 {booking.paymentStatus}
                          </span>
                        )}
                      </div>
                      {booking.status !== 'cancelled' && booking.status !== 'failed' && (
                        <button
                          onClick={() => handleCancel(booking._id || booking.id)}
                          disabled={cancelling === (booking._id || booking.id)}
                          className="text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                          title="Cancel booking"
                        >
                          {cancelling === (booking._id || booking.id) ? <Loader size={18} className="animate-spin" /> : <X size={18} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {activeBookings.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <p className="text-gray-600 text-sm font-semibold mb-2">Total Bookings</p>
              <p className="text-4xl font-bold text-red-600">{activeBookings.length}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <p className="text-gray-600 text-sm font-semibold mb-2">Total Spent</p>
              <p className="text-4xl font-bold text-green-600">
                NPR {totalSpent.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <p className="text-gray-600 text-sm font-semibold mb-2">Districts Visited</p>
              <p className="text-4xl font-bold text-blue-600">{districts.size}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
