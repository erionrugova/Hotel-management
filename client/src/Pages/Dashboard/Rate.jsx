import { useEffect, useState } from "react";
import apiService from "../../services/api";
import { useUser } from "../../UserContext";

function Rate() {
  const [rates, setRates] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    roomId: "",
    policy: "",
    rate: "",
    dealId: "",
  });

  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const { isAdmin, isManager } = useUser();

  useEffect(() => {
    fetchRates();
    fetchRooms();
    fetchDeals();
  }, []);

  // Helper function to filter and sort rates: one per room type, ordered Single → Double → Deluxe → Suite
  const filterAndSortRates = (ratesData) => {
    // Group rates by room type and keep only one per type (first one found)
    const ratesByType = new Map();
    ratesData.forEach((rate) => {
      const roomType = rate.room?.type || "";
      if (roomType && !ratesByType.has(roomType)) {
        ratesByType.set(roomType, rate);
      }
    });

    // Convert map to array and sort: Single, Double, Deluxe, Suite, then alphabetically
    const typeOrder = ["SINGLE", "DOUBLE", "DELUXE", "SUITE"];
    return Array.from(ratesByType.values()).sort((a, b) => {
      const typeA = a.room?.type || "";
      const typeB = b.room?.type || "";
      
      const indexA = typeOrder.indexOf(typeA);
      const indexB = typeOrder.indexOf(typeB);
      
      // If both are in the predefined order, sort by their index
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only A is in predefined order, it comes first
      if (indexA !== -1) return -1;
      // If only B is in predefined order, it comes first
      if (indexB !== -1) return 1;
      // If neither is in predefined order, sort alphabetically
      return typeA.localeCompare(typeB);
    });
  };

  const fetchRates = async () => {
    try {
      const data = await apiService.getRates();
      const filteredAndSorted = filterAndSortRates(data);
      setRates(filteredAndSorted);
    } catch (err) {
      console.error("Failed to fetch rates:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const data = await apiService.getRooms();
      
      // Group rooms by type and keep only one room per type (for rate creation)
      const roomsByType = new Map();
      data.forEach((room) => {
        if (!roomsByType.has(room.type)) {
          roomsByType.set(room.type, room);
        }
      });

      // Sort: Single, Double, Deluxe, Suite, then alphabetically
      const typeOrder = ["SINGLE", "DOUBLE", "DELUXE", "SUITE"];
      const sorted = Array.from(roomsByType.values()).sort((a, b) => {
        const indexA = typeOrder.indexOf(a.type);
        const indexB = typeOrder.indexOf(b.type);
        
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.type.localeCompare(b.type);
      });
      
      setRooms(sorted);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    }
  };

  const fetchDeals = async () => {
    try {
      const data = await apiService.getDeals();
      if (!Array.isArray(data)) {
        console.warn("⚠️ Deals response invalid:", data);
        setDeals([]);
        return;
      }
      setDeals(data.filter((d) => d.status === "ONGOING"));
    } catch (err) {
      console.error("Failed to fetch deals:", err);
    }
  };

  const handleAddRate = async () => {
    try {
      if (!form.roomId || !form.policy || !form.rate) {
        alert("Room, Policy, and Rate are required.");
        return;
      }

      const saved = await apiService.createRate({
        roomId: parseInt(form.roomId, 10),
        policy: form.policy.toUpperCase(),
        rate: parseFloat(form.rate),
        dealId: form.dealId ? parseInt(form.dealId, 10) : null,
      });

      // Refetch rates to ensure we have the room data and apply filtering
      const allRates = await apiService.getRates();
      const filteredAndSorted = filterAndSortRates(allRates);
      setRates(filteredAndSorted);
      
      setShowModal(false);
      setForm({ roomId: "", policy: "", rate: "", dealId: "" });
    } catch (err) {
      console.error("Failed to create rate:", err);
      alert(err.message);
    }
  };
  const handleEditClick = (rate) => {
    setEditForm({
      id: rate.id,
      roomId: rate.roomId,
      policy: rate.policy,
      rate: rate.rate,
      dealId: rate.dealId || "",
    });
    setEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      const updated = await apiService.updateRate(editForm.id, {
        roomId: parseInt(editForm.roomId, 10),
        policy: editForm.policy.toUpperCase(),
        rate: parseFloat(editForm.rate),
        dealId: editForm.dealId ? parseInt(editForm.dealId, 10) : null,
      });

      // Refetch rates to ensure we have the room data and apply filtering
      const allRates = await apiService.getRates();
      const filteredAndSorted = filterAndSortRates(allRates);
      setRates(filteredAndSorted);
      
      setEditModal(false);
      setEditForm(null);
    } catch (err) {
      console.error("Failed to update rate:", err);
    }
  };

  const handleDeleteRate = async (id) => {
    try {
      await apiService.deleteRate(id);
      // Refetch rates to ensure proper filtering after deletion
      const allRates = await apiService.getRates();
      const filteredAndSorted = filterAndSortRates(allRates);
      setRates(filteredAndSorted);
    } catch (err) {
      console.error("Failed to delete rate:", err);
    }
  };

  if (loading) return (
    <div className="p-10 min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-lg animate-pulse text-indigo-400 font-medium">Loading rates...</div>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-10 min-h-screen bg-slate-950 text-slate-100">
      <h2 className="text-2xl sm:text-3xl font-semibold mb-6 sm:mb-8 text-white">Rates Management</h2>

      <div className="flex justify-end mb-6 space-x-2">
        {(isAdmin() || isManager()) && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-lg shadow-indigo-500/20 font-medium"
          >
            + Add Rate
          </button>
        )}
      </div>

      <div className="bg-slate-900 shadow-xl rounded-xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-slate-800 text-slate-200">
              <tr>
                <th className="p-4 font-semibold">#</th>
                <th className="p-4 font-semibold">Room</th>
                <th className="p-4 font-semibold">Policy</th>
                <th className="p-4 font-semibold">Rate</th>
                <th className="p-4 font-semibold">Deal</th>
                <th className="p-4 font-semibold">Deal Price</th>
                {(isAdmin() || isManager()) && <th className="p-4 font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rates.map((r, index) => (
                <tr key={r.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 sm:p-4 text-slate-400 text-xs sm:text-sm">{index + 1}</td>
                  <td className="p-3 sm:p-4 text-xs sm:text-sm">
                    {r.room ? (
                      <span className="font-medium text-slate-200">
                        {r.room.type}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">Room not linked</span>
                    )}
                  </td>
                  <td className="p-3 sm:p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      r.policy === 'FLEXIBLE' ? 'bg-green-500/10 text-green-400' :
                      r.policy === 'STRICT' ? 'bg-orange-500/10 text-orange-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {r.policy}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 font-medium text-slate-200 text-xs sm:text-sm">${r.rate}</td>
                  <td className="p-3 sm:p-4 text-xs sm:text-sm">
                    {r.deal ? (
                      <span className="bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded text-xs">
                        {r.deal.name} ({r.deal.discount}%)
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="p-3 sm:p-4 font-medium text-green-400 text-xs sm:text-sm">
                    {r.dealPrice ? `$${r.dealPrice}` : <span className="text-slate-600">—</span>}
                  </td>
                  {(isAdmin() || isManager()) && (
                    <td className="p-3 sm:p-4">
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        <button
                          onClick={() => handleEditClick(r)}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-lg text-xs transition-colors border border-amber-500/20"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => handleDeleteRate(r.id)}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition-colors border border-red-500/20"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {rates.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center p-8 text-slate-500">
                    No rates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
          <div className="bg-slate-900 p-4 sm:p-8 rounded-xl shadow-2xl w-full max-w-md space-y-4 sm:space-y-6 border border-slate-800">
            <h3 className="text-xl font-semibold text-white">Add Rate</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Room Type</label>
                <select
                  value={form.roomId}
                  onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="">Select Room Type</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Policy</label>
                <select
                  value={form.policy}
                  onChange={(e) => setForm({ ...form, policy: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="">Select Policy</option>
                  <option value="FLEXIBLE">Flexible</option>
                  <option value="STRICT">Strict</option>
                  <option value="NON_REFUNDABLE">Non-Refundable</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Rate ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={form.rate}
                  onChange={(e) => setForm({ ...form, rate: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Deal (Optional)</label>
                <select
                  value={form.dealId}
                  onChange={(e) => setForm({ ...form, dealId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="">No Deal</option>
                  {deals
                    .filter((deal) => {
                      const selectedRoom = rooms.find(
                        (r) => r.id === parseInt(form.roomId, 10)
                      );
                      return (
                        deal.roomType === "ALL" ||
                        (selectedRoom && deal.roomType === selectedRoom.type)
                      );
                    })
                    .map((deal) => (
                      <option key={deal.id} value={deal.id}>
                        {deal.name} ({deal.discount}%)
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors border border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRate}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-lg shadow-indigo-500/20 font-medium"
              >
                Save Rate
              </button>
            </div>
          </div>
        </div>
      )}

      {editModal && editForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
          <div className="bg-slate-900 p-4 sm:p-8 rounded-xl shadow-2xl w-full max-w-md space-y-4 sm:space-y-6 border border-slate-800 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white">Edit Rate</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Room Type</label>
                <select
                  value={editForm.roomId}
                  onChange={(e) =>
                    setEditForm({ ...editForm, roomId: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="">Select Room Type</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Policy</label>
                <select
                  value={editForm.policy}
                  onChange={(e) =>
                    setEditForm({ ...editForm, policy: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="FLEXIBLE">Flexible</option>
                  <option value="STRICT">Strict</option>
                  <option value="NON_REFUNDABLE">Non-Refundable</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Rate ($)</label>
                <input
                  type="number"
                  placeholder="Rate"
                  value={editForm.rate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, rate: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Deal (Optional)</label>
                <select
                  value={editForm.dealId || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, dealId: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="">No Deal</option>
                  {deals
                    .filter((deal) => {
                      const selectedRoom = rooms.find(
                        (r) => r.id === parseInt(editForm.roomId, 10)
                      );
                      return (
                        deal.roomType === "ALL" ||
                        (selectedRoom && deal.roomType === selectedRoom.type)
                      );
                    })
                    .map((deal) => (
                      <option key={deal.id} value={deal.id}>
                        {deal.name} ({deal.discount}%)
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEditModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors border border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-lg shadow-amber-500/20 font-medium"
              >
                Update Rate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Rate;
