import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaPhoneAlt, FaEnvelope, FaLocationArrow } from "react-icons/fa";
import apiService from "../services/api";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
  }),
};

function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.name || !formData.email || !formData.message) {
      setError("All fields are required.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      await apiService.sendMessage(formData);
      setSuccess("Your message has been sent successfully!");
      setFormData({ name: "", email: "", message: "" });
    } catch {
      setError("Failed to send message. Please try again later.");
    }
  };

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <motion.div
      className="min-h-screen bg-[#F8F6F1] flex flex-col overflow-hidden"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0 }}
    >
      <div className="relative h-[380px] md:h-[420px] overflow-hidden bg-gradient-to-b from-[#B9965D]/70 via-[#C5A880]/50 to-[#F8F6F1] flex items-center justify-center">
        <div className="text-center text-white px-6">
          <motion.h1
            className="text-5xl md:text-6xl font-extrabold mb-3 drop-shadow-lg"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Contact Us
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl italic font-light"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            We’d love to hear from you — reach out anytime.
          </motion.p>
        </div>
      </div>

      <motion.div
        className="flex justify-center items-center flex-1 py-16 px-4"
        variants={fadeUp}
        custom={1}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-xl p-8 md:p-10 w-full max-w-2xl border-t-4 border-[#C5A880]"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-6 text-center text-[#B9965D]">
            Get in Touch
          </h2>

          {error && (
            <motion.div
              className="bg-red-100 text-red-700 p-3 mb-4 rounded-md"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              className="bg-green-100 text-green-700 p-3 mb-4 rounded-md"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {success}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-[#C5A880] focus:border-transparent transition-all duration-300"
                placeholder="Your Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-[#C5A880] transition-all duration-300"
                placeholder="Your Email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows="4"
                className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-[#C5A880] transition-all duration-300"
                placeholder="Your Message"
              ></textarea>
            </div>

            <motion.button
              type="submit"
              className="w-full bg-[#C5A880] text-[#1F1F1F] py-3 rounded-md font-semibold text-lg shadow-md hover:bg-[#B9965D] hover:shadow-lg transition-all duration-300"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Send Message
            </motion.button>
          </form>

          <motion.div
            className="mt-10 text-center text-gray-600"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <p className="font-medium mb-2">Or reach us directly at:</p>
            <div className="flex flex-wrap justify-center gap-6 mt-4 text-[#B9965D] text-lg">
              <a
                href="tel:+1234567890"
                className="flex items-center hover:text-[#a0854d] transition"
              >
                <FaPhoneAlt className="mr-2" /> +1 234 567 890
              </a>
              <a
                href="mailto:support@example.com"
                className="flex items-center hover:text-[#a0854d] transition"
              >
                <FaEnvelope className="mr-2" /> support@example.com
              </a>
              <a
                href="https://www.google.com/maps"
                target="_blank"
                rel="noreferrer"
                className="flex items-center hover:text-[#a0854d] transition"
              >
                <FaLocationArrow className="mr-2" /> Find us on Google Maps
              </a>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default ContactUs;
