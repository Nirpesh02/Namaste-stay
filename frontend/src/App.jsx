import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Districts from "./pages/Districts";
import Listings from "./pages/Listings";
import HotelDetails from "./pages/HotelDetails";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Favorites from "./pages/Favorites";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import AuthProvider from "./context/AuthContext";
import { FavoriteProvider } from "./context/FavoriteContext";
import { ReviewProvider } from "./context/ReviewContext";

function AppContent() {
  const location = useLocation();
  const hideNavFooter = ["/owner-dashboard", "/admin-dashboard"].includes(location.pathname);

  return (
    <>
      {!hideNavFooter && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/districts" element={<Districts />} />
        <Route path="/stays" element={<Listings />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/hotel/:hotelId" element={<HotelDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/bookings" element={<Dashboard />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/owner-dashboard" element={<OwnerDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failure" element={<PaymentFailure />} />
      </Routes>
      {!hideNavFooter && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FavoriteProvider>
          <ReviewProvider>
            <AppContent />
          </ReviewProvider>
        </FavoriteProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}