import React from 'react';

function Login() {
    const handleSubmit = (e) => {
        e.preventDefault();
        window.location.href = '/dashboard';
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#F8F6F1]">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-[#E0D8C3]"
            >
                <h2 className="text-3xl font-semibold text-[#B89B5E] mb-6 text-center">Login</h2>

                <div className="mb-4">
                    <label className="block text-gray-700 mb-1" htmlFor="username">
                        Username
                    </label>
                    <input
                        id="username"
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#C5A880]"
                        required
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 mb-1" htmlFor="password">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#C5A880]"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-[#B89B5E] text-white py-2 rounded hover:bg-[#a0854d] transition"
                >
                    Log In
                </button>
            </form>
        </div>
    );
}

export default Login;
