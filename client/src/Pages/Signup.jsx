import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../UserContext";
import apiService from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { 
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle
} from "react-icons/fa";

function Signup() {
  const { login } = useUser();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getPasswordStrength = (pwd) => {
    if (pwd.length === 0) return { strength: 0, label: "", color: "" };
    if (pwd.length < 6) return { strength: 1, label: "Weak", color: "red" };
    if (pwd.length < 8) return { strength: 2, label: "Fair", color: "yellow" };
    if (pwd.length < 12) return { strength: 3, label: "Good", color: "blue" };
    return { strength: 4, label: "Strong", color: "green" };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.register({ username, password });

      if (response && response.message) {
        const loginResult = await login({ username, password });

        if (loginResult.success) {
          if (loginResult.user.role === "ADMIN") {
            navigate("/dashboard");
          } else {
            navigate("/");
          }
        } else {
          navigate("/login?registered=true");
        }
      } else {
        setError("Registration failed. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:3000/api/auth/google";
  };

  return (
    <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center p-4 py-12">
      <motion.div
        className="w-full max-w-lg"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="bg-white rounded-3xl shadow-2xl p-10 md:p-12 border border-gray-200/50">
          {/* Header */}
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#B89B5E] to-[#C5A880] mb-5 shadow-lg">
              <FaUser className="text-white text-xl" />
            </div>
            <h1 className="text-5xl font-bold text-[#B89B5E] mb-3 tracking-tight">
              Create Account
            </h1>
            <p className="text-gray-600 text-base font-light">
              Join Four Seasons Hotel and start your journey
            </p>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-lg flex items-center gap-3 shadow-sm"
              >
                <FaExclamationTriangle className="text-red-500 flex-shrink-0" size={20} />
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#B89B5E]/5 to-[#C5A880]/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
                <div className="relative">
                  <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-[#B89B5E] transition-colors" size={18} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B89B5E]/20 focus:border-[#B89B5E] transition-all text-gray-800 placeholder-gray-400 font-medium"
                    placeholder="At least 3 characters"
                    required
                    minLength={3}
                  />
                </div>
              </div>
              {username && username.length < 3 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-xs text-red-500 flex items-center gap-1.5"
                >
                  <FaTimesCircle size={12} />
                  Username must be at least 3 characters
                </motion.p>
              )}
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#B89B5E]/5 to-[#C5A880]/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-[#B89B5E] transition-colors" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B89B5E]/20 focus:border-[#B89B5E] transition-all text-gray-800 placeholder-gray-400 font-medium"
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#B89B5E] transition-colors p-1"
                  >
                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
              </div>
              
              {/* Password Strength */}
              {password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3"
                >
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          passwordStrength.color === "red" ? "bg-red-500" :
                          passwordStrength.color === "yellow" ? "bg-yellow-500" :
                          passwordStrength.color === "blue" ? "bg-blue-500" :
                          "bg-green-500"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${
                      passwordStrength.color === "red" ? "text-red-500" :
                      passwordStrength.color === "yellow" ? "text-yellow-500" :
                      passwordStrength.color === "blue" ? "text-blue-500" :
                      "text-green-500"
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">At least 6 characters required</p>
                </motion.div>
              )}
            </motion.div>

            {/* Confirm Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                Confirm Password
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#B89B5E]/5 to-[#C5A880]/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-[#B89B5E] transition-colors" size={18} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B89B5E]/20 focus:border-[#B89B5E] transition-all text-gray-800 placeholder-gray-400 font-medium"
                    placeholder="Re-enter your password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#B89B5E] transition-colors p-1"
                  >
                    {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
              </div>
              {confirmPassword && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`mt-2 text-xs flex items-center gap-1.5 ${
                    password === confirmPassword && password.length >= 6
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {password === confirmPassword && password.length >= 6 ? (
                    <>
                      <FaCheckCircle size={12} />
                      Passwords match
                    </>
                  ) : (
                    <>
                      <FaTimesCircle size={12} />
                      Passwords do not match
                    </>
                  )}
                </motion.p>
              )}
            </motion.div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading || password !== confirmPassword || password.length < 6 || username.length < 3}
              className="group relative w-full overflow-hidden bg-gradient-to-r from-[#B89B5E] to-[#C5A880] text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <span className="relative z-10">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </span>
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-8">
            <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            <span className="px-5 text-gray-500 text-sm font-medium">OR</span>
            <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          </div>

          {/* Google Button */}
          <motion.button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 rounded-xl py-4 hover:border-[#B89B5E] hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <FcGoogle className="text-2xl group-hover:scale-110 transition-transform" />
            <span className="text-gray-700 font-semibold group-hover:text-[#B89B5E] transition-colors">
              Continue with Google
            </span>
          </motion.button>

          {/* Login Link */}
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-[#B89B5E] hover:text-[#C5A880] font-semibold transition-colors relative group"
              >
                Log in
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#B89B5E] group-hover:w-full transition-all duration-300"></span>
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default Signup;
