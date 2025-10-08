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

  const fetchRates = async () => {
    try {
      const data = await apiService.getRates();

      const order = { SINGLE: 1, DOUBLE: 2, DELUXE: 3, SUITE: 4 };
      const sorted = [...data].sort(
        (a, b) => order[a.room?.type] - order[b.room?.type]
      );

      setRates(sorted);
    } catch (err) {
      console.error("Failed to fetch rates:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const data = await apiService.getRooms();
      const order = { SINGLE: 1, DOUBLE: 2, DELUXE: 3, SUITE: 4 };
      const sorted = [...data].sort((a, b) => order[a.type] - order[b.type]);
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

      setRates((prev) => [saved, ...prev]);
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

      setRates((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setEditModal(false);
      setEditForm(null);
    } catch (err) {
      console.error("Failed to update rate:", err);
    }
  };

  const handleDeleteRate = async (id) => {
    try {
      await apiService.deleteRate(id);
      setRates((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to delete rate:", err);
    }
  };

  if (loading) return <div className="p-6">Loading rates...</div>;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Rates</h2>

      <div className="flex justify-end mb-4 space-x-2">
        {(isAdmin() || isManager()) && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white"
          >
            Add rate
          </button>
        )}
      </div>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Room</th>
              <th className="p-3">Policy</th>
              <th className="p-3">Rate</th>
              <th className="p-3">Deal</th>
              <th className="p-3">Deal Price</th>
              {(isAdmin() || isManager()) && <th className="p-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rates.map((r, index) => (
              <tr key={r.id} className="border-b">
                <td className="p-3">{index + 1}</td>
                <td className="p-3">
                  {r.room
                    ? `#${r.room.roomNumber} (${r.room.type})`
                    : "Room not linked"}
                </td>
                <td className="p-3">{r.policy}</td>
                <td className="p-3">${r.rate}</td>
                <td className="p-3">
                  {r.deal ? `${r.deal.name} (${r.deal.discount}%)` : "—"}
                </td>
                <td className="p-3">{r.dealPrice ? `$${r.dealPrice}` : "—"}</td>
                {(isAdmin() || isManager()) && (
                  <td className="p-3 space-x-2">
                    <button
                      onClick={() => handleEditClick(r)}
                      className="px-2 py-1 bg-yellow-500 text-white rounded text-xs"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => handleDeleteRate(r.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {rates.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center p-4 text-gray-500">
                  No rates found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded shadow-lg w-96 space-y-4">
            <h3 className="text-lg font-semibold">Add Rate</h3>

            <select
              value={form.roomId}
              onChange={(e) => setForm({ ...form, roomId: e.target.value })}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="">Select Room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  #{room.roomNumber} ({room.type})
                </option>
              ))}
            </select>

            <select
              value={form.policy}
              onChange={(e) => setForm({ ...form, policy: e.target.value })}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="">Select Policy</option>
              <option value="FLEXIBLE">Flexible</option>
              <option value="STRICT">Strict</option>
              <option value="NON_REFUNDABLE">Non-Refundable</option>
            </select>

            <input
              type="number"
              placeholder="Rate"
              value={form.rate}
              onChange={(e) => setForm({ ...form, rate: e.target.value })}
              className="w-full border px-3 py-2 rounded"
            />

            <select
              value={form.dealId}
              onChange={(e) => setForm({ ...form, dealId: e.target.value })}
              className="w-full border px-3 py-2 rounded"
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

            <div className="flex justify-end gap-2">
              <button
                onClick={handleAddRate}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {editModal && editForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded shadow-lg w-96 space-y-4">
            <h3 className="text-lg font-semibold">Edit Rate</h3>

            <select
              value={editForm.roomId}
              onChange={(e) =>
                setEditForm({ ...editForm, roomId: e.target.value })
              }
              className="w-full border px-3 py-2 rounded"
            >
              <option value="">Select Room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  #{room.roomNumber} ({room.type})
                </option>
              ))}
            </select>

            <select
              value={editForm.policy}
              onChange={(e) =>
                setEditForm({ ...editForm, policy: e.target.value })
              }
              className="w-full border px-3 py-2 rounded"
            >
              <option value="FLEXIBLE">Flexible</option>
              <option value="STRICT">Strict</option>
              <option value="NON_REFUNDABLE">Non-Refundable</option>
            </select>

            <input
              type="number"
              placeholder="Rate"
              value={editForm.rate}
              onChange={(e) =>
                setEditForm({ ...editForm, rate: e.target.value })
              }
              className="w-full border px-3 py-2 rounded"
            />

            <select
              value={editForm.dealId || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, dealId: e.target.value })
              }
              className="w-full border px-3 py-2 rounded"
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

            <div className="flex justify-end gap-2">
              <button
                onClick={handleSaveEdit}
                className="bg-yellow-500 text-white px-4 py-2 rounded"
              >
                Update
              </button>
              <button
                onClick={() => setEditModal(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Rate;
