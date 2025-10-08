import React from "react";
import { motion } from "framer-motion";
import { Bed, Wifi, WashingMachine, Tv, Coffee, Shield } from "lucide-react";
import hotelImg from "../Images/fourSeasons.webp";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

function AboutUs() {
  const amenities = [
    {
      icon: Bed,
      text: (
        <>
          <span className="font-semibold">126 elegant guest rooms</span> with
          contemporary decor, including Standard, Premium, Deluxe, and one
          Disabled-Friendly Room. We also offer{" "}
          <span className="font-semibold">15 spacious suites</span> including
          Junior, Deluxe, Luxury, Executive, and a Presidential Suite.
        </>
      ),
    },
    {
      icon: Tv,
      text: (
        <>
          All suites are equipped with{" "}
          <span className="font-semibold">LCD TVs with 60+ channels</span>, a{" "}
          <span className="font-semibold">mini bar</span>, and an{" "}
          <span className="font-semibold">in-room safe</span>.
        </>
      ),
    },
    {
      icon: WashingMachine,
      text: (
        <>
          A daily guest <span className="font-semibold">laundry service</span>{" "}
          is available to keep your wardrobe fresh throughout your stay.
        </>
      ),
    },
    {
      icon: Wifi,
      text: (
        <>
          Complimentary <span className="font-semibold">Wi-Fi</span> Internet
          access is available in all areas of the hotel.
        </>
      ),
    },
    {
      icon: Coffee,
      text: (
        <>
          Enjoy freshly brewed{" "}
          <span className="font-semibold">coffee and tea</span> in your room or
          at our lobby café.
        </>
      ),
    },
    {
      icon: Shield,
      text: (
        <>
          For peace of mind, we provide{" "}
          <span className="font-semibold">24/7 security</span> and concierge
          services.
        </>
      ),
    },
  ];

  return (
    <motion.div
      className="min-h-screen bg-[#F8F6F1] flex flex-col"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0 }}
    >
      <div className="relative w-full h-[400px] md:h-[480px] overflow-hidden">
        <motion.img
          src={hotelImg}
          alt="Four Seasons Hotel"
          className="w-full h-full object-cover scale-105"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#B9965D]/70 to-[#1F1F1F]/60"></div>

        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1 }}
        >
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-wide drop-shadow-md">
            About Us
          </h1>
          <p className="text-lg md:text-xl font-light italic max-w-2xl mb-10">
            Luxury and comfort await you at the Four Seasons Hotel
          </p>
        </motion.div>
      </div>

      <motion.div
        className="max-w-4xl mx-auto px-6 md:px-12 lg:px-20 py-20 text-center"
        variants={fadeUp}
        custom={0}
      >
        <p className="text-lg text-gray-700 leading-relaxed">
          Welcome to{" "}
          <span className="font-semibold text-[#B9965D]">
            Four Seasons Hotel
          </span>
          , a luxurious retreat where elegance meets comfort. Nestled in the
          heart of the city, our property offers world-class hospitality, modern
          facilities, and a serene atmosphere for both leisure and business
          travelers.
        </p>
      </motion.div>

      <div className="max-w-3xl mx-auto px-6 md:px-12 lg:px-20 pb-24 space-y-16">
        {amenities.map((item, i) => (
          <motion.div
            key={i}
            className="flex items-start space-x-8 bg-white/80 rounded-2xl shadow-md p-6 hover:shadow-lg transition-all"
            variants={fadeUp}
            custom={i + 1}
            whileInView="visible"
            initial="hidden"
            viewport={{ once: true, amount: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex-shrink-0 bg-[#F8F6F1] rounded-full p-4 shadow-inner">
              <item.icon className="w-12 h-12 text-[#B9965D]" />
            </div>
            <p className="text-gray-700 leading-relaxed">{item.text}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="text-center pb-16"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7 }}
        viewport={{ once: true }}
      >
        <p className="text-xl italic text-gray-600">
          “Experience timeless luxury and unforgettable comfort at the{" "}
          <span className="text-[#B9965D] font-semibold">Four Seasons</span>.”
        </p>
      </motion.div>
    </motion.div>
  );
}

export default AboutUs;
