import React, { useState } from 'react';

// InputAssumptions.jsx
const InputAssumptions = ({ 
  mortalityData, 
  handleMortalityDataChange,
  handleMortalityFileUpload,
  downloadMortalityTemplate
}) => {
  const [displayedAge, setDisplayedAge] = useState({ start: 0, end: 20 });
  
  const handleAgeRangeChange = (e) => {
    const { name, value } = e.target;
    setDisplayedAge(prev => ({
      ...prev,
      [name]: parseInt(value, 10) || 0
    }));
  };
  
  // Generate age range for display (with pagination controls)
  const generateAgeRange = () => {
    const ages = [];
    const start = Math.max(0, displayedAge.start);
    const end = Math.min(120, displayedAge.end);
    
    for (let age = start; age <= end; age++) {
      ages.push(age);
    }
    
    return ages;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Mortality Assumptions</h2>
      <p className="text-gray-600 mb-4">Enter the mortality rates for each age and gender or upload a CSV file. Values update automatically.</p>
      
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex-grow">
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload Mortality Rate CSV</label>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={(e) => handleMortalityFileUpload(e)}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>
        <div>
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              downloadMortalityTemplate();
            }}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <span className="mr-1">Download Template</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
        </div>
      </div>
      
      {/* Age range selector with horizontally aligned buttons */}
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Age Range</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="start"
              value={displayedAge.start}
              onChange={handleAgeRangeChange}
              className="w-20 p-1 border rounded"
              min="0"
              max="120"
            />
            <span>to</span>
            <input
              type="number"
              name="end"
              value={displayedAge.end}
              onChange={handleAgeRangeChange}
              className="w-20 p-1 border rounded"
              min="0"
              max="120"
            />
          </div>
        </div>
        
        <button
          onClick={() => setDisplayedAge({ start: 0, end: 20 })}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          Reset
        </button>
        
        <button
          onClick={() => setDisplayedAge(prev => ({ 
            start: Math.max(0, prev.start - 20), 
            end: Math.max(20, prev.end - 20) 
          }))}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          disabled={displayedAge.start <= 0}
        >
          Previous
        </button>
        
        <button
          onClick={() => setDisplayedAge(prev => ({ 
            start: prev.start + 20, 
            end: Math.min(120, prev.end + 20) 
          }))}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          disabled={displayedAge.end >= 120}
        >
          Next
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Age</th>
              <th className="py-3 px-4 text-center font-semibold text-gray-700 border">Sex</th>
              <th className="py-3 px-4 text-center font-semibold text-gray-700 border">Mortality Rate</th>
            </tr>
          </thead>
          <tbody>
            {generateAgeRange().map(age => (
              <React.Fragment key={`age-${age}`}>
                {/* Male row */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border" rowSpan={2}>{age}</td>
                  <td className="py-2 px-4 border text-center">Male</td>
                  <td className="py-2 px-4 border">
                    <input
                      type="number"
                      value={mortalityData?.[age]?.[0] || ''}
                      onChange={(e) => handleMortalityDataChange(age, 0, e.target.value)}
                      className="w-full p-1 border rounded"
                      step="0.00000001"
                      min="0"
                      max="1"
                    />
                  </td>
                </tr>
                {/* Female row */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border text-center">Female</td>
                  <td className="py-2 px-4 border">
                    <input
                      type="number"
                      value={mortalityData?.[age]?.[1] || ''}
                      onChange={(e) => handleMortalityDataChange(age, 1, e.target.value)}
                      className="w-full p-1 border rounded"
                      step="0.00000001"
                      min="0"
                      max="1"
                    />
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InputAssumptions;