import React, { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaSpa,
  FaUtensils,
  FaCity,
  FaConciergeBell,
  FaStar,
  FaArrowRight,
  FaQuoteLeft,
  FaAward,
  FaUsers,
  FaBed,
  FaWifi,
  FaSwimmingPool,
  FaParking,
  FaDumbbell
} from "react-icons/fa";
import {
  Sparkles,
  TrendingUp,
  Shield,
  Heart,
  MapPin
} from "lucide-react";
import photoTop from "../Images/top.jpg";
import photoLeft1 from "../Images/left1.jpg";
import photoLeft2 from "../Images/left2.jpg";
import photo7 from "../Images/birk-enwald-znZXwcHdKwM-unsplash.jpg";
import photo8 from "../Images/lily-banse--YHSwy6uqvk-unsplash.jpg";
import photoConference from "../Images/meetings.jpg";

// Reusable Section Wrapper Component - Memoized for performance
const FadeInSection = React.memo(({ children, delay = 0, className = "" }) => {
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
});

FadeInSection.displayName = "FadeInSection";

function Homepage() {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const signatureExperiences = [
    {
      icon: FaSpa,
      title: "Spa & Wellness",
      description: "Rejuvenate your mind and body with our award-winning spa treatments and wellness programs designed for complete relaxation.",
      story: "Escape to tranquility",
      color: "from-purple-500 to-pink-500",
      features: ["Massage Therapy", "Aromatherapy", "Wellness Programs"],
    },
    {
      icon: FaUtensils,
      title: "Fine Dining",
      description: "Indulge in culinary excellence with our world-class chefs creating unforgettable dining experiences.",
      story: "A culinary journey",
      color: "from-amber-500 to-orange-500",
      features: ["International Cuisine", "Wine Selection", "Private Dining"],
    },
    {
      icon: FaCity,
      title: "City Views",
      description: "Breathtaking panoramic views from every room, offering a stunning perspective of the city skyline.",
      story: "Views that inspire",
      color: "from-blue-500 to-cyan-500",
      features: ["Panoramic Windows", "Balcony Access", "Sunset Views"],
    },
    {
      icon: FaConciergeBell,
      title: "Concierge Services",
      description: "24/7 personalized service for your every need, ensuring a seamless and memorable stay.",
      story: "Service beyond expectation",
      color: "from-emerald-500 to-teal-500",
      features: ["24/7 Service", "Personal Assistant", "Event Planning"],
    },
  ];

  const amenities = [
    { icon: FaWifi, label: "Free WiFi" },
    { icon: FaSwimmingPool, label: "Swimming Pool" },
    { icon: FaParking, label: "Valet Parking" },
    { icon: FaDumbbell, label: "Fitness Center" },
    { icon: FaBed, label: "Luxury Bedding" },
    { icon: FaConciergeBell, label: "24/7 Concierge" },
  ];

  const stats = [
    { icon: FaUsers, number: "20,000+", label: "Happy Guests" },
    { icon: FaAward, number: "15+", label: "Awards Won" },
    { icon: FaStar, number: "5.0", label: "Average Rating" },
    { icon: FaBed, number: "150+", label: "Luxury Rooms" },
  ];

  return (
    <div className="min-h-screen bg-[#F8F6F1] overflow-hidden">
      {/* Hero Section - Enhanced Cinematic */}
      <div ref={heroRef} className="relative overflow-hidden">
        <motion.div
          className="w-full h-[700px] md:h-[900px] bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: `url(${photoTop})`,
            transform: `translateY(${scrollY * 0.3}px)`,
          }}
        >
          {/* Enhanced Cinematic Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80"></div>

          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white px-4 max-w-5xl">
              <motion.h1
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                className="text-6xl md:text-8xl font-extrabold mb-6 tracking-tight leading-tight"
              >
                Four Seasons Hotel
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                className="text-2xl md:text-4xl mb-12 font-light italic text-white/95"
              >
                Where Luxury Meets Timeless Elegance
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
              >
                <Link
                  to="/rooms"
                  className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-[#B89B5E] via-[#C5A880] to-[#B89B5E] text-white px-12 py-5 rounded-2xl text-xl font-semibold hover:shadow-2xl hover:shadow-[#B89B5E]/40 transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <span className="relative z-10">Book Your Stay</span>
                  <FaArrowRight className="relative z-10 group-hover:translate-x-2 transition-transform" />
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
              <motion.div
                className="w-1.5 h-1.5 bg-white rounded-full"
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Stats Bar */}
      <FadeInSection className="bg-white border-y border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center group"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#B89B5E] to-[#C5A880] mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Icon className="text-white text-2xl" />
                  </div>
                  <div className="text-4xl font-bold text-[#B89B5E] mb-2">{stat.number}</div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </FadeInSection>

      <main className="container mx-auto space-y-32 px-8 md:px-16 lg:px-24 xl:px-32 py-24">
        {/* Comfort Meets Elegance Section */}
        <section className="relative">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 text-[#B89B5E] font-semibold text-sm uppercase tracking-wider mb-4">
                <Heart className="text-[#B89B5E]" size={16} />
                <span>Luxury Accommodations</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                Comfort Meets <span className="text-[#B89B5E]">Elegance</span>
              </h2>
              <p className="text-gray-700 text-xl leading-relaxed font-medium">
                Experience the perfect harmony of comfort and sophistication.
                Our Deluxe and Premium rooms are designed to provide an oasis of
                calm with modern decor, luxurious linens, and breathtaking city
                views.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                Each room includes complimentary Wi-Fi, smart TVs, rain showers,
                minibars, and round-the-clock room service — because your
                comfort is our priority.
              </p>

              {/* Amenities Grid */}
              <div className="grid grid-cols-3 gap-4 pt-6">
                {amenities.slice(0, 6).map((amenity, i) => {
                  const Icon = amenity.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.1 }}
                      className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 group"
                    >
                      <Icon className="text-[#B89B5E] text-2xl group-hover:scale-110 transition-transform" />
                      <span className="text-xs text-gray-600 font-medium text-center">{amenity.label}</span>
                    </motion.div>
                  );
                })}
              </div>

              <Link
                to="/rooms"
                className="group inline-flex items-center gap-3 bg-gradient-to-r from-[#B89B5E] to-[#C5A880] text-white px-10 py-4 rounded-xl text-lg font-semibold hover:shadow-xl hover:shadow-[#B89B5E]/30 transition-all duration-300 transform hover:-translate-y-1"
              >
                Explore All Rooms
                <FaArrowRight className="group-hover:translate-x-2 transition-transform" />
              </Link>
            </motion.div>

            <motion.div
              className="grid grid-rows-2 gap-6"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              <div className="relative group overflow-hidden rounded-3xl shadow-2xl">
                <img
                  src={photoLeft1}
                  alt="Luxurious hotel room with elegant decor, premium furnishings, and stunning city view"
                  className="w-full h-72 object-cover transform group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-end justify-center pb-6">
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-lg font-semibold bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl"
                  >
                    View Details
                  </motion.span>
                </div>
              </div>
              <div className="relative group overflow-hidden rounded-3xl shadow-2xl">
                <img
                  src={photoLeft2}
                  alt="Premium hotel suite featuring modern amenities, luxury furnishings, and sophisticated design"
                  className="w-full h-72 object-cover transform group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-end justify-center pb-6">
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-lg font-semibold bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl"
                  >
                    View Details
                  </motion.span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Signature Experiences Section */}
        <FadeInSection>
          <div className="text-center mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 text-[#B89B5E] font-semibold text-xs uppercase tracking-wider mb-3"
            >
              <Sparkles className="text-[#B89B5E]" size={14} />
              <span>Signature Experiences</span>
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">
              Unforgettable <span className="text-[#B89B5E]">Moments</span>
            </h2>
            <p className="text-gray-600 text-sm max-w-2xl mx-auto">
              Discover the exceptional services that make your stay truly memorable
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {signatureExperiences.map((experience, index) => {
              const Icon = experience.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group relative bg-gradient-to-br from-white to-[#F8F6F1] rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${experience.color} mb-4 shadow-md group-hover:scale-105 transition-all duration-300`}>
                    <Icon className="text-white text-xl" />
                  </div>
                  <p className="text-xs text-[#B89B5E] font-bold mb-2 uppercase tracking-wider">
                    {experience.story}
                  </p>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    {experience.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {experience.description}
                  </p>
                  <ul className="space-y-1.5">
                    {experience.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-1 h-1 rounded-full bg-[#B89B5E]"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </FadeInSection>

        {/* Spa Section */}
        <section className="relative">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <motion.div
              className="relative group overflow-hidden rounded-3xl shadow-2xl"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <img
                src={photo7}
                alt="Luxury spa facility featuring relaxation area, wellness treatments, and serene ambiance"
                className="w-full h-[500px] object-cover transform group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-end justify-center pb-8">
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-xl font-semibold bg-white/20 backdrop-blur-sm px-8 py-4 rounded-xl"
                >
                  Explore Spa
                </motion.span>
              </div>
            </motion.div>
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 text-[#B89B5E] font-semibold text-sm uppercase tracking-wider mb-4">
                <FaSpa className="text-[#B89B5E]" size={16} />
                <span>Wellness & Relaxation</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                Relax in Our <span className="text-[#B89B5E]">Spa</span>
              </h2>
              <p className="text-gray-700 text-xl leading-relaxed font-medium">
                Unwind in our award-winning spa, offering premium massages,
                aromatherapy, and wellness treatments. Let our skilled
                therapists rejuvenate your mind and body while you enjoy
                tranquil music and ambient lighting.
              </p>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <Shield className="text-[#B89B5E]" size={24} />
                  <span className="text-gray-700 font-medium">Certified Therapists</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="text-[#B89B5E]" size={24} />
                  <span className="text-gray-700 font-medium">Premium Treatments</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Dining Section */}
        <section className="relative">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 text-[#B89B5E] font-semibold text-sm uppercase tracking-wider mb-4">
                <FaUtensils className="text-[#B89B5E]" size={16} />
                <span>Culinary Excellence</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                Gourmet <span className="text-[#B89B5E]">Dining</span>
              </h2>
              <p className="text-gray-700 text-xl leading-relaxed font-medium">
                Indulge in fine dining with a curated selection of international
                dishes and local delicacies. Our chefs use the finest
                ingredients to create unforgettable culinary moments — served in
                an elegant, candle-lit atmosphere.
              </p>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-[#B89B5E]" size={24} />
                  <span className="text-gray-700 font-medium">Michelin-Starred Chefs</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaStar className="text-[#B89B5E]" size={20} />
                  <span className="text-gray-700 font-medium">Award-Winning Cuisine</span>
                </div>
              </div>
            </motion.div>
            <motion.div
              className="relative group overflow-hidden rounded-3xl shadow-2xl"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              <img
                src={photo8}
                alt="Fine dining restaurant with elegant table setting, gourmet cuisine, and sophisticated ambiance"
                className="w-full h-[500px] object-cover transform group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-end justify-center pb-8">
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-xl font-semibold bg-white/20 backdrop-blur-sm px-8 py-4 rounded-xl"
                >
                  View Menu
                </motion.span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Conference Section */}
        <section className="relative">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <motion.div
              className="relative group overflow-hidden rounded-3xl shadow-2xl"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <img
                src={photoConference}
                alt="Modern conference room with state-of-the-art technology, elegant design, and professional meeting space"
                className="w-full h-[500px] object-cover transform group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-end justify-center pb-8">
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-xl font-semibold bg-white/20 backdrop-blur-sm px-8 py-4 rounded-xl"
                >
                  Book Event
                </motion.span>
              </div>
            </motion.div>
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 text-[#B89B5E] font-semibold text-sm uppercase tracking-wider mb-4">
                <MapPin className="text-[#B89B5E]" size={16} />
                <span>Business Excellence</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                Meetings & <span className="text-[#B89B5E]">Conferences</span>
              </h2>
              <p className="text-gray-700 text-xl leading-relaxed font-medium">
                Our conference facilities combine modern design with advanced
                technology to ensure your meetings run smoothly. From small
                private events to large corporate gatherings, we provide
                everything you need for success.
              </p>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <FaWifi className="text-[#B89B5E]" size={20} />
                  <span className="text-gray-700 font-medium">High-Speed Internet</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="text-[#B89B5E]" size={24} />
                  <span className="text-gray-700 font-medium">Professional Setup</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Booking CTA Section */}
        <FadeInSection>
          <div className="bg-white rounded-2xl p-12 md:p-16 shadow-lg border border-gray-100">
            <div className="max-w-3xl mx-auto text-center">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight"
              >
                Ready to Experience Luxury?
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto"
              >
                Book your stay today and discover why we're rated among the world's finest hotels.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Link
                  to="/rooms"
                  className="group inline-flex items-center gap-3 bg-gradient-to-r from-[#B89B5E] to-[#C5A880] text-white px-10 py-4 rounded-xl text-lg font-semibold hover:shadow-xl hover:shadow-[#B89B5E]/30 transition-all duration-300 transform hover:-translate-y-1"
                >
                  Book Your Stay
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </div>
          </div>
        </FadeInSection>
      </main>
    </div>
  );
}

export default Homepage;
