import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList, ResponsiveContainer, Cell } from 'recharts';
import { PieChart, Pie } from 'recharts';

const renderCustomizedLabel = ({ percent }) => {
  // This calculates the percentage and adds a "%" sign
  return `${(percent * 100).toFixed(0)}%`;
};




const CustomPieChart = ({ data, colors = [] }) => {
  if (!data || data.length === 0) return <p>No pie data available.</p>;
  colors.length = data.length

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
             // 2. Use the custom function for the label prop
            label={renderCustomizedLabel}
            // Optional: removes the line connecting the label to the slice
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
        <Tooltip
          formatter={(value) =>
            Number(value).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })
          }
        />

          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomPieChart;
