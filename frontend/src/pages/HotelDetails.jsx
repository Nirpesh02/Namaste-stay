import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, Users, Wifi, Wind, Star, Calendar, ArrowLeft, Share2, Loader } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useReview } from "../context/ReviewContext";
import { provincesData } from "../data/provincesData";
import ReviewModal from "../components/ReviewModal";
import { initiateEsewaPayment, redirectToEsewa } from "../services/esewa";
import AuthAPI from "../services/AuthAPI";

export default function HotelDetails() {
  const navigate = useNavigate();
  const { hotelId } = useParams();
  const { user, token, createBooking, bookings } = useAuth();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const { getHotelRating, getHotelReviews } = useReview();
  const [searchParams] = useSearchParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [availabilityInfo, setAvailabilityInfo] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [bookingData, setBookingData] = useState({
    checkIn: "",
    checkOut: "",
    guests: "1",
    roomType: "Standard Room", // Add room type selection
  });

  const roomTypes = [
    { type: "Standard Room", size: "250 sq ft", price: 2500, capacity: "2 guests" },
    { type: "Deluxe Room", size: "350 sq ft", price: 3500, capacity: "3 guests" },
    { type: "Suite", size: "500 sq ft", price: 5000, capacity: "4 guests" },
  ];

  // Helper function to get today's date in YYYY-MM-DD format (using local timezone)
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to get next day in YYYY-MM-DD format (using local timezone)
  const getNextDay = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    date.setDate(date.getDate() + 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Find hotel from data
  let hotelData = null;
  let hotelName = "";
  let districtName = "";
  let provinceName = "";

  provincesData.forEach(province => {
    province.districts.forEach(district => {
      const hotel = district.hotels.find(h => h.name.replace(/\s+/g, "-").toLowerCase() === hotelId);
      if (hotel) {
        hotelData = hotel;
        hotelName = hotel.name;
        districtName = district.title;
        provinceName = province.key;
      }
    });
  });

  if (!hotelData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Hotel not found</h1>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const allImages = [
    "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg",
    ...(hotelData.roomImages || []),
    "https://images.pexels.com/photos/2398220/pexels-photo-2398220.jpeg",
    "https://images.pexels.com/photos/1456265/pexels-photo-1456265.jpeg",
  ];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleBookingChange = (e) => {
    const { name, value } = e.target;

    if (name === "checkIn") {
      // Validate check-in is not in the past
      if (value && value < getTodayDate()) {
        alert("Cannot select a past date for check-in");
        return;
      }

      const newBookingData = {
        ...bookingData,
        [name]: value,
      };

      // If check-out is set and is before or equal to new check-in, reset it
      if (bookingData.checkOut && bookingData.checkOut <= value) {
        newBookingData.checkOut = "";
      }

      setBookingData(newBookingData);
      // Check availability after setting new dates
      setTimeout(() => {
        if (newBookingData.checkOut) {
          checkAvailability();
        }
      }, 0);
    } else if (name === "checkOut") {
      // Validate check-out is not in the past
      if (value && value < getTodayDate()) {
        alert("Cannot select a past date for check-out");
        return;
      }

      // Validate check-out is after check-in
      if (bookingData.checkIn && value <= bookingData.checkIn) {
        alert("Check-out date must be after check-in date");
        return;
      }

      setBookingData(prev => ({
        ...prev,
        [name]: value
      }));
      // Check availability after setting new dates
      setTimeout(() => {
        checkAvailability();
      }, 0);
    } else {
      setBookingData(prev => ({
        ...prev,
        [name]: value
      }));
      // Check availability when room type or guests change
      if (name === "roomType" || name === "guests") {
        setTimeout(() => {
          checkAvailability();
        }, 0);
      }
    }
  };

  const calculatePrice = () => {
    const selectedRoom = roomTypes.find(r => r.type === bookingData.roomType);
    const pricePerNight = selectedRoom?.price || parseInt(hotelData.price);
    if (!bookingData.checkIn || !bookingData.checkOut) return pricePerNight;
    
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    const nights = Math.max(1, (checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    return pricePerNight * nights;
  };

  // Check room availability when dates or guests change
  const checkAvailability = async () => {
    if (!bookingData.checkIn || !bookingData.checkOut || !hotelName) return;

    setCheckingAvailability(true);
    try {
      const result = await AuthAPI.checkRoomAvailability(
        hotelName,
        bookingData.roomType,
        bookingData.checkIn,
        bookingData.checkOut,
        bookingData.guests
      );

      if (result.success) {
        setAvailabilityInfo(result.availability);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!bookingData.checkIn || !bookingData.checkOut) {
      alert("Please select check-in and check-out dates");
      return;
    }

    // Final validation: reject past dates at confirmation time
    const today = getTodayDate();
    if (bookingData.checkIn < today) {
      alert("Check-in date cannot be in the past. Please select a valid date.");
      return;
    }
    if (bookingData.checkOut < today) {
      alert("Check-out date cannot be in the past. Please select a valid date.");
      return;
    }
    if (bookingData.checkOut <= bookingData.checkIn) {
      alert("Check-out date must be after check-in date.");
      return;
    }

    setPaymentLoading(true);

    try {
      // Step 1: Create a pending booking on the backend
      const selectedRoom = roomTypes.find(r => r.type === bookingData.roomType);
      const pricePerNight = selectedRoom?.price || parseInt(hotelData.price);
      const totalPrice = calculatePrice();

      const booking = await createBooking({
        hotelId: hotelId,
        hotelName: hotelName,
        district: districtName,
        province: provinceName,
        roomType: bookingData.roomType,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: bookingData.guests,
        pricePerNight,
        totalPrice,
        image: allImages[0],
      });

      // Step 2: Initiate eSewa payment
      const paymentResult = await initiateEsewaPayment(token, booking._id);

      // Step 3: Redirect to eSewa payment gateway
      setShowBookingModal(false);
      localStorage.setItem('pendingEsewaBookingId', booking._id);
      redirectToEsewa({
        paymentUrl: paymentResult.paymentUrl,
        fields: paymentResult.fields,
      });
    } catch (error) {
      setPaymentLoading(false);
      // Check if this is an availability error
      if (error.message && error.message.includes("room")) {
        // Re-check availability and show the status
        await checkAvailability();
        alert(`Availability issue: ${error.message}\n\nPlease try different dates or room types.`);
      } else {
        alert(error.message || "Failed to process payment. Please try again.");
      }
    }
  };

  const availableRooms = parseInt(hotelData.availableRooms || "8");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-red-700 transition-colors font-semibold"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Share2 size={22} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative h-96 bg-gray-200 rounded-2xl overflow-hidden group">
                <img
                  src={allImages[currentImageIndex]}
                  alt={`${hotelName} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Navigation Buttons */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 transition-all shadow-lg opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft size={24} className="text-gray-900" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 transition-all shadow-lg opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight size={24} className="text-gray-900" />
                    </button>
                    <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {currentImageIndex + 1}/{allImages.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {allImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        currentImageIndex === idx ? "border-red-600" : "border-gray-200 hover:border-red-400"
                      }`}
                    >
                      <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Hotel Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{hotelName}</h1>
              
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-1">
                  <Star className="fill-yellow-400 text-yellow-400" size={20} />
                  <span className="font-bold text-lg">{getHotelRating(hotelId) || hotelData.rating}</span>
                  <span className="text-gray-600 text-sm">({getHotelReviews(hotelId).length} {getHotelReviews(hotelId).length === 1 ? 'review' : 'reviews'})</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={18} />
                  <span>{districtName}, {provinceName}</span>
                </div>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-200 mb-6">
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Available Rooms</p>
                  <p className="text-2xl font-bold text-red-600">{availableRooms}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Room Type</p>
                  <p className="text-2xl font-bold text-gray-900">Suite</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Quality Grade</p>
                  <p className="text-2xl font-bold text-blue-600">★★★★★</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">About this hotel</h2>
                <p className="text-gray-700 leading-relaxed">
                  Experience luxury and comfort at {hotelName}. Our premium accommodation offers world-class amenities and personalized service to ensure your stay is unforgettable. Located in the heart of {districtName}, we provide easy access to major attractions while maintaining a peaceful retreat atmosphere.
                </p>

                <h3 className="text-xl font-bold text-gray-900 pt-4">Room Quality & Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                    <Wifi className="text-blue-600 flex-shrink-0" size={20} />
                    <div>
                      <p className="font-semibold text-gray-900">High-Speed WiFi</p>
                      <p className="text-sm text-gray-600">Complimentary ultra-fast internet</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 bg-green-50 rounded-lg">
                    <Wind className="text-green-600 flex-shrink-0" size={20} />
                    <div>
                      <p className="font-semibold text-gray-900">Central A/C</p>
                      <p className="text-sm text-gray-600">Climate-controlled rooms</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 bg-purple-50 rounded-lg">
                    <Users className="text-purple-600 flex-shrink-0" size={20} />
                    <div>
                      <p className="font-semibold text-gray-900">Spacious Rooms</p>
                      <p className="text-sm text-gray-600">300+ sq ft per room</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 bg-orange-50 rounded-lg">
                    <Star className="text-orange-600 flex-shrink-0" size={20} />
                    <div>
                      <p className="font-semibold text-gray-900">5-Star Service</p>
                      <p className="text-sm text-gray-600">24/7 concierge support</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 pt-4">Amenities & Services</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "Free breakfast",
                    "Swimming pool",
                    "Fitness center",
                    "Spa & wellness",
                    "Restaurant & bar",
                    "Room service",
                    "Laundry service",
                    "Parking available",
                    "Business center",
                    "Conference rooms",
                    "Airport transfer",
                    "Travel assistance",
                  ].map((amenity, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-700">
                      <span className="text-green-600 font-bold">✓</span>
                      {amenity}
                    </li>
                  ))}
                </ul>

                <h3 className="text-xl font-bold text-gray-900 pt-4">Room Types Available</h3>
                <div className="space-y-3">
                  {roomTypes.map((room, idx) => (
                    <button
                      key={idx}
                      onClick={() => setBookingData({ ...bookingData, roomType: room.type })}
                      className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                        bookingData.roomType === room.type
                          ? "border-red-600 bg-red-50"
                          : "border-gray-200 hover:border-red-400 bg-white"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-900">{room.type}</h4>
                        <span className="text-red-600 font-bold">NPR {room.price}/night</span>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>📏 {room.size}</span>
                        <span>👥 {room.capacity}</span>
                      </div>
                      {bookingData.roomType === room.type && (
                        <div className="mt-2 text-xs font-semibold text-red-600">✓ Selected</div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Availability Status */}
                {bookingData.checkIn && bookingData.checkOut && (
                  <div className="mt-4 p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
                    {checkingAvailability ? (
                      <div className="flex items-center gap-2 text-blue-700">
                        <Loader size={18} className="animate-spin" />
                        <span className="text-sm font-semibold">Checking availability...</span>
                      </div>
                    ) : availabilityInfo ? (
                      <div>
                        <p className={`text-sm font-semibold ${availabilityInfo.available ? 'text-green-700' : 'text-red-700'}`}>
                          {availabilityInfo.available 
                            ? `✓ ${availabilityInfo.availableRooms} room(s) available` 
                            : `✗ ${availabilityInfo.message}`
                          }
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {availabilityInfo.totalRooms} room(s) of this type • {bookingData.guests} guest(s)
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Guest Reviews Section */}
              <h3 className="text-xl font-bold text-gray-900 pt-4">Guest Reviews</h3>
              <div className="space-y-4">
                {/* Overall Rating Summary */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-4xl font-bold text-red-700">{getHotelRating(hotelId) || "4.5"}</div>
                      <div className="flex gap-1 mt-1">
                        {Array.from({ length: Math.floor(getHotelRating(hotelId) || 4.5) }).map((_, i) => (
                          <Star key={i} size={18} className="fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Based on {getHotelReviews(hotelId).length} reviews</p>
                      <p className="text-sm text-gray-600">Verified guest reviews</p>
                    </div>
                  </div>
                </div>

                {/* Individual Reviews */}
                {getHotelReviews(hotelId).length > 0 ? (
                  <div className="space-y-4">
                    {getHotelReviews(hotelId).map((review) => (
                      <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-300 to-red-600 flex items-center justify-center text-white font-bold text-sm">
                              {review.userName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{review.userName}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(review.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">{review.text}</p>
                        {review.helpful > 0 && (
                          <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                            👍 {review.helpful} people found this helpful
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-2">No reviews yet</p>
                    <p className="text-sm text-gray-500">Be the first to share your experience!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              {/* Price Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Selected Room Type</p>
                    <p className="text-lg font-bold text-gray-900">{bookingData.roomType}</p>
                  </div>

                  <div>
                    <p className="text-gray-600 text-sm mb-1">Price per night</p>
                    <p className="text-3xl font-bold text-red-600">NPR {roomTypes.find(r => r.type === bookingData.roomType)?.price || hotelData.price}</p>
                  </div>

                  <div className="space-y-3 py-4 border-y border-gray-200">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Check-In
                      </label>
                      <input
                        type="date"
                        name="checkIn"
                        value={bookingData.checkIn}
                        onChange={handleBookingChange}
                        min={getTodayDate()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Check-Out
                      </label>
                      <input
                        type="date"
                        name="checkOut"
                        value={bookingData.checkOut}
                        onChange={handleBookingChange}
                        min={bookingData.checkIn ? getNextDay(bookingData.checkIn) : getTodayDate()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Guests
                      </label>
                      <select
                        name="guests"
                        value={bookingData.guests}
                        onChange={handleBookingChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        {[1, 2, 3, 4, 5, 6].map(n => (
                          <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {bookingData.checkIn && bookingData.checkOut && (
                    <div className="space-y-2 py-3 border-b border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Nights</span>
                        <span className="font-semibold">
                          {Math.max(1, (new Date(bookingData.checkOut) - new Date(bookingData.checkIn)) / (1000 * 60 * 60 * 24))}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-red-600">NPR {calculatePrice().toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (!user) {
                        navigate("/login");
                      } else {
                        setShowBookingModal(true);
                      }
                    }}
                    className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reserve Now
                  </button>

                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="w-full border-2 border-red-600 text-red-600 font-bold py-3 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Write a Review
                  </button>
                </div>
              </div>

              {/* Availability Badge */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-900 mb-2">✓ Great Availability</p>
                <p className="text-xs text-green-800">
                  {availableRooms} rooms available for your dates
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Confirmation Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Confirm Your Booking</h2>

            <div className="space-y-3 py-4 border-y border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-600">Hotel</span>
                <span className="font-semibold text-gray-900">{hotelName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Room Type</span>
                <span className="font-semibold text-gray-900">{bookingData.roomType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Check-In</span>
                <span className="font-semibold text-gray-900">{bookingData.checkIn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Check-Out</span>
                <span className="font-semibold text-gray-900">{bookingData.checkOut}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Guests</span>
                <span className="font-semibold text-gray-900">{bookingData.guests}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                <span>Total Price</span>
                <span className="text-red-600 text-xl">NPR {calculatePrice().toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={paymentLoading}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {paymentLoading ? (
                  <><Loader size={18} className="animate-spin" /> Processing...</>
                ) : (
                  "Pay with eSewa"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        hotelName={hotelName}
        hotelId={hotelId}
      />
    </div>
  );
}
