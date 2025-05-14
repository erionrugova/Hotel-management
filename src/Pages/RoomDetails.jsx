import React from "react";
import { useLocation, useParams } from "react-router-dom";
import Header from "./components/header";
import Footer from "./components/footer";

function RoomDetails() {
    const { state } = useLocation();
    const { id } = useParams();

    if (!state) {
        return (
            <div className="text-center mt-20">
                <p className="text-2xl font-semibold text-gray-700">Room details not found.</p>
            </div>
        );
    }

    const room = state;

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 container mx-auto p-6">
                <div className="flex flex-col md:flex-row gap-6">
                    <img src={room.image} alt={room.name} className="w-full md:w-1/2 h-auto rounded shadow-md" />
                    <div>
                        <h1 className="text-3xl font-bold mb-4">{room.name}</h1>
                        <p className="text-gray-700 mb-4">{room.description || "No description available."}</p>
                        <p className="text-2xl font-semibold mb-6 text-[#C5A880]">{room.price}</p>
                        {room.amenities && (
                            <>
                                <h3 className="text-lg font-semibold mb-2">Amenities:</h3>
                                <ul className="list-disc list-inside text-gray-600">
                                    {room.amenities.map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                        <button className="mt-6 inline-block bg-[#C5A880] text-[#1F1F1F] px-4 py-2 rounded hover:bg-[#B9965D] transition duration-300">
                            Book Now
                        </button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default RoomDetails;
