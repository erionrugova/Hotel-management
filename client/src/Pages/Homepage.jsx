import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../Pages/components/footer";
import photoTop from "../Images/top.jpg";
import photoLeft1 from "../Images/left1.jpg";
import photoLeft2 from "../Images/left2.jpg";
import photo7 from "../Images/birk-enwald-znZXwcHdKwM-unsplash.jpg";
import photo8 from "../Images/lily-banse--YHSwy6uqvk-unsplash.jpg";
import photoConference from "../Images/meetings.jpg";

function Homepage() {
  const [scrollY, setScrollY] = useState(0);
  const sectionsRef = useRef([]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting)
            entry.target.classList.add("fade-in-visible");
        });
      },
      { threshold: 0.2 }
    );

    sectionsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      sectionsRef.current.forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      <div className="relative overflow-hidden">
        <div
          className="w-full h-[600px] bg-cover bg-center transition-transform duration-700"
          style={{
            backgroundImage: `url(${photoTop})`,
            transform: `translateY(${scrollY * 0.3}px)`,
          }}
        ></div>

        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-center text-white animate-fade-in-up px-4">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-wide">
              Four Seasons Hotel
            </h1>
            <p className="text-xl md:text-2xl mb-8 font-light italic">
              Luxury Redefined
            </p>
            <Link
              to="/rooms"
              className="bg-[#B89B5E] text-white px-10 py-4 rounded-lg text-lg font-semibold hover:bg-[#a0854d] transition duration-300 shadow-lg hover:shadow-xl"
            >
              Book Your Stay
            </Link>
          </div>
        </div>
      </div>

      <main className="container mx-auto space-y-24 px-8 md:px-16 lg:px-24 xl:px-32 py-20">
        <section
          ref={(el) => (sectionsRef.current[0] = el)}
          className="opacity-0 transition-all duration-700 transform translate-y-10"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <h2 className="text-3xl font-bold text-[#B89B5E]">
                Comfort Meets Elegance
              </h2>
              <p className="text-gray-700">
                Experience the perfect harmony of comfort and sophistication.
                Our Deluxe and Premium rooms are designed to provide an oasis of
                calm with modern decor, luxurious linens, and breathtaking city
                views.
              </p>
              <p className="text-gray-700">
                Each room includes complimentary Wi-Fi, smart TVs, rain showers,
                minibars, and round-the-clock room service — because your
                comfort is our priority.
              </p>
              <Link
                to="/rooms"
                className="inline-block bg-[#B89B5E] text-white px-8 py-3 rounded-lg hover:bg-[#a0854d] transition duration-300 font-semibold"
              >
                Explore All Rooms
              </Link>
            </div>

            <div className="grid grid-rows-2 gap-4">
              <img
                src={photoLeft1}
                alt="Room 1"
                className="w-full h-64 object-cover rounded-xl shadow-lg transform hover:scale-[1.03] transition duration-500"
              />
              <img
                src={photoLeft2}
                alt="Room 2"
                className="w-full h-64 object-cover rounded-xl shadow-lg transform hover:scale-[1.03] transition duration-500"
              />
            </div>
          </div>
        </section>

        <section
          ref={(el) => (sectionsRef.current[1] = el)}
          className="opacity-0 transition-all duration-700 transform translate-y-10"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <img
              src={photo7}
              alt="Spa"
              className="w-full rounded-xl shadow-lg transform hover:scale-[1.03] transition duration-500"
            />
            <div className="space-y-5">
              <h2 className="text-3xl font-bold text-[#B89B5E]">
                Relax in Our Spa
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Unwind in our award-winning spa, offering premium massages,
                aromatherapy, and wellness treatments. Let our skilled
                therapists rejuvenate your mind and body while you enjoy
                tranquil music and ambient lighting.
              </p>
            </div>
          </div>
        </section>

        <section
          ref={(el) => (sectionsRef.current[2] = el)}
          className="opacity-0 transition-all duration-700 transform translate-y-10"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <h2 className="text-3xl font-bold text-[#B89B5E]">
                Gourmet Dining Experience
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Indulge in fine dining with a curated selection of international
                dishes and local delicacies. Our chefs use the finest
                ingredients to create unforgettable culinary moments — served in
                an elegant, candle-lit atmosphere.
              </p>
            </div>
            <img
              src={photo8}
              alt="Fine Dining"
              className="w-full rounded-xl shadow-lg transform hover:scale-[1.03] transition duration-500"
            />
          </div>
        </section>

        <section
          ref={(el) => (sectionsRef.current[3] = el)}
          className="opacity-0 transition-all duration-700 transform translate-y-10"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <img
              src={photoConference}
              alt="Conference"
              className="w-full rounded-xl shadow-lg transform hover:scale-[1.03] transition duration-500"
            />
            <div className="space-y-5">
              <h2 className="text-3xl font-bold text-[#B89B5E]">
                Meetings & Conferences
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Our conference facilities combine modern design with advanced
                technology to ensure your meetings run smoothly. From small
                private events to large corporate gatherings, we provide
                everything you need for success.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Homepage;
