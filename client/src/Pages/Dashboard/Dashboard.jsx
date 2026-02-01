import { useState, useEffect, useMemo } from "react";
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
  const [revenueByType, setRevenueByType] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomPeriod, setRoomPeriod] = useState("today");
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [availableYears, setAvailableYears] = useState([]);
  const [chartMode, setChartMode] = useState("all");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Use Promise.allSettled to handle partial failures gracefully
        const results = await Promise.allSettled([
          apiService.getRooms(),
          apiService.getBookings(),
          apiService.getGuests(),
          apiService.getMessages(),
        ]);

        // Extract data from settled promises
        // Only use new data if request succeeded, otherwise we'll preserve existing state
        const roomsResult = results[0];
        const bookingsResult = results[1];
        const guestsResult = results[2];
        const contactResult = results[3];

        // Only proceed with state updates if we got at least some successful data
        // This prevents clearing existing data when all requests fail
        const hasSuccessfulData =
          roomsResult.status === "fulfilled" ||
          bookingsResult.status === "fulfilled" ||
          guestsResult.status === "fulfilled" ||
          contactResult.status === "fulfilled";

        if (!hasSuccessfulData) {
          console.warn(
            "⚠️ All dashboard requests failed. Preserving existing data.",
          );
          setLoading(false);
          return;
        }

        // Use successful data, or empty arrays for failed requests (will be handled gracefully)
        const roomsData =
          roomsResult.status === "fulfilled" ? roomsResult.value : [];
        const bookingsData =
          bookingsResult.status === "fulfilled" ? bookingsResult.value : [];
        const contactData =
          contactResult.status === "fulfilled" ? contactResult.value : [];

        // --- Processing Logic ---

        // 1. Calculate Stats
        const now = moment().tz("Europe/Belgrade");

        // Filter bookings: exclude COMPLETED and CANCELLED for active counts
        const activeBookings = bookingsData.filter(
          (b) => b.status !== "COMPLETED" && b.status !== "CANCELLED",
        );
        
        // For check-ins/check-outs, use CONFIRMED bookings
        const confirmedBookings = bookingsData.filter(
          (b) => b.status === "CONFIRMED",
        );

        const checkIns = confirmedBookings.filter((b) =>
          moment.tz(b.startDate, "Europe/Belgrade").isSame(now, "day"),
        ).length;
        const checkOuts = confirmedBookings.filter((b) =>
          moment.tz(b.endDate, "Europe/Belgrade").isSame(now, "day"),
        ).length;

        // In Hotel: active bookings where start <= today < end (exclude COMPLETED and CANCELLED)
        const inHotel = activeBookings.filter((b) => {
          const start = moment.tz(b.startDate, "Europe/Belgrade");
          const end = moment.tz(b.endDate, "Europe/Belgrade");
          return (
            (start.isBefore(now, "day") || start.isSame(now, "day")) &&
            end.isAfter(now, "day")
          );
        }).length;

        const totalRooms = roomsData.length;
        const occupiedToday = inHotel;
        const availableToday = Math.max(0, totalRooms - occupiedToday);

        // Tomorrow's Occupancy (exclude COMPLETED and CANCELLED)
        const occupiedTomorrow = activeBookings.filter((b) => {
          const start = moment.tz(b.startDate, "Europe/Belgrade");
          const end = moment.tz(b.endDate, "Europe/Belgrade");
          const tmrw = now.clone().add(1, "days");
          return (
            (start.isBefore(tmrw, "day") || start.isSame(tmrw, "day")) &&
            end.isAfter(tmrw, "day")
          );
        }).length;

        // This Week's Average Occupancy (exclude COMPLETED and CANCELLED)
        const weekStart = now.clone().startOf("week"); // Sunday
        let totalOccupiedWeek = 0;
        for (let i = 0; i < 7; i++) {
          const day = weekStart.clone().add(i, "days");
          const occ = activeBookings.filter((b) => {
            const start = moment.tz(b.startDate, "Europe/Belgrade");
            const end = moment.tz(b.endDate, "Europe/Belgrade");
            return (
              (start.isBefore(day, "day") || start.isSame(day, "day")) &&
              end.isAfter(day, "day")
            );
          }).length;
          totalOccupiedWeek += occ;
        }
        const avgWeekOccupancy = Math.round(totalOccupiedWeek / 7);

        setStats({
          checkIn: checkIns,
          checkOut: checkOuts,
          inHotel: inHotel,
          availableRooms: availableToday,
          occupiedRooms: occupiedToday,
          tomorrow: occupiedTomorrow,
          thisWeek: avgWeekOccupancy,
        });

        // 2. Room Types with Dynamic Period
        // We will filter based on `roomPeriod` state (today, tomorrow, week)
        // Since this runs in useEffect, we need to recalculate when `roomPeriod` changes
        // But for initial load, we'll just calculate "today"
        // We'll move this logic to a separate effect or just recalculate here
        // For simplicity, let's just compute all and set state, then filtering happens in render or separate effect?
        // Actually, let's just compute "today" here, and we'll have a separate useEffect for roomPeriod changes if needed.
        // Wait, roomPeriod is a dependency of this effect? No, we should probably separate it.
        // But to avoid complexity, let's just compute the current `roomPeriod` data here.

        let targetDate = now;
        if (roomPeriod === "tomorrow") targetDate = now.clone().add(1, "days");

        // Calculate usage per room type
        const roomUsage = {}; // { Single: { booked: 5, total: 10, price: 100 } }

        // Initialize with total counts
        roomsData.forEach((r) => {
          if (!roomUsage[r.type]) {
            roomUsage[r.type] = {
              booked: 0,
              total: 0,
              price: r.price,
              type: r.type,
            };
          }
          roomUsage[r.type].total += 1;
        });

        // Count booked (exclude COMPLETED and CANCELLED)
        if (roomPeriod === "week") {
          // Average for the week? Or total unique bookings?
          // Let's do: Average occupancy for the next 7 days
          for (let i = 0; i < 7; i++) {
            const d = now.clone().add(i, "days");
            activeBookings.forEach((b) => {
              const start = moment.tz(b.startDate, "Europe/Belgrade");
              const end = moment.tz(b.endDate, "Europe/Belgrade");
              if (
                (start.isBefore(d, "day") || start.isSame(d, "day")) &&
                end.isAfter(d, "day")
              ) {
                const room = roomsData.find((r) => r.id === b.roomId);
                if (room && roomUsage[room.type]) {
                  roomUsage[room.type].booked += 1 / 7; // Add 1/7th for average
                }
              }
            });
          }
          // Round booked numbers
          Object.keys(roomUsage).forEach((k) => {
            roomUsage[k].booked = Math.round(roomUsage[k].booked);
          });
        } else {
          // Single day (today or tomorrow)
          activeBookings.forEach((b) => {
            const start = moment.tz(b.startDate, "Europe/Belgrade");
            const end = moment.tz(b.endDate, "Europe/Belgrade");
            if (
              (start.isBefore(targetDate, "day") ||
                start.isSame(targetDate, "day")) &&
              end.isAfter(targetDate, "day")
            ) {
              const room = roomsData.find((r) => r.id === b.roomId);
              if (room && roomUsage[room.type]) {
                roomUsage[room.type].booked += 1;
              }
            }
          });
        }

        setRooms(Object.values(roomUsage));

        // 3. Occupancy Chart (Monthly for selected year)
        // We need available years first
        const years = new Set();
        years.add(moment().year()); // Always include current year
        confirmedBookings.forEach((b) => {
          years.add(moment(b.startDate).year());
        });
        const sortedYears = Array.from(years).sort((a, b) => b - a);
        setAvailableYears(sortedYears);

        // Compute monthly occupancy for selectedYear
        // Include all bookings (including COMPLETED) for historical accuracy
        const monthlyOcc = Array(12)
          .fill(0)
          .map((_, i) => ({
            month: moment().month(i).format("MMM"),
            occupied: 0,
            available: 100, // Percentage
          }));

        // Simplification: Count "room-nights" per month
        // Total potential room-nights = totalRooms * daysInMonth
        confirmedBookings.forEach((b) => {
          const start = moment.tz(b.startDate, "Europe/Belgrade");
          const end = moment.tz(b.endDate, "Europe/Belgrade");

          // Iterate through days of booking
          let current = start.clone();
          while (current.isBefore(end, "day")) {
            if (current.year() === selectedYear) {
              const mIndex = current.month();
              monthlyOcc[mIndex].occupied += 1;
            }
            current.add(1, "days");
          }
        });

        // Normalize to percentage
        monthlyOcc.forEach((m, i) => {
          const daysInMonth = moment({
            year: selectedYear,
            month: i,
          }).daysInMonth();
          const totalCapacity = totalRooms * daysInMonth;
          if (totalCapacity > 0) {
            const occPct = Math.round((m.occupied / totalCapacity) * 100);
            m.occupied = occPct;
            m.available = 100 - occPct;
          } else {
            m.occupied = 0;
            m.available = 100;
          }
        });
        setOccupancyData(monthlyOcc);

        // 4. Revenue Overview (Monthly)
        const monthlyRev = Array(12)
          .fill(0)
          .map((_, i) => ({
            month: moment().month(i).format("MMM"),
            revenue: 0,
          }));

        confirmedBookings.forEach((b) => {
          // Only count bookings with actual finalPrice
          if (!b.finalPrice) return;
          const start = moment.tz(b.startDate, "Europe/Belgrade");
          if (start.year() === selectedYear) {
            const mIndex = start.month();
            monthlyRev[mIndex].revenue += Number(b.finalPrice);
          }
        });
        setRevenueData(monthlyRev);

        // 5. Room Type Distribution (Pie Chart)
        // First, get all unique room types from rooms data
        const allRoomTypes = [...new Set(roomsData.map((r) => r.type))];
        
        // Initialize distribution with all room types (including those with 0 bookings)
        const typeDist = {};
        allRoomTypes.forEach((type) => {
          typeDist[type] = 0;
        });

        const bookingsToUse =
          chartMode === "all"
            ? activeBookings // Use activeBookings (excludes COMPLETED and CANCELLED)
            : activeBookings.filter((b) => {
                // Only show currently active bookings
                const start = moment.tz(b.startDate, "Europe/Belgrade");
                const end = moment.tz(b.endDate, "Europe/Belgrade");
                return (
                  (start.isBefore(now, "day") || start.isSame(now, "day")) &&
                  end.isAfter(now, "day")
                );
              });

        bookingsToUse.forEach((b) => {
          const room = roomsData.find((r) => r.id === b.roomId);
          if (room) {
            if (!typeDist[room.type]) typeDist[room.type] = 0;
            typeDist[room.type] += 1;
          }
        });

        const totalBookingsCount = bookingsToUse.length;
        const pieData = Object.entries(typeDist).map(([name, count]) => ({
          name,
          value: count,
          count,
          percent:
            totalBookingsCount > 0
              ? Math.round((count / totalBookingsCount) * 100)
              : 0,
        }));
        setRoomTypeChart(pieData);

        // 6. Recent Messages
        setMessages(
          contactData.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
          ),
        );

        setBookings(bookingsData); // Store raw bookings for other uses if needed

        // 7. Calculate Weekly Activity (Check-ins vs Check-outs)
        const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
          const day = weekStart.clone().add(i, "days");
          const dayStr = day.format("YYYY-MM-DD");
          const checkIns = confirmedBookings.filter(
            (b) =>
              moment.tz(b.startDate, "Europe/Belgrade").format("YYYY-MM-DD") ===
              dayStr,
          ).length;
          const checkOuts = confirmedBookings.filter(
            (b) =>
              moment.tz(b.endDate, "Europe/Belgrade").format("YYYY-MM-DD") ===
              dayStr,
          ).length;
          return { day: day.format("ddd"), checkIns, checkOuts };
        });
        setWeeklyStats(weeklyActivity);

        // 8. Revenue by Room Type (use all confirmed bookings for revenue, not filtered)
        // First, get all unique room types from rooms data
        const allRoomTypesForRevenue = [...new Set(roomsData.map((r) => r.type))];
        
        // Initialize revenue with all room types (including those with 0 revenue)
        const revByType = {};
        allRoomTypesForRevenue.forEach((type) => {
          revByType[type] = 0;
        });

        confirmedBookings.forEach((b) => {
          // Include all bookings for revenue calculation (including COMPLETED for historical accuracy)
          const room = roomsData.find((r) => r.id === b.roomId);
          if (room && b.finalPrice) {
            if (!revByType[room.type]) revByType[room.type] = 0;
            revByType[room.type] += Number(b.finalPrice || 0);
          }
        });
        const revByTypeData = Object.entries(revByType)
          .map(([name, value]) => ({
            name,
            value,
          }))
          .sort((a, b) => b.value - a.value);
        setRevenueByType(revByTypeData);
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, refreshFlag, roomPeriod, selectedYear, chartMode]); // Add dependencies to re-run when filters change

  // Prepare Today's Activity Lists (memoized for performance)
  const todayCheckIns = useMemo(() => {
    return bookings.filter((b) => {
      const start = moment.tz(b.startDate, "Europe/Belgrade");
      return start.isSame(moment(), "day") && b.status === "CONFIRMED";
    });
  }, [bookings]);

  const todayCheckOuts = useMemo(() => {
    return bookings.filter((b) => {
      const end = moment.tz(b.endDate, "Europe/Belgrade");
      return end.isSame(moment(), "day") && b.status === "CONFIRMED";
    });
  }, [bookings]);

  const COLORS = useMemo(() => ({
    SINGLE: "#0088FE",
    DOUBLE: "#00C49F",
    SUITE: "#FFBB28",
    DELUXE: "#FF8042",
  }), []);

  const colorArray = useMemo(() => ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"], []);

  if (loading) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg animate-pulse text-indigo-400 font-medium">
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="p-4 sm:p-6 lg:p-8 bg-slate-950 min-h-screen text-slate-200"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            {user ? `Welcome back, ${user.username}` : "Dashboard"}
          </h1>
          <p className="text-slate-400 mt-1">Here's what's happening today.</p>
        </div>

        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-900/20 hover:bg-indigo-500 hover:shadow-indigo-900/40 transition-all duration-300 text-sm font-medium w-full sm:w-auto justify-center"
        >
          <Home size={18} />
          Homepage
        </button>
      </div>

      {/* Today's Activity Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
          <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
          Today's Activity
        </h2>
        <div className="space-y-3">
          {todayCheckIns.length === 0 && todayCheckOuts.length === 0 ? (
            <p className="text-slate-500 italic">
              No check-ins or check-outs scheduled for today.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {todayCheckIns.map((b) => {
                let displayTime = moment.tz("Europe/Belgrade");
                if (b.createdAt) {
                  const parsed = moment.utc(b.createdAt);
                  if (parsed.isValid())
                    displayTime = parsed.tz("Europe/Belgrade");
                  else {
                    const direct = moment.tz(b.createdAt, "Europe/Belgrade");
                    if (direct.isValid()) displayTime = direct;
                  }
                }
                return (
                  <motion.div
                    key={`in-${b.id}`}
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center justify-between border-l-4 border-emerald-500 pl-4 py-3 bg-slate-800/50 rounded-r-lg"
                  >
                    <div>
                      <span className="text-emerald-400 font-semibold block text-sm">
                        CHECK-IN
                      </span>
                      <span className="text-slate-200 font-medium">
                        {b.customerFirstName} {b.customerLastName}
                      </span>
                      <span className="text-slate-400 text-xs block">
                        Room {b.room?.roomNumber || "N/A"}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono bg-slate-800 px-2 py-1 rounded">
                      {displayTime.format("h:mm A")}
                    </span>
                  </motion.div>
                );
              })}
              {todayCheckOuts.map((b) => {
                let displayTime = moment.tz("Europe/Belgrade");
                const dateToUse = b.updatedAt || b.createdAt;
                if (dateToUse) {
                  const parsed = moment.utc(dateToUse);
                  if (parsed.isValid())
                    displayTime = parsed.tz("Europe/Belgrade");
                  else {
                    const direct = moment.tz(dateToUse, "Europe/Belgrade");
                    if (direct.isValid()) displayTime = direct;
                  }
                }
                return (
                  <motion.div
                    key={`out-${b.id}`}
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center justify-between border-l-4 border-rose-500 pl-4 py-3 bg-slate-800/50 rounded-r-lg"
                  >
                    <div>
                      <span className="text-rose-400 font-semibold block text-sm">
                        CHECK-OUT
                      </span>
                      <span className="text-slate-200 font-medium">
                        {b.customerFirstName} {b.customerLastName}
                      </span>
                      <span className="text-slate-400 text-xs block">
                        Room {b.room?.roomNumber || "N/A"}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono bg-slate-800 px-2 py-1 rounded">
                      {displayTime.format("h:mm A")}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        {Object.entries(stats).map(([key, value]) => (
          <Card
            key={key}
            className="transition-all duration-300 hover:scale-[1.04] hover:shadow-xl bg-slate-900 border-slate-800"
          >
            <CardContent>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                {statLabels[key] || key.replace(/([A-Z])/g, " $1")}
              </p>
              <p className="text-2xl font-bold text-white">{value}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-xl font-semibold text-white">Room Types Status</h2>
        <div className="flex gap-2 flex-wrap bg-slate-900 p-1 rounded-lg border border-slate-800">
          {["today", "tomorrow", "week"].map((period) => {
            const isActive = roomPeriod === period;
            return (
              <button
                key={period}
                onClick={() => setRoomPeriod(period)}
                className={`px-4 py-1.5 rounded-md font-medium text-sm transition-all duration-300 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
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
                className="border border-slate-800 rounded-xl bg-slate-900 shadow-lg hover:shadow-indigo-900/20 transition-all overflow-hidden relative"
              >
                <div
                  className={`absolute top-0 left-0 w-1 h-full ${occupancyRate > 80 ? "bg-rose-500" : occupancyRate > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                ></div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-white uppercase tracking-wide">
                      {room.type}
                    </h3>
                    <div className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-400 font-mono">
                      ${Number(room.price || 0).toFixed(0)}
                    </div>
                  </div>

                  <div className="flex justify-between items-end mb-2">
                    <p className="text-slate-400 text-sm">
                      <span className="font-bold text-white text-2xl">
                        {room.booked}
                      </span>
                      <span className="text-slate-600 mx-1">/</span>
                      {room.total}
                    </p>
                    <p
                      className={`text-sm font-bold ${occupancyRate > 80 ? "text-rose-400" : occupancyRate > 50 ? "text-amber-400" : "text-emerald-400"}`}
                    >
                      {occupancyRate}%
                    </p>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${occupancyRate}%` }}
                      transition={{ duration: 0.8 }}
                      className={`h-2 rounded-full ${
                        occupancyRate > 80
                          ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                          : occupancyRate > 50
                            ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                            : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      }`}
                    ></motion.div>
                  </div>
                </CardContent>
              </motion.div>
            );
          })
        ) : (
          <p className="col-span-4 text-center text-slate-500 py-8">
            No room data available.
          </p>
        )}
      </motion.div>

      {/* Weekly Activity Chart (New) */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">
          Weekly Activity
        </h2>
        <div className="bg-slate-900 border border-slate-800 shadow-xl rounded-xl p-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyStats} barSize={20}>
              <XAxis
                dataKey="day"
                stroke="#94a3b8"
                tick={{ fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f8fafc",
                }}
                cursor={{ fill: "#334155", opacity: 0.2 }}
              />
              <Legend wrapperStyle={{ paddingTop: "10px" }} />
              <Bar
                dataKey="checkIns"
                name="Check-ins"
                fill="#34d399"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="checkOuts"
                name="Check-outs"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Occupancy Stats */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">
              Occupancy Trends
            </h2>
            {availableYears.length > 0 && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-slate-200 px-3 py-1 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="bg-slate-900 border border-slate-800 shadow-xl rounded-xl p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancyData}>
                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#f8fafc",
                  }}
                  cursor={{ fill: "#334155", opacity: 0.2 }}
                />
                <Bar
                  dataKey="occupied"
                  stackId="a"
                  fill="#6366f1"
                  name="Occupied %"
                  radius={[0, 0, 4, 4]}
                />
                <Bar
                  dataKey="available"
                  stackId="a"
                  fill="#1e293b"
                  name="Available %"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Room Type Distribution */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Distribution</h2>
            <button
              onClick={() =>
                setChartMode(chartMode === "all" ? "active" : "all")
              }
              className={`px-3 py-1 rounded-lg font-medium text-xs transition-all ${
                chartMode === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {chartMode === "all" ? "Active Only" : "All Time"}
            </button>
          </div>
          <div className="bg-slate-900 border border-slate-800 shadow-xl rounded-xl p-4 h-64 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roomTypeChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {roomTypeChart.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        COLORS[entry.name.toUpperCase()] ||
                        colorArray[index % colorArray.length]
                      }
                      stroke="rgba(0,0,0,0)"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#f8fafc",
                  }}
                />
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  iconType="circle"
                  wrapperStyle={{ color: "#94a3b8" }}
                  formatter={(value, entry) => {
                    const data = roomTypeChart.find((d) => d.name === value);
                    return `${value} (${data?.percent || 0}%)`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Overview */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">
              Revenue Overview
            </h2>
            <select
              className="bg-slate-900 border border-slate-700 text-slate-200 px-3 py-1 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
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

          <div className="bg-slate-900 border border-slate-800 shadow-xl rounded-xl p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                  tick={{ fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  tickFormatter={(v) => `$${v / 1000}k`}
                  tick={{ fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => [
                    `$${value.toLocaleString()}`,
                    "Total Revenue",
                  ]}
                  labelFormatter={(label) => `${label} ${selectedYear}`}
                  contentStyle={{
                    borderRadius: "8px",
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    color: "#f8fafc",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Room Type */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">
              Revenue by Room Type
            </h2>
          </div>
          <div className="bg-slate-900 border border-slate-800 shadow-xl rounded-xl p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueByType}
                layout="vertical"
                margin={{ left: 0, right: 20 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#94a3b8"
                  tick={{ fill: "#cbd5e1", fontSize: 12 }}
                  width={80}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#334155", opacity: 0.2 }}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#f8fafc",
                  }}
                  formatter={(val) => `$${val.toLocaleString()}`}
                />
                <Bar
                  dataKey="value"
                  fill="#8b5cf6"
                  radius={[0, 4, 4, 0]}
                  barSize={32}
                >
                  {revenueByType.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colorArray[index % colorArray.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-white">
          Recent Guest Messages
          {messages.some((m) => !m.read) && (
            <span className="bg-rose-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
              {messages.filter((m) => !m.read).length}
            </span>
          )}
        </h2>
      </div>

      <div className="bg-slate-900 border border-slate-800 shadow-xl rounded-xl p-4 overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[600px] text-slate-300">
          <thead className="bg-slate-800 text-slate-200">
            <tr>
              <th className="p-3 min-w-[120px] rounded-l-lg">Name</th>
              <th className="p-3 min-w-[180px]">Email</th>
              <th className="p-3 min-w-[200px]">Message</th>
              <th className="p-3 min-w-[100px] text-nowrap text-center">
                Date
              </th>
              <th className="p-3 min-w-[150px] text-center rounded-r-lg">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {messages.length > 0 ? (
              messages.slice(0, 5).map((msg) => (
                <motion.tr
                  key={msg.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className={`border-b border-slate-800 hover:bg-slate-800/50 transition-colors ${
                    msg.read ? "bg-transparent" : "bg-indigo-900/10"
                  }`}
                >
                  <td className="p-3 font-medium break-words text-white">
                    {msg.name}
                  </td>
                  <td className="p-3 break-words text-slate-400">
                    {msg.email}
                  </td>
                  <td className="p-3 text-slate-300 align-top max-w-[450px] whitespace-normal break-words">
                    {msg.message}
                  </td>
                  <td className="p-3 text-slate-500 whitespace-nowrap text-center align-top">
                    {moment(msg.createdAt).format("YYYY-MM-DD")}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2 justify-center align-top flex-wrap">
                      <button
                        onClick={async () => {
                          try {
                            await apiService.updateMessageStatus(msg.id, {
                              read: !msg.read,
                            });
                            setMessages((prev) =>
                              prev.map((m) =>
                                m.id === msg.id ? { ...m, read: !msg.read } : m,
                              ),
                            );
                          } catch (err) {
                            console.error("Failed to update message:", err);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          msg.read
                            ? "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                            : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
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
                                prev.filter((m) => m.id !== msg.id),
                              );
                            } catch (err) {
                              console.error("Failed to delete message:", err);
                            }
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="text-center p-8 text-slate-500 italic"
                >
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
