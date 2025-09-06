// src/Pages/Dashboard/Dashboard.jsx
import { useState, useEffect } from "react";
import { useUser } from "../../UserContext";
import { Card, CardContent } from "../../components/card";
import apiService from "../../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function Dashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState({
    checkIn: 0,
    checkOut: 0,
    inHotel: 0,
    availableRooms: 0,
    occupiedRooms: 0,
  });
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [roomsData, bookingsData] = await Promise.all([
          apiService.getRooms(),
          apiService.getBookings(),
        ]);

        // Calculate stats
        const availableRooms = roomsData.filter(
          (room) => room.status === "AVAILABLE"
        ).length;
        const occupiedRooms = roomsData.filter(
          (room) => room.status === "OCCUPIED"
        ).length;

        const today = new Date().toISOString().split("T")[0];
        const todayCheckIns = bookingsData.filter(
          (booking) =>
            booking.startDate.startsWith(today) &&
            booking.status === "CONFIRMED"
        ).length;
        const todayCheckOuts = bookingsData.filter(
          (booking) =>
            booking.endDate.startsWith(today) && booking.status === "CONFIRMED"
        ).length;
        const inHotel = bookingsData.filter(
          (booking) =>
            booking.status === "CONFIRMED" &&
            new Date(booking.startDate) <= new Date() &&
            new Date(booking.endDate) > new Date()
        ).length;

        setStats({
          checkIn: todayCheckIns,
          checkOut: todayCheckOuts,
          inHotel,
          availableRooms,
          occupiedRooms,
        });

        // Group rooms by type
        const roomTypes = {};
        roomsData.forEach((room) => {
          if (!roomTypes[room.type]) {
            roomTypes[room.type] = { total: 0, booked: 0, price: room.price };
          }
          roomTypes[room.type].total++;
          if (room.status === "OCCUPIED") {
            roomTypes[room.type].booked++;
          }
        });

        setRooms(
          Object.entries(roomTypes).map(([type, data]) => ({
            type: type.replace("_", " "),
            ...data,
          }))
        );

        setBookings(bookingsData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const occupancyData = [
    { month: "May", percent: 100 },
    { month: "Jun", percent: 65 },
    { month: "Jul", percent: 80 },
    { month: "Aug", percent: 35 },
    { month: "Sep", percent: 95 },
    { month: "Oct", percent: 70 },
    { month: "Nov", percent: 85 },
    { month: "Dec", percent: 90 },
    { month: "Jan", percent: 88 },
    { month: "Feb", percent: 92 },
  ];

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold mb-6">
        {user ? `Welcome back, ${user.username}` : "Dashboard"}
      </h1>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardContent>
            <p className="text-gray-500">Today's Check-in</p>
            <p className="text-2xl font-bold">{stats.checkIn}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-gray-500">Today's Check-out</p>
            <p className="text-2xl font-bold">{stats.checkOut}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-gray-500">In Hotel</p>
            <p className="text-2xl font-bold">{stats.inHotel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-gray-500">Available Rooms</p>
            <p className="text-2xl font-bold">{stats.availableRooms}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-gray-500">Occupied Rooms</p>
            <p className="text-2xl font-bold">{stats.occupiedRooms}</p>
          </CardContent>
        </Card>
      </div>

      {/* Rooms */}
      <h2 className="text-xl font-semibold mb-4">Room Types</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {rooms.map((room, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <h3 className="font-semibold">{room.type}</h3>
              <p>
                {room.booked}/{room.total} booked
              </p>
              <p className="text-[#B89B5E] font-bold">${room.price}/day</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Occupancy Statistics */}
      <h2 className="text-xl font-semibold mb-4">Occupancy Statistics</h2>
      <div className="bg-white shadow rounded p-4 h-64 mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={occupancyData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="percent" fill="#B89B5E" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Bookings */}
      <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
      <div className="bg-white shadow rounded p-4">
        {bookings.slice(0, 5).map((booking, i) => (
          <div key={i} className="border-b py-2 last:border-b-0">
            <p className="font-semibold">
              {booking.user.username} - Room {booking.room.roomNumber}
            </p>
            <p className="text-gray-600">
              {new Date(booking.startDate).toLocaleDateString()} -{" "}
              {new Date(booking.endDate).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-500">Status: {booking.status}</p>
          </div>
        ))}
        {bookings.length === 0 && (
          <p className="text-gray-500 text-center py-4">No bookings found</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
