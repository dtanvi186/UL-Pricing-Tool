import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { PieChart, Pie } from 'recharts';

const WaterfallChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <p>No data available for the chart.</p>;
  }

  // Process data for the waterfall chart
  let cumulative = 0;
  const processedData = data.map(item => {
    const isTotal = item.isTotal || false;
    const value = item.value || 0;
    
    // The starting point of the bar
    const startValue = cumulative;
    
    // Update cumulative value for the next item
    if (!isTotal) {
      cumulative += value;
    }

    return {
      name: item.name,
      // The "base" - an invisible bar that positions the visible bar
      start: isTotal ? 0 : startValue,
      // The visible bar representing the actual value
      value: isTotal ? cumulative : value,
      isTotal: isTotal,
    };
  });

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload.find(p => p.dataKey === 'value');
      if (data) {
        return (
          <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
            <p className="font-medium">{label}</p>
            <p className="text-blue-600">
              Value: <span className="font-bold">{data.value.toFixed(2)} millions </span>
            </p>
          </div>
        );
      }
    }
    return null;
  };

  // Custom tick formatter for X-axis to handle line breaks
  const CustomXAxisTick = ({ x, y, payload }) => {
    const words = payload.value.split(' ');
    const maxWordsPerLine = 1; // Adjust this to control line breaks
    const lines = [];
    
    for (let i = 0; i < words.length; i += maxWordsPerLine) {
      lines.push(words.slice(i, i + maxWordsPerLine).join(' '));
    }

    return (
      <g transform={`translate(${x},${y})`}>
        {lines.map((line, index) => (
          <text
            key={index}
            x={0}
            y={index * 12 + 8}
            dy={0}
            textAnchor="middle"
            fill="#666"
            fontSize="12"
          >
            {line}
          </text>
        ))}
      </g>
    );
  };

  return (
    <div className="w-full overflow-x-auto">
     <div className="w-full">

        <ResponsiveContainer width="100%" height={450}>
          <BarChart 
            data={processedData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              interval={0}
              tick={<CustomXAxisTick />}
              height={80}
            />
            <YAxis />
            <ReferenceLine y={0} stroke="#00000062" strokeWidth={1.5} ifOverflow="visible" />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
            
            <Bar dataKey="start" stackId="a" fill="transparent" />
            <Bar dataKey="value" stackId="a">
              {processedData.map((entry, index) => {
                let color;

                // First bar
                if (index === 0) {
                  color = '#203864'; // custom color for first
                }
                // Last bar
                else if (index === processedData.length - 1) {
                  color = '#FFC000'; // custom color for last
                }
                // Positive value
                else if (entry.value >= 0) {
                  color = '#00B050';
                }
                // Negative value
                else {
                  color = '#CC3300';
                }

                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};



export default WaterfallChart;
