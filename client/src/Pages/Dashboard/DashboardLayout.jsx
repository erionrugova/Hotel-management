import DashboardSidebar from "./DashboardSidebar";
import { Outlet } from "react-router-dom";

function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      <DashboardSidebar />

      <div className="ml-64 flex-1 p-8">
        <Outlet />
      </div>
    </div>
  );
}

export default DashboardLayout;
