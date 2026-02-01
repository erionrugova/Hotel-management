import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Bed, 
  Wifi, 
  WashingMachine, 
  Tv, 
  Coffee, 
  Shield,
  Award,
  Calendar,
  Users,
  Star,
  Heart,
  Sparkles,
  Zap,
  TrendingUp,
  Globe,
  Palette,
  Camera,
  Music,
  MapPin
} from "lucide-react";
import { FaArrowRight, FaAward, FaSpa, FaUtensils, FaCity, FaStar, FaHotel } from "react-icons/fa";
import photoTop from "../Images/top.jpg";
import photo7 from "../Images/birk-enwald-znZXwcHdKwM-unsplash.jpg";
import photo8 from "../Images/lily-banse--YHSwy6uqvk-unsplash.jpg";
import photoLeft1 from "../Images/left1.jpg";
import photoLeft2 from "../Images/left2.jpg";
import photoConference from "../Images/meetings.jpg";
import heroImage from "../Images/roberto-nickson-emqnSQwQQDo-unsplash.jpg";

// Reusable FadeInSection Component
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

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2, suffix = "", prefix = "" }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTime = null;
          const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(end);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [end, duration, hasAnimated]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

function AboutUs() {
  const heroRef = useRef(null);

  const amenities = [
    {
      icon: Bed,
      title: "Luxury Accommodations",
      description: "126 elegant guest rooms with contemporary decor, including Standard, Premium, Deluxe, and one Disabled-Friendly Room. We also offer 15 spacious suites including Junior, Deluxe, Luxury, Executive, and a Presidential Suite.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Tv,
      title: "Modern Entertainment",
      description: "All suites are equipped with LCD TVs with 60+ channels, a mini bar, and an in-room safe for your convenience and security.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: WashingMachine,
      title: "Laundry Services",
      description: "A daily guest laundry service is available to keep your wardrobe fresh throughout your stay.",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Wifi,
      title: "High-Speed Internet",
      description: "Complimentary Wi-Fi Internet access is available in all areas of the hotel for seamless connectivity.",
      color: "from-amber-500 to-orange-500",
    },
    {
      icon: Coffee,
      title: "Premium Beverages",
      description: "Enjoy freshly brewed coffee and tea in your room or at our lobby café, available throughout the day.",
      color: "from-rose-500 to-red-500",
    },
    {
      icon: Shield,
      title: "24/7 Security",
      description: "For peace of mind, we provide 24/7 security and concierge services to ensure your safety and comfort.",
      color: "from-indigo-500 to-purple-500",
    },
  ];

  const timeline = [
    {
      year: "1990",
      title: "Foundation",
      description: "Four Seasons Hotel was established with a vision to provide unparalleled luxury hospitality.",
      icon: Calendar,
    },
    {
      year: "2005",
      title: "First Expansion",
      description: "Expanded to include premium suites and world-class spa facilities, setting new standards in luxury.",
      icon: Award,
    },
    {
      year: "2015",
      title: "International Recognition",
      description: "Awarded Forbes Travel Guide Five-Star rating, recognized as one of the world's finest hotels.",
      icon: Star,
    },
    {
      year: "2024",
      title: "Modern Excellence",
      description: "Continuing our legacy of excellence with state-of-the-art facilities and exceptional service.",
      icon: Users,
    },
  ];

  const team = [
    {
      name: "Sarah Mitchell",
      role: "General Manager",
      bio: "With over 20 years of experience in luxury hospitality, Sarah ensures every guest experiences the highest standards of service.",
      photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
    },
    {
      name: "James Anderson",
      role: "Director of Operations",
      bio: "James oversees all hotel operations, ensuring seamless experiences for our valued guests.",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    },
    {
      name: "Emily Chen",
      role: "Head of Guest Relations",
      bio: "Emily leads our guest relations team, dedicated to creating memorable stays for every visitor.",
      photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
    },
  ];

  const awards = [
    { name: "Forbes Travel Guide", year: "2024" },
    { name: "TripAdvisor", year: "Travelers' Choice" },
    { name: "AAA Five Diamond", year: "2023" },
    { name: "Conde Nast", year: "Top Hotels" },
  ];

  const heroTextLines = [
    "About Us",
    "Luxury and comfort await you",
    "at the Four Seasons Hotel",
  ];

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      {/* Hero Section */}
      <div ref={heroRef} className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
          }}
        />
        
        {/* Soft Light Flare Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        </div>

        {/* Content with Staggered Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6">
          {heroTextLines.map((line, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.2, duration: 0.8, ease: "easeOut" }}
              className={index === 0 ? "text-5xl md:text-7xl font-extrabold mb-4 tracking-wide drop-shadow-lg" : "text-xl md:text-2xl font-light italic mb-2 max-w-2xl"}
            >
              {line}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Introduction Section */}
      <FadeInSection className="max-w-4xl mx-auto px-6 md:px-12 lg:px-20 py-16 text-center">
        <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
          Welcome to{" "}
          <span className="font-semibold text-[#B89B5E]">Four Seasons Hotel</span>
          , a luxurious retreat where elegance meets comfort. Nestled in the
          heart of the city, our property offers world-class hospitality, modern
          facilities, and a serene atmosphere for both leisure and business
          travelers.
        </p>
      </FadeInSection>

      {/* Guest Statistics Section with Animated Counters */}
      <FadeInSection className="bg-white border-y border-gray-200 py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { label: "Guests Hosted", value: 20000, suffix: "+", icon: Users, color: "from-blue-500 to-cyan-500" },
              { label: "Rooms Booked", value: 50000, suffix: "+", icon: Bed, color: "from-purple-500 to-pink-500" },
              { label: "Awards Won", value: 15, suffix: "+", icon: Award, color: "from-amber-500 to-orange-500" },
              { label: "Events Hosted", value: 1000, suffix: "+", icon: Calendar, color: "from-emerald-500 to-teal-500" },
              { label: "Coffee Served", value: 500000, suffix: "+", icon: Coffee, color: "from-rose-500 to-red-500" },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="text-center bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-[#B89B5E] to-[#C5A880] mb-4 shadow-lg">
                    <Icon className="text-white text-xl" />
                  </div>
                  <div className="text-3xl font-bold text-[#B89B5E] mb-2">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </FadeInSection>

      {/* Amenities Section - Cards with Hover Effects */}
      <FadeInSection className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our <span className="text-[#B89B5E]">Amenities</span>
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Everything you need for a perfect stay
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {amenities.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group relative bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <Icon className="text-white text-2xl" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </FadeInSection>

      {/* Timeline / Story Section - Compact & Professional */}
      <FadeInSection className="py-12 bg-[#F8F6F1]">
        <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Our <span className="text-[#B89B5E]">Story</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {timeline.map((milestone, index) => {
              const Icon = milestone.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#B89B5E] to-[#C5A880] flex items-center justify-center flex-shrink-0">
                      <Icon className="text-white text-lg" />
                    </div>
                    <div>
                      <span className="text-xl font-bold text-[#B89B5E]">{milestone.year}</span>
                      <h3 className="text-lg font-bold text-gray-900">{milestone.title}</h3>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{milestone.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </FadeInSection>

      {/* Team Section */}
      <FadeInSection className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our <span className="text-[#B89B5E]">Team</span>
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Meet the dedicated professionals who make your stay exceptional
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 text-center border border-gray-100"
              >
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 shadow-lg border-4 border-white ring-2 ring-[#B89B5E]/20">
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-[#B89B5E] font-semibold text-sm mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </FadeInSection>

      {/* Signature Experiences Section */}
      <FadeInSection className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Signature <span className="text-[#B89B5E]">Experiences</span>
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Beyond rooms and amenities - discover the lifestyle we offer
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: FaSpa,
                title: "Spa & Wellness",
                description: "Rejuvenate with our award-winning spa treatments and wellness programs.",
                image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop",
                color: "from-purple-500 to-pink-500",
              },
              {
                icon: FaUtensils,
                title: "Rooftop Dining",
                description: "Indulge in fine dining with breathtaking city views and world-class cuisine.",
                image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop",
                color: "from-amber-500 to-orange-500",
              },
              {
                icon: FaCity,
                title: "City Tours",
                description: "Explore the city with our curated tours and exclusive local experiences.",
                image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop",
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: Sparkles,
                title: "Curated Events",
                description: "Host memorable events in our elegant spaces with personalized service.",
                image: photoConference,
                color: "from-emerald-500 to-teal-500",
              },
            ].map((experience, index) => {
              const Icon = experience.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
                >
                  {experience.image && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={experience.image}
                        alt={experience.title}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>
                  )}
                  <div className="p-6">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${experience.color} mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="text-white text-xl" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {experience.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{experience.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </FadeInSection>

      {/* Awards & Media Mentions */}
      <FadeInSection className="py-16 bg-white border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Recognition & <span className="text-[#B89B5E]">Awards</span>
            </h2>
            <p className="text-gray-600">Honored by industry leaders worldwide</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {awards.map((award, index) => {
              const awardColors = [
                "from-violet-500 to-purple-500",
                "from-blue-500 to-cyan-500",
                "from-amber-500 to-orange-500",
                "from-emerald-500 to-teal-500",
              ];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
                  whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100"
                >
                  <FaAward className="text-[#B89B5E] text-3xl mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{award.name}</h3>
                  <p className="text-xs text-gray-600">{award.year}</p>
                </motion.div>
              );
            })}
          </div>
          {/* Press Mentions */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">As featured in</p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {["Forbes", "Vogue", "Travel + Leisure", "Conde Nast", "The New York Times"].map((media, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-gray-400 text-sm font-semibold hover:text-[#B89B5E] transition-colors cursor-pointer"
                >
                  {media}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </FadeInSection>

      {/* Call-to-Action Section */}
      <FadeInSection className="py-20 bg-[#F8F6F1]">
        <div className="max-w-4xl mx-auto px-6 md:px-12 lg:px-20">
          <div className="bg-white rounded-2xl p-12 md:p-16 shadow-lg border border-gray-100 text-center">
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
              Book your luxury escape today and discover why we're rated among the world's finest hotels.
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
    </div>
  );
}

export default AboutUs;
