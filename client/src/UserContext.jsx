// src/UserContext.jsx
import { createContext, useState, useContext, useEffect } from "react";
import apiService from "./services/api";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---------------- Global refresh system ----------------
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => {
    console.log("🔁 Global refresh triggered");
    setRefreshKey((prev) => prev + 1);
  };

  // ---------------- Hydrate user on load ----------------
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        console.log("✅ Hydrated user from storage:", parsed);
      } catch (err) {
        console.error("❌ Failed to parse stored user:", err);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, [refreshKey]);

  // ---------------- Normal login (username/password) ----------------
  const login = async (credentials) => {
    try {
      const response = await apiService.login(credentials);
      const { token, user: userData } = response;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      console.error("❌ Login error:", error);
      return { success: false, error: error.message };
    }
  };

  // ---------------- Google login ----------------
  const loginWithGoogle = (token, userData) => {
    if (!token || !userData)
      return { success: false, error: "Invalid Google login" };
    try {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      console.log("✅ Google login success:", userData);
      return { success: true, user: userData };
    } catch (err) {
      console.error("❌ Failed to save Google login:", err);
      return { success: false, error: err.message };
    }
  };

  // ---------------- Register ----------------
  const register = async (userData) => {
    try {
      const response = await apiService.register(userData);
      return { success: true, data: response };
    } catch (error) {
      console.error("❌ Register error:", error);
      return { success: false, error: error.message };
    }
  };

  // ---------------- Logout ----------------
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    console.log("✅ User logged out");
  };

  // ---------------- Role helpers ----------------
  const isAdmin = () => user?.role === "ADMIN";
  const isManager = () => user?.role === "MANAGER";
  const isUser = () => user?.role === "USER";

  const value = {
    user,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    isAdmin,
    isManager,
    isUser,
    refreshKey,
    triggerRefresh, // ✅ used by other components
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};
