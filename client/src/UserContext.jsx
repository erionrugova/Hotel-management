import { createContext, useState, useContext, useEffect } from "react";
import apiService from "./services/api";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(false);

  // decode JWT
  const parseJwt = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(base64));
    } catch {
      return {};
    }
  };

  // restore session on load
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (token && userData) {
        try {
          setUser(JSON.parse(userData));
          console.log("Restored user from local storage");
        } catch {
          console.error("Failed to parse stored user");
          localStorage.removeItem("user");
        }
      } else {
        console.log("No local session, trying to refresh token...");
        const newAccess = await apiService.refreshAccessToken();
        if (newAccess) {
          console.log("Session restored via refresh token");
          const decoded = parseJwt(newAccess);
          const newUser = {
            username: decoded.username,
            role: decoded.role,
          };
          setUser(newUser);
          localStorage.setItem("token", newAccess);
          localStorage.setItem("user", JSON.stringify(newUser));
        } else {
          console.log("No refresh token or expired session");
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  // login
  const login = async (credentials) => {
    try {
      const response = await apiService.login(credentials);
      const { accessToken, user: userData } = response;

      if (!accessToken || !userData) {
        throw new Error("Invalid response from server");
      }

      localStorage.setItem("token", accessToken);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      console.log("User logged in:", userData);

      return { success: true, user: userData };
    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, error: error.message };
    }
  };

  // google login
  const loginWithGoogle = (accessToken, userData) => {
    if (!accessToken || !userData) {
      console.error("Invalid Google login response");
      return { success: false, error: "Invalid Google login" };
    }

    localStorage.setItem("token", accessToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    console.log("Google login success:", userData);

    return { success: true, user: userData };
  };

  const logout = async (showModal = false) => {
    try {
      await apiService.logout(); // backen will revoke refresh token
    } catch (err) {
      console.warn("Logout request failed:", err);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);

    if (showModal) {
      setSessionExpired(true);
      console.log("Session expired, showing popup");
    } else {
      console.log("User logged out");
    }
  };

  // handle session expiry
  useEffect(() => {
    const handleExpired = () => logout(true);
    window.addEventListener("sessionExpired", handleExpired);
    return () => window.removeEventListener("sessionExpired", handleExpired);
  }, []);

  const triggerRefresh = () => {
    console.log("Global refresh triggered");
    setRefreshFlag((prev) => !prev);
  };

  const isAdmin = () => user?.role === "ADMIN";
  const isManager = () => user?.role === "MANAGER";
  const isUser = () => user?.role === "USER";

  const value = {
    user,
    loading,
    login,
    loginWithGoogle,
    logout,
    isAdmin,
    isManager,
    isUser,
    sessionExpired,
    setSessionExpired,
    refreshFlag,
    triggerRefresh,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};
