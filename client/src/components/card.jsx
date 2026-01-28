import React from "react";

export function Card({ children, className = "" }) {
  // Check if background color is provided in className, otherwise default to white
  const hasBg = className.includes("bg-");
  const hasBorder = className.includes("border-");
  
  const baseClasses = `rounded-xl shadow-lg p-4 transition-all duration-200`;
  const defaultClasses = `${!hasBg ? "bg-white" : ""} ${!hasBorder ? "border border-gray-200" : ""}`;
  
  return (
    <div
      className={`${baseClasses} ${defaultClasses} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className }) {
  return <div className={`p-2 ${className}`}>{children}</div>;
}
