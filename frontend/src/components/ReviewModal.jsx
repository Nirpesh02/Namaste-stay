import { X, Star } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useReview } from "../context/ReviewContext";

export default function ReviewModal({ isOpen, onClose, hotelName, hotelId }) {
  const { user } = useAuth();
  const { addReview } = useReview();
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please log in to submit a review");
      return;
    }

    // Add review to context
    addReview(hotelId, hotelName, {
      rating,
      text: review,
      userName: user.name,
    });

    setSubmitted(true);
    setTimeout(() => {
      setReview("");
      setRating(5);
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Write a Review</h2>
            <p className="text-gray-600 text-sm mt-1">{hotelName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          >
            <X size={24} />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-12 space-y-4">
            <div className="text-5xl">✓</div>
            <p className="text-xl font-bold text-gray-900">Thank You!</p>
            <p className="text-gray-600">Your review has been submitted successfully</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* User Info (Read-only) */}
            {user && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <img
                  src={user.profilePicture || user.picture || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.name)}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-600 truncate">{user.email}</p>
                </div>
              </div>
            )}

            {/* Star Rating */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                How would you rate your stay?
              </label>
              <div className="flex gap-3 text-4xl flex-wrap">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-125 cursor-pointer"
                  >
                    <span
                      className={`${
                        star <= (hoveredRating || rating)
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    >
                      ★
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            </div>

            {/* Review Text */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Share your experience (optional)
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value.slice(0, 500))}
                placeholder="Tell others about your stay..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-sm"
                rows="4"
              />
              <p className="text-xs text-gray-500 mt-1">{review.length}/500</p>
            </div>

            {/* Helpful Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900 font-semibold mb-2">💡 Helpful tip:</p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Be honest and constructive</li>
                <li>• Share what you liked and disliked</li>
                <li>• Mention cleanliness, staff, and amenities</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-red-700 text-white rounded-lg font-semibold hover:bg-red-800 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Star size={18} />
                Submit Review
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
