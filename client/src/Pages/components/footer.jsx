import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  FaFacebookF, 
  FaTwitter, 
  FaInstagram, 
  FaLinkedinIn,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaArrowRight,
  FaCrown
} from "react-icons/fa";

function Footer() {
  const [email, setEmail] = useState("");
  const location = useLocation();

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleLinkClick = () => {
    scrollToTop();
  };

  useEffect(() => {
    scrollToTop();
  }, [location.pathname]);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    alert("Thank you for subscribing to our newsletter!");
    setEmail("");
  };

  const quickLinks = [
    { name: "Home", path: "/" },
    { name: "Rooms", path: "/rooms" },
    { name: "About Us", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  const accountLinks = [
    { name: "Login", path: "/login" },
    { name: "Sign Up", path: "/signup" },
  ];

  const socialLinks = [
    { icon: FaFacebookF, url: "https://facebook.com", label: "Facebook", color: "hover:text-blue-500" },
    { icon: FaTwitter, url: "https://twitter.com", label: "Twitter", color: "hover:text-sky-400" },
    { icon: FaInstagram, url: "https://instagram.com", label: "Instagram", color: "hover:text-pink-500" },
    { icon: FaLinkedinIn, url: "https://linkedin.com", label: "LinkedIn", color: "hover:text-blue-600" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <footer className="relative bg-gradient-to-br from-[#0a0a0a] via-[#151515] to-[#0a0a0a] text-gray-300 overflow-hidden">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#B89B5E]/5 via-transparent to-[#B89B5E]/5 opacity-50"></div>
      
      {/* Sophisticated pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #B89B5E 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        ></div>
      </div>

      {/* Premium top border with glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px]">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#B89B5E] to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#B89B5E]/50 to-transparent blur-sm"></div>
      </div>

      {/* Animated shimmer effect */}
      <div className="absolute top-0 left-0 right-0 h-full overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-shimmer"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Brand Section - Enhanced */}
          <motion.div className="lg:col-span-1" variants={itemVariants}>
            <Link 
              to="/" 
              onClick={handleLinkClick} 
              className="group inline-block mb-6 relative"
            >
              <div className="flex items-center space-x-2 mb-2">
                <FaCrown className="text-[#B89B5E] text-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                <h2 className="text-3xl font-bold bg-gradient-to-r from-[#B89B5E] via-[#D4B96F] to-[#B89B5E] bg-clip-text text-transparent tracking-tight group-hover:scale-105 transition-transform duration-300">
                  Four Seasons
                </h2>
              </div>
              <div className="h-[2px] w-0 group-hover:w-full bg-gradient-to-r from-[#B89B5E] to-transparent transition-all duration-500"></div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 font-light tracking-wide">
              Experience unparalleled luxury and exceptional service. Where every moment is crafted to perfection with timeless elegance.
            </p>
            <div className="flex space-x-3">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="group relative w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#2a2a2a] transition-all duration-300 hover:border-[#B89B5E]/50 hover:shadow-[0_0_20px_rgba(184,155,94,0.3)] hover:scale-110"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className={`text-gray-400 ${social.color} transition-all duration-300`} size={18} />
                    <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-[#0a0a0a] text-white text-xs px-3 py-1.5 rounded-lg border border-[#B89B5E]/30 opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none shadow-xl">
                      {social.label}
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#0a0a0a]"></div>
                    </span>
                  </motion.a>
                );
              })}
            </div>
          </motion.div>

          {/* Quick Links - Enhanced */}
          <motion.div variants={itemVariants}>
            <h3 className="text-white font-bold text-lg mb-8 relative inline-block tracking-wide">
              <span className="relative z-10">Quick Links</span>
              <div className="absolute -bottom-2 left-0 w-16 h-[2px] bg-gradient-to-r from-[#B89B5E] to-transparent"></div>
              <div className="absolute -bottom-2 left-0 w-8 h-[2px] bg-[#B89B5E] blur-sm"></div>
            </h3>
            <ul className="space-y-4">
              {quickLinks.map((link, index) => (
                <motion.li 
                  key={index}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to={link.path}
                    onClick={handleLinkClick}
                    className="group flex items-center text-gray-400 hover:text-white transition-all duration-300 text-sm font-medium tracking-wide relative"
                  >
                    <div className="absolute left-0 w-0 h-[1px] bg-gradient-to-r from-[#B89B5E] to-transparent group-hover:w-6 transition-all duration-300"></div>
                    <FaArrowRight className="mr-3 text-[#B89B5E] opacity-0 group-hover:opacity-100 transform -translate-x-3 group-hover:translate-x-0 transition-all duration-300" size={12} />
                    <span className="group-hover:translate-x-2 transition-transform duration-300 relative">
                      {link.name}
                      <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#B89B5E] group-hover:w-full transition-all duration-300"></span>
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Account & Support - Enhanced */}
          <motion.div variants={itemVariants}>
            <h3 className="text-white font-bold text-lg mb-8 relative inline-block tracking-wide">
              <span className="relative z-10">Account & Support</span>
              <div className="absolute -bottom-2 left-0 w-16 h-[2px] bg-gradient-to-r from-[#B89B5E] to-transparent"></div>
              <div className="absolute -bottom-2 left-0 w-8 h-[2px] bg-[#B89B5E] blur-sm"></div>
            </h3>
            <ul className="space-y-4 mb-8">
              {accountLinks.map((link, index) => (
                <motion.li 
                  key={index}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to={link.path}
                    onClick={handleLinkClick}
                    className="group flex items-center text-gray-400 hover:text-white transition-all duration-300 text-sm font-medium tracking-wide relative"
                  >
                    <div className="absolute left-0 w-0 h-[1px] bg-gradient-to-r from-[#B89B5E] to-transparent group-hover:w-6 transition-all duration-300"></div>
                    <FaArrowRight className="mr-3 text-[#B89B5E] opacity-0 group-hover:opacity-100 transform -translate-x-3 group-hover:translate-x-0 transition-all duration-300" size={12} />
                    <span className="group-hover:translate-x-2 transition-transform duration-300 relative">
                      {link.name}
                      <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#B89B5E] group-hover:w-full transition-all duration-300"></span>
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>
            <div className="space-y-4">
              <motion.a
                href="tel:+1234567890"
                className="flex items-center text-gray-400 hover:text-white transition-all duration-300 text-sm group font-medium"
                whileHover={{ x: 4 }}
              >
                <div className="mr-4 w-10 h-10 rounded-lg bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#2a2a2a] flex items-center justify-center group-hover:border-[#B89B5E]/50 group-hover:shadow-[0_0_15px_rgba(184,155,94,0.2)] transition-all duration-300">
                  <FaPhone className="text-[#B89B5E] group-hover:scale-110 transition-transform duration-300" size={14} />
                </div>
                <span className="group-hover:translate-x-1 transition-transform duration-300">+1 (234) 567-890</span>
              </motion.a>
              <motion.a
                href="mailto:info@fourseasonshotel.com"
                className="flex items-center text-gray-400 hover:text-white transition-all duration-300 text-sm group font-medium"
                whileHover={{ x: 4 }}
              >
                <div className="mr-4 w-10 h-10 rounded-lg bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#2a2a2a] flex items-center justify-center group-hover:border-[#B89B5E]/50 group-hover:shadow-[0_0_15px_rgba(184,155,94,0.2)] transition-all duration-300">
                  <FaEnvelope className="text-[#B89B5E] group-hover:scale-110 transition-transform duration-300" size={14} />
                </div>
                <span className="group-hover:translate-x-1 transition-transform duration-300">info@fourseasonshotel.com</span>
              </motion.a>
              <motion.div 
                className="flex items-start text-gray-400 text-sm group font-medium"
                whileHover={{ x: 4 }}
              >
                <div className="mr-4 w-10 h-10 rounded-lg bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#2a2a2a] flex items-center justify-center group-hover:border-[#B89B5E]/50 group-hover:shadow-[0_0_15px_rgba(184,155,94,0.2)] transition-all duration-300 mt-0.5">
                  <FaMapMarkerAlt className="text-[#B89B5E] group-hover:scale-110 transition-transform duration-300" size={14} />
                </div>
                <span className="group-hover:translate-x-1 transition-transform duration-300 leading-relaxed">123 Luxury Avenue, Premium District, City 12345</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Newsletter - Enhanced */}
          <motion.div variants={itemVariants}>
            <h3 className="text-white font-bold text-lg mb-8 relative inline-block tracking-wide">
              <span className="relative z-10">Newsletter</span>
              <div className="absolute -bottom-2 left-0 w-16 h-[2px] bg-gradient-to-r from-[#B89B5E] to-transparent"></div>
              <div className="absolute -bottom-2 left-0 w-8 h-[2px] bg-[#B89B5E] blur-sm"></div>
            </h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed font-light tracking-wide">
              Subscribe to receive exclusive offers, updates, and luxury travel insights delivered to your inbox.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#B89B5E]/20 to-transparent rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="relative w-full px-5 py-4 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#B89B5E] focus:ring-2 focus:ring-[#B89B5E]/30 transition-all duration-300 font-light tracking-wide"
                />
              </div>
              <motion.button
                type="submit"
                className="group w-full relative overflow-hidden bg-gradient-to-r from-[#B89B5E] via-[#C5A880] to-[#B89B5E] text-white px-6 py-4 rounded-xl font-semibold tracking-wide shadow-lg hover:shadow-[0_0_30px_rgba(184,155,94,0.4)] transition-all duration-300 flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="relative z-10">Subscribe</span>
                <FaArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" size={12} />
              </motion.button>
            </form>
          </motion.div>
        </motion.div>

        {/* Bottom Bar - Enhanced */}
        <motion.div 
          className="border-t border-[#2a2a2a] pt-10 mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            <div className="text-gray-500 text-sm font-light tracking-wide">
              <p>
        © {new Date().getFullYear()}{" "}
                <span className="text-[#B89B5E] font-semibold bg-gradient-to-r from-[#B89B5E] to-[#D4B96F] bg-clip-text text-transparent">
                  Four Seasons Hotel
                </span>
        . All rights reserved.
      </p>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end gap-8 text-sm">
              {["Privacy Policy", "Terms of Service", "Support"].map((link, index) => (
                <Link
                  key={index}
                  to={link === "Support" ? "/contact" : "/"}
                  onClick={handleLinkClick}
                  className="text-gray-500 hover:text-[#B89B5E] transition-all duration-300 font-medium tracking-wide relative group"
                >
                  {link}
                  <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#B89B5E] group-hover:w-full transition-all duration-300"></span>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Premium bottom accent with glow */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px]">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#B89B5E] to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#B89B5E]/50 to-transparent blur-sm"></div>
      </div>
    </footer>
  );
}

export default Footer;
