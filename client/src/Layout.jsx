import { Link, Outlet, useLocation } from "react-router-dom";

function Layout() {
  const location = useLocation();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Front Desk", path: "/dashboard/frontdesk" },
    { name: "Guests", path: "/dashboard/guests" },
    { name: "Rooms", path: "/dashboard/roomsDashboard" },
    { name: "Deals", path: "/dashboard/deals" },
    { name: "Rate", path: "/dashboard/rate" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-6">
        <h1 className="text-xl font-bold mb-6">Four Seasons Hotel</h1>
        <nav className="space-y-4">
          {navItems.map((item, i) => (
            <Link
              key={i}
              to={item.path}
              className={`block px-4 py-2 rounded ${
                location.pathname === item.path
                  ? "bg-blue-500 text-white"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
