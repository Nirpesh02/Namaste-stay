import { useNavigate } from "react-router-dom";
import { Heart, X, MapPin } from "lucide-react";
import { useFavorite } from "../context/FavoriteContext";
import { useReview } from "../context/ReviewContext";

export default function Favorites() {
  const navigate = useNavigate();
  const { favorites, removeFavorite } = useFavorite();
  const { getHotelRating, getHotelReviews } = useReview();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">My Favorites</h1>
          <p className="text-gray-600 mt-2">
            {favorites.length === 0 
              ? "No favorites yet. Start adding your favorite stays!" 
              : `You have ${favorites.length} favorite${favorites.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="space-y-4">
              <Heart size={48} className="mx-auto text-gray-300" />
              <h2 className="text-2xl font-bold text-gray-700">No favorites yet</h2>
              <p className="text-gray-600">
                Explore our stays and add your favorites to save them for later
              </p>
              <button
                onClick={() => navigate("/districts")}
                className="mt-6 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold inline-block transition-colors"
              >
                Explore Stays
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => (
              <div
                key={favorite.hotelId}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="h-48 overflow-hidden bg-gray-200 relative">
                  <img
                    src={favorite.hotelImage || "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg"}
                    alt={favorite.hotelName}
                    className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => navigate(`/hotel/${favorite.hotelName.replace(/\s+/g, "-").toLowerCase()}`)}
                  />
                  <button
                    onClick={() => removeFavorite(favorite.hotelId)}
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                    title="Remove from favorites"
                  >
                    <Heart size={20} className="text-red-600 fill-red-600" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h3 
                      className="text-lg font-bold text-gray-900 hover:text-red-600 cursor-pointer transition-colors"
                      onClick={() => navigate(`/hotel/${favorite.hotelName.replace(/\s+/g, "-").toLowerCase()}`)}
                    >
                      {favorite.hotelName}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <div className="flex items-center gap-1 text-yellow-500">
                        {(() => {
                          const rating = getHotelRating(favorite.hotelId) || 4.5;
                          const stars = Math.floor(rating);
                          return (
                            <>
                              {"★".repeat(Math.max(1, stars))}
                              <span className="text-gray-600 ml-1 text-sm">({rating})</span>
                            </>
                          );
                        })()}
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {getHotelReviews(favorite.hotelId).length} reviews
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-red-600 shrink-0" />
                      <span>{favorite.district}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">NPR {favorite.price?.toLocaleString() || "2,500"}</span>
                      <span className="text-gray-500">per night</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => navigate(`/hotel/${favorite.hotelName.replace(/\s+/g, "-").toLowerCase()}`)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors text-sm"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => removeFavorite(favorite.hotelId)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      title="Remove"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    Added {new Date(favorite.addedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
