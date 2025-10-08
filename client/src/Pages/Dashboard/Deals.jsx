import { useState, useEffect } from "react";
import apiService from "../../services/api";
import { useUser } from "../../UserContext";

function Deals() {
  const [deals, setDeals] = useState([]);
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    discount: "",
    status: "ONGOING",
    endDate: "",
    roomType: "",
  });

  const [editForm, setEditForm] = useState(null);

  const { isAdmin, isManager } = useUser();

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const data = await apiService.getDeals();
      if (!Array.isArray(data)) {
        console.warn("⚠️ Deals response invalid:", data);
        setDeals([]);
        return;
      }
      setDeals(data);
    } catch (err) {
      console.error("Failed to fetch deals:", err);
    }
  };

  const handleAddDeal = async () => {
    try {
      const saved = await apiService.createDeal(form);
      setDeals((prev) => [saved, ...prev]);
      setShowModal(false);
      setForm({
        name: "",
        discount: "",
        status: "ONGOING",
        endDate: "",
        roomType: "",
      });
    } catch (err) {
      console.error("Failed to create deal:", err);
      alert(err.message);
    }
  };

  const handleEditClick = (deal) => {
    setEditForm({ ...deal, endDate: deal.endDate?.slice(0, 10) || "" });
    setEditModal(true);
  };

  const handleUpdateDeal = async (id, updates) => {
    try {
      const updated = await apiService.updateDeal(id, updates);
      setDeals((prev) => prev.map((d) => (d.id === id ? updated : d)));
      setEditModal(false);
      setEditForm(null);
    } catch (err) {
      console.error("Failed to update deal:", err);
    }
  };

  const handleDeleteDeal = async (id) => {
    try {
      await apiService.deleteDeal(id);
      setDeals((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("Failed to delete deal:", err);
    }
  };

  const filteredDeals =
    filter === "All" ? deals : deals.filter((d) => d.status === filter);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Deals</h2>

      <div className="flex justify-between mb-4">
        <div className="space-x-2">
          <button
            onClick={() => setFilter("ONGOING")}
            className={`px-4 py-2 rounded-lg ${
              filter === "ONGOING" ? "bg-blue-600 text-white" : "border"
            }`}
          >
            Ongoing
          </button>
          <button
            onClick={() => setFilter("INACTIVE")}
            className={`px-4 py-2 rounded-lg ${
              filter === "INACTIVE" ? "bg-yellow-500 text-white" : "border"
            }`}
          >
            Deactivated
          </button>
          <button
            onClick={() => setFilter("All")}
            className={`px-4 py-2 rounded-lg ${
              filter === "All" ? "bg-gray-600 text-white" : "border"
            }`}
          >
            All
          </button>
        </div>

        {(isAdmin() || isManager()) && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white"
          >
            Add deal
          </button>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">New Deal</h3>

            <input
              type="text"
              placeholder="Deal name"
              className="border p-2 w-full mb-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              type="number"
              placeholder="Discount (%)"
              className="border p-2 w-full mb-2"
              value={form.discount}
              onChange={(e) => setForm({ ...form, discount: e.target.value })}
            />

            <input
              type="date"
              className="border p-2 w-full mb-2"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />

            <select
              className="border p-2 w-full mb-2"
              value={form.roomType}
              onChange={(e) => setForm({ ...form, roomType: e.target.value })}
            >
              <option value="">Select Room Type</option>
              <option value="SINGLE">SINGLE</option>
              <option value="DOUBLE">DOUBLE</option>
              <option value="SUITE">SUITE</option>
              <option value="DELUXE">DELUXE</option>
              <option value="ALL">ALL</option>
            </select>

            <select
              className="border p-2 w-full mb-2"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="ONGOING">Ongoing</option>
              <option value="INACTIVE">Inactive</option>
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

      {editModal && editForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Edit Deal</h3>

            <input
              type="text"
              className="border p-2 w-full mb-2"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
            />

            <input
              type="number"
              className="border p-2 w-full mb-2"
              value={editForm.discount}
              onChange={(e) =>
                setEditForm({ ...editForm, discount: e.target.value })
              }
            />

            <input
              type="date"
              className="border p-2 w-full mb-2"
              value={editForm.endDate}
              onChange={(e) =>
                setEditForm({ ...editForm, endDate: e.target.value })
              }
            />

            <select
              className="border p-2 w-full mb-2"
              value={editForm.roomType}
              onChange={(e) =>
                setEditForm({ ...editForm, roomType: e.target.value })
              }
            >
              <option value="SINGLE">SINGLE</option>
              <option value="DOUBLE">DOUBLE</option>
              <option value="SUITE">SUITE</option>
              <option value="DELUXE">DELUXE</option>
              <option value="ALL">ALL</option>
            </select>

            <select
              className="border p-2 w-full mb-2"
              value={editForm.status}
              onChange={(e) =>
                setEditForm({ ...editForm, status: e.target.value })
              }
            >
              <option value="ONGOING">Ongoing</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <div className="flex justify-end space-x-2">
              <button onClick={() => setEditModal(false)}>Cancel</button>
              <button
                onClick={() => handleUpdateDeal(editForm.id, editForm)}
                className="px-3 py-1 bg-yellow-600 text-white rounded"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Discount</th>
              <th className="p-3">End Date</th>
              <th className="p-3">Room Type</th>
              <th className="p-3">Status</th>
              {(isAdmin() || isManager()) && <th className="p-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredDeals.map((d, index) => (
              <tr key={d.id} className="border-b">
                <td className="p-3">{index + 1}</td>
                <td className="p-3">{d.name}</td>
                <td className="p-3">{d.discount}%</td>
                <td className="p-3">
                  {d.endDate ? new Date(d.endDate).toLocaleDateString() : "—"}
                </td>
                <td className="p-3">{d.roomType}</td>
                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded-lg text-sm ${
                      d.status === "ONGOING"
                        ? "bg-green-100 text-green-700"
                        : d.status === "INACTIVE"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {d.status}
                  </span>
                </td>
                {(isAdmin() || isManager()) && (
                  <td className="p-3 space-x-2">
                    <button
                      onClick={() => handleEditClick(d)}
                      className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                    >
                      Edit
                    </button>

                    {d.status === "ONGOING" ? (
                      <button
                        onClick={() =>
                          handleUpdateDeal(d.id, { status: "INACTIVE" })
                        }
                        className="px-2 py-1 bg-yellow-500 text-white rounded text-xs"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          handleUpdateDeal(d.id, { status: "ONGOING" })
                        }
                        className="px-2 py-1 bg-green-500 text-white rounded text-xs"
                      >
                        Reactivate
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteDeal(d.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {filteredDeals.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center p-4 text-gray-500">
                  No deals found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Deals;
