import React from "react";

function Footer() {
  return (
    <footer className="bg-[#1F1F1F] text-[#F5F5F5] py-6 text-center border-t border-[#B89B5E]/30">
      <p className="text-sm tracking-wide">
        © {new Date().getFullYear()}{" "}
        <span className="text-[#B89B5E] font-semibold">Four Seasons Hotel</span>
        . All rights reserved.
      </p>
      <p className="text-gray-400 text-xs mt-1">
        Designed with luxury and precision ✨
      </p>
    </footer>
  );
}

export default Footer;
