import DashboardSidebar from "./DashboardSidebar";
import { Outlet } from "react-router-dom";

function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />

      <div className="ml-64 flex-1 p-6">
        <Outlet />
      </div>
    </div>
  );
}

export default DashboardLayout;
