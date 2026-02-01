import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPhoneAlt, FaEnvelope, FaLocationArrow, FaCheckCircle, FaArrowRight } from "react-icons/fa";
import { Mail, MapPin, Phone, MessageCircle, Clock, Sparkles, Heart, ChevronDown, HelpCircle } from "lucide-react";
import apiService from "../services/api";
import { useUser } from "../UserContext";

// FadeInSection Component
const FadeInSection = ({ children, delay = 0, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// FAQ Item Component - Luxury Design
const FAQItem = ({ question, answer, index, isOpen, onToggle }) => {
  return (
    <motion.div
      className="group relative bg-white rounded-2xl border-2 border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1, type: "spring" }}
      whileHover={{ y: -3, borderColor: "#B89B5E" }}
    >
      {/* Luxury Background Gradient on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#B89B5E]/5 via-transparent to-[#C5A880]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <button
        onClick={onToggle}
        className="w-full px-8 py-6 flex items-center justify-between text-left relative z-10 group-hover:bg-gradient-to-r group-hover:from-[#B89B5E]/5 group-hover:to-transparent transition-all duration-300"
      >
        <div className="flex items-center gap-4 flex-1">
          {/* Number Badge */}
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B89B5E] to-[#C5A880] flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {index + 1}
          </motion.div>
          <span className="font-bold text-gray-900 text-xl pr-4 group-hover:text-[#B89B5E] transition-colors duration-300">
            {question}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="flex-shrink-0"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#B89B5E] to-[#C5A880] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
            <ChevronDown className="text-white" size={20} />
          </div>
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden relative z-10"
          >
            <div className="px-8 pb-8 pt-2">
              <div className="pl-14 border-l-4 border-[#B89B5E] bg-gradient-to-r from-[#B89B5E]/5 to-transparent rounded-r-lg p-6">
                <p className="text-gray-700 leading-relaxed text-lg">
                  {answer}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

function ContactUs() {
  const { isAdmin, isManager } = useUser();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(null);
  const [hotelSettings, setHotelSettings] = useState({
    address: "",
    phone: "",
    contactEmail: "",
  });

  const faqs = [
    {
      question: "What are your check-in and check-out times?",
      answer: "Check-in is available from 3:00 PM, and check-out is until 11:00 AM. Early check-in and late check-out may be available upon request, subject to availability. Please contact us in advance to make arrangements.",
    },
    {
      question: "Do you offer accessible rooms?",
      answer: "Yes, we have fully accessible rooms designed to accommodate guests with disabilities. These rooms feature wider doorways, roll-in showers, grab bars, and other accessibility features to ensure a comfortable stay for all our guests.",
    },
    {
      question: "Is Wi-Fi available throughout the hotel?",
      answer: "Yes, complimentary high-speed Wi-Fi is available in all rooms and public areas of the hotel. You'll receive the Wi-Fi password upon check-in, and our staff will be happy to assist you with any connectivity needs.",
    },
    {
      question: "What dining options are available?",
      answer: "We offer multiple dining experiences including our fine dining restaurant, rooftop bar, lobby café, and 24/7 room service. Our restaurant features international cuisine prepared by world-class chefs. Reservations are recommended for our restaurant, especially during peak hours.",
    },
    {
      question: "Do you have parking facilities?",
      answer: "Yes, we offer both valet parking and self-parking services. Valet parking is available 24/7, and self-parking is available in our secure parking garage. Please contact us for current rates and availability, or mention your parking needs when making your reservation.",
    },
    {
      question: "Are pets allowed?",
      answer: "We welcome well-behaved pets in designated pet-friendly rooms. Please contact us in advance to make arrangements and review our pet policy. Additional fees may apply, and we ask that pets be kept on a leash in public areas.",
    },
    {
      question: "What is your cancellation policy?",
      answer: "Cancellation policies vary depending on the rate type and booking channel. Generally, cancellations made 48 hours or more before check-in are free of charge. For specific cancellation terms, please refer to your booking confirmation or contact our reservations team.",
    },
    {
      question: "Do you offer airport transportation?",
      answer: "Yes, we offer airport transportation services for our guests. Both shuttle service and private car arrangements can be made. Please contact our concierge team in advance to arrange transportation, and we'll be happy to assist you with your travel needs.",
    },
  ];

  useEffect(() => {
    const fetchHotelSettings = async () => {
      try {
        const settings = await apiService.getHotelSettingsPublic();
        if (settings) {
          setHotelSettings({
            address: settings.address || "",
            phone: settings.phone || "",
            contactEmail: settings.contactEmail || "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch hotel settings:", err);
      }
    };
    fetchHotelSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    if (!formData.name || !formData.email || !formData.message) {
      setError("All fields are required.");
      setIsSubmitting(false);
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email address.");
      setIsSubmitting(false);
      return;
    }

    try {
      await apiService.sendMessage(formData);
      setSuccess(true);
      setFormData({ name: "", email: "", message: "" });
      setTimeout(() => {
        setSuccess(false);
      }, 4000);
    } catch {
      setError("Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      {/* Main Content - Two Column Layout */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - "We Are Here For You" Section */}
          <FadeInSection delay={0.2}>
            <div className="space-y-8">
              {/* Header Card */}
              <motion.div
                className="bg-gradient-to-br from-[#B89B5E] to-[#C5A880] rounded-3xl p-10 md:p-12 text-white relative overflow-hidden shadow-2xl"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>

                <div className="relative z-10">
                  <motion.div
                    className="inline-flex items-center gap-2 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Heart className="text-white" size={24} />
                    <span className="text-sm font-semibold uppercase tracking-wider text-white/90">Our Commitment</span>
                  </motion.div>

                  <motion.h2
                    className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    We Are Here For You
                  </motion.h2>

                  <motion.p
                    className="text-lg md:text-xl text-white/90 leading-relaxed mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    At our hotel, we are committed to providing exceptional service and ensuring your comfort.
                    Whether you have questions about your stay, need assistance with bookings, or have special requests,
                    our dedicated support team is available to help.
                  </motion.p>

                  {/* Response Time Badge */}
                  <motion.div
                    className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Clock className="text-white" size={20} />
                    <span className="font-semibold">24-Hour Response Guarantee</span>
                  </motion.div>
                </div>
              </motion.div>

              {/* Contact Information Cards */}
              <div className="space-y-4">
                {hotelSettings.phone && (
                  <motion.a
                    href={`tel:${hotelSettings.phone}`}
                    className="group block bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    whileHover={{ x: 5, scale: 1.02 }}
                  >
                    <div className="flex items-center gap-4">
                      <motion.div
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#B89B5E] to-[#C5A880] flex items-center justify-center text-white shadow-lg"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Phone className="text-white" size={24} />
                      </motion.div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide mb-1">Phone</p>
                        <p className="text-xl font-bold text-gray-900 group-hover:text-[#B89B5E] transition-colors">
                          {hotelSettings.phone}
                        </p>
                      </div>
                      <FaArrowRight className="text-gray-400 group-hover:text-[#B89B5E] group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.a>
                )}

                {hotelSettings.contactEmail && (
                  <motion.a
                    href={`mailto:${hotelSettings.contactEmail}`}
                    className="group block bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                    whileHover={{ x: 5, scale: 1.02 }}
                  >
                    <div className="flex items-center gap-4">
                      <motion.div
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#B89B5E] to-[#C5A880] flex items-center justify-center text-white shadow-lg"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Mail className="text-white" size={24} />
                      </motion.div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide mb-1">Email</p>
                        <p className="text-xl font-bold text-gray-900 group-hover:text-[#B89B5E] transition-colors break-all">
                          {hotelSettings.contactEmail}
                        </p>
                      </div>
                      <FaArrowRight className="text-gray-400 group-hover:text-[#B89B5E] group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.a>
                )}

                {hotelSettings.address && (
                  <motion.a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotelSettings.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group block bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 }}
                    whileHover={{ x: 5, scale: 1.02 }}
                  >
                    <div className="flex items-start gap-4">
                      <motion.div
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#B89B5E] to-[#C5A880] flex items-center justify-center text-white shadow-lg flex-shrink-0"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <MapPin className="text-white" size={24} />
                      </motion.div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide mb-1">Location</p>
                        <p className="text-lg font-bold text-gray-900 group-hover:text-[#B89B5E] transition-colors mb-2">
                          {hotelSettings.address}
                        </p>
                        <span className="text-[#B89B5E] font-semibold inline-flex items-center gap-1 text-sm">
                          View on map <FaArrowRight className="text-xs group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </motion.a>
                )}
              </div>
            </div>
          </FadeInSection>

          {/* Right Column - Contact Form */}
          <FadeInSection delay={0.3}>
            <motion.div
              className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-100 relative overflow-hidden"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#B89B5E]/5 to-transparent rounded-full blur-3xl"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 text-[#B89B5E] font-semibold text-xs uppercase tracking-wider mb-6">
                  <MessageCircle className="text-[#B89B5E]" size={16} />
                  <span>Get in Touch</span>
                </div>

                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Send us a Message
                </h3>
                <p className="text-gray-600 mb-8">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-lg"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <p className="font-medium">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {success && (
                    <motion.div
                      className="bg-green-50 border-l-4 border-green-500 text-green-700 p-6 mb-6 rounded-r-lg flex items-center gap-3"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <FaCheckCircle className="text-2xl" />
                      </motion.div>
                      <div>
                        <p className="font-semibold text-lg">Message sent successfully!</p>
                        <p className="text-sm">We'll get back to you within 24 hours.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#B89B5E] focus:border-[#B89B5E] transition-all duration-300 bg-gray-50 focus:bg-white"
                      placeholder="Enter your full name"
                      required
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#B89B5E] focus:border-[#B89B5E] transition-all duration-300 bg-gray-50 focus:bg-white"
                      placeholder="your.email@example.com"
                      required
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Message
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows="6"
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#B89B5E] focus:border-[#B89B5E] transition-all duration-300 resize-none bg-gray-50 focus:bg-white"
                      placeholder="Tell us how we can help you..."
                      required
                    ></textarea>
                  </motion.div>

                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-[#B89B5E] to-[#C5A880] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    whileHover={{ scale: isSubmitting ? 1 : 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-[#C5A880] to-[#B89B5E] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    <span className="relative z-10 flex items-center gap-2">
                      {isSubmitting ? (
                        <>
                          <motion.div
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Message
                          <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </FadeInSection>
        </div>

        {/* FAQ Section - Luxury Design */}
        <FadeInSection delay={0.4} className="mt-32">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <motion.div
                className="inline-flex items-center gap-2 text-[#B89B5E] font-semibold text-xs uppercase tracking-wider mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#B89B5E] to-[#C5A880] flex items-center justify-center">
                  <HelpCircle className="text-white" size={16} />
                </div>
                <span>Your Questions Answered</span>
              </motion.div>
              <motion.h3
                className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Frequently Asked{" "}
                <span className="bg-gradient-to-r from-[#B89B5E] to-[#C5A880] bg-clip-text text-transparent">
                  Questions
                </span>
              </motion.h3>
              <motion.p
                className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Discover everything you need to know about your luxury stay with us
              </motion.p>
            </div>

            <div className="space-y-5">
              {faqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  index={index}
                  isOpen={openFAQ === index}
                  onToggle={() => setOpenFAQ(openFAQ === index ? null : index)}
                />
              ))}
            </div>

            {/* Additional Help CTA */}
            <motion.div
              className="mt-16 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="bg-gradient-to-br from-[#B89B5E] to-[#C5A880] rounded-2xl p-8 shadow-xl">
                <p className="text-white text-lg mb-4 font-medium">
                  Still have questions?
                </p>
                <p className="text-white/90 mb-6">
                  Our concierge team is available 24/7 to assist you with any inquiries.
                </p>
                <motion.a
                  href="#contact-form"
                  className="inline-flex items-center gap-2 bg-white text-[#B89B5E] px-8 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-lg"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Contact Us
                  <FaArrowRight />
                </motion.a>
              </div>
            </motion.div>
          </div>
        </FadeInSection>
      </div>
    </div>
  );
}

export default ContactUs;
