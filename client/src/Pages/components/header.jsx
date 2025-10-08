import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../../UserContext";

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin, isManager } = useUser();

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

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {user.username}
                </span>

                {isAdmin() && (
                  <Link
                    to="/dashboard"
                    className="bg-[#B89B5E] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#a0854d] transition-colors"
                  >
                    Admin Dashboard
                  </Link>
                )}

                {isManager() && (
                  <Link
                    to="/dashboard"
                    className="bg-[#B89B5E] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#a0854d] transition-colors"
                  >
                    Manager Dashboard
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-[#B89B5E] text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-[#B89B5E] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#a0854d] transition-colors"
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
