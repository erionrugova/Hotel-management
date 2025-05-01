import React from "react";

function Header() {
  return (
    <header className="bg-blue-900  text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">Hotel Paradise</h1>
        <nav className="space-x-4">
          <a href="/" className="hover:underline">Home</a>
          <a href="/" className="hover:underline">Rooms</a>
          <a href="/about" className="hover:underline">Contact</a>
          <a href="/login" className="hover:underline">Log in</a>
        </nav>
      </div>
    </header>
  );
}

export default Header;
