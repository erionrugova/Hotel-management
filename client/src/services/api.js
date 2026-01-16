const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3000/api";

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}, retry = true) {
    const url = `${this.baseURL}${endpoint}`;

    // For auth endpoints (login/register), don't include token even if it exists
    // This ensures clean login attempts without stale tokens
    const isAuthEndpoint =
      endpoint.startsWith("/auth/login") ||
      endpoint.startsWith("/auth/register") ||
      endpoint.startsWith("/auth/google");

    const token = isAuthEndpoint ? null : localStorage.getItem("token");

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

    // Log request details for debugging (only for auth endpoints to avoid spam)
    if (isAuthEndpoint) {
      console.log("🔵 Making auth request:", {
        endpoint,
        url,
        hasToken: !!token,
        method: options.method || "GET",
      });
    }

    try {
      const response = await fetch(url, config);

      // Log response for debugging auth requests
      if (isAuthEndpoint) {
        console.log("🔵 Auth response received:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });
      }
      let data = null;

      // Try to parse JSON response - handle both success and error responses
      try {
        const text = await response.text();
        if (text && text.trim()) {
          try {
            data = JSON.parse(text);
          } catch (parseError) {
            // Response text exists but is not valid JSON
            // This can happen with error responses that return plain text
            console.warn("Response is not valid JSON:", parseError);
            // Store the text as the error message
            data = { error: text, message: text };
          }
        }
      } catch (textError) {
        // Failed to read response text (shouldn't happen, but handle gracefully)
        console.warn("Failed to read response text:", textError);
      }

      // handle invalid token - but NOT for auth endpoints (login/register)
      // Auth endpoints return 401 for invalid credentials, not expired tokens
      if (
        (response.status === 401 || response.status === 403) &&
        retry &&
        !isAuthEndpoint
      ) {
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

        // Log error details for auth endpoints
        if (isAuthEndpoint) {
          console.log("🔴 Auth request failed:", {
            status: response.status,
            message: msg,
            data: data,
          });
        }

        // Create an error object that includes response data for proper error handling
        const error = new Error(msg);
        error.response = { data: data || {}, status: response.status };
        throw error;
      }

      // Log success for auth endpoints
      if (isAuthEndpoint) {
        console.log("✅ Auth request successful:", {
          hasAccessToken: !!data?.accessToken,
          hasUser: !!data?.user,
        });
      }

      // For successful responses, data should exist
      // If it's null, that's unusual but we'll return it and let the caller handle it
      return data;
    } catch (error) {
      // Log the error for debugging auth requests
      if (isAuthEndpoint) {
        console.error("🔴 Auth request error caught:", {
          message: error.message,
          name: error.name,
          hasResponse: !!error.response,
          responseStatus: error.response?.status,
          stack: error.stack?.split("\n").slice(0, 3).join("\n"),
        });
      }

      // If it's already an error with response data (from server), re-throw it immediately
      // This includes 401 errors from login attempts with wrong credentials
      // Check for valid HTTP status codes (100-599)
      if (
        error.response &&
        typeof error.response.status === "number" &&
        error.response.status >= 100 &&
        error.response.status < 600
      ) {
        if (isAuthEndpoint) {
          console.log("🔄 Re-throwing server error (valid HTTP status)");
        }
        throw error;
      }

      // For network errors (like "Failed to fetch"), provide a more helpful error message
      // Network errors occur when fetch() itself fails, before we get a response
      const errorMessage =
        error?.message ||
        String(error) ||
        "Network error: Unable to connect to server";

      // Check for network errors
      const isNetworkError =
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("NetworkError") ||
        errorMessage.includes("Network request failed") ||
        error instanceof TypeError ||
        (error.name === "TypeError" &&
          errorMessage.toLowerCase().includes("fetch"));

      let finalErrorMessage;
      if (isNetworkError) {
        finalErrorMessage =
          "Unable to connect to server. Please check if the server is running and try again.";
      } else if (errorMessage.includes("CORS")) {
        finalErrorMessage =
          "CORS error: The server is blocking the request. Please check server configuration.";
      } else {
        finalErrorMessage = errorMessage;
      }

      // Log error details safely
      console.error("❌ API request failed:", finalErrorMessage);
      console.error("❌ Request URL:", url);
      if (isNetworkError) {
        console.error(
          "❌ This appears to be a network connectivity issue. Check:"
        );
        console.error(
          "   1. Is the server running on",
          this.baseURL.replace("/api", ""),
          "?"
        );
        console.error("   2. Are there any CORS issues?");
        console.error("   3. Is there a firewall blocking the connection?");
      }

      const apiError = new Error(finalErrorMessage);
      apiError.response = { data: { error: finalErrorMessage }, status: 0 };
      apiError.isNetworkError = isNetworkError;
      throw apiError;
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
