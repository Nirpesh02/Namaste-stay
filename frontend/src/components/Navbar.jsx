import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, UserCircle, Menu, X, LogOut, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useFavorite } from "../context/FavoriteContext";
import SearchModal from "./SearchModal";

const navItems = [
  { path: "/", label: "Home" },
  { path: "/districts", label: "Districts" },
  { path: "/bookings", label: "My Bookings" },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { favorites } = useFavorite();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Scroll to top when location changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
    setProfileMenuOpen(false);
  };

  const handleNavClick = () => {
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const handleLogoClick = () => {
    window.scrollTo(0, 0);
  };

  return (
    <>
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition">
          <h1 className="text-2xl font-black text-red-700">Namaste Stay</h1>
          <span className="text-xs text-red-600 font-semibold">Nepal</span>
        </Link>

        <nav className="hidden md:flex gap-8 items-center text-sm font-semibold uppercase tracking-wide">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => handleNavClick(item.path)}
              className={`transition-colors relative pb-1 ${
                location.pathname === item.path
                  ? "text-red-700"
                  : "text-gray-600 hover:text-red-700"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
            title="Search hotels and districts"
          >
            <Search size={18} />
          </button>

          {/* Favorites Button */}
          <button
            onClick={() => {
              navigate("/favorites");
              window.scrollTo(0, 0);
            }}
            className="relative p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-red-600 transition-colors"
            title="My Favorites"
          >
            <Heart size={18} className={location.pathname === "/favorites" ? "fill-red-600 text-red-600" : ""} />
            {favorites.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </button>

          {/* User Profile or Login Button */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-red-50 transition-colors"
              >
                <img
                  src={user.profilePicture || user.picture || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.name)}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-red-200"
                />
                <span className="text-xs font-semibold text-gray-700 hidden sm:inline max-w-[100px] truncate">
                  {user.name.split(" ")[0]}
                </span>
              </button>

              {/* Dropdown Menu */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                  </div>

                  <Link
                    to="/bookings"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      window.scrollTo(0, 0);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    My Bookings
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 font-semibold"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="p-2 rounded-full bg-red-50 text-red-700 hover:bg-red-100 transition-colors font-semibold hidden sm:flex items-center gap-2"
            >
              <UserCircle size={20} />
              <span className="text-xs uppercase hidden md:inline">Login</span>
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full hover:bg-gray-100 text-gray-600"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <nav className="flex flex-col px-6 py-4 gap-3">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleNavClick(item.path);
                }}
                className={`text-sm font-semibold py-2 px-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? "bg-red-100 text-red-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {!user && (
              <Link
                to="/login"
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.scrollTo(0, 0);
                }}
                className="text-sm font-semibold py-2 px-3 rounded-lg bg-red-100 text-red-700 transition-colors"
              >
                Login / Sign Up
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>

      {/* Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}