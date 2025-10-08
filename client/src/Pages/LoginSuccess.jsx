import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../UserContext";

function LoginSuccess() {
  const navigate = useNavigate();
  const { setUser } = useUser();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userBase64 = params.get("user");

    if (token && userBase64) {
      try {
        const decodedUser = atob(decodeURIComponent(userBase64));
        const parsedUser = JSON.parse(decodedUser);

        console.log("✅ Decoded user:", parsedUser);

        if (token.startsWith("eyJ")) {
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(parsedUser));

          setUser(parsedUser);

          console.log("✅ Stored backend JWT & updated context");
          navigate("/dashboard");
        } else {
          console.error("❌ Invalid Google token (not backend JWT)");
          alert("Invalid login response. Please try again.");
          navigate("/login");
        }
      } catch (error) {
        console.error("❌ Error decoding login data:", error);
        navigate("/login?error=google_auth_failed");
      }
    } else {
      console.warn("⚠️ Missing login data in redirect URL");
      navigate("/login");
    }
  }, [navigate, setUser]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h2 className="text-2xl font-semibold mb-4">Signing you in...</h2>
      <p className="text-gray-600">Please wait while we finalize your login.</p>
    </div>
  );
}

export default LoginSuccess;
