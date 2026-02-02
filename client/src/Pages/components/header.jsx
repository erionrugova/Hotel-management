import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../../UserContext";
import { FaUser, FaBook, FaSignOutAlt, FaChevronDown } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin, isManager } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  const publicNavItems = [
    { name: "Home", path: "/" },
    { name: "Rooms", path: "/rooms" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-[#B89B5E]">
              Four Seasons Hotel
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8">
            {publicNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? "text-[#B89B5E] bg-[#F8F6F1]"
                    : "text-gray-700 hover:text-[#B89B5E] hover:bg-gray-100"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3 relative" ref={menuRef}>
                {/* User Profile Button */}
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#F8F6F1] to-[#F0EDE5] hover:from-[#F0EDE5] hover:to-[#E8E4D9] transition-all duration-200 border border-[#E0DCCF] shadow-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-[#B89B5E] flex items-center justify-center text-white font-semibold text-sm">
                    <FaUser className="text-xs" />
                  </div>
                  <span className="text-sm font-medium text-gray-800 hidden sm:inline">
                    {user.username}
                  </span>
                  <FaChevronDown className={`text-xs text-gray-600 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 animate-[fadeIn_0.2s_ease-in-out_forwards]">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Account</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{user.username}</p>
                    </div>
                    
                    <div className="py-1">
                      <Link
                        to="/my-bookings"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F8F6F1] hover:text-[#B89B5E] transition-colors group"
                      >
                        <FaBook className="text-[#B89B5E] group-hover:text-[#B89B5E] transition-colors" />
                        <span className="font-medium">My Bookings</span>
                      </Link>

                      {isAdmin() && (
                        <Link
                          to="/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F8F6F1] hover:text-[#B89B5E] transition-colors group"
                        >
                          <div className="w-4 h-4 rounded bg-[#B89B5E] flex items-center justify-center">
                            <span className="text-white text-xs font-bold">A</span>
                          </div>
                          <span className="font-medium">Admin Dashboard</span>
                        </Link>
                      )}

                      {isManager() && (
                        <Link
                          to="/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F8F6F1] hover:text-[#B89B5E] transition-colors group"
                        >
                          <div className="w-4 h-4 rounded bg-[#B89B5E] flex items-center justify-center">
                            <span className="text-white text-xs font-bold">M</span>
                          </div>
                          <span className="font-medium">Manager Dashboard</span>
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                        className="flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full group"
                      >
                        <FaSignOutAlt className="group-hover:translate-x-0.5 transition-transform" />
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-[#B89B5E] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#a0854d] transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
