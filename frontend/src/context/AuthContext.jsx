import { createContext, useState, useContext, useCallback } from "react";
import AuthAPI from "../services/AuthAPI";

const AuthContext = createContext();

const normalizeUser = (userObj) => {
  if (!userObj) return null;
  return {
    ...userObj,
    profilePicture: userObj.profilePicture || userObj.picture || null,
    picture: userObj.picture || userObj.profilePicture || null,
    loginTime: userObj.loginTime || userObj.createdAt || new Date().toISOString(),
  };
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;
    return normalizeUser(JSON.parse(storedUser));
  });
  const [token, setToken] = useState(() => localStorage.getItem("authToken"));
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);

  const persistAuth = (token, userObj) => {
    const normalizedUser = normalizeUser(userObj);
    setToken(token);
    setUser(normalizedUser);
    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
  };

  const clearAuth = () => {
    setToken(null);
    setUser(null);
    setBookings([]);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  };

  // Register with Email
  const registerWithEmail = async ({ name, email, password, accountType = "user" }) => {
    try {
      return await AuthAPI.register(name, email, password, accountType);
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // Verify Email OTP and activate account
  const verifyEmailCode = async (email, code) => {
    try {
      const result = await AuthAPI.verifyEmail(email, code);

      if (result.success && result.token) {
        persistAuth(result.token, result.user);
      }

      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // Resend OTP
  const resendVerificationCode = async (email) => {
    try {
      return await AuthAPI.resendVerification(email);
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // Login with Email and Password
  const loginWithEmailPassword = async ({ email, password, accountType = "user" }) => {
    try {
      const result = await AuthAPI.login(email, password, accountType);

      if (result.success && result.token) {
        persistAuth(result.token, result.user);
      }

      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // Admin Login
  const adminLogin = async ({ email, password }) => {
    try {
      const result = await AuthAPI.adminLogin(email, password);

      if (result.success && result.token) {
        persistAuth(result.token, result.user);
      }

      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // Demo Login (for testing without Google)
  const loginWithDemo = async (email = "user@namastestay.com", accountType = "user") => {
    try {
      const result = await AuthAPI.login(email, "demo-password", accountType);
      if (result.success && result.token) {
        persistAuth(result.token, result.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Demo login error:", error);
      return false;
    }
  };

  // Logout Handler
  const logout = () => {
    clearAuth();
  };

  // ===== BOOKING METHODS (now using backend) =====

  // Create Booking (pending payment)
  const createBooking = async (bookingData) => {
    if (!token) throw new Error("Not authenticated");

    const result = await AuthAPI.createBooking(token, bookingData);
    if (!result.success) {
      throw new Error(result.message || "Failed to create booking");
    }

    return result.booking;
  };

  // Fetch user's bookings from backend
  const fetchBookings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await AuthAPI.getBookings(token);
      if (result.success) {
        setBookings(result.bookings || []);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Legacy addBooking (for backwards compat — creates confirmed booking locally)
  const addBooking = (booking) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (booking.checkIn && booking.checkIn < todayStr) {
      throw new Error("Check-in date cannot be in the past.");
    }
    if (booking.checkOut && booking.checkOut < todayStr) {
      throw new Error("Check-out date cannot be in the past.");
    }
    if (booking.checkIn && booking.checkOut && booking.checkOut <= booking.checkIn) {
      throw new Error("Check-out date must be after check-in date.");
    }

    const newBooking = {
      id: Math.random().toString(36).substr(2, 9),
      ...booking,
      bookedDate: new Date().toISOString(),
      status: "confirmed",
    };

    const updatedBookings = [...bookings, newBooking];
    setBookings(updatedBookings);

    return newBooking;
  };

  // Cancel Booking (backend)
  const cancelBooking = async (bookingId) => {
    if (!token) return;
    try {
      const result = await AuthAPI.cancelBooking(token, bookingId);
      if (result.success) {
        setBookings(prev => prev.map(b =>
          (b._id === bookingId || b.id === bookingId) ? { ...b, status: 'cancelled' } : b
        ));
      }
      return result;
    } catch (error) {
      console.error("Error cancelling booking:", error);
      return { success: false, message: error.message };
    }
  };

  // Update Profile Picture (manual)
  const updateProfilePicture = async (profilePictureUrl) => {
    try {
      if (!token) return { success: false, message: "Not authenticated" };

      const result = await AuthAPI.updateProfilePicture(token, profilePictureUrl);
      if (result.success) {
        const updatedUser = { ...user, profilePicture: result.profilePicture };
        persistAuth(token, updatedUser);
      }
      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // Refresh Profile Picture from Google
  const refreshProfilePictureFromGoogle = async () => {
    try {
      if (!token) return { success: false, message: "Not authenticated" };

      const result = await AuthAPI.refreshProfilePicture(token);
      if (result.success) {
        const updatedUser = { ...user, profilePicture: result.profilePicture };
        persistAuth(token, updatedUser);
      }
      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const value = {
    user,
    token,
    loading,
    bookings,
    loginWithDemo,
    registerWithEmail,
    verifyEmailCode,
    resendVerificationCode,
    loginWithEmailPassword,
    adminLogin,
    logout,
    addBooking,
    createBooking,
    fetchBookings,
    cancelBooking,
    updateProfilePicture,
    refreshProfilePictureFromGoogle,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.accountType === 'admin' || user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
