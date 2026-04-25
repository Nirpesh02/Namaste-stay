const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api')
).replace(/\/$/, '');

const FALLBACK_BASE_URLS = [
  API_BASE_URL,
  '/api',
  'http://localhost:5000/api',
  'http://127.0.0.1:5000/api',
].filter((value, index, arr) => value && arr.indexOf(value) === index);

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : { message: await response.text() };

  if (!response.ok) {
    return {
      success: false,
      message: payload?.message || `Request failed with status ${response.status}`,
      status: response.status,
      ...payload,
    };
  }

  return payload;
};

const safeRequest = async (path, options = {}) => {
  let lastError = null;

  for (const baseUrl of FALLBACK_BASE_URLS) {
    const url = `${baseUrl}${path}`;
    try {
      const response = await fetch(url, options);
      return await parseResponse(response);
    } catch (error) {
      lastError = error;
    }
  }

  return {
    success: false,
    message: `Network error while contacting backend. Tried: ${FALLBACK_BASE_URLS.join(', ')}`,
    error: lastError?.message || 'Unknown network error',
  };
};

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

class AuthAPI {
  // Register with email
  static async register(name, email, password, accountType = 'user') {
    return safeRequest('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, accountType }),
    });
  }

  // Verify email with code
  static async verifyEmail(email, verificationCode) {
    return safeRequest('/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, verificationCode }),
    });
  }

  // Resend verification code
  static async resendVerification(email) {
    return safeRequest('/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  }

  // Login with email and password
  static async login(email, password, accountType = 'user') {
    return safeRequest('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, accountType }),
    });
  }

  // Google OAuth login/registration
  static async googleOAuth(googleId, name, email, accessToken, profilePicture = null, accountType = 'user') {
    return safeRequest('/auth/google-oauth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        googleId,
        name,
        email,
        accessToken,
        profilePicture,
        accountType,
      }),
    });
  }

  // Get current user profile
  static async getProfile(token) {
    return safeRequest('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Update profile picture
  static async updateProfilePicture(token, profilePicture) {
    return safeRequest('/auth/profile-picture', {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ profilePicture }),
    });
  }

  // Refresh profile picture from Google
  static async refreshProfilePicture(token) {
    return safeRequest('/auth/refresh-profile-picture', {
      method: 'POST',
      headers: authHeaders(token),
    });
  }

  // ===== HOTEL APIs =====

  static async getHotels(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return safeRequest(`/hotels${queryString ? '?' + queryString : ''}`);
  }

  static async getHotel(id) {
    return safeRequest(`/hotels/${id}`);
  }

  static async createHotel(token, hotelData) {
    return safeRequest('/hotels', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(hotelData),
    });
  }

  static async updateHotel(token, id, hotelData) {
    return safeRequest(`/hotels/${id}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(hotelData),
    });
  }

  static async deleteHotel(token, id) {
    return safeRequest(`/hotels/${id}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
  }

  // ===== BOOKING APIs =====

  static async createBooking(token, bookingData) {
    return safeRequest('/bookings', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(bookingData),
    });
  }

  static async getBookings(token, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return safeRequest(`/bookings${queryString ? '?' + queryString : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  static async getBooking(token, id) {
    return safeRequest(`/bookings/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  static async getAllBookings(token, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return safeRequest(`/bookings/all${queryString ? '?' + queryString : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  static async getOwnerBookings(token, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return safeRequest(`/bookings/owner${queryString ? '?' + queryString : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  static async cancelBooking(token, id) {
    return safeRequest(`/bookings/${id}/cancel`, {
      method: 'PUT',
      headers: authHeaders(token),
    });
  }

  // ===== PAYMENT APIs =====

  static async initiateEsewaPayment(token, bookingId, clientOrigin) {
    return safeRequest('/payments/esewa/initiate', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ bookingId, clientOrigin }),
    });
  }

  static async verifyEsewaPayment(encodedData, bookingId) {
    const params = new URLSearchParams({ data: encodedData });
    if (bookingId) params.append('bookingId', bookingId);
    return safeRequest(`/payments/esewa/verify?${params.toString()}`);
  }

  // ===== ADMIN APIs =====

  static async adminLogin(email, password) {
    return safeRequest('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  }

  static async getAdminDashboard(token) {
    return safeRequest('/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  static async getAdminUsers(token, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return safeRequest(`/admin/users${queryString ? '?' + queryString : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  static async toggleUserStatus(token, userId) {
    return safeRequest(`/admin/users/${userId}/toggle`, {
      method: 'PUT',
      headers: authHeaders(token),
    });
  }

  static async changeAdminPassword(token, currentPassword, newPassword) {
    return safeRequest('/admin/change-password', {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }
}

export default AuthAPI;
