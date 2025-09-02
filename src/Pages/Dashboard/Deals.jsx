import { useState } from "react";

function Deals() {
  const [deals, setDeals] = useState([
    {
      ref: "#5644",
      name: "Family deal",
      reservations: 10,
      endDate: "21/3/23",
      roomType: "VIP",
      discount: "15%",
      status: "Ongoing",
    },
    {
      ref: "#6112",
      name: "Christmas deal",
      reservations: 12,
      endDate: "25/3/23",
      roomType: "Single, Double",
      discount: "10%",
      status: "Full",
    },
    {
      ref: "#6141",
      name: "Family deal",
      reservations: 15,
      endDate: "-",
      roomType: "Triple",
      discount: "20%",
      status: "Inactive",
    },
  ]);

  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    ref: "",
    name: "",
    reservations: "",
    endDate: "",
    roomType: "",
    discount: "",
    status: "Ongoing",
  });

  const filteredDeals =
    filter === "All" ? deals : deals.filter((d) => d.status === filter);

  const handleAddDeal = () => {
    setDeals([...deals, { ...form, reservations: Number(form.reservations) }]);
    setShowModal(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Deals</h2>
      <div className="flex justify-between mb-4">
        <div className="space-x-2">
          <button
            onClick={() => setFilter("Ongoing")}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white"
          >
            Ongoing
          </button>
          <button
            onClick={() => setFilter("Full")}
            className="px-4 py-2 rounded-lg border"
          >
            Finished
          </button>
          <button
            onClick={() => setFilter("All")}
            className="px-4 py-2 rounded-lg border"
          >
            All
          </button>
        </div>
        <div className="space-x-2">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white"
          >
            Add deal
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">New Deal</h3>
            <input
              type="text"
              placeholder="Ref #"
              className="border p-2 w-full mb-2"
              value={form.ref}
              onChange={(e) => setForm({ ...form, ref: e.target.value })}
            />
            <input
              type="text"
              placeholder="Deal name"
              className="border p-2 w-full mb-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              type="number"
              placeholder="Reservations left"
              className="border p-2 w-full mb-2"
              value={form.reservations}
              onChange={(e) =>
                setForm({ ...form, reservations: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="End date"
              className="border p-2 w-full mb-2"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
            <input
              type="text"
              placeholder="Room type"
              className="border p-2 w-full mb-2"
              value={form.roomType}
              onChange={(e) => setForm({ ...form, roomType: e.target.value })}
            />
            <input
              type="text"
              placeholder="Discount"
              className="border p-2 w-full mb-2"
              value={form.discount}
              onChange={(e) => setForm({ ...form, discount: e.target.value })}
            />
            <select
              className="border p-2 w-full mb-2"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option>Ongoing</option>
              <option>Full</option>
              <option>Inactive</option>
              <option>New</option>
            </select>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button
                onClick={handleAddDeal}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Reference #</th>
              <th className="p-3">Deal name</th>
              <th className="p-3">Reservations left</th>
              <th className="p-3">End date</th>
              <th className="p-3">Room type</th>
              <th className="p-3">Discount</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeals.map((d, i) => (
              <tr key={i} className="border-b">
                <td className="p-3">{d.ref}</td>
                <td className="p-3">{d.name}</td>
                <td className="p-3">{d.reservations}</td>
                <td className="p-3">{d.endDate}</td>
                <td className="p-3">{d.roomType}</td>
                <td className="p-3">{d.discount}</td>
                <td className="p-3">{d.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Deals;
