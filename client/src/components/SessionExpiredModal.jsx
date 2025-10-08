import React from "react";
import { useUser } from "../UserContext";

export default function SessionExpiredModal() {
  const { sessionExpired, setSessionExpired } = useUser();

  if (!sessionExpired) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div className="bg-white p-6 rounded-2xl shadow-lg text-center w-80">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Session Expired
        </h2>
        <p className="text-gray-600 mb-4">
          Your session has expired. Please log in again.
        </p>
        <button
          onClick={() => {
            setSessionExpired(false);
            window.location.href = "/login";
          }}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}
