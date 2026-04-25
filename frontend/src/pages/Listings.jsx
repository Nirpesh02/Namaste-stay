import StayCard from "../components/StayCard";
import { useState, useMemo } from "react";
import { Filter, BarChart3 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { provincesData } from "../data/provincesData";

// Generate stays from provinces data
const generateStaysFromProvinces = () => {
  const staysMap = new Map();
  const stayImages = [
    "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg",
    "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg",
    "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg",
    "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg",
    "https://images.pexels.com/photos/2398220/pexels-photo-2398220.jpeg",
    "https://images.pexels.com/photos/1456265/pexels-photo-1456265.jpeg",
  ];
  
  let stayIndex = 0;
  
  provincesData.forEach(province => {
    province.districts.forEach(district => {
      district.hotels.forEach((hotel, idx) => {
        const stay = {
          id: `${district.title}-${hotel.name}`,
          title: hotel.name,
          subtitle: district.title,
          price: `NPR ${hotel.price} / night`,
          img: stayImages[stayIndex % stayImages.length],
          rating: hotel.rating,
          tag: district.title,
          amenities: "WiFi,Breakfast,Parking",
          district: district.title,
          roomImages: hotel.roomImages || [],
        };
        staysMap.set(stay.id, stay);
        stayIndex++;
      });
    });
  });
  
  return Array.from(staysMap.values());
};

const allStays = generateStaysFromProvinces();

export default function Listings() {
  const [searchParams] = useSearchParams();
  const selectedDistrict = searchParams.get("district");
  
  const [priceRange, setPriceRange] = useState([2000, 50000]);
  const [selectedRating, setSelectedRating] = useState(null);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [sortBy, setSortBy] = useState("popular");
  const [showFilters, setShowFilters] = useState(true);

  const filteredAndSortedStays = useMemo(() => {
    let filtered = allStays;
    
    // Filter by district if selected
    if (selectedDistrict) {
      filtered = filtered.filter(stay => stay.district === selectedDistrict);
    }

    filtered = filtered.filter(stay => {
      const price = parseInt(stay.price.replace(/[^0-9]/g, ''));
      const stayRating = parseFloat(stay.rating);

      // Price filter
      if (price < priceRange[0] || price > priceRange[1]) return false;

      // Rating filter
      if (selectedRating && stayRating < selectedRating) return false;

      // Amenities filter
      if (selectedAmenities.length > 0) {
        const stayAmenities = stay.amenities.split(',');
        const hasAmenities = selectedAmenities.every(amenity =>
          stayAmenities.some(a => a.toLowerCase().includes(amenity.toLowerCase()))
        );
        if (!hasAmenities) return false;
      }

      return true;
    });

    // Sort
    if (sortBy === "price-low") {
      filtered.sort((a, b) => parseInt(a.price.replace(/[^0-9]/g, '')) - parseInt(b.price.replace(/[^0-9]/g, '')));
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => parseInt(b.price.replace(/[^0-9]/g, '')) - parseInt(a.price.replace(/[^0-9]/g, '')));
    } else if (sortBy === "rating") {
      filtered.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    }
    // "popular" is default order

    return filtered;
  }, [selectedDistrict, priceRange, selectedRating, selectedAmenities, sortBy]);

  const amenitiesOptions = ['WiFi', 'Breakfast Included', 'Spa & Wellness', 'Parking', 'Mountain View'];

  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  return (
    <main className="bg-[#fdf8f9] min-h-screen">
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">
            {selectedDistrict ? `Hotels in ${selectedDistrict}` : "Available Stays"}
          </h1>
          <p className="text-gray-500 mt-1">
            {selectedDistrict 
              ? `Found ${filteredAndSortedStays.length} hotels in ${selectedDistrict}`
              : `Found ${filteredAndSortedStays.length} stays matching your preferences`
            }
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 pb-12 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Filters Sidebar */}
        <aside className="bg-white p-5 rounded-2xl shadow-md h-fit sticky top-20">
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <h2 className="text-lg font-bold">Filters</h2>
            <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden">
              <Filter size={20} />
            </button>
          </div>

          {showFilters && (
            <div className="space-y-5">
              {/* Price Range */}
              <div>
                <div className="text-xs uppercase text-gray-500 tracking-wider font-semibold mb-3">PRICE RANGE (NPR)</div>
                <input
                  type="range"
                  min="2000"
                  max="50000"
                  step="1000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full accent-red-700"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-2 font-semibold">
                  <span>NPR {priceRange[0].toLocaleString()}</span>
                  <span>NPR {priceRange[1].toLocaleString()}+</span>
                </div>
              </div>

              {/* Star Rating */}
              <div>
                <div className="text-xs uppercase text-gray-500 tracking-wider font-semibold mb-3">MINIMUM RATING</div>
                <div className="flex gap-2">
                  {[null, 4.5, 4, 3.5, 3].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setSelectedRating(rating)}
                      className={`w-10 h-10 rounded-full font-semibold transition-all hover:scale-110 ${
                        selectedRating === rating
                          ? 'bg-red-700 text-white shadow-lg'
                          : 'bg-white border border-gray-300 text-gray-700 hover:border-red-400'
                      }`}
                    >
                      {rating ? rating : 'Any'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <div className="text-xs uppercase text-gray-500 tracking-wider font-semibold mb-3">Amenities</div>
                {amenitiesOptions.map((amenity) => (
                  <label
                    key={amenity}
                    className="flex items-center gap-2 text-sm mt-2 cursor-pointer hover:text-red-700 transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="accent-red-700 cursor-pointer"
                      checked={selectedAmenities.includes(amenity)}
                      onChange={() => toggleAmenity(amenity)}
                    />
                    {amenity}
                  </label>
                ))}
              </div>

              {/* Apply Button */}
              <button className="w-full bg-red-700 text-white py-3 rounded-xl font-semibold mt-6 hover:bg-red-800 transition-colors">
                Apply Filters
              </button>

              {(selectedAmenities.length > 0 || selectedRating) && (
                <button
                  onClick={() => {
                    setSelectedAmenities([]);
                    setSelectedRating(null);
                    setPriceRange([2000, 50000]);
                  }}
                  className="w-full bg-gray-200 text-gray-700 py-2 rounded-xl font-semibold hover:bg-gray-300 transition-colors text-sm"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </aside>

        {/* Listings */}
        <section>
          {/* Sorting */}
          <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <BarChart3 size={18} />
              Showing {filteredAndSortedStays.length} results
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-red-600"
            >
              <option value="popular">Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          {/* Cards Grid */}
          {filteredAndSortedStays.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAndSortedStays.map((stay) => (
                <div key={stay.title}>
                  <StayCard {...stay} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
              <div className="text-gray-400 text-5xl mb-4">🏨</div>
              <p className="text-gray-600 text-lg font-semibold">No stays match your filters.</p>
              <p className="text-gray-500 mt-2">Try adjusting your criteria</p>
              <button
                onClick={() => {
                  setSelectedAmenities([]);
                  setSelectedRating(null);
                  setPriceRange([2000, 50000]);
                }}
                className="mt-4 bg-red-700 text-white px-6 py-2 rounded-full font-semibold hover:bg-red-800 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
