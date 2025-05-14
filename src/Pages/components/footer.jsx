import React from "react";

function Footer() {
  return (
    <footer className="bg-[#1F1F1F] text-[#F5F5F5] p-4 text-center">
      © {new Date().getFullYear()} Four Seasons Hotel. All rights reserved.
    </footer>
  );
}

export default Footer;
