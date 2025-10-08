const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3000/api";

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}, retry = true) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem("token");

    const headers = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    if (options.body && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const config = {
      ...options,
      headers,
      credentials: "include",
    };

    try {
      const response = await fetch(url, config);
      let data = null;
      try {
        data = await response.json();
      } catch {}

      // handle invalid token
      if ((response.status === 401 || response.status === 403) && retry) {
        console.warn("🔄 Access token expired or invalid, trying refresh...");
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          console.log("✅ Retrying original request after refresh...");
          return this.request(endpoint, options, false);
        } else {
          console.error("❌ Refresh failed — forcing logout");
          window.dispatchEvent(new Event("sessionExpired"));
          throw new Error("Session expired. Please log in again.");
        }
      }

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
      console.error("❌ API request failed:", error.message);
      return false;
    }
  }

  // refresh token handler
  async refreshAccessToken() {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn("⚠️ Refresh token missing or expired");
          return false;
        }
        throw new Error("Refresh failed");
      }

      const data = await response.json();
      if (data.accessToken) {
        localStorage.setItem("token", data.accessToken);
        console.log("✅ Access token refreshed successfully");
        return true;
      }

      console.warn("⚠️ No accessToken returned during refresh");
      return false;
    } catch (error) {
      console.error("❌ Failed to refresh access token:", error);
      return false;
    }
  }

  // auth
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

  logout() {
    return this.request("/auth/logout", { method: "POST" });
  }

  // users
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

  // rooms
  getRooms(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/rooms${query ? `?${query}` : ""}`);
  }

  getRoom(id) {
    return this.request(`/rooms/${id}`);
  }

  createRoom(roomData) {
    let body;
    if (roomData instanceof FormData) body = roomData;
    else {
      body = new FormData();
      for (const key in roomData)
        if (roomData[key] !== undefined && roomData[key] !== null)
          body.append(key, roomData[key]);
    }
    return this.request("/rooms", { method: "POST", body });
  }

  updateRoom(id, roomData) {
    let body;
    if (roomData instanceof FormData) body = roomData;
    else {
      body = new FormData();
      for (const key in roomData)
        if (roomData[key] !== undefined && roomData[key] !== null)
          body.append(key, roomData[key]);
    }
    return this.request(`/rooms/${id}`, { method: "PUT", body });
  }

  deleteRoom(id) {
    return this.request(`/rooms/${id}`, { method: "DELETE" });
  }

  // bookings
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

  // rates
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

  // deals
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

  // guests
  getGuests() {
    return this.request("/guests");
  }

  updateGuestStatus(id, data) {
    return this.request(`/guests/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // messages
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
