import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BedDouble,
  Users,
  Percent,
  DollarSign,
  Receipt,
  Settings,
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
    { name: "Invoices", path: "/dashboard/invoices", icon: <Receipt size={18} /> },
    { name: "Settings", path: "/dashboard/settings", icon: <Settings size={18} /> },
  ];

  return (
    <div className="w-64 bg-slate-900 text-slate-100 h-screen fixed top-0 left-0 flex flex-col border-r border-slate-800 shadow-xl z-50">
      <div className="p-6 text-2xl font-bold border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-lg">H</span>
        </div>
        <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Four Seasons Hotel
        </span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all duration-200 font-medium ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 translate-x-1"
                  : "hover:bg-slate-800 text-slate-400 hover:text-white hover:translate-x-1"
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <div className="px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700">
          <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">System Status</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm text-emerald-400 font-medium">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardSidebar;
