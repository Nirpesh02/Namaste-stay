import { createContext, useContext, useState, useEffect } from "react";

const ReviewContext = createContext();

export function ReviewProvider({ children }) {
  const [reviews, setReviews] = useState([]);

  // Load reviews from localStorage on mount
  useEffect(() => {
    const savedReviews = JSON.parse(localStorage.getItem("hotelReviews") || "[]");
    setReviews(savedReviews);
  }, []);

  // Save reviews to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("hotelReviews", JSON.stringify(reviews));
  }, [reviews]);

  const addReview = (hotelId, hotelName, { rating, text, userName }) => {
    const newReview = {
      id: Date.now(),
      hotelId,
      hotelName,
      rating,
      text,
      userName,
      date: new Date().toISOString(),
      helpful: 0,
    };
    setReviews([newReview, ...reviews]);
    return newReview;
  };

  const getHotelReviews = (hotelId) => {
    return reviews.filter(review => review.hotelId === hotelId).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getHotelRating = (hotelId) => {
    const hotelReviews = getHotelReviews(hotelId);
    if (hotelReviews.length === 0) return 0;
    const avgRating = hotelReviews.reduce((sum, review) => sum + review.rating, 0) / hotelReviews.length;
    return Math.round(avgRating * 10) / 10;
  };

  const deleteReview = (reviewId) => {
    setReviews(reviews.filter(review => review.id !== reviewId));
  };

  const likeReview = (reviewId) => {
    setReviews(reviews.map(review => 
      review.id === reviewId 
        ? { ...review, helpful: review.helpful + 1 }
        : review
    ));
  };

  return (
    <ReviewContext.Provider value={{ 
      reviews, 
      addReview, 
      getHotelReviews, 
      getHotelRating,
      deleteReview,
      likeReview
    }}>
      {children}
    </ReviewContext.Provider>
  );
}

export function useReview() {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error("useReview must be used within ReviewProvider");
  }
  return context;
}
