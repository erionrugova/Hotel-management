import { useUser } from "../../UserContext";
import { Card, CardContent } from "../../components/card";
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

  // Fake data
  const stats = {
    checkIn: 23,
    checkOut: 13,
    inHotel: 60,
    availableRooms: 10,
    occupiedRooms: 90,
  };

  const rooms = [
    { type: "Single sharing", booked: 2, total: 30, price: 70 },
    { type: "Double sharing", booked: 2, total: 35, price: 120 },
    { type: "Triple sharing", booked: 2, total: 25, price: 150 },
    { type: "Deluxe Double", booked: 4, total: 10, price: 180 },
    { type: "Family Suite", booked: 4, total: 10, price: 220 },
    { type: "Presidential Suite", booked: 4, total: 10, price: 350 },
  ];

  const feedback = [
    { name: "Mark", comment: "Food was great.", room: "001" },
    {
      name: "Christian",
      comment: "Facilities were perfect for amount paid.",
      room: "002",
    },
    {
      name: "Alexander",
      comment: "Room cleaning could be better.",
      room: "003",
    },
  ];

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

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold mb-6">
        {user ? `Welcome back, ${user.name}` : "Dashboard"}
      </h1>

      {/* Overview */}
      <div className="grid grid-cols-5 gap-6 mb-8">
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
      <h2 className="text-xl font-semibold mb-4">Rooms</h2>
      <div className="grid grid-cols-4 gap-6 mb-8">
        {rooms.map((room, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <h3 className="font-semibold">{room.type}</h3>
              <p>
                {room.booked}/{room.total} booked
              </p>
              <p className="text-blue-600 font-bold">${room.price}/day</p>
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
            <Bar dataKey="percent" fill="#C5A880" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Feedback */}
      <h2 className="text-xl font-semibold mb-4">Customer Feedback</h2>
      <div className="bg-white shadow rounded p-4">
        {feedback.map((f, i) => (
          <div key={i} className="border-b py-2 last:border-b-0">
            <p className="font-semibold">
              {f.name} ({f.room})
            </p>
            <p className="text-gray-600">{f.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
