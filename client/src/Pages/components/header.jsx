import React from "react";
import { useUser } from "../../UserContext";

function Header() {
  const { user } = useUser();
  return (
    <header className="bg-[#1F1F1F] text-[#F5F5F5] shadow-md">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-wide">
          {user ? `Hello, ${user.name}` : "Four Seasons Hotel"}
        </h1>
        <nav className="space-x-6">
          <a href="/" className="hover:text-[#C5A880] transition duration-300">
            Home
          </a>
          <a
            href="/rooms"
            className="hover:text-[#C5A880] transition duration-300"
          >
            Rooms
          </a>
          <a
            href="/about"
            className="hover:text-[#C5A880] transition duration-300"
          >
            About us
          </a>
          <a
            href="/contact"
            className="hover:text-[#C5A880] transition duration-300"
          >
            Contact
          </a>
          <a
            href="/login"
            className="hover:text-[#C5A880] transition duration-300"
          >
            Log in
          </a>
        </nav>
      </div>
    </header>
  );
}

export default Header;
