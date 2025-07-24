import React from "react";

const ExpenseSummaryTab = ({ extractionResults }) => {
  const { expensesData } = extractionResults || {};

  if (!expensesData || !expensesData.activeNop) {
    return <p>No summary data available.</p>;
  }

  const targetYears = ['2025', '2026', '2027', '2028', '2029'];
  const projectionYears = expensesData.activeNop[0]?.length || 0;
  const baseYear = 2025;
  const financialYears = Array.from({ length: projectionYears }, (_, i) => baseYear + i);

  const metrics = [
    { key: "activeNop", label: "Active NOP" },
    { key: "maintenanceExpenses", label: "Maintenance Expense" },
    { key: "vendorFixedFee", label: "Vendor Fixed Fee" },
    { key: "noPolsIfsm", label: "No Pols IFSM" },
    { key: "maintExpPerPolicy", label: "Maintenance Exp / Policy" },
    { key: "vffPerPolicy", label: "Vendor Fee / Policy" },
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-6">Summary Expenses by Target Year</h2>

      {metrics.map(({ key, label }) => (
        <div key={key} className="mb-10">
          <h3 className="text-lg font-semibold mb-2">{label}</h3>
          <div className="overflow-auto">
            <table className="min-w-full table-auto border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1">Financial Year</th>
                  {targetYears.map(year => (
                    <th key={year} className="border px-2 py-1 text-right">{year}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {financialYears.map((finYear, i) => (
                  <tr key={finYear}>
                    <td className="border px-2 py-1">{finYear}</td>
                    {targetYears.map((_, j) => {
                      const value = expensesData[key]?.[j]?.[i] ?? 0;
                      return (
                        <td key={`${j}-${i}`} className="border px-2 py-1 text-right">
                          {value.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExpenseSummaryTab;
