import React, { useState, useEffect } from 'react';

const ModelPointInputs = ({ formData, handleModelPointChange }) => {
  const [modelPoints, setModelPoints] = useState([]);
  const [error, setError] = useState('');
  const [nextId, setNextId] = useState(1); // Start from 1
  const MAX_ROWS = 10;
  
  // Initialize with one row on first render
  useEffect(() => {
    if (formData.modelPointInputs && formData.modelPointInputs.length > 0) {
      // Existing model points exist - keep them but make sure IDs are sequential from 1
      const remappedPoints = formData.modelPointInputs.map((point, index) => ({
        ...point,
        SPCODE: `SP${index + 1}` // Remap SPCODEs to be sequential starting from 1
      }));
      
      setModelPoints(remappedPoints);
      setNextId(remappedPoints.length + 1); // Set next ID to be one more than the length
      handleModelPointChange(remappedPoints); // Update parent with remapped IDs
    } else {
      // No existing model points - create first two rows with default values
      const initialPoints = [
       /* {
          SPCODE: 'SP1',
          'Age at entry': 30,
          'Premium Payment Term': 1,
          'Policy Term (in years)': 20,
          'Annual Premium': 30000,
          'Sum Assured': 33000,
          'Death Benefit': 'Maximum of Sum Assured and Fund Value',
          'Weightage': 1
        } */
        {
          SPCODE: 'SP2',
          'Age at entry': 30,
          'Premium Payment Term': 1,
          'Policy Term (in years)': 20,
          'Annual Premium': 30000,
          'Sum Assured': 33000,
          'Death Benefit': 'Sum Assured + Fund Value',
          'Weightage': 1
        } 
      ];
      
      setModelPoints(initialPoints);
      setNextId(3); // Next ID will be 3
      handleModelPointChange(initialPoints);
    }
  }, []);
  
  // Validate weights whenever model points change
  useEffect(() => {
    validateWeights();
  }, [modelPoints]);
  
  // Add a new row to the model points
  const addNewRow = () => {
    if (modelPoints.length >= MAX_ROWS) {
      setError(`Maximum of ${MAX_ROWS} model points allowed`);
      return;
    }
    
    const newModelPoint = {
      SPCODE: `SP${nextId}`,
      'Age at entry': 30,
      'Premium Payment Term': 1,
      'Policy Term (in years)': 20,
      'Annual Premium': 30000,
      'Sum Assured': 33000,
      'Death Benefit': 'Maximum of Sum Assured and Fund Value',
      'Weightage': 0
    };
    
    const updatedModelPoints = [...modelPoints, newModelPoint];
    setModelPoints(updatedModelPoints);
    handleModelPointChange(updatedModelPoints);
    setNextId(nextId + 1); // Increment for next row
  };
  
  // Delete a row from the model points
  const deleteRow = (index) => {
    if (modelPoints.length <= 1) {
      setError('At least one model point is required');
      return;
    }
    
    // Remove the row
    const updatedModelPoints = [...modelPoints];
    updatedModelPoints.splice(index, 1);
    
    // Now reassign SPCODEs to maintain sequential numbering
    const remappedPoints = updatedModelPoints.map((point, i) => ({
      ...point,
      SPCODE: `SP${i + 1}`
    }));
    
    setModelPoints(remappedPoints);
    handleModelPointChange(remappedPoints);
    setNextId(remappedPoints.length + 1); // Reset next ID based on current length
  };
  
  // Handle changes to a model point field
  const handleRowChange = (index, field, value) => {
    const updatedModelPoints = [...modelPoints];
    
    // Apply validations based on field
    if (field === 'Policy Term (in years)' && value > 20) {
      setError('Policy term cannot be greater than 20 years');
      return;
    }
    
    if (field === 'Weightage' && (value < 0 || value > 1)) {
      setError('Weightage must be between 0 and 1');
      return;
    }
    
    // Update the field
    updatedModelPoints[index][field] = value;
    setModelPoints(updatedModelPoints);
    handleModelPointChange(updatedModelPoints);
    setError(''); // Clear error if successful
  };
  
  // Validate that weights sum to 1
  const validateWeights = () => {
    if (modelPoints.length === 0) return;
    
    const sum = modelPoints.reduce((total, point) => total + parseFloat(point['Weightage'] || 0), 0);
    
    // Allow for small floating point errors (sum should be close to 1)
    if (Math.abs(sum - 1) > 0.0001) {
      setError('The sum of Weightage must equal 1');
    } else {
      setError('');
    }
  };
  // #235371ff
  // #013c61ff
  // #f9f9f9ff
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Model Point Inputs</h2>
      <p className="text-gray-600 mb-4">Enter model point data for the projection. Maximum of {MAX_ROWS} model points allowed.</p>
      
      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {/* Add row button */}
      <div className="mb-4">
        <button
          onClick={addNewRow}
          disabled={modelPoints.length >= MAX_ROWS}
          className={`px-4 py-2 rounded ${
            modelPoints.length >= MAX_ROWS
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-[#235371ff] text-white hover:bg-[#013c61ff]'
          }`}
        >
          Add Model Point
        </button>
        <span className="ml-4 text-gray-500">
          {modelPoints.length} of {MAX_ROWS} model points used
        </span>
      </div>
      
      {/* Model points table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Sr No</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Age at entry</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Premium Payment Term</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Policy Term (in years)</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Annual Premium</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Sum Assured</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Death Benefit</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Weightage</th>
              <th className="py-3 px-4 text-center font-semibold text-gray-700 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {modelPoints.map((point, index) => (
              <tr key={point.SPCODE} className="hover:bg-gray-50">
                {/* Sr No (Read-only) */}
                <td className="py-2 px-4 border text-gray-500">
                  {index + 1}
                </td>
                
                {/* Age at entry */}
                <td className="py-2 px-4 border">
                  <input
                    type="number"
                    value={point['Age at entry']}
                    onChange={(e) => handleRowChange(index, 'Age at entry', parseInt(e.target.value, 10) || 0)}
                    className="w-full p-1 border rounded"
                    min="0"
                    max="100"
                  />
                </td>
                
                {/* Premium Payment Term */}
                <td className="py-2 px-4 border">
                  <input
                    type="number"
                    value={point['Premium Payment Term']}
                    onChange={(e) => handleRowChange(index, 'Premium Payment Term', parseInt(e.target.value, 10) || 0)}
                    className="w-full p-1 border rounded"
                    min="1"
                  />
                </td>
                
                {/* Policy Term (in years) */}
                <td className="py-2 px-4 border">
                  <input
                    type="number"
                    value={point['Policy Term (in years)']}
                    onChange={(e) => handleRowChange(index, 'Policy Term (in years)', parseInt(e.target.value, 10) || 0)}
                    className="w-full p-1 border rounded"
                    min="1"
                    max="20"
                  />
                </td>
                
                {/* Annual Premium */}
                <td className="py-2 px-4 border">
                  <input
                    type="number"
                    value={point['Annual Premium']}
                    onChange={(e) => handleRowChange(index, 'Annual Premium', parseFloat(e.target.value) || 0)}
                    className="w-full p-1 border rounded"
                    min="0"
                    step="1000"
                  />
                </td>
                
                {/* Sum Assured */}
                <td className="py-2 px-4 border">
                  <input
                    type="number"
                    value={point['Sum Assured']}
                    onChange={(e) => handleRowChange(index, 'Sum Assured', parseFloat(e.target.value) || 0)}
                    className="w-full p-1 border rounded"
                    min="0"
                    step="1000"
                  />
                </td>
                
                {/* Death Benefit - Dropdown */}
                <td className="py-2 px-4 border">
                  <select
                    value={point['Death Benefit']}
                    onChange={(e) => handleRowChange(index, 'Death Benefit', e.target.value)}
                    className="w-full p-1 border rounded"
                  >
                    <option value="Maximum of Sum Assured and Fund Value">Maximum of Sum Assured and Fund Value</option>
                    <option value="Sum Assured + Fund Value">Sum Assured + Fund Value</option>
                  </select>
                </td>
                
                {/* Weightage */}
                <td className="py-2 px-4 border">
                  <input
                    type="number"
                    value={point['Weightage']}
                    onChange={(e) => handleRowChange(index, 'Weightage', parseFloat(e.target.value) || 0)}
                    className={`w-full p-1 border rounded ${error.includes('Weightage') ? 'border-red-500' : ''}`}
                    min="0"
                    max="1"
                    step="0.01"
                  />
                </td>
                
                {/* Actions - Delete button */}
                <td className="py-2 px-4 border text-center">
                  <button
                    onClick={() => deleteRow(index)}
                    className="text-red-600 hover:text-red-800 p-1"
                    disabled={modelPoints.length <= 1}
                    title="Delete row"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Weight sum information */}
      <div className="mt-4 text-right">
        <span className={`font-medium ${error.includes('Weightage') ? 'text-red-600' : 'text-green-600'}`}>
          Sum of Weightage: {modelPoints.reduce((total, point) => total + parseFloat(point['Weightage'] || 0), 0).toFixed(2)}
          {!error.includes('Weightage') && ' ✓'}
        </span>
      </div>
    </div>
  );
};

export default ModelPointInputs;