import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { X, Search } from "lucide-react";
import { provincesData } from "../data/provincesData";

export default function SearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase().trim();
    const results = [];

    provincesData.forEach(province => {
      province.districts.forEach(district => {
        // Search in district name
        if (district.title.toLowerCase().includes(query)) {
          results.push({
            type: "district",
            title: district.title,
            province: province.key,
            description: `${district.stays} in ${province.title}`,
          });
        }

        // Search in hotel names
        district.hotels.forEach(hotel => {
          if (hotel.name.toLowerCase().includes(query)) {
            results.push({
              type: "hotel",
              title: hotel.name,
              district: district.title,
              province: province.key,
              rating: hotel.rating,
              price: hotel.price,
              description: `${district.title}, ${province.title}`,
            });
          }
        });
      });
    });

    return results.slice(0, 10); // Limit to 10 results
  }, [searchQuery]);

  const handleSelectDistrict = (district) => {
    navigate(`/listings?district=${encodeURIComponent(district)}`);
    setSearchQuery("");
    onClose();
  };

  const handleSelectHotel = (hotelDistrict) => {
    navigate(`/listings?district=${encodeURIComponent(hotelDistrict)}`);
    setSearchQuery("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-96 overflow-hidden flex flex-col">
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-white">
          <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-gray-200">
            <Search size={20} className="text-red-600" />
            <input
              type="text"
              placeholder="Search districts, hotels, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="flex-1 outline-none text-gray-900 placeholder-gray-500"
            />
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          {searchQuery && (
            <p className="mt-2 text-xs text-gray-600">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1">
          {searchQuery.trim() === "" ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-sm">Start typing to search districts and hotels</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-sm">No results found for "{searchQuery}"</p>
              <p className="text-xs mt-2">Try searching for district or hotel names</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() =>
                    result.type === "district"
                      ? handleSelectDistrict(result.title)
                      : handleSelectHotel(result.district)
                  }
                  className="w-full text-left p-3 rounded-lg hover:bg-red-50 transition-colors border border-gray-100 hover:border-red-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{result.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{result.description}</p>
                    </div>
                    {result.type === "hotel" && (
                      <div className="text-right">
                        <div className="text-xs font-semibold text-gray-900">
                          NPR {result.price}
                        </div>
                        <div className="text-xs text-yellow-600">⭐ {result.rating}</div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
