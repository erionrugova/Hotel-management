import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BedDouble,
  Users,
  Percent,
  DollarSign,
} from "lucide-react";

function DashboardSidebar() {
  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    {
      name: "Front Desk",
      path: "/dashboard/frontdesk",
      icon: <BedDouble size={18} />,
    },
    { name: "Rooms", path: "/dashboard/rooms", icon: <BedDouble size={18} /> },
    { name: "Guests", path: "/dashboard/guests", icon: <Users size={18} /> },
    { name: "Deals", path: "/dashboard/deals", icon: <Percent size={18} /> },
    { name: "Rates", path: "/dashboard/rates", icon: <DollarSign size={18} /> },
  ];

  return (
    <div className="w-64 bg-gray-900 text-gray-100 h-screen fixed top-0 left-0 flex flex-col">
      <div className="p-4 text-xl font-bold border-b border-gray-800">
        Four Seasons Hotel
      </div>
      <nav className="flex-1 p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg mb-2 transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-800 text-gray-300"
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default DashboardSidebar;
