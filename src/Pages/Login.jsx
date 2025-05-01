import React from 'react';

function Login() {
    const handleSubmit = (e) => {
        e.preventDefault();
        window.location.href = '/dashboard';
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-blue-50">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm"
            >
                <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">Login</h2>

                <div className="mb-4">
                    <label className="block text-gray-700 mb-1" htmlFor="username">
                        Username
                    </label>
                    <input
                        id="username"
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                    Log In
                </button>
            </form>
        </div>
    );
}

export default Login;
