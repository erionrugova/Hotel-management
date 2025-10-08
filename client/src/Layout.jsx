import { Outlet } from "react-router-dom";
import Header from "./Pages/components/header";

function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
