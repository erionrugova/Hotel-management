// src/services/api.js
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3000/api";

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem("token");

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      // Try to parse JSON even on non-2xx, so we can surface server messages
      let data = null;
      try {
        data = await response.json();
      } catch (_) {
        // no-op: response had no JSON body
      }

      if (!response.ok) {
        const msg =
          (data && (data.error || data.message)) ||
          (Array.isArray(data?.errors) && data.errors[0]?.msg) ||
          `HTTP error! status: ${response.status}`;
        throw new Error(msg);
      }

      return data;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Rate endpoints
  async getRates() {
    return this.request("/rates");
  }
  async createRate(data) {
    return this.request("/rates", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  async updateRate(id, data) {
    return this.request(`/rates/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
  async deleteRate(id) {
    return this.request(`/rates/${id}`, { method: "DELETE" });
  }

  // Deal endpoints
  async getDeals() {
    return this.request("/deals");
  }
  async createDeal(data) {
    return this.request("/deals", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  async updateDeal(id, data) {
    return this.request(`/deals/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
  async deleteDeal(id) {
    return this.request(`/deals/${id}`, { method: "DELETE" });
  }

  // Guests
  async getGuests() {
    return this.request("/guests");
  }

  // ----------------- Auth endpoints -----------------
  login(credentials) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  register(userData) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  // ----------------- User endpoints -----------------
  getUsers() {
    return this.request("/users");
  }

  getUser(id) {
    return this.request(`/users/${id}`);
  }

  updateUser(id, userData) {
    return this.request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: "DELETE",
    });
  }

  // ----------------- Room endpoints -----------------
  getRooms(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/rooms${query ? `?${query}` : ""}`);
  }

  getRoom(id) {
    return this.request(`/rooms/${id}`);
  }

  createRoom(roomData) {
    return this.request("/rooms", {
      method: "POST",
      body: JSON.stringify(roomData),
    });
  }

  updateRoom(id, roomData) {
    return this.request(`/rooms/${id}`, {
      method: "PUT",
      body: JSON.stringify(roomData),
    });
  }

  deleteRoom(id) {
    return this.request(`/rooms/${id}`, {
      method: "DELETE",
    });
  }

  // ----------------- Booking endpoints -----------------
  getBookings(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/bookings${query ? `?${query}` : ""}`);
  }

  getBooking(id) {
    return this.request(`/bookings/${id}`);
  }

  // Create a booking via /bookings (your current backend route)
  createBooking(bookingData) {
    // expects: { roomId, startDate, endDate, ...optional customer fields }
    return this.request("/bookings", {
      method: "POST",
      body: JSON.stringify(bookingData),
    });
  }

  updateBookingStatus(id, status) {
    return this.request(`/bookings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  cancelBooking(id) {
    return this.request(`/bookings/${id}/cancel`, {
      method: "PATCH",
    });
  }

  deleteBooking(id) {
    return this.request(`/bookings/${id}`, {
      method: "DELETE",
    });
  }
}

export default new ApiService();
