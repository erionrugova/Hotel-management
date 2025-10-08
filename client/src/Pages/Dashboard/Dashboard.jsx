import { useState, useEffect } from "react";
import { useUser } from "../../UserContext";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { Card, CardContent } from "../../components/card";
import apiService from "../../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { motion } from "framer-motion";
import moment from "moment-timezone";

moment.tz.setDefault("Europe/Belgrade");

function Dashboard() {
  const { user, refreshFlag } = useUser();
  const navigate = useNavigate();

  const statLabels = {
    checkIn: "Today's Check-ins",
    checkOut: "Today's Check-outs",
    inHotel: "Guests in Hotel",
    availableRooms: "Available Rooms",
    occupiedRooms: "Occupied Rooms",
    tomorrow: "Tomorrow's Occupancy",
    thisWeek: "This Week's Occupancy",
  };

  const [stats, setStats] = useState({
    checkIn: 0,
    checkOut: 0,
    inHotel: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    tomorrow: 0,
    thisWeek: 0,
  });

  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [occupancyData, setOccupancyData] = useState([]);
  const [messages, setMessages] = useState([]);
  const [roomTypeChart, setRoomTypeChart] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomPeriod, setRoomPeriod] = useState("today");
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [availableYears, setAvailableYears] = useState([]);
  const [chartMode, setChartMode] = useState("all");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [roomsData, bookingsData, guestsData, contactData] =
          await Promise.all([
            apiService.getRooms(),
            apiService.getBookings(),
            apiService.getGuests(),
            apiService.getMessages(),
          ]);

        const today = moment.tz("Europe/Belgrade").startOf("day");
        const tomorrow = moment(today).add(1, "day");
        const weekStart = moment(today).startOf("week");
        const weekEnd = moment(today).endOf("week");

        // Stats
        const confirmedBookings = bookingsData.filter(
          (b) => b.status === "CONFIRMED"
        );

        const todayCheckIns = confirmedBookings.filter((b) =>
          moment.tz(b.startDate, "Europe/Belgrade").isSame(today, "day")
        );
        const todayCheckOuts = confirmedBookings.filter((b) =>
          moment.tz(b.endDate, "Europe/Belgrade").isSame(today, "day")
        );

        // Guests currently in hotel
        const inHotel = guestsData.filter((g) => {
          const booking = g.booking || g.Booking;
          if (!booking) return false;
          const start = moment.tz(booking.startDate, "Europe/Belgrade");
          const end = moment.tz(booking.endDate, "Europe/Belgrade");
          const isActive =
            start.isSameOrBefore(today) && end.isSameOrAfter(today);
          return g.status === "CONFIRMED" && isActive;
        }).length;

        // Occupied and available rooms
        const occupiedRooms = roomsData.filter((room) =>
          room.bookings.some((b) => {
            const start = moment.tz(b.startDate, "Europe/Belgrade");
            const end = moment.tz(b.endDate, "Europe/Belgrade");
            return (
              b.status === "CONFIRMED" &&
              start.isSameOrBefore(today) &&
              end.isSameOrAfter(today)
            );
          })
        ).length;

        const availableRooms = roomsData.length - occupiedRooms;

        // Tomorrow occupancy
        const tomorrowOccupancy = confirmedBookings.filter((b) => {
          const start = moment.tz(b.startDate, "Europe/Belgrade");
          const end = moment.tz(b.endDate, "Europe/Belgrade");
          return (
            start.isSameOrBefore(tomorrow, "day") &&
            end.isSameOrAfter(tomorrow, "day")
          );
        }).length;

        // This week occupancy
        const weekOccupancy = confirmedBookings.filter((b) => {
          const start = moment.tz(b.startDate, "Europe/Belgrade");
          const end = moment.tz(b.endDate, "Europe/Belgrade");
          return start.isBefore(weekEnd) && end.isAfter(weekStart);
        }).length;

        setStats({
          checkIn: todayCheckIns.length,
          checkOut: todayCheckOuts.length,
          inHotel,
          availableRooms,
          occupiedRooms,
          tomorrow: tomorrowOccupancy,
          thisWeek: weekOccupancy,
        });

        setBookings(bookingsData);
        setMessages(contactData);

        const years = [
          ...new Set(
            bookingsData.map((b) =>
              moment.tz(b.startDate, "Europe/Belgrade").year()
            )
          ),
        ].sort((a, b) => b - a);
        setAvailableYears(years);

        // Occupancy stats
        const totalRooms = roomsData.length || 1;
        const months = Array.from({ length: 12 }, (_, i) => {
          const monthStart = moment
            .tz("Europe/Belgrade")
            .year(selectedYear)
            .month(i)
            .startOf("month");
          const monthEnd = moment
            .tz("Europe/Belgrade")
            .year(selectedYear)
            .month(i)
            .endOf("month");
          const daysInMonth = monthEnd.date();
          const totalRoomDays = totalRooms * daysInMonth;
          let occupiedRoomDays = 0;

          confirmedBookings.forEach((b) => {
            const bookingStart = moment.tz(b.startDate, "Europe/Belgrade");
            const bookingEnd = moment.tz(b.endDate, "Europe/Belgrade");
            if (
              bookingStart.isBefore(monthEnd) &&
              bookingEnd.isAfter(monthStart)
            ) {
              const overlapStart = moment.max(bookingStart, monthStart);
              const overlapEnd = moment.min(bookingEnd, monthEnd);
              if (overlapStart.isBefore(overlapEnd)) {
                occupiedRoomDays += overlapEnd.diff(overlapStart, "days");
              }
            }
          });

          const occupiedPercent = Math.round(
            (occupiedRoomDays / totalRoomDays) * 100
          );

          return {
            month: moment().month(i).format("MMM"),
            occupied: occupiedPercent,
            available: 100 - occupiedPercent,
          };
        });

        setOccupancyData(months);

        const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
          const monthStart = moment
            .tz("Europe/Belgrade")
            .year(selectedYear)
            .month(i)
            .startOf("month");
          const monthEnd = moment
            .tz("Europe/Belgrade")
            .year(selectedYear)
            .month(i)
            .endOf("month");

          const total = bookingsData
            .filter(
              (b) =>
                b.status === "CONFIRMED" &&
                b.paymentStatus === "PAID" &&
                moment
                  .tz(b.startDate, "Europe/Belgrade")
                  .isBetween(monthStart, monthEnd, null, "[]")
            )
            .reduce((sum, b) => sum + (parseFloat(b.finalPrice) || 0), 0);

          return {
            month: moment().month(i).format("MMM"),
            revenue: total,
          };
        });

        setRevenueData(monthlyRevenue);

        // Room types
        const roomTypes = {};
        roomsData.forEach((room) => {
          if (!roomTypes[room.type]) {
            roomTypes[room.type] = {
              total: 0,
              booked: 0,
              price: room.price || 0,
            };
          }
          roomTypes[room.type].total++;
        });

        const isActiveBooking = (booking) => {
          const start = moment.tz(booking.startDate, "Europe/Belgrade");
          const end = moment.tz(booking.endDate, "Europe/Belgrade");
          if (roomPeriod === "today")
            return start.isSameOrBefore(today) && end.isSameOrAfter(today);
          if (roomPeriod === "tomorrow")
            return (
              start.isSameOrBefore(tomorrow) && end.isSameOrAfter(tomorrow)
            );
          if (roomPeriod === "week")
            return start.isBefore(weekEnd) && end.isAfter(weekStart);
          return false;
        };

        bookingsData.forEach((b) => {
          if (b.status === "CONFIRMED" && b.room?.type && isActiveBooking(b)) {
            const type = b.room.type.toUpperCase();
            if (!roomTypes[type])
              roomTypes[type] = { total: 0, booked: 0, price: 0 };
            roomTypes[type].booked++;
          }
        });

        setRooms(
          Object.entries(roomTypes).map(([type, data]) => ({
            type: type.replace("_", " "),
            ...data,
          }))
        );

        // Pie chart
        const activeBookings = bookingsData.filter((b) => {
          if (b.status !== "CONFIRMED" || !b.room?.type) return false;
          const start = moment.tz(b.startDate, "Europe/Belgrade");
          const end = moment.tz(b.endDate, "Europe/Belgrade");
          return chartMode === "active"
            ? start.isSameOrBefore(today) && end.isSameOrAfter(today)
            : true;
        });

        const chartCounts = {};
        activeBookings.forEach((b) => {
          const type = b.room.type.toUpperCase();
          if (!chartCounts[type]) chartCounts[type] = 0;
          chartCounts[type]++;
        });

        const totalChartCount = Object.values(chartCounts).reduce(
          (a, b) => a + b,
          0
        );

        const chartData = Object.entries(chartCounts).map(([type, count]) => ({
          name: type,
          count,
          percent:
            totalChartCount > 0
              ? ((count / totalChartCount) * 100).toFixed(2)
              : 0,
          value: count,
        }));

        setRoomTypeChart(chartData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [refreshFlag, roomPeriod, selectedYear, chartMode]);

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-lg animate-pulse text-gray-600">
          Loading dashboard...
        </div>
      </div>
    );
  }

  const COLORS =
    chartMode === "active"
      ? {
          DELUXE: "#EAB308",
          DOUBLE: "#3B82F6",
          SINGLE: "#CA8A04",
          SUITE: "#10B981",
        }
      : {
          DELUXE: "#E5C07B",
          DOUBLE: "#93C5FD",
          SINGLE: "#D6AF63",
          SUITE: "#6EE7B7",
        };

  const colorArray = Object.values(COLORS);

  const todayCheckIns = bookings.filter(
    (b) =>
      b.status === "CONFIRMED" &&
      moment.tz(b.startDate, "Europe/Belgrade").isSame(moment(), "day")
  );
  const todayCheckOuts = bookings.filter(
    (b) =>
      b.status === "CONFIRMED" &&
      moment.tz(b.endDate, "Europe/Belgrade").isSame(moment(), "day")
  );

  return (
    <motion.div
      className="p-8 bg-gray-50 min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold mb-6">
          {user ? `Welcome back, ${user.username}` : "Dashboard"}
        </h1>

        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700 transition-all duration-300"
        >
          <Home size={18} />
          Back to Homepage
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-10">
        <h2 className="text-xl font-semibold mb-4">Today’s Activity</h2>
        <div className="space-y-4">
          {todayCheckIns.length === 0 && todayCheckOuts.length === 0 ? (
            <p className="text-gray-500">No activity today.</p>
          ) : (
            <>
              {todayCheckIns.map((b) => (
                <motion.div
                  key={`in-${b.id}`}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between border-l-4 border-green-500 pl-4 py-2 bg-green-50 rounded"
                >
                  <span className="text-sm text-green-700 font-medium">
                    ✅ Check-in: Room {b.room?.roomNumber || "N/A"} —{" "}
                    {b.customerFirstName} {b.customerLastName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {moment.tz(b.startDate, "Europe/Belgrade").format("HH:mm")}
                  </span>
                </motion.div>
              ))}
              {todayCheckOuts.map((b) => (
                <motion.div
                  key={`out-${b.id}`}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between border-l-4 border-red-500 pl-4 py-2 bg-red-50 rounded"
                >
                  <span className="text-sm text-red-700 font-medium">
                    🚪 Check-out: Room {b.room?.roomNumber || "N/A"} —{" "}
                    {b.customerFirstName} {b.customerLastName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {moment.tz(b.endDate, "Europe/Belgrade").format("HH:mm")}
                  </span>
                </motion.div>
              ))}
            </>
          )}
        </div>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        {Object.entries(stats).map(([key, value]) => (
          <Card
            key={key}
            className="transition-transform duration-300 hover:scale-[1.04] hover:shadow-lg"
          >
            <CardContent>
              <p className="text-gray-500 capitalize">
                {statLabels[key] || key.replace(/([A-Z])/g, " $1")}
              </p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Room Types</h2>
        <div className="flex gap-3">
          {["today", "tomorrow", "week"].map((period) => {
            const isActive = roomPeriod === period;
            return (
              <button
                key={period}
                onClick={() => setRoomPeriod(period)}
                className={`px-4 py-1.5 rounded-md font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-300 scale-105"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {rooms.length > 0 ? (
          rooms.map((room, i) => {
            const occupancyRate =
              room.total > 0 ? Math.round((room.booked / room.total) * 100) : 0;

            return (
              <motion.div
                key={i}
                whileHover={{ scale: 1.03 }}
                className="border border-gray-200 rounded-xl bg-gradient-to-b from-white to-gray-50 shadow-sm hover:shadow-xl transition-all"
              >
                <CardContent className="p-5 text-center">
                  <h3 className="font-semibold text-lg text-gray-900 uppercase tracking-wide">
                    {room.type}
                  </h3>
                  <p className="text-gray-700 text-sm mt-1 mb-2">
                    <span className="font-medium text-gray-900">
                      {room.booked}
                    </span>{" "}
                    / {room.total} occupied
                  </p>

                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${occupancyRate}%` }}
                      transition={{ duration: 0.8 }}
                      className={`h-2.5 rounded-full ${
                        occupancyRate > 80
                          ? "bg-red-500"
                          : occupancyRate > 50
                          ? "bg-yellow-400"
                          : "bg-green-500"
                      }`}
                    ></motion.div>
                  </div>

                  <p className="text-xs text-gray-600 mb-3">
                    Occupancy: <b>{occupancyRate}%</b>
                  </p>
                  <p className="text-[#B89B5E] font-bold text-lg">
                    ${Number(room.price || 0).toFixed(2)}/day
                  </p>
                </CardContent>
              </motion.div>
            );
          })
        ) : (
          <p className="col-span-4 text-center text-gray-500">
            No room data available.
          </p>
        )}
      </motion.div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Occupancy Statistics</h2>
        {availableYears.length > 0 && (
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border px-2 py-1 rounded-md text-sm"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-white shadow rounded-xl p-4 h-64 mb-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={occupancyData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="occupied"
              stackId="a"
              fill="#B89B5E"
              name="Occupied %"
              animationDuration={900}
            />
            <Bar
              dataKey="available"
              stackId="a"
              fill="#4ADE80"
              name="Available %"
              animationDuration={900}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between items-center mb-4 mt-12">
        <h2 className="text-xl font-semibold">Revenue Overview</h2>
        <select
          className="border px-3 py-1.5 rounded-md text-sm text-gray-700"
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
        >
          {availableYears.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white shadow rounded-xl p-4 h-72 mb-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={revenueData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#B89B5E" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#B89B5E" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" stroke="#888" />
            <YAxis stroke="#888" tickFormatter={(v) => `$${v / 1000}k`} />
            <Tooltip
              formatter={(value) => [
                `$${value.toLocaleString()}`,
                "Total Revenue",
              ]}
              labelFormatter={(label) => `${label} ${selectedYear}`}
              contentStyle={{
                borderRadius: "8px",
                backgroundColor: "#fff",
                border: "1px solid #ddd",
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#B89B5E"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Bookings by Room Type</h2>
        <button
          onClick={() => setChartMode(chartMode === "all" ? "active" : "all")}
          className={`px-3 py-1.5 rounded font-medium transition-all duration-300 ${
            chartMode === "all"
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {chartMode === "all" ? "Show Active Only" : "Show All-Time"}
        </button>
      </div>

      <motion.div
        className="bg-white shadow rounded-xl p-4 h-[420px] mb-10 flex justify-center items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <ResponsiveContainer width="65%" height="100%">
          <PieChart
            margin={{
              top: 20,
              right: 40,
              bottom: 50,
              left: 40,
            }}
          >
            <Pie
              data={roomTypeChart}
              cx="50%"
              cy="52%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${percent}%)`}
              outerRadius={120}
              dataKey="value"
              isAnimationActive={true}
              animationDuration={800}
            >
              {roomTypeChart.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    COLORS[entry.name.toUpperCase()] ||
                    colorArray[index % colorArray.length]
                  }
                />
              ))}
            </Pie>

            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="square"
              wrapperStyle={{
                marginTop: "30px",
              }}
            />
            <Tooltip
              formatter={(value, name, entry) => [
                `${entry.payload.count} booked (${entry.payload.percent}%)`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          Recent Guest Messages
          {messages.some((m) => !m.read) && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {messages.filter((m) => !m.read).length}
            </span>
          )}
        </h2>
      </div>

      <div className="bg-white shadow rounded-xl p-4 overflow-x-auto">
        <table className="w-full text-sm text-left table-fixed">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 w-[15%]">Name</th>
              <th className="p-3 w-[20%]">Email</th>
              <th className="p-3 w-[40%]">Message</th>
              <th className="p-3 w-[15%] text-nowrap text-center">Date</th>
              <th className="p-3 w-[10%] text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.length > 0 ? (
              messages.slice(0, 5).map((msg) => (
                <motion.tr
                  key={msg.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className={`border-b ${
                    msg.read ? "bg-gray-50" : "bg-yellow-50"
                  }`}
                >
                  <td className="p-3 font-medium break-words">{msg.name}</td>
                  <td className="p-3 break-words">{msg.email}</td>
                  <td className="p-3 text-gray-700 align-top max-w-[450px] whitespace-normal break-words">
                    {msg.message}
                  </td>
                  <td className="p-3 text-gray-500 whitespace-nowrap text-center align-top">
                    {moment(msg.createdAt).format("YYYY-MM-DD")}
                  </td>
                  <td className="p-3 flex gap-2 justify-center align-top">
                    <button
                      onClick={async () => {
                        try {
                          await apiService.updateMessageStatus(msg.id, {
                            read: !msg.read,
                          });
                          setMessages((prev) =>
                            prev.map((m) =>
                              m.id === msg.id ? { ...m, read: !msg.read } : m
                            )
                          );
                        } catch (err) {
                          console.error("Failed to update message:", err);
                        }
                      }}
                      className={`px-2 py-1 rounded text-xs ${
                        msg.read
                          ? "bg-blue-200 text-blue-700 hover:bg-blue-300"
                          : "bg-green-200 text-green-700 hover:bg-green-300"
                      }`}
                    >
                      {msg.read ? "Mark Unread" : "Mark Read"}
                    </button>

                    <button
                      onClick={async () => {
                        if (
                          window.confirm("Delete this message permanently?")
                        ) {
                          try {
                            await apiService.deleteMessage(msg.id);
                            setMessages((prev) =>
                              prev.filter((m) => m.id !== msg.id)
                            );
                          } catch (err) {
                            console.error("Failed to delete message:", err);
                          }
                        }
                      }}
                      className="px-2 py-1 rounded text-xs bg-red-200 text-red-700 hover:bg-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center p-4 text-gray-500">
                  No messages found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export default Dashboard;
