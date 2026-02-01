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
        // Only clear if we don't have existing data
        if (deals.length === 0) {
          setDeals([]);
        }
        return;
      }
      setDeals(data);
    } catch (err) {
      console.error("Failed to fetch deals:", err);
      // Preserve existing deals data on error
      if (deals.length === 0) {
        setDeals([]);
      }
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
    <div className="p-10 min-h-screen bg-slate-950 text-slate-100">
      <h2 className="text-3xl font-semibold mb-8 text-white">Deals</h2>

      <div className="flex justify-between mb-6">
        <div className="space-x-2">
          <button
            onClick={() => setFilter("ONGOING")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "ONGOING" 
                ? "bg-indigo-600 text-white" 
                : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
            }`}
          >
            Ongoing
          </button>
          <button
            onClick={() => setFilter("INACTIVE")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "INACTIVE" 
                ? "bg-yellow-600 text-white" 
                : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
            }`}
          >
            Deactivated
          </button>
          <button
            onClick={() => setFilter("All")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "All" 
                ? "bg-slate-600 text-white" 
                : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
            }`}
          >
            All
          </button>
        </div>

        {(isAdmin() || isManager()) && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-lg shadow-indigo-500/20"
          >
            Add deal
          </button>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-2xl w-96 text-slate-100">
            <h3 className="text-xl font-semibold mb-4 text-white">New Deal</h3>

            <input
              type="text"
              placeholder="Deal name"
              className="bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 w-full mb-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              type="number"
              placeholder="Discount (%)"
              className="bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 w-full mb-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={form.discount}
              onChange={(e) => setForm({ ...form, discount: e.target.value })}
            />

            <input
              type="date"
              className="bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 w-full mb-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />

            <select
              className="bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 w-full mb-3 focus:ring-2 focus:ring-indigo-500 outline-none"
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
              className="bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 w-full mb-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="ONGOING">Ongoing</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <div className="flex justify-end space-x-2 mt-4">
              <button 
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDeal}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {editModal && editForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-2xl w-96 text-slate-100">
            <h3 className="text-xl font-semibold mb-4 text-white">Edit Deal</h3>

            <input
              type="text"
              className="bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 w-full mb-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
            />

            <input
              type="number"
              className="bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 w-full mb-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={editForm.discount}
              onChange={(e) =>
                setEditForm({ ...editForm, discount: e.target.value })
              }
            />

            <input
              type="date"
              className="bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 w-full mb-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={editForm.endDate}
              onChange={(e) =>
                setEditForm({ ...editForm, endDate: e.target.value })
              }
            />

            <select
              className="bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 w-full mb-3 focus:ring-2 focus:ring-indigo-500 outline-none"
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
              className="bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 w-full mb-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={editForm.status}
              onChange={(e) =>
                setEditForm({ ...editForm, status: e.target.value })
              }
            >
              <option value="ONGOING">Ongoing</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <div className="flex justify-end space-x-2 mt-4">
              <button 
                onClick={() => setEditModal(false)}
                className="px-3 py-1.5 text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateDeal(editForm.id, editForm)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 shadow-xl rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-800 text-slate-200">
            <tr>
              <th className="p-4 font-semibold">ID</th>
              <th className="p-4 font-semibold">Name</th>
              <th className="p-4 font-semibold">Discount</th>
              <th className="p-4 font-semibold">End Date</th>
              <th className="p-4 font-semibold">Room Type</th>
              <th className="p-4 font-semibold">Status</th>
              {(isAdmin() || isManager()) && <th className="p-4 font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredDeals.map((d, index) => (
              <tr key={d.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4 text-slate-400">{index + 1}</td>
                <td className="p-4 text-slate-200 font-medium">{d.name}</td>
                <td className="p-4 text-slate-300">{d.discount}%</td>
                <td className="p-4 text-slate-300">
                  {d.endDate ? new Date(d.endDate).toLocaleDateString() : "—"}
                </td>
                <td className="p-4 text-slate-300">{d.roomType}</td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      d.status === "ONGOING"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : d.status === "INACTIVE"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}
                  >
                    {d.status}
                  </span>
                </td>
                {(isAdmin() || isManager()) && (
                  <td className="p-4 space-x-2">
                    <button
                      onClick={() => handleEditClick(d)}
                      className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg text-xs font-medium transition-colors border border-indigo-500/20"
                    >
                      Edit
                    </button>

                    {d.status === "ONGOING" ? (
                      <button
                        onClick={() =>
                          handleUpdateDeal(d.id, { status: "INACTIVE" })
                        }
                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-xs font-medium transition-colors border border-amber-500/20"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          handleUpdateDeal(d.id, { status: "ONGOING" })
                        }
                        className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium transition-colors border border-emerald-500/20"
                      >
                        Reactivate
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteDeal(d.id)}
                      className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-colors border border-red-500/20"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {filteredDeals.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center p-8 text-slate-500">
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
