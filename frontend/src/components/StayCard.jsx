import { Heart, MapPin, Users, Wifi, Wind, Calendar, X, MessageCircle, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFavorite } from "../context/FavoriteContext";
import { useReview } from "../context/ReviewContext";
import ReviewModal from "./ReviewModal";

export default function StayCard({ title, subtitle, price, img, rating, tag, district, roomImages = [] }) {
  const navigate = useNavigate();
  const { user, addBooking, bookings } = useAuth();
  const { isFavorite, addFavorite, removeFavorite } = useFavorite();
  const { getHotelRating, getHotelReviews } = useReview();
  const [isHovered, setIsHovered] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bookingData, setBookingData] = useState({
    checkIn: "",
    checkOut: "",
    guests: "1",
  });

  // Create hotel ID from title (for URL)
  const hotelId = title.replace(/\s+/g, "-").toLowerCase();
  const isLiked = isFavorite(hotelId);

  // Combine property image with room images
  const allImages = [img, ...roomImages].filter(Boolean);
  const currentImage = allImages[currentImageIndex] || img;

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

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleCardClick = () => {
    navigate(`/hotel/${hotelId}`);
  };

  const handleBookClick = (e) => {
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    setShowBookingModal(true);
  };

  const handleReviewClick = (e) => {
    e.stopPropagation();
    setShowReviewModal(true);
  };

  const handleFavoriteToggle = (e) => {
    e.stopPropagation();
    if (isLiked) {
      removeFavorite(hotelId);
    } else {
      addFavorite(hotelId, title, img, subtitle, price);
    }
  };

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "checkIn") {
      // Validate check-in is not in the past
      if (value && value < getTodayDate()) {
        alert("Cannot select a past date for check-in");
        return;
      }
      
      // If check-in is changed, reset check-out if it's not valid
      const newBookingData = {
        ...bookingData,
        [name]: value,
      };
      
      // If check-out is set and is before or equal to new check-in, reset it
      if (bookingData.checkOut && bookingData.checkOut <= value) {
        newBookingData.checkOut = "";
      }
      
      setBookingData(newBookingData);
    } else if (name === "checkOut") {
      // Validate check-out is after check-in
      if (bookingData.checkIn && value <= bookingData.checkIn) {
        alert("Check-out date must be after check-in date");
        return;
      }
      
      // Validate check-out is not in the past
      if (value && value < getTodayDate()) {
        alert("Cannot select a past date for check-out");
        return;
      }
      
      setBookingData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setBookingData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const calculatePrice = () => {
    const pricePerNight = parseInt(price.replace(/[^0-9]/g, ''));
    if (!bookingData.checkIn || !bookingData.checkOut) return pricePerNight;
    
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    const nights = Math.max(1, (checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    return pricePerNight * nights;
  };

  const handleConfirmBooking = () => {
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

    // Check for overlapping bookings on the same hotel
    const overlappingBooking = bookings.find((existing) => {
      if (existing.status === "cancelled") return false;
      if (existing.hotelName !== title) return false;
      return bookingData.checkIn < existing.checkOut && bookingData.checkOut > existing.checkIn;
    });

    if (overlappingBooking) {
      alert(
        `${overlappingBooking.hotelName} is already booked from ${overlappingBooking.checkIn} to ${overlappingBooking.checkOut}. Please select different dates.`
      );
      return;
    }

    const booking = {
      hotelName: title,
      district: district || subtitle,
      province: tag || "Nepal",
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      guests: bookingData.guests,
      price: price.replace(/[^0-9]/g, ''),
      totalPrice: calculatePrice(),
      rating: rating,
      image: img,
    };

    try {
      addBooking(booking);
    } catch (error) {
      alert(error.message);
      return;
    }
    setShowBookingModal(false);
    setBookingData({ checkIn: "", checkOut: "", guests: "1" });
    
    // Show success message
    alert(`Booking confirmed! Check "My Bookings" to view your reservation.`);
    navigate("/bookings");
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-2xl hover:scale-[1.02] transition-all h-full flex flex-col cursor-pointer"
      >
        <div className="relative overflow-hidden h-56 bg-gray-200">
          <img
          src={currentImage}
          alt={title}
          className={`h-full w-full object-cover transition-transform duration-400 ${isHovered ? 'scale-110' : ''}`}
        />
        
        <div className={`absolute inset-0 transition-colors duration-300 ${isHovered ? 'bg-black/20' : 'bg-black/0'}`} />

        {/* Image Navigation */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-all opacity-0 hover:opacity-100 group-hover:opacity-100"
            >
              <ChevronLeft size={18} className="text-gray-900" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-all opacity-0 hover:opacity-100 group-hover:opacity-100"
            >
              <ChevronRight size={18} className="text-gray-900" />
            </button>
            {/* Image Counter */}
            <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-semibold">
              {currentImageIndex + 1}/{allImages.length}
            </div>
          </>
        )}

        {tag && (
          <span className="absolute top-3 left-3 bg-red-700 text-white text-xs font-semibold px-3 py-1 rounded-full">
            {tag}
          </span>
        )}

          <div className="absolute top-3 right-3 flex gap-2">
            {rating && (
              <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                ⭐ {rating}
              </div>
            )}
            <button
              onClick={handleFavoriteToggle}
              className="bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white hover:scale-110 transition-all"
              title={isLiked ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                size={18}
                className={isLiked ? "fill-red-500 text-red-500" : "text-gray-600"}
              />
            </button>
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 line-clamp-2">{title}</h3>
          
          <div className="flex items-center gap-1 text-gray-500 mt-1 text-sm">
            <MapPin size={14} />
            <p>{subtitle}</p>
          </div>

          <div className="my-3 flex gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
              <Wifi size={12} /> WiFi
            </span>
            <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
              <Wind size={12} /> Air-con
            </span>
          </div>

          {/* Rating and Review Section */}
          <div className="py-3 border-t border-gray-200 mt-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.floor(getHotelRating(hotelId) || 4) }).map((_, i) => (
                  <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-sm font-semibold text-gray-800 ml-1">{getHotelRating(hotelId) || "4.5"}</span>
              </div>
              <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                {getHotelReviews(hotelId).length} {getHotelReviews(hotelId).length === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>

          <div className="mt-auto">
            <div className="flex items-baseline gap-2 mb-4">
              <p className="text-red-700 text-2xl font-bold">{price.split('/')[0]}</p>
              <p className="text-gray-500 text-xs">/ night</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleBookClick}
                className="flex-1 bg-red-700 text-white font-semibold py-3 rounded-xl hover:bg-red-800 hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <span>Book Now</span>
              </button>
              <button
                onClick={handleReviewClick}
                className="flex-1 border-2 border-red-700 text-red-700 font-semibold py-3 rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} />
                <span>Review</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Complete Your Booking</h2>
                <p className="text-gray-600 text-sm mt-1">{title}</p>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Booking Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Check-In Date
                </label>
                <input
                  type="date"
                  name="checkIn"

                  value={bookingData.checkIn}
                  onChange={handleBookingChange}
                  min={getTodayDate()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Check-Out Date
                </label>
                <input
                  type="date"
                  name="checkOut"
                  value={bookingData.checkOut}
                  onChange={handleBookingChange}
                  min={bookingData.checkIn ? getNextDay(bookingData.checkIn) : getTodayDate()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Guests
                </label>
                <select
                  name="guests"
                  value={bookingData.guests}
                  onChange={handleBookingChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Price per night</span>
                <span className="font-semibold text-gray-900">{price}</span>
              </div>
              {bookingData.checkIn && bookingData.checkOut && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Number of nights</span>
                    <span className="font-semibold text-gray-900">
                      {Math.max(1, (new Date(bookingData.checkOut) - new Date(bookingData.checkIn)) / (1000 * 60 * 60 * 24))}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between">
                    <span className="font-semibold text-gray-900">Total Price</span>
                    <span className="text-lg font-bold text-red-700">NPR {calculatePrice().toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                className="flex-1 px-4 py-3 bg-red-700 text-white rounded-lg font-semibold hover:bg-red-800 transition-colors"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        hotelName={title}
        hotelId={hotelId}
      />
    </>
  );
}