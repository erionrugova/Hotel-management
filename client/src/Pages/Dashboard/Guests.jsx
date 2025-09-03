import { useState } from "react";

function Guests() {
  const [filter, setFilter] = useState("checkin"); // checkin or checkout
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  // Sample guest names
  const guestNames = [
    "Alexander",
    "Almira",
    "Jona",
    "Pegasus",
    "Martin",
    "Cecil",
    "Luke",
    "Kiand",
    "Turen",
    "Yadrin",
    "Sophia",
    "Michael",
    "Olivia",
    "Noah",
    "Emma",
    "Liam",
    "Ava",
  ];

  const statuses = ["Clean", "Dirty", "Pick up", "Inspected"];
  const types = ["checkin", "checkout"];

  // Generate guests dynamically
  const guests = guestNames.map((name, index) => {
    const roomNumber = String(index + 1).padStart(3, "0"); // 001, 002, 003...
    const total = Math.floor(Math.random() * 500) + 100; // between 400–2400
    const paid = Math.floor(total * (Math.random() * 0.8 + 0.2)); // 20–100% paid
    return {
      id: `#${5000 + index}`,
      name,
      room: roomNumber,
      total,
      paid,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      type: types[Math.floor(Math.random() * types.length)],
    };
  });

  const statusColors = {
    Clean: "bg-blue-100 text-blue-600",
    Dirty: "bg-red-100 text-red-600",
    "Pick up": "bg-yellow-100 text-yellow-600",
    Inspected: "bg-green-100 text-green-600",
  };

  // Filtering
  const filteredGuests = guests.filter((g) => {
    const matchesType = g.type === filter;
    const matchesSearch =
      g.room.toLowerCase().includes(search.toLowerCase()) ||
      g.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "All" ? true : g.status === statusFilter;
    return matchesType && matchesSearch && matchesStatus;
  });

  // Pagination
  const guestsPerPage = 5;
  const totalPages = Math.ceil(filteredGuests.length / guestsPerPage);
  const startIndex = (currentPage - 1) * guestsPerPage;
  const paginatedGuests = filteredGuests.slice(
    startIndex,
    startIndex + guestsPerPage
  );

  const changePage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Guests</h2>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          onClick={() => {
            setFilter("checkin");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-lg ${
            filter === "checkin"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          Check in
        </button>
        <button
          onClick={() => {
            setFilter("checkout");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-lg ${
            filter === "checkout"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          Check out
        </button>

        {/* Search + Filter */}
        <div className="ml-auto flex gap-2 items-center">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border rounded-lg px-3 py-2"
          >
            <option value="All">All Status</option>
            <option value="Clean">Clean</option>
            <option value="Dirty">Dirty</option>
            <option value="Pick up">Pick up</option>
            <option value="Inspected">Inspected</option>
          </select>
          <input
            type="text"
            placeholder="Search by room or name"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="border rounded-lg px-3 py-2"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Reservation ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Room Number</th>
              <th className="p-3">Total amount</th>
              <th className="p-3">Amount paid</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedGuests.length > 0 ? (
              paginatedGuests.map((g, i) => (
                <tr key={i} className="border-b">
                  <td className="p-3">{g.id}</td>
                  <td className="p-3">{g.name}</td>
                  <td className="p-3">{g.room}</td>
                  <td className="p-3">${g.total}</td>
                  <td className="p-3">${g.paid}</td>
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 text-sm rounded-full ${
                        statusColors[g.status]
                      }`}
                    >
                      {g.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center p-4 text-gray-500">
                  No guests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg border text-gray-500 disabled:opacity-50"
          >
            Previous
          </button>
          <div className="flex gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => changePage(i + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg border text-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default Guests;
