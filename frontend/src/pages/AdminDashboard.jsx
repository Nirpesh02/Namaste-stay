import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, LayoutGrid, Home, Calendar, Users, Settings, Plus, X, Trash2, Edit, Eye, EyeOff, Menu, ArrowLeft, TrendingUp, DollarSign, CheckCircle, XCircle, Loader } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AuthAPI from "../services/AuthAPI";

// Simple Bar Chart component (no external lib needed)
function BarChart({ data, label, color }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase">{label}</p>
      <div className="flex items-end gap-2 h-40">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-gray-700">{d.value > 0 ? d.value.toLocaleString() : ''}</span>
            <div className="w-full rounded-t-md transition-all" style={{ height: `${Math.max((d.value / max) * 100, 4)}%`, background: color || '#dc2626' }} />
            <span className="text-[10px] text-gray-500 truncate w-full text-center">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Simple Pie/Donut Chart
function DonutChart({ segments }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let cumulative = 0;
  const size = 160;
  const stroke = 28;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} className="transform -rotate-90">
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const offset = cumulative * circumference;
          cumulative += pct;
          return (
            <circle key={i} cx={size/2} cy={size/2} r={radius} fill="none"
              stroke={seg.color} strokeWidth={stroke}
              strokeDasharray={`${pct * circumference} ${circumference}`}
              strokeDashoffset={-offset} className="transition-all duration-500" />
          );
        })}
      </svg>
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ background: seg.color }} />
            <span className="text-gray-700">{seg.label}: <strong>{seg.value}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, token, logout, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dashboard data
  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [statusDist, setStatusDist] = useState({});
  const [recentBookings, setRecentBookings] = useState([]);

  // Hotels
  const [hotels, setHotels] = useState([]);
  const [showAddHotel, setShowAddHotel] = useState(false);
  const [newHotel, setNewHotel] = useState({ name: "", price: "", district: "", province: "", description: "" });
  const [editingHotel, setEditingHotel] = useState(null);

  // Bookings
  const [allBookings, setAllBookings] = useState([]);

  // Users
  const [users, setUsers] = useState([]);

  // Settings
  const [pwForm, setPwForm] = useState({ current: "", new: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");

  useEffect(() => {
    if (!user || !isAdmin) { navigate("/login"); return; }
    loadDashboard();
  }, [user, isAdmin]);

  useEffect(() => { setSidebarOpen(false); window.scrollTo(0,0); }, [activeTab]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [dashRes, hotelsRes] = await Promise.all([
        AuthAPI.getAdminDashboard(token),
        AuthAPI.getHotels({ limit: 100 }),
      ]);
      if (dashRes.success) {
        setStats(dashRes.stats);
        setMonthlyData(dashRes.monthlyData || []);
        setStatusDist(dashRes.statusDistribution || {});
        setRecentBookings(dashRes.recentBookings || []);
      }
      if (hotelsRes.success) setHotels(hotelsRes.hotels || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadBookings = async () => {
    const res = await AuthAPI.getAllBookings(token, { limit: 100 });
    if (res.success) setAllBookings(res.bookings || []);
  };

  const loadUsers = async () => {
    const res = await AuthAPI.getAdminUsers(token);
    if (res.success) setUsers(res.users || []);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "bookings") loadBookings();
    if (tab === "users") loadUsers();
    if (tab === "dashboard") loadDashboard();
  };

  const handleAddHotel = async (e) => {
    e.preventDefault();
    if (!newHotel.name || !newHotel.price || !newHotel.district || !newHotel.province) {
      alert("Fill all required fields"); return;
    }
    const res = await AuthAPI.createHotel(token, { ...newHotel, price: Number(newHotel.price) });
    if (res.success) {
      setHotels(prev => [...prev, res.hotel]);
      setNewHotel({ name: "", price: "", district: "", province: "", description: "" });
      setShowAddHotel(false);
      alert("Hotel added!");
    } else { alert(res.message); }
  };

  const handleDeleteHotel = async (id) => {
    if (!confirm("Delete this hotel?")) return;
    const res = await AuthAPI.deleteHotel(token, id);
    if (res.success) setHotels(prev => prev.filter(h => h._id !== id));
    else alert(res.message);
  };

  const handleToggleUser = async (id) => {
    const res = await AuthAPI.toggleUserStatus(token, id);
    if (res.success) {
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: res.user.isActive } : u));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg("");
    if (pwForm.new !== pwForm.confirm) { setPwMsg("Passwords don't match"); return; }
    if (pwForm.new.length < 6) { setPwMsg("Min 6 characters"); return; }
    const res = await AuthAPI.changeAdminPassword(token, pwForm.current, pwForm.new);
    setPwMsg(res.success ? "Password changed!" : res.message);
    if (res.success) setPwForm({ current: "", new: "", confirm: "" });
  };

  const handleLogout = () => { logout(); navigate("/"); };

  if (!user || !isAdmin) return null;

  const tabs = [
    { id: "dashboard", label: "DASHBOARD", icon: LayoutGrid },
    { id: "hotels", label: "HOTELS", icon: Home },
    { id: "bookings", label: "BOOKINGS", icon: Calendar },
    { id: "users", label: "USERS", icon: Users },
    { id: "settings", label: "SETTINGS", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 w-64 h-full bg-white shadow-lg z-40 overflow-y-auto transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-black text-red-700">Namaste Stay</h2>
          <p className="text-xs text-gray-600 mt-1">🔐 Admin Panel</p>
        </div>
        <nav className="mt-6 space-y-2 px-4">
          {tabs.map(t => (
            <button key={t.id} onClick={() => handleTabChange(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all ${activeTab === t.id ? "bg-red-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}>
              <t.icon size={20} /> {t.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-6 left-4 right-4">
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-semibold">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="lg:ml-64 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6 lg:hidden">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg"><Menu size={24} /></button>
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-gray-600 hover:text-red-700 font-semibold"><ArrowLeft size={20} /> Back</button>
        </div>

        {loading && activeTab === "dashboard" ? (
          <div className="flex items-center justify-center py-20"><Loader size={36} className="animate-spin text-red-600" /></div>
        ) : (
          <>
            {/* DASHBOARD */}
            {activeTab === "dashboard" && stats && (
              <div className="space-y-8">
                <div><h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1><p className="text-gray-600 mt-1">Welcome back, {user.name}</p></div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Total Bookings", value: stats.totalBookings, icon: Calendar, color: "bg-blue-100 text-blue-600" },
                    { label: "Total Revenue", value: `NPR ${stats.totalRevenue?.toLocaleString() || 0}`, icon: DollarSign, color: "bg-green-100 text-green-600" },
                    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "bg-purple-100 text-purple-600" },
                    { label: "Total Hotels", value: stats.totalHotels, icon: Home, color: "bg-orange-100 text-orange-600" },
                  ].map((card, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-md p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${card.color}`}><card.icon size={22} /></div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">{card.label}</p>
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Trend (6 months)</h3>
                    <BarChart data={monthlyData.map(m => ({ label: m.month, value: m.revenue }))} label="Revenue (NPR)" color="#16a34a" />
                  </div>
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Booking Status</h3>
                    <DonutChart segments={[
                      { label: "Confirmed", value: statusDist.confirmed || 0, color: "#16a34a" },
                      { label: "Pending", value: statusDist.pending || 0, color: "#eab308" },
                      { label: "Cancelled", value: statusDist.cancelled || 0, color: "#dc2626" },
                      { label: "Failed", value: statusDist.failed || 0, color: "#6b7280" },
                    ]} />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Bookings Trend (6 months)</h3>
                  <BarChart data={monthlyData.map(m => ({ label: m.month, value: m.bookings }))} label="Bookings" color="#3b82f6" />
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Bookings</h3>
                  {recentBookings.length === 0 ? <p className="text-gray-500">No bookings yet</p> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b text-left text-gray-500">
                          <th className="pb-2">Guest</th><th className="pb-2">Hotel</th><th className="pb-2">Amount</th><th className="pb-2">Status</th><th className="pb-2">Date</th>
                        </tr></thead>
                        <tbody>
                          {recentBookings.map(b => (
                            <tr key={b._id} className="border-b last:border-0">
                              <td className="py-3 font-medium">{b.user?.name || b.guestName}</td>
                              <td className="py-3">{b.hotel?.name || b.hotelName}</td>
                              <td className="py-3 font-semibold">NPR {b.totalPrice?.toLocaleString()}</td>
                              <td className="py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{b.status}</span></td>
                              <td className="py-3 text-gray-500">{new Date(b.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* HOTELS */}
            {activeTab === "hotels" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Hotels ({hotels.length})</h2>
                  <button onClick={() => setShowAddHotel(!showAddHotel)} className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold flex items-center gap-2">
                    <Plus size={18} /> Add Hotel
                  </button>
                </div>

                {showAddHotel && (
                  <form onSubmit={handleAddHotel} className="bg-white rounded-xl shadow-md p-6 space-y-4">
                    <h3 className="text-lg font-bold">New Hotel</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input placeholder="Hotel Name *" value={newHotel.name} onChange={e => setNewHotel({...newHotel, name: e.target.value})} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" />
                      <input type="number" placeholder="Price/Night (NPR) *" value={newHotel.price} onChange={e => setNewHotel({...newHotel, price: e.target.value})} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" />
                      <input placeholder="District *" value={newHotel.district} onChange={e => setNewHotel({...newHotel, district: e.target.value})} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" />
                      <input placeholder="Province *" value={newHotel.province} onChange={e => setNewHotel({...newHotel, province: e.target.value})} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" />
                    </div>
                    <textarea placeholder="Description" value={newHotel.description} onChange={e => setNewHotel({...newHotel, description: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" rows={3} />
                    <div className="flex gap-3">
                      <button type="submit" className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">Create Hotel</button>
                      <button type="button" onClick={() => setShowAddHotel(false)} className="px-6 py-2.5 border rounded-lg hover:bg-gray-50 font-semibold">Cancel</button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hotels.map(h => (
                    <div key={h._id} className="bg-white rounded-xl shadow-md p-5 space-y-3 hover:shadow-lg transition-shadow">
                      {h.coverImage && <img src={h.coverImage} alt={h.name} className="w-full h-36 object-cover rounded-lg" />}
                      <div>
                        <h3 className="font-bold text-gray-900">{h.name}</h3>
                        <p className="text-sm text-gray-500">📍 {h.district}, {h.province}</p>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-red-600">NPR {h.price?.toLocaleString()}/night</span>
                        <span className="text-yellow-500">⭐ {h.rating}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleDeleteHotel(h._id)} className="flex-1 px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 flex items-center justify-center gap-1">
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {hotels.length === 0 && <div className="text-center py-12 text-gray-500">No hotels yet. Add your first hotel above.</div>}
              </div>
            )}

            {/* BOOKINGS */}
            {activeTab === "bookings" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">All Bookings ({allBookings.length})</h2>
                {allBookings.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">No bookings found</div>
                ) : (
                  <div className="bg-white rounded-xl shadow-md overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-gray-50 text-left text-gray-500 border-b">
                        <th className="px-4 py-3">Guest</th><th className="px-4 py-3">Hotel</th><th className="px-4 py-3">Check-In</th><th className="px-4 py-3">Check-Out</th>
                        <th className="px-4 py-3">Amount</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Status</th>
                      </tr></thead>
                      <tbody>
                        {allBookings.map(b => (
                          <tr key={b._id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">{b.user?.name || b.guestName || '-'}</td>
                            <td className="px-4 py-3">{b.hotel?.name || b.hotelName}</td>
                            <td className="px-4 py-3">{b.checkIn ? new Date(b.checkIn).toLocaleDateString() : '-'}</td>
                            <td className="px-4 py-3">{b.checkOut ? new Date(b.checkOut).toLocaleDateString() : '-'}</td>
                            <td className="px-4 py-3 font-semibold">NPR {b.totalPrice?.toLocaleString()}</td>
                            <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${b.paymentStatus === 'completed' ? 'bg-green-100 text-green-700' : b.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{b.paymentStatus}</span></td>
                            <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{b.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* USERS */}
            {activeTab === "users" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Users ({users.length})</h2>
                {users.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">No users found</div>
                ) : (
                  <div className="bg-white rounded-xl shadow-md overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-gray-50 text-left text-gray-500 border-b">
                        <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th>
                      </tr></thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u._id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">{u.name}</td>
                            <td className="px-4 py-3">{u.email}</td>
                            <td className="px-4 py-3"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{u.accountType}</span></td>
                            <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3">{u.isActive ? <span className="text-green-600 font-semibold">Active</span> : <span className="text-red-600 font-semibold">Inactive</span>}</td>
                            <td className="px-4 py-3">
                              <button onClick={() => handleToggleUser(u._id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${u.isActive ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}>
                                {u.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SETTINGS */}
            {activeTab === "settings" && (
              <div className="max-w-xl space-y-6">
                <h2 className="text-2xl font-bold">Settings</h2>
                <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
                  <h3 className="text-lg font-bold">Admin Profile</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Name:</span> <strong>{user.name}</strong></p>
                    <p><span className="text-gray-500">Email:</span> <strong>{user.email}</strong></p>
                    <p><span className="text-gray-500">Role:</span> <strong>Administrator</strong></p>
                  </div>
                </div>
                <form onSubmit={handleChangePassword} className="bg-white rounded-xl shadow-md p-6 space-y-4">
                  <h3 className="text-lg font-bold">Change Password</h3>
                  <input type="password" placeholder="Current Password" value={pwForm.current} onChange={e => setPwForm({...pwForm, current: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" />
                  <input type="password" placeholder="New Password (min 6 chars)" value={pwForm.new} onChange={e => setPwForm({...pwForm, new: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" />
                  <input type="password" placeholder="Confirm New Password" value={pwForm.confirm} onChange={e => setPwForm({...pwForm, confirm: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" />
                  {pwMsg && <p className={`text-sm font-semibold ${pwMsg.includes('changed') ? 'text-green-600' : 'text-red-600'}`}>{pwMsg}</p>}
                  <button type="submit" className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">Update Password</button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
