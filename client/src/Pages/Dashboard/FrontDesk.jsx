import { useEffect, useState } from "react";
import moment from "moment";
import Timeline from "react-calendar-timeline";
import "react-calendar-timeline/dist/style.css";
import BookingModal from "./BookingModal";
import apiService from "../../services/api";
import { useUser } from "../../UserContext";

const statusColor = (checkInISO, checkOutISO) => {
  const today = moment().startOf("day");
  const ci = moment(checkInISO);
  const co = moment(checkOutISO);

  if (today.isBefore(ci, "day")) return "#facc15"; // future booking
  if (today.isSame(co, "day")) return "#ef4444"; // due out today
  if (today.isAfter(co, "day")) return "#3b82f6"; // checked out
  if (today.isBetween(ci, co, "day", "[]")) return "#4ade80"; // active
  return "#9ca3af"; // fallback
};

function FrontDesk() {
  const [groups, setGroups] = useState([]);
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { triggerRefresh } = useUser();
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsRes, bookingsRes] = await Promise.all([
          apiService.getRooms(),
          apiService.getBookings(),
        ]);

        setGroups(
          roomsRes.map((r) => ({
            id: r.id,
            title: `Room ${r.roomNumber}`,
          }))
        );

        setItems(
          bookingsRes.map((b) => ({
            id: b.id,
            group: b.roomId,
            title: `${b.customerFirstName || ""} ${
              b.customerLastName || ""
            }`.trim(),
            start_time: moment(b.startDate),
            end_time: moment(b.endDate),
            customerFirstName: b.customerFirstName,
            customerLastName: b.customerLastName,
            customerEmail: b.customerEmail,
            paymentType: b.paymentType,
            checkIn: b.startDate,
            checkOut: b.endDate,
            room: b.room
              ? { roomNumber: b.room.roomNumber, type: b.room.type }
              : { roomNumber: "Unknown", type: "—" },
            itemProps: {
              style: {
                background: statusColor(b.startDate, b.endDate),
                color: "#fff",
                borderRadius: 6,
                textAlign: "center",
                fontSize: "0.8rem",
                padding: "2px 4px",
              },
            },
          }))
        );
      } catch (err) {
        console.error("Failed to load front desk data", err);
      }
    };

    fetchData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setIsModalOpen(true);
  };

  const openEdit = (id) => {
    const found = items.find((b) => b.id === id);
    if (found) {
      setEditing(found);
      setIsModalOpen(true);
    }
  };

  const handleSave = async (booking) => {
    try {
      let saved;
      if (editing) {
        saved = await apiService.updateBooking(editing.id, booking);
        setItems((prev) =>
          prev.map((i) =>
            i.id === editing.id
              ? {
                  ...i,
                  ...saved,
                  start_time: moment(saved.startDate),
                  end_time: moment(saved.endDate),
                  checkIn: saved.startDate,
                  checkOut: saved.endDate,
                  room:
                    saved.room && typeof saved.room === "object"
                      ? saved.room
                      : i.room,
                  itemProps: {
                    style: {
                      ...i.itemProps.style,
                      background: statusColor(saved.startDate, saved.endDate),
                    },
                  },
                }
              : i
          )
        );
      } else {
        saved = await apiService.createBooking(booking);
        setItems((prev) => [
          ...prev,
          {
            id: saved.id,
            group: saved.roomId,
            title: `${saved.customerFirstName} ${saved.customerLastName}`,
            start_time: moment(saved.startDate),
            end_time: moment(saved.endDate),
            checkIn: saved.startDate,
            checkOut: saved.endDate,
            customerFirstName: saved.customerFirstName,
            customerLastName: saved.customerLastName,
            customerEmail: saved.customerEmail,
            paymentType: saved.paymentType,
            room: saved.room
              ? { roomNumber: saved.room.roomNumber, type: saved.room.type }
              : { roomNumber: "Unknown", type: "—" },
            itemProps: {
              style: {
                background: statusColor(saved.startDate, saved.endDate),
                color: "#fff",
                borderRadius: 6,
                textAlign: "center",
                fontSize: "0.8rem",
                padding: "2px 4px",
              },
            },
          },
        ]);
      }

      triggerRefresh();
    } catch (err) {
      console.error("Failed to save booking", err);
    }

    setIsModalOpen(false);
    setEditing(null);
  };

  const handleDelete = async (id) => {
    try {
      await apiService.deleteBooking(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      triggerRefresh();
    } catch (err) {
      console.error("Failed to delete booking", err);
    }
  };

  const handleItemMove = async (itemId, dragTime, newGroupOrder) => {
    try {
      const item = items.find((i) => i.id === itemId);
      const group = groups[newGroupOrder];
      const newStart = moment(dragTime);
      const newEnd = moment(item.end_time).add(
        newStart.diff(item.start_time),
        "ms"
      );

      await apiService.updateBooking(itemId, {
        roomId: group.id,
        startDate: newStart.toISOString(),
        endDate: newEnd.toISOString(),
      });

      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                group: group.id,
                start_time: newStart,
                end_time: newEnd,
                itemProps: {
                  style: {
                    ...i.itemProps.style,
                    background: statusColor(newStart, newEnd),
                  },
                },
              }
            : i
        )
      );

      triggerRefresh();
    } catch (err) {
      console.error("Failed to move booking:", err);
    }
  };

  const handleItemResize = async (itemId, time, edge) => {
    try {
      const item = items.find((i) => i.id === itemId);
      const newStart = edge === "left" ? moment(time) : moment(item.start_time);
      const newEnd = edge === "right" ? moment(time) : moment(item.end_time);

      await apiService.updateBooking(itemId, {
        startDate: newStart.toISOString(),
        endDate: newEnd.toISOString(),
      });

      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                start_time: newStart,
                end_time: newEnd,
                itemProps: {
                  style: {
                    ...i.itemProps.style,
                    background: statusColor(newStart, newEnd),
                  },
                },
              }
            : i
        )
      );

      triggerRefresh();
    } catch (err) {
      console.error("Failed to resize booking:", err);
    }
  };

  const filteredItems = showActiveOnly
    ? items.filter((b) => {
        const today = moment().startOf("day");
        return today.isBetween(b.start_time, b.end_time, "day", "[]");
      })
    : items;

  const sortedItems = [...filteredItems].sort((a, b) => {
    const today = moment().startOf("day");
    const aStart = moment(a.checkIn);
    const aEnd = moment(a.checkOut);
    const bStart = moment(b.checkIn);
    const bEnd = moment(b.checkOut);

    const aActive = today.isBetween(aStart, aEnd, "day", "[]");
    const bActive = today.isBetween(bStart, bEnd, "day", "[]");
    const aCheckedOut = today.isAfter(aEnd, "day");
    const bCheckedOut = today.isAfter(bEnd, "day");

    const rank = (active, checkedOut) => (active ? 0 : checkedOut ? 2 : 1);
    return rank(aActive, aCheckedOut) - rank(bActive, bCheckedOut);
  });

  return (
    <div className="p-6 overflow-x-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Front Desk</h2>
        <div className="flex items-center gap-4">
          <label className="flex items-center text-sm text-gray-700">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={() => setShowActiveOnly((prev) => !prev)}
              className="mr-2"
            />
            Show only active bookings
          </label>
          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Create booking
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-4 text-sm flex-wrap">
        <span className="px-2 py-1 rounded-lg bg-yellow-100 text-yellow-700">
          Upcoming
        </span>
        <span className="px-2 py-1 rounded-lg bg-green-100 text-green-700">
          Active
        </span>
        <span className="px-2 py-1 rounded-lg bg-red-100 text-red-700">
          Due Out Today
        </span>
        <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700">
          Checked out
        </span>
      </div>

      <div className="mb-8 max-w-full overflow-x-auto bg-white shadow-lg rounded-lg p-4">
        <Timeline
          groups={groups}
          items={filteredItems}
          defaultTimeStart={moment().startOf("day").subtract(3, "days")}
          defaultTimeEnd={moment().add(1, "month").endOf("month")}
          lineHeight={42}
          itemHeightRatio={0.9}
          canMove
          canResize="both"
          canChangeGroup
          onItemMove={handleItemMove}
          onItemResize={handleItemResize}
          onItemClick={(itemId) => openEdit(itemId)}
        />
      </div>

      <div className="bg-white shadow-md rounded-lg p-4 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">Bookings List</h3>

        {["Active", "Upcoming", "Checked Out"].map((status) => {
          const filteredByStatus = sortedItems.filter((b) => {
            const today = moment().startOf("day");
            const ci = moment(b.checkIn);
            const co = moment(b.checkOut);
            if (status === "Active")
              return today.isBetween(ci, co, "day", "[]");
            if (status === "Upcoming") return today.isBefore(ci, "day");
            if (status === "Checked Out") return today.isAfter(co, "day");
            return false;
          });

          if (filteredByStatus.length === 0) return null;

          const colorClass =
            status === "Active"
              ? "bg-green-100 text-green-800"
              : status === "Upcoming"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-blue-100 text-blue-800";

          return (
            <div key={status} className="mb-6">
              <h4
                className={`text-sm font-semibold px-3 py-2 rounded ${colorClass}`}
              >
                {status} Bookings ({filteredByStatus.length})
              </h4>
              <table className="table-auto border-collapse text-sm w-auto mt-2">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="p-2 border">Guest</th>
                    <th className="p-2 border">Email</th>
                    <th className="p-2 border">Room</th>
                    <th className="p-2 border">Check-In</th>
                    <th className="p-2 border">Check-Out</th>
                    <th className="p-2 border">Stay Status</th>
                    <th className="p-2 border">Payment</th>
                    <th className="p-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredByStatus.map((b) => {
                    const today = moment().startOf("day");
                    const ci = moment(b.checkIn);
                    const co = moment(b.checkOut);
                    const isActive = today.isBetween(ci, co, "day", "[]");
                    const isCheckedOut = today.isAfter(co, "day");

                    return (
                      <tr
                        key={b.id}
                        className={`border-b hover:bg-gray-50 transition ${
                          isCheckedOut ? "opacity-70" : ""
                        }`}
                      >
                        <td className="p-2 border whitespace-nowrap">
                          {b.customerFirstName} {b.customerLastName}
                        </td>
                        <td className="p-2 border whitespace-nowrap">
                          {b.customerEmail}
                        </td>
                        <td className="p-2 border">
                          {b.room && typeof b.room === "object"
                            ? `${b.room.roomNumber || "?"} (${
                                b.room.type || "?"
                              })`
                            : b.room || "—"}
                        </td>
                        <td className="p-2 border whitespace-nowrap">
                          {moment(b.checkIn).format("YYYY-MM-DD")}
                        </td>
                        <td className="p-2 border whitespace-nowrap">
                          {moment(b.checkOut).format("YYYY-MM-DD")}
                        </td>
                        <td className="p-2 border">
                          {isCheckedOut ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              Checked Out
                            </span>
                          ) : isActive ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                              Upcoming
                            </span>
                          )}
                        </td>
                        <td className="p-2 border">{b.paymentType}</td>
                        <td className="p-2 border">
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEdit(b.id)}
                              className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(b.id)}
                              className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        booking={editing}
        groups={groups}
      />
    </div>
  );
}

export default FrontDesk;
