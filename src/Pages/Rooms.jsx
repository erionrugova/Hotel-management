// src/Pages/Rooms.jsx
import React from "react";
import Header from "./components/header";
import Footer from "./components/footer";
import { Link } from "react-router-dom";
import photo1 from "../Images/albert-vincent-wu-fupf3-xAUqw-unsplash.jpg";
import photo2 from "../Images/adam-winger-VGs8z60yT2c-unsplash.jpg";
import photo3 from "../Images/room3.jpg";
import photo4 from "../Images/room4.jpg";
import photo5 from "../Images/roberto-nickson-emqnSQwQQDo-unsplash.jpg";
import photo6 from "../Images/natalia-gusakova-EYoK3eVKIiQ-unsplash.jpg";

function Rooms() {
    const rooms = [
        { id: 1, name: "Deluxe Room", price: "$120/night", image: photo1, description: "Spacious room with king-size bed, balcony view, and modern amenities.",
            amenities: ["Free Wi-Fi", "Air Conditioning", "Mini Bar", "Room Service", "Flat Screen TV"] },
        { id: 2, name: "Executive Suite", price: "$200/night", image: photo2, description: "Spacious room with king-size bed, balcony view, and modern amenities.",
            amenities: ["Free Wi-Fi", "Air Conditioning", "Mini Bar", "Room Service", "Flat Screen TV"] },
        { id: 3, name: "Standard Room", price: "$80/night", image: photo3, description: "Spacious room with king-size bed, balcony view, and modern amenities.",
            amenities: ["Free Wi-Fi", "Air Conditioning", "Mini Bar", "Room Service", "Flat Screen TV"] },
        { id: 4, name: "Family Suite", price: "$150/night", image: photo4, description: "Spacious room with king-size bed, balcony view, and modern amenities.",
            amenities: ["Free Wi-Fi", "Air Conditioning", "Mini Bar", "Room Service", "Flat Screen TV"] },
        { id: 5, name: "Presidential Suite", price: "$350/night", image: photo5, description: "Spacious room with king-size bed, balcony view, and modern amenities.",
            amenities: ["Free Wi-Fi", "Air Conditioning", "Mini Bar", "Room Service", "Flat Screen TV"] },
        { id: 6, name: "Budget Room", price: "$60/night", image: photo6, description: "Spacious room with king-size bed, balcony view, and modern amenities.",
            amenities: ["Free Wi-Fi", "Air Conditioning", "Mini Bar", "Room Service", "Flat Screen TV"] },
    ];

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 container mx-auto p-6">
                <h1 className="text-3xl font-semibold mb-6 text-[#C5A880]">Our Rooms</h1>
                <div className="grid md:grid-cols-3 gap-6">
                    {rooms.map((room) => (
                        <div key={room.id} className="border rounded-lg shadow-lg overflow-hidden">
                            <img src={room.image} alt={room.name} className="w-full h-48 object-cover" />
                            <div className="p-4">
                                <h3 className="text-xl font-bold">{room.name}</h3>
                                <p className="text-gray-600">{room.price}</p>
                                <Link
                                    to={`/rooms/${room.id}`}
                                    state={room}
                                    className="mt-6 inline-block bg-[#C5A880] text-[#1F1F1F] px-4 py-2 rounded hover:bg-[#B9965D] transition duration-300"
                                >
                                    View Details
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default Rooms;
