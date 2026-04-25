import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, LayoutGrid, Home, Calendar, Settings, Plus, X, Clock, DollarSign, CheckCircle, Menu, ArrowLeft, Loader } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { provincesData } from "../data/provincesData";
import AuthAPI from "../services/AuthAPI";

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [newProperty, setNewProperty] = useState({
    name: "",
    price: "",
    district: "",
    province: "",
    uploadedImage: null,
  });

  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    if (!user || user.accountType !== "owner") {
      navigate("/login");
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hotelsRes, bookingsRes] = await Promise.all([
        AuthAPI.getHotels({ owner: user._id, limit: 100 }),
        AuthAPI.getOwnerBookings(token, { limit: 100 })
      ]);
      
      if (hotelsRes.success) {
        setProperties(hotelsRes.hotels || []);
      }
      
      if (bookingsRes.success) {
        const b = bookingsRes.bookings || [];
        setBookings(b);
        
        // Generate some recent activity from bookings
        const activity = b.slice(0, 5).map(booking => ({
          type: "booking",
          title: `New Booking: ${booking.hotelName}`,
          time: new Date(booking.createdAt).toLocaleDateString(),
          details: `${booking.user?.name || booking.guestName} booked for ${booking.nights} nights`
        }));
        setRecentActivity(activity);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setSidebarOpen(false);
  }, [activeTab]);

  // Get districts for selected province
  const getDistrictsForProvince = (provinceName) => {
    const province = provincesData.find(p => p.key === provinceName);
    return province ? province.districts : [];
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Please log in first</h1>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    window.scrollTo(0, 0);
    navigate("/");
  };

  const handleAddProperty = async (e) => {
    e.preventDefault();
    if (!newProperty.name || !newProperty.price || !newProperty.district || !newProperty.province) {
      alert("Please fill all required fields");
      return;
    }

    const hotelData = {
      name: newProperty.name,
      district: newProperty.district,
      province: newProperty.province,
      price: parseInt(newProperty.price),
      coverImage: newProperty.uploadedImage,
    };

    try {
      const res = await AuthAPI.createHotel(token, hotelData);
      if (res.success) {
        setProperties([...properties, res.hotel]);
        setNewProperty({ name: "", price: "", district: "", province: "", uploadedImage: null });
        setShowAddProperty(false);
        alert(`${newProperty.name} added successfully!`);
      } else {
        alert(res.message || "Failed to add property");
      }
    } catch (e) {
      alert("An error occurred");
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewProperty({ ...newProperty, uploadedImage: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // Calculate stats
  const totalProperties = properties.length;
  // Compute monthly revenue based on confirmed bookings in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const monthlyRevenue = bookings
    .filter(b => b.paymentStatus === "completed" && new Date(b.createdAt) >= thirtyDaysAgo)
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    
  const activeBookingsCount = bookings.filter(b => b.status === "confirmed" || b.status === "pending").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 w-64 h-full bg-white shadow-lg z-40 overflow-y-auto max-h-screen transform transition-transform lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-black text-red-700">Namaste Stay</h2>
          <p className="text-xs text-gray-600 mt-1">💼 Property Manager</p>
        </div>

        {/* Menu */}
        <nav className="mt-6 space-y-2 px-4">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "dashboard"
                ? "bg-red-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <LayoutGrid size={20} />
            DASHBOARD
          </button>
          <button
            onClick={() => setActiveTab("properties")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "properties"
                ? "bg-red-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Home size={20} />
            MY PROPERTIES
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "bookings"
                ? "bg-red-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Calendar size={20} />
            BOOKINGS
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "settings"
                ? "bg-red-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Settings size={20} />
            SETTINGS
          </button>
        </nav>

        {/* Logout */}
        <div className="absolute bottom-6 left-4 right-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all font-semibold"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 p-4 sm:p-6 lg:p-8">
        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-6 lg:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={24} className="text-gray-700" />
          </button>
          <button
            onClick={() => {
              window.scrollTo(0, 0);
              navigate("/");
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-red-700 font-semibold"
          >
            <ArrowLeft size={20} />
            <span className="text-sm">Back</span>
          </button>
        </div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Manager Overview</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Welcome back. Here is what's happening with your heritage stays today.</p>
          </div>
          <div className="text-right whitespace-nowrap">
            <p className="text-sm text-gray-600">LOCAL TIME</p>
            <p className="text-xl sm:text-2xl font-bold text-red-600">
              {new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
          </div>
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Total Properties */}
              <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Home size={24} className="text-red-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-600">TOTAL PROPERTIES</p>
                </div>
                <p className="text-4xl font-bold text-gray-900">{totalProperties}</p>
                <p className="text-xs text-green-600 font-semibold">📈 {Math.floor(totalProperties * 0.2)} added this month</p>
              </div>

              {/* Monthly Revenue */}
              <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <DollarSign size={24} className="text-yellow-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-600">MONTHLY REVENUE</p>
                </div>
                <p className="text-4xl font-bold text-gray-900">NPR {monthlyRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600 font-semibold">📈 +12.6% vs last month</p>
              </div>

              {/* Active Bookings */}
              <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Calendar size={24} className="text-green-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-600">ACTIVE BOOKINGS</p>
                </div>
                <p className="text-4xl font-bold text-gray-900">{activeBookingsCount}</p>
                <p className="text-xs text-blue-600 font-semibold">Across all properties</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Add New Property */}
              <div className="col-span-2">
                <div className="bg-white rounded-xl shadow-md p-8 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Add New Heritage Property</h2>
                    <p className="text-red-600 font-semibold text-sm mt-1">Step 1: Basic Details</p>
                  </div>

                  {!showAddProperty ? (
                    <button
                      onClick={() => setShowAddProperty(true)}
                      className="w-full px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <Plus size={20} />
                      Add New Property
                    </button>
                  ) : (
                    <form onSubmit={handleAddProperty} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Hotel Name */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">HOTEL NAME</label>
                          <input
                            type="text"
                            value={newProperty.name}
                            onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })}
                            placeholder="e.g. Kathmandu Durbar House"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>

                        {/* Price */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">PRICE PER NIGHT (NPR)</label>
                          <input
                            type="number"
                            value={newProperty.price}
                            onChange={(e) => setNewProperty({ ...newProperty, price: e.target.value })}
                            placeholder="0.00"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Province */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">PROVINCE</label>
                          <select
                            value={newProperty.province}
                            onChange={(e) => setNewProperty({ ...newProperty, province: e.target.value, district: "" })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            <option value="">Select Province</option>
                            {provincesData.map(province => (
                              <option key={province.key} value={province.key}>
                                {province.key}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* District */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">DISTRICT</label>
                          <select
                            value={newProperty.district}
                            onChange={(e) => setNewProperty({ ...newProperty, district: e.target.value })}
                            disabled={!newProperty.province}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            <option value="">{newProperty.province ? "Select District" : "Select Province First"}</option>
                            {newProperty.province && getDistrictsForProvince(newProperty.province).map(district => (
                              <option key={district.title} value={district.title}>
                                {district.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Image Upload */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">GALLERY & COVER PHOTO</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-red-500 transition-colors">
                          <div className="text-4xl mb-3">📸</div>
                          <p className="text-gray-600 font-semibold mb-2">Drag and drop high-resolution images of your property</p>
                          <p className="text-xs text-gray-500 mb-4">PNG, JPG, GIF up to 10MB each</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="imageInput"
                          />
                          <label
                            htmlFor="imageInput"
                            className="cursor-pointer text-red-600 font-semibold hover:underline"
                          >
                            Browse Files
                          </label>
                        </div>

                        {newProperty.uploadedImage && (
                          <div className="mt-4 grid grid-cols-3 gap-4">
                            <div className="relative">
                              <img
                                src={newProperty.uploadedImage}
                                alt="Uploaded"
                                className="w-full h-32 object-cover rounded-lg"
                              />
                            </div>
                            <div className="flex items-center justify-center">
                              <Plus size={32} className="text-gray-300" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-all"
                        >
                          Publish Property
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddProperty(false);
                            setNewProperty({ name: "", price: "", district: "", province: "", uploadedImage: null });
                          }}
                          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
                <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
                
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex gap-3 pb-4 border-b last:border-b-0">
                      <div>
                        {activity.type === "booking" && <CheckCircle size={20} className="text-green-600 mt-1" />}
                        {activity.type === "payment" && <DollarSign size={20} className="text-yellow-600 mt-1" />}
                        {activity.type === "review" && <div className="text-xl mt-1">⭐</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{activity.title}</p>
                        <p className="text-xs text-gray-600">{activity.details}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="w-full text-red-600 font-bold text-sm hover:underline mt-4">
                  VIEW ALL ACTIVITY
                </button>
              </div>
            </div>

            {/* Manager Insight */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Manager Insight</h3>
              <p className="text-gray-700 mb-4">
                Properties in <span className="font-bold">Bhaktapur</span> are seeing a 25% surge in demand for the upcoming festival season. Consider adjusting your festive rates.
              </p>
              <button className="text-yellow-700 font-bold text-sm hover:underline">
                Explore Market Trends →
              </button>
            </div>
          </div>
        )}

        {/* PROPERTIES TAB */}
        {activeTab === "properties" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">My Properties ({properties.length})</h2>
                <button
                  onClick={() => setShowAddProperty(true)}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  <Plus size={20} />
                  Add Property
                </button>
              </div>

              {!showAddProperty ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {properties.map((property) => {
                    const propBookings = bookings.filter(b => b.hotel?._id === property._id || b.hotel === property._id);
                    const activeCount = propBookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length;
                    
                    return (
                      <div key={property._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{property.name}</h3>
                            <p className="text-sm text-gray-600">{property.district}</p>
                          </div>
                          <div className="text-xl">⭐ {property.rating || "New"}</div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <p><span className="font-semibold">Price:</span> NPR {property.price?.toLocaleString()}/night</p>
                          <p><span className="font-semibold">Active Bookings:</span> {activeCount}</p>
                          <p><span className="font-semibold">Status:</span> <span className={`${property.isActive ? 'text-green-600' : 'text-red-600'} font-semibold`}>{property.isActive ? 'Active' : 'Inactive'}</span></p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <form onSubmit={handleAddProperty} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">HOTEL NAME</label>
                      <input
                        type="text"
                        value={newProperty.name}
                        onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })}
                        placeholder="e.g. Kathmandu Durbar House"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">PRICE PER NIGHT (NPR)</label>
                      <input
                        type="number"
                        value={newProperty.price}
                        onChange={(e) => setNewProperty({ ...newProperty, price: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">PROVINCE</label>
                      <select
                        value={newProperty.province}
                        onChange={(e) => setNewProperty({ ...newProperty, province: e.target.value, district: "" })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">Select Province</option>
                        {provincesData.map(province => (
                          <option key={province.key} value={province.key}>
                            {province.key}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">DISTRICT</label>
                      <select
                        value={newProperty.district}
                        onChange={(e) => setNewProperty({ ...newProperty, district: e.target.value })}
                        disabled={!newProperty.province}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">{newProperty.province ? "Select District" : "Select Province First"}</option>
                        {newProperty.province && getDistrictsForProvince(newProperty.province).map(district => (
                          <option key={district.title} value={district.title}>
                            {district.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-all"
                    >
                      Publish Property
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddProperty(false);
                        setNewProperty({ name: "", price: "", district: "", province: "", uploadedImage: null });
                      }}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === "bookings" && (
          <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Booking Management</h2>
            <div className="space-y-4">
              {bookings.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {bookings.map(booking => (
                    <div key={booking._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-gray-900">{booking.hotelName || booking.hotel?.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">Guest: {booking.user?.name || booking.guestName}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="font-bold text-red-600">NPR {booking.totalPrice?.toLocaleString()}</p>
                          <div className="flex gap-2 mt-2">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : booking.status === 'cancelled' || booking.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {booking.status}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase ${booking.paymentStatus === 'completed' ? 'bg-green-100 text-green-700' : booking.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              💳 {booking.paymentStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600 text-lg">No bookings yet</p>
                  <p className="text-gray-500 text-sm mt-2">Bookings will appear here when guests reserve your properties</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
            <div className="space-y-6 max-w-2xl">
              <div className="pb-6 border-b">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Profile Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold text-gray-900">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Account Type</p>
                    <p className="font-semibold text-gray-900">Property Owner</p>
                  </div>
                </div>
              </div>

              <div className="pb-6 border-b">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Notification Preferences</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                    <span className="text-gray-700">Email notifications for new bookings</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                    <span className="text-gray-700">Weekly revenue reports</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                    <span className="text-gray-700">Monthly market insights</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 rounded" />
                    <span className="text-gray-700">Guest reviews and feedback</span>
                  </label>
                </div>
              </div>

              <div className="pb-6 border-b">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Account</h3>
                <button className="px-6 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 font-semibold transition-colors">
                  Change Password
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors">
                  Save Changes
                </button>
                <button 
                  onClick={handleLogout}
                  className="px-6 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
