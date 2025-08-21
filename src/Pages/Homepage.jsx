import React from "react";
import Header from "./components/header";
import Footer from "./components/footer";
import { Link } from "react-router-dom";
import photoTop from "../Images/top.jpg";
import photoLeft1 from "../Images/left1.jpg";
import photoLeft2 from "../Images/left2.jpg";
import photo7 from "../Images/birk-enwald-znZXwcHdKwM-unsplash.jpg";
import photo8 from "../Images/lily-banse--YHSwy6uqvk-unsplash.jpg";
import photoConference from "../Images/meetings.jpg";
function Homepage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <div>
        <img
          src={photoTop}
          alt="Luxury Room"
          className="w-full h-[450px] object-cover"
        />
      </div>

      <main className="flex-1 container mx-auto space-y-20 p-8 md:p-16 lg:p-24 xl:p-32">
        {/* Room Preview Section */}
        <section className="grid md:grid-cols-2 gap-10 px-6 items-center">
          {/* Right side: Room description */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              Comfort Meets Elegance
            </h2>
            <p className="text-gray-700 mb-4">
              For our guest’s convenience, we offer modern Standard Rooms,
              exclusive Premium and Deluxe Rooms and 15 spacious suites
              including Junior Suites, Premium, Deluxe, Executive, and a
              Presidential Suite, all equipped with modern and contemporary
              amenities.
            </p>
            <p className="text-gray-700 mb-4">
              All guest accommodations feature elegant bathrooms, some equipped
              with water jet bathtubs, hairdryer, controlled air-conditioning,
              windows that open, complimentary Wi-Fi, LCD TV with premium cable
              and international channels, direct dial telephone, a tea/coffee
              maker, in-room safe and a minibar.
            </p>
            <p className="text-gray-700 mb-6">
              Twice-daily maid service, including turndown service.
            </p>

            <Link
              to="/rooms"
              className="mt-6 inline-block bg-[#C5A880] text-[#1F1F1F] px-4 py-2 rounded hover:bg-[#B9965D] transition duration-300"
            >
              Explore All Rooms
            </Link>
          </div>

          {/* Left side: Two stacked images */}
          <div className="grid grid-rows-2 gap-4">
            <img
              src={photoLeft1}
              alt="Room 1"
              className="w-full h-60 object-cover rounded-lg shadow-md"
            />
            <img
              src={photoLeft2}
              alt="Room 2"
              className="w-full h-60 object-cover rounded-lg shadow-md"
            />
          </div>
        </section>

        {/* Spa Section */}
        <section className="container mx-auto grid md:grid-cols-2 gap-10 px-6 items-center">
          <img src={photo7} alt="Spa" className="w-full rounded-lg shadow-md" />
          <div>
            <h2 className="text-2xl font-semibold mb-4">Relax in Our Spa</h2>
            <p className="text-gray-700">
              Unwind and rejuvenate in our full-service spa, offering massages,
              sauna, facials, and personalized treatments. Our expert therapists
              ensure a peaceful and revitalizing experience in a serene
              environment.
            </p>
          </div>
        </section>

        {/* Food Section */}
        <section className="container mx-auto grid md:grid-cols-2 gap-10 px-6 items-center">
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              Gourmet Dining Experience
            </h2>
            <p className="text-gray-700">
              Enjoy world-class cuisine prepared by our experienced chefs. From
              international dishes to local specialties, our on-site restaurant
              offers a menu designed to satisfy every palate, served in a warm
              and elegant setting.
            </p>
          </div>
          <img
            src={photo8}
            alt="Food"
            className="w-full rounded-lg shadow-md"
          />
        </section>

        {/* Meetings & Conferences Section */}
        <section className="container mx-auto grid md:grid-cols-2 gap-10 px-6 items-center">
          <img
            src={photoConference}
            alt="Conference Room"
            className="w-full rounded-lg shadow-md"
          />
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              Meetings & Conferences
            </h2>
            <p className="text-gray-700">
              Host your meetings, events, and corporate conferences in our
              state-of-the-art facilities. We offer fully-equipped meeting rooms
              with high-speed Wi-Fi, AV technology, flexible seating
              arrangements, and dedicated event coordination support.
            </p>
            <p className="text-gray-700 mt-2">
              Whether it's a small business meeting or a large seminar, our
              spaces are designed to impress and ensure productivity in a
              professional environment.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Homepage;
