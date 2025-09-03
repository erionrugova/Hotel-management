function Rate() {
  const rates = [
    {
      type: "Single",
      deals: "Family deal",
      policy: "Strict",
      dealPrice: "$800",
      rate: "$800",
      availability: "5 rooms",
    },
    {
      type: "Double",
      deals: "Christmas deal",
      policy: "Strict",
      dealPrice: "$1200",
      rate: "$1200",
      availability: "Full",
    },
    {
      type: "Triple",
      deals: "Family deal",
      policy: "Flexible",
      dealPrice: "$2000",
      rate: "$2000",
      availability: "12 rooms",
    },
    {
      type: "VIP",
      deals: "Black Friday",
      policy: "Non refundable",
      dealPrice: "$4000",
      rate: "$4000",
      availability: "10 rooms",
    },
  ];

  const availabilityColors = {
    Full: "text-red-600 bg-red-100",
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Rate</h2>
      <div className="flex justify-end mb-4 space-x-2">
        <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">
          Add rate
        </button>
        <button className="px-4 py-2 rounded-lg border">Filter</button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Room type</th>
              <th className="p-3">Deals</th>
              <th className="p-3">Cancellation policy</th>
              <th className="p-3">Deal price</th>
              <th className="p-3">Rate</th>
              <th className="p-3">Availability</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((r, i) => (
              <tr key={i} className="border-b">
                <td className="p-3">{r.type}</td>
                <td className="p-3">{r.deals}</td>
                <td className="p-3">{r.policy}</td>
                <td className="p-3">{r.dealPrice}</td>
                <td className="p-3">{r.rate}</td>
                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded-lg text-sm ${
                      availabilityColors[r.availability] || "text-gray-700"
                    }`}
                  >
                    {r.availability}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Rate;
