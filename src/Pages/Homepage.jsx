import React from "react";
import Header from "./components/header";
import Footer from "./components/footer";



    function Homepage() {
  const rooms = [
    { id: 1, name: "Deluxe Room", price: "$120/night", image: "https://via.placeholder.com/300x200" },
    { id: 2, name: "Executive Suite", price: "$200/night", image: "https://via.placeholder.com/300x200" },
    { id: 3, name: "Standard Room", price: "$80/night", image: "https://via.placeholder.com/300x200" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 container mx-auto p-6">
        <h2 className="text-3xl font-semibold mb-6">Available Rooms</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div key={room.id} className="border rounded-lg shadow-lg overflow-hidden">
              <img src={room.image} alt={room.name} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="text-xl font-bold">{room.name}</h3>
                <p className="text-gray-600">{room.price}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Homepage