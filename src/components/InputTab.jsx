// InputTab.jsx (Input Tab Component with Restricted Parameters and Table Navigation)
import React, { useState } from 'react';

const InputTab = ({ 
  formData, 
  handleInputChange, 
  handleLoyaltyBonusChange, 
  handleSensitivityChange, 
  handleLapseRateChange, 
  handleSurrenderChargeChange, 
  handlePremiumAllocationChargeChange, 
  handleCommissionChange,
  handleBusinessProjectionChange,
  handleCommissionFileUpload,
  handlePremiumAllocationFileUpload,
  handleLapseRateFileUpload,
  downloadCommissionTemplate,
  downloadPremiumAllocationTemplate,
  downloadLapseRateTemplate
}) => {
  // State to track which table is currently visible
  const [currentTableIndex, setCurrentTableIndex] = useState(0);
  
  // Function to handle bulk updates for premium allocation charges (5+ case)
  const handlePremiumAllocationBulkUpdate = (year, term, value) => {
    // First, call the normal handler for year 5
    handlePremiumAllocationChargeChange(year, term, value);
    
    // Then apply the same value to all years from 6 to 20
    for (let y = 6; y <= 20; y++) {
      handlePremiumAllocationChargeChange(y, term, value);
    }
  };
  
  // Function to handle bulk updates for commission (5+ case)
  const handleCommissionBulkUpdate = (year, term, value) => {
    // First, call the normal handler for year 5
    handleCommissionChange(year, term, value);
    
    // Then apply the same value to all years from 6 to 20
    for (let y = 6; y <= 20; y++) {
      handleCommissionChange(y, term, value);
    }
  };
  
  // Array of table components to cycle through
  const tables = [
    'Input Parameters',
    'Premium Allocation Charge',
    'Commission',
    'Loyalty Bonus',
    'Lapse Rate & Surrender Charge',
    'Business Projections',
  ];
  
  // Navigation functions
  const goToNextTable = () => {
    if (currentTableIndex < tables.length - 1) {
      setCurrentTableIndex(currentTableIndex + 1);
    }
  };
  
  const goToPreviousTable = () => {
    if (currentTableIndex > 0) {
      setCurrentTableIndex(currentTableIndex - 1);
    }
  };

 // #235371ff
  // #013c61ff
  // #f9f9f9ff
  
  return (
    <div className="space-y-8">
      {/* Table Navigation */}
      <div className="flex justify-between items-center bg-white rounded-lg shadow-md p-4">
        <button
          onClick={goToPreviousTable}
          disabled={currentTableIndex === 0}
          className={`px-4 py-2 rounded-md flex items-center ${
            currentTableIndex === 0 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-[#235371ff] text-white hover:bg-[#013c61ff]'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back
        </button>
        
        <h2 className="text-xl font-semibold">
          {tables[currentTableIndex]}
        </h2>
        
        <button
          onClick={goToNextTable}
          disabled={currentTableIndex === tables.length - 1}
          className={`px-4 py-2 rounded-md flex items-center ${
            currentTableIndex === tables.length - 1 
             ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-[#235371ff] text-white hover:bg-[#013c61ff]'
          }`}
        >
          Next
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-[#235371ff] h-2.5 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${((currentTableIndex + 1) / tables.length) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          {tables.map((table, index) => (
            <div 
              key={index}
              className={`${index === currentTableIndex ? 'font-bold text-[#013c61ff]' : ''}`}
            >
              {table}
            </div>
          ))}
        </div>
      </div>

      {/* Main Parameters Table - VISIBLE when currentTableIndex === 0 */}
      {currentTableIndex === 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 transition-all duration-300 ease-in-out">
          <p className="text-gray-600 mb-4">Enter values in the fields below. All fields can be edited by the user. Values update automatically.</p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Title</th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Value</th>
                </tr>
              </thead>
              <tbody>
                {/* VISIBLE PARAMETERS (1-7) */}

                {/* Admin Charge */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">Admin Charge (Per Policy)</td>
                  <td className="py-2 px-4 border">
                    <input
                      type="number"
                      name="adminCharge"
                      value={formData.adminCharge}
                      onChange={handleInputChange}
                      className="w-full p-1 border rounded"
                      step="0.01"
                    />
                  </td>
                </tr>

                {/* Fund Management Charge */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">Fund Management Charge (% of Fund Value)</td>
                  <td className="py-2 px-4 border">
                    <div className="relative">
                      <input
                        type="number"
                        name="fundManagementCharge"
                        value={formData.fundManagementCharge}
                        onChange={handleInputChange}
                        className="w-full p-1 border rounded pr-6"
                        step="0.01"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2">%</span>
                    </div>
                  </td>
                </tr>
                
                {/* Monthly FMC (calculated) - HIDDEN */}
                
                {/* Fund Management Expense */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">Fund Management Expense (% of Fund Value)</td>
                  <td className="py-2 px-4 border">
                    <div className="relative">
                      <input
                        type="number"
                        name="fundManagementExpense"
                        value={formData.fundManagementExpense}
                        onChange={handleInputChange}
                        className="w-full p-1 border rounded pr-6"
                        step="0.01"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2">%</span>
                    </div>
                  </td>
                </tr>

                {/* NEW: Cost of Insurance (% of AMC00) */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">Cost of Insurance (% of AMC00)</td>
                  <td className="py-2 px-4 border">
                    <div className="relative">
                      <input
                        type="number"
                        name="coiRiskChargeMultiple"
                        value={formData.coiRiskChargeMultiple}
                        onChange={handleInputChange}
                        className="w-full p-1 border rounded pr-6"
                        step="0.01"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2">%</span>
                    </div>
                  </td>
                </tr>

                {/*} NEW:Investment Income Percent*/}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border"> Investment Income (%) </td>
                  <td className="py-2 px-4 border">
                    <div className="relative">
                      <input
                        type="number"
                        name="flatInvestmentIncomeRate"
                        value={formData.flatInvestmentIncomeRate}
                        onChange={handleInputChange}
                        className="w-full p-1 border rounded pr-6"
                        step="0.01"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2">%</span>
                    </div>
                  </td>
                </tr> 

                {/* NEW: Reinsurance Quota Share */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">Reinsurance Quota Share</td>
                  <td className="py-2 px-4 border">
                    <div className="relative">
                      <input
                        type="number"
                        name="reinsuranceQuotaShare"
                        value={formData.reinsuranceQuotaShare}
                        onChange={handleInputChange}
                        className="w-full p-1 border rounded pr-6"
                        step="0.01"
                        min="0"
                        max="100"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2">%</span>
                    </div>
                  </td>
                </tr>

                {/* NEW: Reinsurance Rates (% of AMC00) */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">Reinsurance Rates (% of AMC00)</td>
                  <td className="py-2 px-4 border">
                    <div className="relative">
                      <input
                        type="number"
                        name="reinsuranceRates"
                        value={formData.reinsuranceRates}
                        onChange={handleInputChange}
                        className="w-full p-1 border rounded pr-6"
                        step="0.01"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2">%</span>
                    </div>
                  </td>
                </tr>

                {/* Currency (replacing Current) */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">Currency</td>
                  <td className="py-2 px-4 border">
                    <input
                      type="text"
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="w-full p-1 border rounded"
                    />
                  </td>
                </tr>

                {/* Vendor Commission (% of Policy Administration charges) */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">Vendor Commission (% of Policy Administration charges)</td>
                  <td className="py-2 px-4 border">
                    <div className="relative">
                      <input
                        type="number"
                        name="vendorCommissionPolicy"
                        value={formData.vendorCommissionPolicy}
                        onChange={handleInputChange}
                        className="w-full p-1 border rounded pr-6"
                        step="0.01"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2">%</span>
                    </div>
                  </td>
                </tr>

                {/* Vendor Commission (% of Allocation charges) */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">Vendor Commission (% of Allocation charges)</td>
                  <td className="py-2 px-4 border">
                    <div className="relative">
                      <input
                        type="number"
                        name="vendorCommissionAllocation"
                        value={formData.vendorCommissionAllocation}
                        onChange={handleInputChange}
                        className="w-full p-1 border rounded pr-6"
                        step="0.01"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2">%</span>
                    </div>
                  </td>
                </tr>

                {/* Flat Annual Fee to Vendor */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">Flat Annual Fee to Vendor</td>
                  <td className="py-2 px-4 border">
                    <input
                      type="number"
                      name="flatAnnualFeeToVendor"
                      value={formData.flatAnnualFeeToVendor}
                      onChange={handleInputChange}
                      className="w-full p-1 border rounded"
                      step="0.01"
                    />
                  </td>
                </tr>

                {/* WHT on Vendor payments */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">WHT on Vendor payments</td>
                  <td className="py-2 px-4 border">
                    <div className="relative">
                      <input
                        type="number"
                        name="whtOnVendorPayments"
                        value={formData.whtOnVendorPayments}
                        onChange={handleInputChange}
                        className="w-full p-1 border rounded pr-6"
                        step="0.01"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2">%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Business Projections Table - VISIBLE when currentTableIndex === 1 */}
      {currentTableIndex === 5 && (
        <div className="bg-white rounded-lg shadow-md p-6 transition-all duration-300 ease-in-out">
          <p className="text-gray-600 mb-4">Enter new business policy counts and expenses. Values update automatically.</p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Year</th>
                  {[...Array(5)].map((_, index) => {
                    const year = new Date(formData.valuationDate).getFullYear() + index;
                    return (
                      <th key={year} className="py-3 px-4 text-center font-semibold text-gray-700 border">{year}</th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {/* VISIBLE PARAMETERS (1-3) */}
                
                {/* New Business Policy Count */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border font-medium">New Business Policy Count</td>
                  {[...Array(5)].map((_, index) => {
                    const year = new Date(formData.valuationDate).getFullYear() + index;
                    return (
                      <td key={year} className="py-2 px-4 border">
                        <input
                          type="number"
                          value={formData.businessProjections?.policyCount?.[year] || ""}
                          onChange={(e) => handleBusinessProjectionChange('policyCount', year, e.target.value)}
                          className="w-full p-1 border rounded text-right"
                          step="1"
                          min="0"
                        />
                      </td>
                    );
                  })}
                </tr>
                
                {/* Maintenance Expense */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border font-medium">Maintenance Expense</td>
                  {[...Array(5)].map((_, index) => {
                    const year = new Date(formData.valuationDate).getFullYear() + index;
                    return (
                      <td key={year} className="py-2 px-4 border">
                        <input
                          type="number"
                          value={formData.businessProjections?.maintenanceExpense?.[year] || ""}
                          onChange={(e) => handleBusinessProjectionChange('maintenanceExpense', year, e.target.value)}
                          className="w-full p-1 border rounded text-right"
                          step="1"
                          min="0"
                        />
                      </td>
                    );
                  })}
                </tr>
                
                {/* Acquisition Expense */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border font-medium">Acquisition Expense</td>
                  {[...Array(5)].map((_, index) => {
                    const year = new Date(formData.valuationDate).getFullYear() + index;
                    return (
                      <td key={year} className="py-2 px-4 border">
                        <input
                          type="number"
                          value={formData.businessProjections?.acquisitionExpense?.[year] || ""}
                          onChange={(e) => handleBusinessProjectionChange('acquisitionExpense', year, e.target.value)}
                          className="w-full p-1 border rounded text-right"
                          step="1"
                          min="0"
                        />
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Loyalty Bonus Table - VISIBLE when currentTableIndex === 2 */}
      {currentTableIndex === 3 && (
        <div className="bg-white rounded-lg shadow-md p-6 transition-all duration-300 ease-in-out">
          <p className="text-gray-600 mb-4">Enter the loyalty bonus percentages for specific policy years. Values update automatically.</p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Policy Year</th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Loyalty Bonus (% of fund value)</th>
                </tr>
              </thead>
              <tbody>
                {/* Policy Year 6 */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">6</td>
                  <td className="py-2 px-4 border">
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.loyaltyBonus[6]}
                        onChange={(e) => handleLoyaltyBonusChange(6, e.target.value)}
                        className="w-full p-1 border rounded pr-6"
                        step="0.01"
                        min="0"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2">%</span>
                    </div>
                  </td>
                </tr>
                
                {/* Policy Year 11 */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">11</td>
                  <td className="py-2 px-4 border">
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.loyaltyBonus[11]}
                        onChange={(e) => handleLoyaltyBonusChange(11, e.target.value)}
                        className="w-full p-1 border rounded pr-6"
                        step="0.01"
                        min="0"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2">%</span>
                    </div>
                  </td>
                </tr>
                
                {/* Policy Year 16 */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">16</td>
                  <td className="py-2 px-4 border">
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.loyaltyBonus[16]}
                        onChange={(e) => handleLoyaltyBonusChange(16, e.target.value)}
                        className="w-full p-1 border rounded pr-6"
                        step="0.01"
                        min="0"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2">%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Lapse Rate and Surrender Charge Table - VISIBLE when currentTableIndex === 4 */}
      {currentTableIndex === 4 && (
        <div className="bg-white rounded-lg shadow-md p-6 transition-all duration-300 ease-in-out">
          <p className="text-gray-600 mb-4">Enter the lapse rate percentages and surrender charges for policy years. Values update automatically.</p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Policy Year</th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Lapse Rate</th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Surrender Charge Fixed </th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Surrender Charge (%)</th>
                </tr>
              </thead>
             
              <tbody>
                {/* Policy Years 1 to 4 */}
                {[1, 2, 3, 4].map((year) => (
                  <tr key={year} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border">{year}</td>
                    <td className="py-2 px-4 border">
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.lapseRate?.[year] || ""}
                          onChange={(e) => handleLapseRateChange(year, e.target.value)}
                          className="w-full p-1 border rounded pr-6"
                          step="0.01" min="0"
                        />
                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2">%</span>
                      </div>
                    </td>
                    <td className="py-2 px-4 border">
                      <input
                        type="number"
                        value={formData.surrenderCharge?.[year]?.fixed || "0.00"}
                        onChange={(e) => handleSurrenderChargeChange(year, 'fixed', e.target.value)}
                        className="w-full p-1 border rounded"
                        step="0.01" min="0"
                      />
                    </td>
                    <td className="py-2 px-4 border">
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.surrenderCharge?.[year]?.percent || "0.00"}
                          onChange={(e) => handleSurrenderChargeChange(year, 'percent', e.target.value)}
                          className="w-full p-1 border rounded pr-6"
                          step="0.01" min="0"
                        />
                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2">%</span>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Policy Year 5+ */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">5+</td>
                  <td className="py-2 px-4 border">
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.lapseRate?.[5] || ""}
                        onChange={(e) => handleLapseRateChange(5, e.target.value)}
                        className="w-full p-1 border rounded pr-6"
                        step="0.01" min="0"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2">%</span>
                    </div>
                  </td>
                  <td className="py-2 px-4 border">
                    <input
                      type="number"
                      value={formData.surrenderCharge?.[5]?.fixed || "0.00"}
                      onChange={(e) => handleSurrenderChargeChange(5, 'fixed', e.target.value)}
                      className="w-full p-1 border rounded"
                      step="0.01" min="0"
                    />
                  </td>
                  <td className="py-2 px-4 border">
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.surrenderCharge?.[5]?.percent || "0.00"}
                        onChange={(e) => handleSurrenderChargeChange(5, 'percent', e.target.value)}
                        className="w-full p-1 border rounded pr-6"
                        step="0.01" min="0"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2">%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Premium Allocation Charge Table - VISIBLE when currentTableIndex === 5 */}
      {currentTableIndex === 1 && (
        <div className="bg-white rounded-lg shadow-md p-6 transition-all duration-300 ease-in-out">
          <p className="text-gray-600 mb-4">Enter the premium allocation charge percentages for each policy year and premium payment term. Values update automatically.</p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Policy Year</th>
                  <th className="py-3 px-4 text-center font-semibold text-gray-700 border">1</th>
                  <th className="py-3 px-4 text-center font-semibold text-gray-700 border">3</th>
                  <th className="py-3 px-4 text-center font-semibold text-gray-700 border">5</th>
                  <th className="py-3 px-4 text-center font-semibold text-gray-700 border">10</th>
                </tr>
              </thead>
              <tbody>
                {/* Policy Year 1 */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">1</td>
                  {[1, 3, 5, 10].map((term) => (
                    <td key={`1-${term}`} className="py-2 px-4 border">
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.premiumAllocationCharge?.[1]?.[term] || 
                                (term === 1 ? "94.50" : 
                                term === 3 ? "95.01" : 
                                term === 5 ? "90.01" : "85.01")}
                          onChange={(e) => handlePremiumAllocationChargeChange(1, term, e.target.value)}
                          className="w-full p-1 border rounded pr-6"
                          step="0.01"
                          min="0"
                          max="100"
                        />
                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2">%</span>
                      </div>
                    </td>
                  ))}
                </tr>
                
                {/* Policy Year 2 */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">2</td>
                  {[1, 3, 5, 10].map((term) => (
                    <td key={`2-${term}`} className="py-2 px-4 border">
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.premiumAllocationCharge?.[2]?.[term] || 
                                (term === 1 ? "0.00" : 
                                term === 3 ? "97.01" : 
                                term === 5 ? "95.01" : "90.01")}
                          onChange={(e) => handlePremiumAllocationChargeChange(2, term, e.target.value)}
                          className="w-full p-1 border rounded pr-6"
                          step="0.01"
                          min="0"
                          max="100"
                        />
                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2">%</span>
                      </div>
                    </td>
                  ))}
                </tr>
                
                {/* Policy Year 3 */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">3</td>
                  {[1, 3, 5, 10].map((term) => (
                    <td key={`3-${term}`} className="py-2 px-4 border">
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.premiumAllocationCharge?.[3]?.[term] || 
                                (term === 1 ? "0.00" : 
                                term === 3 ? "99.01" : 
                                term === 5 ? "97.01" : "95.01")}
                          onChange={(e) => handlePremiumAllocationChargeChange(3, term, e.target.value)}
                          className="w-full p-1 border rounded pr-6"
                          step="0.01"
                          min="0"
                          max="100"
                        />
                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2">%</span>
                      </div>
                    </td>
                  ))}
                </tr>
                
                {/* Policy Year 4 */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">4</td>
                  {[1, 3, 5, 10].map((term) => (
                    <td key={`4-${term}`} className="py-2 px-4 border">
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.premiumAllocationCharge?.[4]?.[term] || 
                                (term === 1 ? "0.00" : 
                                term === 3 ? "100.00" : 
                                term === 5 ? "99.01" : "97.01")}
                          onChange={(e) => handlePremiumAllocationChargeChange(4, term, e.target.value)}
                          className="w-full p-1 border rounded pr-6"
                          step="0.01"
                          min="0"
                          max="100"
                        />
                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2">%</span>
                      </div>
                    </td>
                  ))}
                </tr>
                
                {/* Policy Year 5+ (for years 5 and greater) */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">5+</td>
                  {[1, 3, 5, 10].map((term) => (
                    <td key={`5-${term}`} className="py-2 px-4 border">
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.premiumAllocationCharge?.[5]?.[term] || 
                                (term === 1 ? "0.00" : 
                                term === 3 ? "100.00" : 
                                term === 5 ? (term <= 5 ? "99.01" : "100.00") : 
                                (term <= 10 ? "97.01" : "100.00"))}
                          onChange={(e) => {
                            // Update year 5 and apply the same value to all years 5-20
                            const value = e.target.value === '' ? '' : Number(e.target.value);
                            // Call modified handler for handling 5+ case
                            handlePremiumAllocationBulkUpdate(5, term, value);
                          }}
                          className="w-full p-1 border rounded pr-6"
                          step="0.01"
                          min="0"
                          max="100"
                        />
                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2">%</span>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Commission Table - VISIBLE when currentTableIndex === 6 */}
      {currentTableIndex === 2 && (
        <div className="bg-white rounded-lg shadow-md p-6 transition-all duration-300 ease-in-out">
          <p className="text-gray-600 mb-4">Enter the commission percentages for each policy year and premium payment term. Values update automatically.</p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Policy Year</th>
                  <th className="py-3 px-4 text-center font-semibold text-gray-700 border">1</th>
                  <th className="py-3 px-4 text-center font-semibold text-gray-700 border">3</th>
                  <th className="py-3 px-4 text-center font-semibold text-gray-700 border">5</th>
                  <th className="py-3 px-4 text-center font-semibold text-gray-700 border">10</th>
                </tr>
              </thead>
              <tbody>
                {/* Policy Year 1 */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">1</td>
                  {[1, 3, 5, 10].map((term) => (
                    <td key={`1-${term}`} className="py-2 px-4 border">
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.commission?.[1]?.[term] || 
                                (term === 1 ? "3.00" : "10.00")}
                          onChange={(e) => handleCommissionChange(1, term, e.target.value)}
                          className="w-full p-1 border rounded pr-6"
                          step="0.01"
                          min="0"
                          max="100"
                        />
                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2">%</span>
                      </div>
                    </td>
                  ))}
                </tr>
                
                {/* Policy Year 2 */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">2</td>
                  {[1, 3, 5, 10].map((term) => (
                    <td key={`2-${term}`} className="py-2 px-4 border">
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.commission?.[2]?.[term] || 
                                (term === 1 ? "0.00" : "3.00")}
                          onChange={(e) => handleCommissionChange(2, term, e.target.value)}
                          className="w-full p-1 border rounded pr-6"
                          step="0.01"
                          min="0"
                          max="100"
                        />
                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2">%</span>
                      </div>
                    </td>
                  ))}
                </tr>
                
                {/* Policy Year 3 */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">3</td>
                  {[1, 3, 5, 10].map((term) => (
                    <td key={`3-${term}`} className="py-2 px-4 border">
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.commission?.[3]?.[term] || "0.00"}
                          onChange={(e) => handleCommissionChange(3, term, e.target.value)}
                          className="w-full p-1 border rounded pr-6"
                          step="0.01"
                          min="0"
                          max="100"
                        />
                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2">%</span>
                      </div>
                    </td>
                  ))}
                </tr>
                
                {/* Policy Year 4 */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">4</td>
                  {[1, 3, 5, 10].map((term) => (
                    <td key={`4-${term}`} className="py-2 px-4 border">
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.commission?.[4]?.[term] || "0.00"}
                          onChange={(e) => handleCommissionChange(4, term, e.target.value)}
                          className="w-full p-1 border rounded pr-6"
                          step="0.01"
                          min="0"
                          max="100"
                        />
                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2">%</span>
                      </div>
                    </td>
                  ))}
                </tr>
                
                {/* Policy Year 5+ (for years 5 and greater) */}
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">5+</td>
                  {[1, 3, 5, 10].map((term) => (
                    <td key={`5-${term}`} className="py-2 px-4 border">
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.commission?.[5]?.[term] || "0.00"}
                          onChange={(e) => {
                            // Update year 5 and apply the same value to all years 5-20
                            const value = e.target.value === '' ? '' : Number(e.target.value);
                            // Call modified handler for handling 5+ case
                            handleCommissionBulkUpdate(5, term, value);
                          }}
                          className="w-full p-1 border rounded pr-6"
                          step="0.01"
                          min="0"
                          max="100"
                        />
                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2">%</span>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default InputTab;