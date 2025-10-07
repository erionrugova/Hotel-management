// ✅ src/services/api.js

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3000/api";

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Main Request Handler
   * - Automatically adds token if available.
   * - Detects if payload is FormData (no Content-Type set).
   * - Handles JSON parsing and unified error messages.
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem("token");

    const headers = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    // ✅ Skip setting Content-Type if body is FormData (browser sets it)
    if (options.body && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const config = { ...options, headers };

    try {
      const response = await fetch(url, config);

      let data = null;
      try {
        data = await response.json();
      } catch (_) {}

      if (!response.ok) {
        const msg =
          data?.error ||
          data?.message ||
          (Array.isArray(data?.errors) && data.errors[0]?.msg) ||
          `HTTP ${response.status}`;
        throw new Error(msg);
      }

      return data;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // ----------------- AUTH -----------------
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

  googleLogin(credential) {
    return this.request("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    });
  }

  // ----------------- USERS -----------------
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
    return this.request(`/users/${id}`, { method: "DELETE" });
  }

  // ----------------- ROOMS (supports image upload) -----------------
  getRooms(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/rooms${query ? `?${query}` : ""}`);
  }

  getRoom(id) {
    return this.request(`/rooms/${id}`);
  }

  /**
   * ✅ Create a new room (handles FormData for image upload)
   */
  createRoom(roomData) {
    let body;

    if (roomData instanceof FormData) {
      body = roomData;
    } else {
      body = new FormData();
      for (const key in roomData) {
        if (roomData[key] !== undefined && roomData[key] !== null) {
          body.append(key, roomData[key]);
        }
      }
    }

    return this.request("/rooms", {
      method: "POST",
      body,
    });
  }

  /**
   * ✅ Update room details or image
   */
  updateRoom(id, roomData) {
    let body;

    if (roomData instanceof FormData) {
      body = roomData;
    } else {
      body = new FormData();
      for (const key in roomData) {
        if (roomData[key] !== undefined && roomData[key] !== null) {
          body.append(key, roomData[key]);
        }
      }
    }

    return this.request(`/rooms/${id}`, {
      method: "PUT",
      body,
    });
  }

  deleteRoom(id) {
    return this.request(`/rooms/${id}`, { method: "DELETE" });
  }

  // ----------------- BOOKINGS -----------------
  getBookings(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/bookings${query ? `?${query}` : ""}`);
  }

  getBooking(id) {
    return this.request(`/bookings/${id}`);
  }

  createBooking(data) {
    return this.request("/bookings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateBooking(id, data) {
    return this.request(`/bookings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  updateBookingStatus(id, status) {
    return this.request(`/bookings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  cancelBooking(id) {
    return this.request(`/bookings/${id}/cancel`, { method: "PATCH" });
  }

  deleteBooking(id) {
    return this.request(`/bookings/${id}`, { method: "DELETE" });
  }

  // ----------------- RATES -----------------
  getRates() {
    return this.request("/rates");
  }

  createRate(data) {
    return this.request("/rates", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateRate(id, data) {
    return this.request(`/rates/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  deleteRate(id) {
    return this.request(`/rates/${id}`, { method: "DELETE" });
  }

  // ----------------- DEALS -----------------
  getDeals() {
    return this.request("/deals");
  }

  createDeal(data) {
    return this.request("/deals", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateDeal(id, data) {
    return this.request(`/deals/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  deleteDeal(id) {
    return this.request(`/deals/${id}`, { method: "DELETE" });
  }

  // ----------------- GUESTS -----------------
  getGuests() {
    return this.request("/guests");
  }

  updateGuestStatus(id, data) {
    return this.request(`/guests/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // ----------------- MESSAGES -----------------
  getMessages() {
    return this.request("/contact");
  }

  sendMessage(data) {
    return this.request("/contact", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateMessageStatus(id, data) {
    return this.request(`/contact/${id}/read`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  deleteMessage(id) {
    return this.request(`/contact/${id}`, { method: "DELETE" });
  }
}

export default new ApiService();
