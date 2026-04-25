import { createContext, useContext, useState, useEffect } from "react";

const FavoriteContext = createContext();

export function FavoriteProvider({ children }) {
  const [favorites, setFavorites] = useState([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavorites(savedFavorites);
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (hotelId, hotelName, hotelImage, district, price) => {
    const favoriteExists = favorites.some(fav => fav.hotelId === hotelId);
    if (!favoriteExists) {
      setFavorites([
        ...favorites,
        { hotelId, hotelName, hotelImage, district, price, addedAt: new Date().toISOString() }
      ]);
    }
  };

  const removeFavorite = (hotelId) => {
    setFavorites(favorites.filter(fav => fav.hotelId !== hotelId));
  };

  const isFavorite = (hotelId) => {
    return favorites.some(fav => fav.hotelId === hotelId);
  };

  return (
    <FavoriteContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoriteContext.Provider>
  );
}

export function useFavorite() {
  const context = useContext(FavoriteContext);
  if (!context) {
    throw new Error("useFavorite must be used within FavoriteProvider");
  }
  return context;
}
