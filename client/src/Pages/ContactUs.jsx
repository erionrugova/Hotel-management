import React, { useState } from "react";
import { FaPhoneAlt, FaEnvelope, FaLocationArrow } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function ContactUs() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        message: ""
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.message) {
            setError("All fields are required.");
            return;
        }
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            setError("Please enter a valid email address.");
            return;
        }

        setTimeout(() => {
            setSuccess("Your message has been sent successfully!");
            setFormData({ name: "", email: "", message: "" });
            setError(null);
        }, 1000);
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-[#F8F6F1] py-12 px-4">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl">
                <h2 className="text-3xl font-semibold mb-6 text-center text-[#C5A880]">Contact Us</h2>

                {error && <div className="bg-red-100 text-red-700 p-4 mb-4 rounded-md">{error}</div>}
                {success && <div className="bg-green-100 text-green-700 p-4 mb-4 rounded-md">{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-[#C5A880]"
                            placeholder="Your Name"
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-[#C5A880]"
                            placeholder="Your Email"
                        />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                            Message
                        </label>
                        <textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleInputChange}
                            rows="4"
                            className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-[#C5A880]"
                            placeholder="Your Message"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#C5A880] text-[#1F1F1F] py-3 rounded-md hover:bg-[#B9965D] transition duration-300"
                    >
                        Send Message
                    </button>
                </form>

                <div className="mt-8 text-center text-gray-600">
                    <p className="font-medium">Or contact us at:</p>
                    <div className="flex flex-wrap justify-center space-x-4 mt-4 text-[#C5A880]">
                        <a href="tel:+1234567890" className="flex items-center">
                            <FaPhoneAlt className="mr-2" />
                            +1 234 567 890
                        </a>
                        <a href="mailto:support@example.com" className="flex items-center">
                            <FaEnvelope className="mr-2" />
                            support@example.com
                        </a>
                        <a href="https://www.google.com/maps" className="flex items-center">
                            <FaLocationArrow className="mr-2" />
                            Find us on Google Maps
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ContactUs;
