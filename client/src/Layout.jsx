import { Outlet } from "react-router-dom";
import Header from "./Pages/components/header";
import Footer from "./Pages/components/footer";

function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
