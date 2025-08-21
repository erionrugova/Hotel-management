import React from "react";
import Header from "./components/header";
import Footer from "./components/footer";
import hotelImg from "../Images/fourSeasons.webp";
import { Bed, Wifi, WashingMachine, Tv, Coffee, Shield } from "lucide-react";

function AboutUs() {
  return (
    <div>
      <Header />

      {/* Hero Image */}
      <div className="relative w-full h-80 md:h-[400px]">
        <img
          src={hotelImg}
          alt="Four Seasons Hotel"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#B9965D]/60 flex items-center justify-center"></div>
      </div>

      {/* Intro */}
      <div className="max-w-4xl mx-auto px-10 py-20 text-center">
        <p className="text-lg text-gray-600">
          Welcome to <span className="font-semibold">Four Seasons Hotel</span>,
          a luxurious retreat where elegance meets comfort. Nestled in the heart
          of the city, our property offers world-class hospitality, modern
          facilities, and a relaxing atmosphere for both leisure and business
          travelers.
        </p>
      </div>

      {/* Amenities - Vertical */}
      <div className="max-w-3xl mx-auto px-20 space-y-20 pb-20">
        {/* Rooms */}
        <div className="flex items-start space-x-10">
          <Bed className="w-20 h-20 text-yellow-600 flex-shrink-0" />
          <p className="text-gray-700">
            <span className="font-semibold">126 elegant guest rooms</span> with
            contemporary decor, including Standard, Premium, Deluxe, and one
            Disabled-Friendly Room. We also offer{" "}
            <span className="font-semibold">15 spacious suites</span> including
            Junior, Deluxe, Luxury, Executive, and a Presidential Suite.
          </p>
        </div>

        {/* TV + Mini Bar + Safe */}
        <div className="flex items-start space-x-10">
          <Tv className="w-20 h-20 text-yellow-600 flex-shrink-0" />
          <p className="text-gray-700">
            All suites are equipped with{" "}
            <span className="font-semibold">LCD TVs with 60+ channels</span>, a{" "}
            <span className="font-semibold">mini bar</span>, and an{" "}
            <span className="font-semibold">in-room safe</span>.
          </p>
        </div>

        {/* Laundry */}
        <div className="flex items-start space-x-10">
          <WashingMachine className="w-20 h-20 text-yellow-600 flex-shrink-0" />
          <p className="text-gray-700">
            A daily guest <span className="font-semibold">laundry service</span>{" "}
            is available to keep your wardrobe fresh throughout your stay.
          </p>
        </div>

        {/* WiFi */}
        <div className="flex items-start space-x-10">
          <Wifi className="w-20 h-20 text-yellow-600 flex-shrink-0" />
          <p className="text-gray-700">
            Complimentary <span className="font-semibold">Wi-Fi</span> Internet
            access is available in all areas of the hotel.
          </p>
        </div>

        {/* Coffee */}
        <div className="flex items-start space-x-10">
          <Coffee className="w-20 h-20 text-yellow-600 flex-shrink-0" />
          <p className="text-gray-700">
            Enjoy freshly brewed{" "}
            <span className="font-semibold">coffee and tea</span> in your room
            or at our lobby café.
          </p>
        </div>

        {/* Security */}
        <div className="flex items-start space-x-10">
          <Shield className="w-20 h-20 text-yellow-600 flex-shrink-0" />
          <p className="text-gray-700">
            For peace of mind, we provide{" "}
            <span className="font-semibold">24/7 security</span>
            and concierge services.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default AboutUs;
