import { Search } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { provincesData } from "../data/provincesData";

export default function Districts() {
  const [selectedProvince, setSelectedProvince] = useState("All Provinces");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const filteredProvinces = useMemo(() => {
    let filtered = provincesData;

    // Filter by province
    if (selectedProvince !== "All Provinces") {
      filtered = filtered.filter((p) => p.key === selectedProvince);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.map((province) => ({
        ...province,
        districts: province.districts.filter((district) =>
          district.title.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((province) => province.districts.length > 0);
    }

    return filtered;
  }, [selectedProvince, searchQuery]);

  const handleDistrictClick = (districtName) => {
    navigate(`/stays?district=${encodeURIComponent(districtName)}`);
  };

  const allProvinceFilters = ['All Provinces', 'Koshi', 'Bagmati', 'Gandaki', 'Lumbini', 'Madhesh', 'Karnali', 'Sudurpashchim'];

  return (
    <main className="bg-[#fdf8f9] min-h-screen">
      {/* Hero Section */}
      <section className="bg-linear-to-r from-red-700 to-red-600 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-red-100 uppercase tracking-wider text-sm font-semibold mb-3">
            Discover Nepal
          </p>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Explore Our 7 Provinces
          </h1>
          <p className="text-red-50 text-lg max-w-2xl mx-auto">
            Journey through Nepal's diverse regions, from mountain peaks to spiritual sanctuaries
          </p>
        </div>
      </section>

      {/* Search Bar */}
      <section className="max-w-7xl mx-auto px-6 py-8 -mt-6 relative z-10">
        <div className="w-full flex border border-gray-300 rounded-full bg-white px-4 py-3 items-center gap-2 shadow-lg">
          <Search size={18} className="text-gray-400" />
          <input
            placeholder="Search by province or district name..."
            className="grow outline-none text-base bg-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {/* Content */}
      {selectedProvince === "All Provinces" && searchQuery === "" ? (
        // Province Cards Grid
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {provincesData.map((province) => (
              <button
                key={province.key}
                onClick={() => setSelectedProvince(province.key)}
                className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:scale-105 text-left h-80 focus:outline-none"
              >
                {/* Background Image */}
                <img
                  src={province.img}
                  alt={province.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent group-hover:from-black/90 group-hover:via-black/50 transition-all duration-300" />
                
                {/* Content */}
                <div className="relative h-full flex flex-col justify-end p-6 text-white">
                  {/* Highlight Badge */}
                  <span className="inline-flex w-fit text-xs uppercase tracking-widest bg-red-600/90 px-3 py-1 rounded-full font-bold mb-3 group-hover:bg-red-500 transition-colors">
                    {province.highlight}
                  </span>
                  
                  {/* Title */}
                  <h3 className="text-2xl font-bold mb-2">{province.title}</h3>
                  
                  {/* Description */}
                  <p className="text-red-50 text-sm mb-4 line-clamp-2">{province.description}</p>
                  
                  {/* Stats */}
                  <div className="flex gap-4 text-sm font-semibold opacity-90">
                    <div>
                      <p className="text-red-200 text-xs">DISTRICTS</p>
                      <p className="text-lg">{province.districts.length}</p>
                    </div>
                    <div>
                      <p className="text-red-200 text-xs">STAYS</p>
                      <p className="text-lg">{province.totalStays}</p>
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  <div className="mt-4 flex items-center gap-2 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Explore <span className="text-lg">→</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : (
        // Districts View
        <section className="max-w-7xl mx-auto px-6 py-8">
          {/* Province Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-8">
            {allProvinceFilters.map((p) => (
              <button
                key={p}
                onClick={() => setSelectedProvince(p)}
                className={`text-sm px-4 py-2 rounded-full transition-all font-medium ${
                  selectedProvince === p
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p === "All Provinces" ? "← Back to All" : p}
              </button>
            ))}
          </div>

          {filteredProvinces.length > 0 ? (
            filteredProvinces.map((province) => (
              <div key={province.key} className="mb-12">
                {/* Province Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">{province.title}</h2>
                    <p className="text-gray-600 mt-2">{province.subtitle}</p>
                    <p className="text-gray-500 text-sm mt-2">{province.description}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-lg text-center min-w-[150px]">
                    <p className="text-sm text-gray-600 font-medium">Total Accommodations</p>
                    <p className="text-3xl font-bold text-red-600">{province.totalStays}</p>
                  </div>
                </div>

                {/* Districts Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {province.districts.map((district) => (
                    <button
                      key={district.title}
                      onClick={() => handleDistrictClick(district.title)}
                      className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:scale-[1.02] text-left bg-white"
                    >
                      {district.featured && district.img ? (
                        // Featured District with Image
                        <>
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={district.img}
                              alt={district.title}
                              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-400"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                          </div>
                          <div className="p-4">
                            <h3 className="text-lg font-bold text-gray-900">{district.title}</h3>
                            <p className="text-red-600 text-sm font-semibold mt-1">{district.stays}</p>
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs font-semibold text-gray-600 mb-2">Featured Hotels:</p>
                              {district.hotels.slice(0, 2).map((hotel, idx) => (
                                <div key={idx} className="text-xs mb-1">
                                  <p className="font-semibold text-gray-800">{hotel.name}</p>
                                  <p className="text-gray-600">⭐ {hotel.rating} • NPR {hotel.price}</p>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 flex items-center gap-1 text-red-600 font-semibold text-sm group-hover:gap-2 transition-all">
                              Browse Hotels <span>→</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        // Regular District
                        <div className="p-4 h-full flex flex-col justify-between hover:bg-red-50 transition-colors">
                          <div>
                            <h3 className="font-bold text-gray-900 text-base">{district.title}</h3>
                            <p className="text-red-600 text-sm font-semibold mt-1">{district.stays}</p>
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs font-semibold text-gray-600 mb-2">Top Hotels:</p>
                              {district.hotels.slice(0, 2).map((hotel, idx) => (
                                <div key={idx} className="text-xs mb-1">
                                  <p className="font-semibold text-gray-800 line-clamp-1">{hotel.name}</p>
                                  <p className="text-gray-600 text-xs">⭐ {hotel.rating}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-red-600 font-semibold text-sm group-hover:gap-2 transition-all mt-3">
                            View <span>→</span>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <p className="text-gray-600 text-xl font-semibold">No districts found</p>
              <p className="text-gray-500 mt-2">Try adjusting your search terms</p>
              <button
                onClick={() => {
                  setSelectedProvince("All Provinces");
                  setSearchQuery("");
                }}
                className="mt-6 bg-red-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-700 transition-colors"
              >
                Back to Provinces
              </button>
            </div>
          )}
        </section>
      )}

      {/* Info Section */}
      {selectedProvince === "All Provinces" && searchQuery === "" && (
        <section className="bg-white py-12 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-4xl font-bold text-red-600">7</p>
                <p className="text-gray-700 font-semibold mt-2">Provinces</p>
                <p className="text-gray-500 text-sm mt-1">Across Nepal</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-red-600">77</p>
                <p className="text-gray-700 font-semibold mt-2">Districts</p>
                <p className="text-gray-500 text-sm mt-1">Waiting to explore</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-red-600">1,100+</p>
                <p className="text-gray-700 font-semibold mt-2">Accommodations</p>
                <p className="text-gray-500 text-sm mt-1">Ready to book</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
