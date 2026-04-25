import { Search, Calendar, Users, Star, MapPin, Zap } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReview } from "../context/ReviewContext";
import DistrictCard from "../components/DistrictCard";
import { provincesData } from "../data/provincesData";

// Get featured districts from each province
const districts = provincesData.map(province => {
  const featuredDistrict = province.districts.find(d => d.featured) || province.districts[0];
  return {
    province: province.key,
    title: featuredDistrict.title,
    stays: featuredDistrict.stays,
    img: featuredDistrict.img || province.img,
  };
}).slice(0, 6);

const testimonials = [
  { name: "Sarah Johnson", location: "USA", rating: 5, text: "Amazing experience! Found the perfect heritage lodge in Kathmandu. The service was exceptional.", img: "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg" },
  { name: "Michel Dupont", location: "France", rating: 5, text: "Pokhara booking was seamless. Great value for money and the staff was incredibly helpful.", img: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg" },
  { name: "Priya Sharma", location: "India", rating: 5, text: "Best platform to book stays in Nepal. Their customer support is 24/7 and helpful.", img: "https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg" },
];

export default function Home() {
  const navigate = useNavigate();
  const { reviews } = useReview();
  const [searchData, setSearchData] = useState({
    district: "",
    checkIn: "",
    checkOut: "",
    guests: "1",
  });

  // Calculate overall platform rating
  const overallRating = reviews.length > 0 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const totalReviews = reviews.length;

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

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "checkIn") {
      // Validate check-in is not in the past
      if (value && value < getTodayDate()) {
        alert("Cannot select a past date for check-in");
        return;
      }
      
      // If check-in is changed, reset check-out if it's not valid
      const newSearchData = {
        ...searchData,
        [name]: value,
      };
      
      // If check-out is set and is before or equal to new check-in, reset it
      if (searchData.checkOut && searchData.checkOut <= value) {
        newSearchData.checkOut = "";
      }
      
      setSearchData(newSearchData);
    } else if (name === "checkOut") {
      // Validate check-out is after check-in
      if (searchData.checkIn && value <= searchData.checkIn) {
        alert("Check-out date must be after check-in date");
        return;
      }
      
      // Validate check-out is not in the past
      if (value && value < getTodayDate()) {
        alert("Cannot select a past date for check-out");
        return;
      }
      
      setSearchData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setSearchData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!searchData.district.trim()) {
      alert("Please select a district");
      return;
    }

    // Validate dates are not in the past at submission time
    const today = getTodayDate();
    if (searchData.checkIn && searchData.checkIn < today) {
      alert("Check-in date cannot be in the past. Please select a valid date.");
      return;
    }
    if (searchData.checkOut && searchData.checkOut < today) {
      alert("Check-out date cannot be in the past. Please select a valid date.");
      return;
    }
    if (searchData.checkIn && searchData.checkOut && searchData.checkOut <= searchData.checkIn) {
      alert("Check-out date must be after check-in date.");
      return;
    }

    // Build query string
    const params = new URLSearchParams({
      district: searchData.district,
      ...(searchData.checkIn && { checkIn: searchData.checkIn }),
      ...(searchData.checkOut && { checkOut: searchData.checkOut }),
      guests: searchData.guests || "1",
    });

    // Navigate to listings with filters
    navigate(`/listings?${params.toString()}`);
  };

  return (
    <div className="bg-[#fdf8f9] bg-[linear-gradient(45deg,rgba(255,255,255,.95),rgba(255,245,245,.95))] min-h-screen">
      {/* Hero Section */}
      <section className="relative h-140 overflow-hidden">
        <img
          src="https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg"
          className="w-full h-full object-cover filter brightness-75"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/50 via-black/20 to-transparent" />

        <div className="absolute inset-0 max-w-7xl mx-auto px-6 flex flex-col justify-center items-center text-center">
          <h1 className="text-5xl md:text-7xl font-serif italic font-bold text-white drop-shadow-lg leading-tight">
            Experience the Soul of Nepal
          </h1>

          <p className="text-white text-lg max-w-2xl mt-4 drop-shadow-md">
            Discover authentic stays across all 77 districts of Nepal
          </p>

          <form onSubmit={handleSearch} className="mt-8 w-full max-w-4xl bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl py-4 px-6 flex flex-wrap justify-center items-center gap-3">
            <div className="flex items-center gap-2 border-r pr-4">
              <Search size={18} className="text-red-600" />
              <input
                type="text"
                name="district"
                value={searchData.district}
                onChange={handleSearchChange}
                placeholder="Which district"
                className="outline-none px-2 text-sm w-40 bg-transparent"
              />
            </div>
            <div className="flex items-center gap-2 border-r pr-4">
              <Calendar size={18} className="text-red-600" />
              <input
                type="date"
                name="checkIn"
                value={searchData.checkIn}
                onChange={handleSearchChange}
                min={getTodayDate()}
                className="outline-none px-2 text-sm w-28 bg-transparent"
              />
            </div>
            <div className="flex items-center gap-2 border-r pr-4">
              <Calendar size={18} className="text-red-600" />
              <input
                type="date"
                name="checkOut"
                value={searchData.checkOut}
                onChange={handleSearchChange}
                min={searchData.checkIn ? getNextDay(searchData.checkIn) : getTodayDate()}
                className="outline-none px-2 text-sm w-28 bg-transparent"
              />
            </div>
            <div className="flex items-center gap-2 border-r pr-4">
              <Users size={18} className="text-red-600" />
              <select
                name="guests"
                value={searchData.guests}
                onChange={handleSearchChange}
                className="outline-none px-2 text-sm w-20 bg-transparent"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="bg-red-700 text-white px-6 py-2 rounded-full font-semibold hover:bg-red-800 transition"
            >
              Find your stay
            </button>
          </form>
        </div>
      </section>

      {/* Districts Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div
          className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8"
        >
          <h2 className="text-4xl font-bold">Explore by District</h2>
          <p className="text-sm text-gray-500">From the vibrant markets of Kathmandu to serene lakes of Pokhara.</p>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {districts.map((district) => (
            <div key={district.title}>
              <DistrictCard {...district} />
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="cursor-pointer">
                <h3 className="text-3xl font-bold text-red-700">{provincesData.reduce((sum, p) => sum + p.districts.length, 0)}</h3>
                <p className="text-xs text-gray-500">DISTRICTS COVERED</p>
              </div>
              <div className="cursor-pointer">
                <h3 className="text-3xl font-bold text-red-700">7</h3>
                <p className="text-xs text-gray-500">PROVINCES</p>
              </div>
              <div className="cursor-pointer">
                <h3 className="text-3xl font-bold text-red-700">{provincesData.reduce((sum, p) => sum + p.districts.reduce((dSum, d) => dSum + d.hotels.length, 0), 0)}+</h3>
                <p className="text-xs text-gray-500">TOTAL HOTELS</p>
              </div>
              <div className="cursor-pointer">
                <h3 className="text-3xl font-bold text-red-700">24/7</h3>
                <p className="text-xs text-gray-500">LOCAL SUPPORT</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-4xl font-serif font-bold">Every Corner of Nepal, Within Your Reach.</h3>
            <p className="text-gray-600 mt-4">From far west heights of Darchula to eastern plains of Jhapa, discover heritage stays in all 77 districts.</p>
            <div className="mt-6 flex gap-2 flex-wrap">
              {["Mustang","Solukhumbu","Dolpa","Manang", "Ilam"].map((name) => (
                <span
                  key={name}
                  className="px-4 py-1 text-xs text-red-700 border border-red-200 rounded-full cursor-pointer transition-colors hover:bg-red-50"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why Choose Namaste Stay?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Zap size={32} className="text-red-600" />,
              title: "Instant Booking",
              desc: "Confirm your stay in seconds with our easy booking process"
            },
            {
              icon: <MapPin size={32} className="text-red-600" />,
              title: "Local Expertise",
              desc: "Our team knows every corner of Nepal like the back of their hand"
            },
            {
              icon: <Star size={32} className="text-red-600" />,
              title: "Verified Stays",
              desc: "All properties are verified for quality and authenticity"
            }
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-xl text-center shadow-md hover:shadow-lg transition-all hover:scale-105"
            >
              <div className="flex justify-center mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-center mb-4">
          What Our Guests Say
        </h2>

        {/* Overall Rating Card */}
        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl p-8 mb-12 text-center">
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div>
              <div className="text-5xl font-bold text-red-700 mb-2">{overallRating}</div>
              <div className="flex justify-center gap-1 mb-2">
                {Array.from({ length: Math.floor(overallRating) }).map((_, i) => (
                  <Star key={i} size={24} className="fill-yellow-400 text-yellow-400" />
                ))}
                {overallRating % 1 !== 0 && <Star size={24} className="fill-yellow-200 text-yellow-400" />}
              </div>
              <p className="text-gray-700 font-semibold">Platform Rating</p>
            </div>
            <div className="border-l-2 border-red-200 h-20"></div>
            <div>
              <h3 className="text-3xl font-bold text-red-700 mb-1">{totalReviews}+</h3>
              <p className="text-gray-700 font-semibold">Guest Reviews</p>
              <p className="text-xs text-gray-600">Verified reviews from real travelers</p>
            </div>
          </div>
        </div>

        {/* Guest Reviews */}
        {totalReviews > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...reviews].reverse().slice(0, 3).map((review) => (
              <div
                key={review.id}
                className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-300 to-red-600 flex items-center justify-center text-white font-bold text-lg">
                    {review.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{review.userName}</h4>
                    <p className="text-xs text-gray-500">{review.hotelName}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm italic">"{review.text}"</p>
                <p className="text-xs text-gray-400 mt-4">
                  {new Date(review.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Reviews Yet</h3>
            <p className="text-gray-600">Be the first to share your Namaste Stay experience!</p>
          </div>
        )}

        {/* Fallback Static Testimonials if No Reviews */}
        {totalReviews === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={testimonial.img}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-800">{testimonial.name}</h4>
                    <p className="text-xs text-gray-500">{testimonial.location}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm italic">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 mb-6">
        <div className="bg-linear-to-r from-red-700 to-red-600 rounded-3xl p-12 text-white text-center hover:scale-102 transition-transform">
          <h2 className="text-3xl font-bold mb-4">Ready to Explore Nepal?</h2>
          <p className="mb-6 text-red-100">Start your next adventure with Namaste Stay</p>
          <button className="bg-white text-red-700 font-bold px-8 py-3 rounded-full hover:bg-gray-100 transition">
            Browse All Stays
          </button>
        </div>
      </section>
    </div>
  );
}
