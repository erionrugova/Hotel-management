import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../UserContext";

const users = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "user", password: "12345", role: "user" },
];

function Login() {
  const { setUser } = useUser();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const foundUser = users.find(
      (u) => u.username === username && u.password === password
    );

    if (foundUser) {
      setUser({ name: foundUser.username, role: foundUser.role });
      if (foundUser.role === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    } else {
      setError("Wrong username or password");
    }
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
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#C5A880]"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#B89B5E] text-white py-2 rounded hover:bg-[#a0854d] transition"
        >
          Log In
        </button>
      </form>
    </div>
  );
}

export default Login;
