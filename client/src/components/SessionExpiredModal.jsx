import React from "react";
import { useUser } from "../UserContext";

export default function SessionExpiredModal() {
  const { sessionExpired, setSessionExpired } = useUser();

  if (!sessionExpired) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
      <div className="bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-800 text-center w-80">
        <h2 className="text-xl font-semibold text-white mb-3">
          Session Expired
        </h2>
        <p className="text-slate-400 mb-6">
          Your session has expired. Please log in again.
        </p>
        <button
          onClick={() => {
            setSessionExpired(false);
            window.location.href = "/login";
          }}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-indigo-500/20 font-medium"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}
