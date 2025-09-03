import React from "react";

// Card wrapper
export function Card({ children, className }) {
  return (
    <div
      className={`bg-white rounded-lg shadow-md p-4 border border-gray-200 ${className}`}
    >
      {children}
    </div>
  );
}

// Card content
export function CardContent({ children, className }) {
  return <div className={`p-2 ${className}`}>{children}</div>;
}
