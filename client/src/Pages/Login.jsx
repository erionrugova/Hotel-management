import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../UserContext";
import { FcGoogle } from "react-icons/fc";

function Login() {
  const { login } = useUser();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login({ username, password });

    if (result.success) {
      if (result.user.role === "ADMIN") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    } else {
      setError(result.error || "Login failed");
    }

    setLoading(false);
  };

  // google login
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:3000/api/auth/google";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8F6F1]">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-[#E0D8C3]"
      >
        <h2 className="text-3xl font-semibold text-[#B89B5E] mb-6 text-center">
          Login
        </h2>

        <div className="mb-4">
          <label className="block text-gray-700 mb-1" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#C5A880]"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-1" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#C5A880]"
            required
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#B89B5E] text-white py-2 rounded hover:bg-[#a0854d] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <div className="flex items-center my-4">
          <hr className="flex-grow border-t border-gray-300" />
          <span className="px-2 text-gray-500 text-sm">OR</span>
          <hr className="flex-grow border-t border-gray-300" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded py-2 hover:bg-gray-100 transition"
        >
          <FcGoogle className="text-xl" />
          <span className="text-gray-700 font-medium">
            Continue with Google
          </span>
        </button>
      </form>
    </div>
  );
}

export default Login;
