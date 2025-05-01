import React from "react";
import Header from "./components/header";
import Footer from "./components/footer";
import { Link } from "react-router-dom";
import photo1 from "../Images/adam-winger-VGs8z60yT2c-unsplash.jpg";
import photo2 from "../Images/albert-vincent-wu-fupf3-xAUqw-unsplash.jpg";
import photo3 from "../Images/febrian-zakaria-gwV9eklemSg-unsplash.jpg";
import photo4 from "../Images/linus-mimietz-p3UWyaujtQo-unsplash.jpg";
import photo5 from "../Images/natalia-gusakova-EYoK3eVKIiQ-unsplash.jpg";
import photo6 from "../Images/roberto-nickson-emqnSQwQQDo-unsplash.jpg";
import photo7 from "../Images/birk-enwald-znZXwcHdKwM-unsplash.jpg";
import photo8 from "../Images/lily-banse--YHSwy6uqvk-unsplash.jpg";
function Homepage() {
    const rooms = [
        {
            id: 1,
            name: "Deluxe Room",
            price: "$120/night",
            image: photo1
        },
        {
            id: 2,
            name: "Executive Suite",
            price: "$200/night",
            image: photo2
        },
        {
            id: 3,
            name: "Standard Room",
            price: "$80/night",
            image: photo3
        },
        {
            id: 4,
            name: "Family Suite",
            price: "$150/night",
            image: photo4,
        },
        {
            id: 5,
            name: "Presidential Suite",
            price: "$350/night",
            image: photo5,
        },
        {
            id: 6,
            name: "Budget Room",
            price: "$60/night",
            image: photo6,
        },
    ];

    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto p-6 space-y-12">
                {/* Rooms Section */}
                <section>
                    <h2 className="text-3xl font-semibold mb-6">Available Rooms</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {rooms.map((room) => (
                            <div key={room.id} className="border rounded-lg shadow-lg overflow-hidden">
                                <img src={room.image} alt={room.name} className="w-full h-48 object-cover" />
                                <div className="p-4">
                                    <h3 className="text-xl font-bold">{room.name}</h3>
                                    <p className="text-gray-600">{room.price}</p>
                                    <Link
                                        to={`/rooms/${room.id}`}
                                        className="mt-3 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                    >
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Spa Section */}
                <section className="grid md:grid-cols-2 gap-8 items-center">
                    <img 
                    src={photo7}
                        alt="Spa"
                        className="w-full rounded-lg shadow-md"
                    />
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Relax in Our Spa</h2>
                        <p className="text-gray-700">
                            Unwind and rejuvenate in our full-service spa, offering massages, sauna, facials, and personalized treatments.
                            Our expert therapists ensure a peaceful and revitalizing experience in a serene environment.
                        </p>
                    </div>
                </section>

                {/* Food Section */}
                <section className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Gourmet Dining Experience</h2>
                        <p className="text-gray-700">
                            Enjoy world-class cuisine prepared by our experienced chefs. From international dishes to local specialties,
                            our on-site restaurant offers a menu designed to satisfy every palate, served in a warm and elegant setting.
                        </p>
                    </div>
                    <img
                        src={photo8}
                        alt="Food"
                        className="w-full rounded-lg shadow-md"
                    />
                </section>
            </main>

            <Footer />
        </div>
    );
}

export default Homepage