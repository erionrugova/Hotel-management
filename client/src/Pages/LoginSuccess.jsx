// src/Pages/LoginSuccess.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../UserContext";

function LoginSuccess() {
  const navigate = useNavigate();
  const { loginWithGoogle, user } = useUser();

  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userBase64 = params.get("user");

    if (token && userBase64) {
      try {
        // ✅ Decode safely (URL decode + Base64 decode)
        const userStr = atob(decodeURIComponent(userBase64));
        const parsedUser = JSON.parse(userStr);

        console.log("✅ Decoded user from callback:", parsedUser);

        const result = loginWithGoogle(token, parsedUser);

        if (!result.success) {
          console.error("❌ loginWithGoogle failed:", result);
          setProcessing(false);
          navigate("/login?error=google_auth_failed");
        }
      } catch (err) {
        console.error("❌ LoginSuccess decode error:", err);
        setProcessing(false);
        navigate("/login?error=google_auth_failed");
      }
    } else {
      console.error("❌ Missing token or user in query");
      setProcessing(false);
      navigate("/login?error=google_auth_failed");
    }
  }, [loginWithGoogle, navigate]);

  // ✅ When user context updates, navigate based on role
  useEffect(() => {
    if (user) {
      console.log("🎉 User set in context:", user);
      setProcessing(false);

      if (user.role === "ADMIN") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    }
  }, [user, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen text-gray-700">
      {processing ? "Logging you in with Google..." : "Redirecting..."}
    </div>
  );
}

export default LoginSuccess;
