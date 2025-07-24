import React, { useMemo, useEffect } from 'react';

const SubsequentYearIFRS4Tab = ({ formData, Year2025IFRS4Data, onDataCalculatedIFRS4, projectionStartYear }) => {

  const IFRS4Data = useMemo(() => {
    console.log('Year2025IFRS4Data in 2026 component:', Year2025IFRS4Data);



  // Early return with default structure if base data is not available
    if (!Year2025IFRS4Data || Object.keys(Year2025IFRS4Data).length === 0) {
      console.warn('Year2025IFRS4Data is null, undefined, or empty - returning default structure');
      
      const years = Array.from({ length: 30 }, (_, i) => i + 1);
      const defaultArray = years.map(() => 0);
      const valuationDate = formData.valuationDate;
      const baseYear = new Date(valuationDate).getFullYear();
      const financialYears = years.map((_, index) => baseYear + index);
      
      return {
        years,
        financialYears,
        averagePremiumScalar: defaultArray,
        noPScalarTab: defaultArray,
        grossWrittenPremiums: defaultArray,
        premiumsCeded: defaultArray,
        netWrittenContributions: defaultArray,
        allocationCharges: defaultArray,
        riderCharges: defaultArray,
        adminFee: defaultArray,
        coi: defaultArray,
        fundManagementCharges: defaultArray,
        surrenderCharges: defaultArray,
        totalRevenue: defaultArray,
        grossDeathClaimsUnit: defaultArray,
        grossDeathClaimsNonUnit: defaultArray,
        grossSurrenderUnitClaims: defaultArray,
        grossSurrenderClaimsNonUnit: defaultArray,
        grossMaturityClaims: defaultArray,
        reinsuranceShare: defaultArray,
        netClaimsPaid: defaultArray,
        loyaltyBonus: defaultArray,
        initialCommission: defaultArray,
        renewalCommission: defaultArray,
        acquisitionExpenses: defaultArray,
        maintenanceExpenses: defaultArray,
        changeInUnitReserves: defaultArray,
        changesInNonUnittechnicalReserves: defaultArray,
        interestEarnedUnit: defaultArray,
        interestEarnedNonUnit: defaultArray,
        netProfit: defaultArray,
        zakat: defaultArray,
        netProfitAfterZakat: defaultArray,
        activeNop: defaultArray,
        hdfcChargeFee: defaultArray,
        hdfcFixedFee: defaultArray,
        investmentExpenses: defaultArray,
        reinsuranceBEL: defaultArray
      };
    }
  
    const years = Array.from({ length: 30 }, (_, i) => i + 1);
    const modelPoints = formData.modelPointInputs || [];
    const policyCounts = formData.businessProjections?.policyCount || {};
    const valuationDate = formData.valuationDate;

    // --- CHANGE 2: Use the prop to calculate the years ---
    const baseYear = new Date(valuationDate).getFullYear();  // lets keep the base year as 2025
    const financialYears = years.map((_, index) => baseYear + index);
    const tabYear = projectionStartYear;
    const averagePremiumScalar = years.map(() => 1); // same across all the tabs -- can chnage here 

    const newBusinessPoliciesBase = policyCounts[baseYear] || 0; // the base scalar to divide by
    const newBusinessPoliciesTab = policyCounts[tabYear] || 0;  // the new business policy count for this year

    const totalWeight = modelPoints.reduce((sum, point) => sum + (point['Weightage'] || 0), 0); // this remains the same
    
   
    const noPScalarValueBase = totalWeight > 0 ? newBusinessPoliciesBase / totalWeight : 0; 
    const noPScalarValueTab = totalWeight > 0 ? newBusinessPoliciesTab / totalWeight : 0;


    // these are constants, so dont need to map the values
   
    const noPScalarTab = years.map(() => noPScalarValueTab); // the scalar for the present year

    
    // the function to calculatee rows
    const calculateRow = (rowName) => {
        if (!Year2025IFRS4Data || !Array.isArray(Year2025IFRS4Data[rowName])) {
            console.warn(`Missing or invalid data for row: ${rowName}`);
            return [];
        }

        const offset = tabYear - baseYear;
        const ratio = noPScalarValueBase > 0 ? (noPScalarValueTab / noPScalarValueBase) : 0;

        return financialYears.map((_, index) => {
            const fromIndex = index - offset;
            const valueFromBase = Year2025IFRS4Data[rowName]?.[fromIndex] || 0;
            const scaled = valueFromBase * ratio;
            console.log(`Row: ${rowName}, From Index: ${fromIndex}, Base Value: ${valueFromBase}, Scaled: ${scaled}`);
            return scaled;
        });
    };

      

    const grossWrittenPremiums = calculateRow('grossWrittenPremiums');
    const premiumsCeded = calculateRow('premiumsCeded');

     const netWrittenContributions = grossWrittenPremiums.map((gwp, index) => {
      const pc = premiumsCeded[index] || 0;
      return gwp - pc;
    });


    const allocationCharges = calculateRow('allocationCharges');
    const riderCharges = calculateRow('riderCharges');
    const adminFee = calculateRow('adminFee');
    const coi = calculateRow('coi');
    const fundManagementCharges = calculateRow('fundManagementCharges');
    const surrenderCharges = calculateRow('surrenderCharges');

    const totalRevenue = netWrittenContributions;

    const grossDeathClaimsUnit = calculateRow('grossDeathClaimsUnit');
    const grossDeathClaimsNonUnit = calculateRow('grossDeathClaimsNonUnit');
    const grossSurrenderUnitClaims = calculateRow('grossSurrenderUnitClaims');
    const grossSurrenderClaimsNonUnit = calculateRow('grossSurrenderClaimsNonUnit');
    const grossMaturityClaims = calculateRow('grossMaturityClaims');
    const reinsuranceShare = calculateRow('reinsuranceShare');

    const netClaimsPaid = grossDeathClaimsUnit.map((gdcU, index) => {
      const gdcNU = grossDeathClaimsNonUnit[index] || 0;
      const gsc = grossSurrenderUnitClaims[index] || 0;
      const gmc = grossMaturityClaims[index] || 0;
      const rsc = reinsuranceShare[index] || 0;
      return (gdcU + gdcNU + gsc + gmc) - rsc;
    });

    // --- NEW: Calculate next set of rows ---
    const loyaltyBonus = calculateRow('loyaltyBonus');
    const initialCommission = calculateRow('initialCommission');
    const renewalCommission = calculateRow('renewalCommission');
    const acquisitionExpenses = calculateRow('acquisitionExpenses'); // same as initial expenses 
    const maintenanceExpenses = calculateRow('maintenanceExpenses'); // same as renewal expenses
    const changeInUnitReserves = calculateRow('changeInUnitReserves');

      // --- CORRECTED: Calculate Changes in Non Unit Technical Reserves ---
    
   const changesInNonUnittechnicalReserves = calculateRow('changesInNonUnittechnicalReserves')

    //  Calculate Interest Earned rows ---
    const interestEarnedUnit = calculateRow('interestEarnedUnit');
    const interestEarnedNonUnit = calculateRow('interestEarnedNonUnit');


    //  NEW: Calculate Net Profit ---

    const netProfit = financialYears.map((_, index) => {
      const totalRev = totalRevenue[index] || 0;
      const netClaims = netClaimsPaid[index] || 0;
      
      const otherExpensesAndChanges = 
        (initialCommission[index] || 0) + 
        (renewalCommission[index] || 0) + 
        (acquisitionExpenses[index] || 0) + 
        (maintenanceExpenses[index] || 0) + 
        (changeInUnitReserves[index] || 0) + 
        (changesInNonUnittechnicalReserves[index] || 0);

      const totalInterest = 
        (interestEarnedUnit[index] || 0) + 
        (interestEarnedNonUnit[index] || 0);
        
      return totalRev - netClaims - otherExpensesAndChanges + totalInterest;
    });

    const zakat = netProfit.map(profit => profit * 0.025);
    const netProfitAfterZakat = netProfit.map((profit, index) => profit - (zakat[index] || 0));
    
     // --- NEW: Updated Calculation for Active NoP ---
    const activeNop = calculateRow('activeNop')


     // --- NEW: Calculate HDFC Fixed Fees ---
    const hdfcFixedFee = financialYears.map(() => formData.flatAnnualFeeToVendor || 0);
    const hdfcChargeFee = financialYears.map((_, index) => {
      const v1 = (formData.vendorCommissionPolicy || 0) / 100 * (adminFee[index] || 0);
      const v2 = (formData.vendorCommissionAllocation || 0) / 100 * (allocationCharges[index] || 0);
      const v3 = (formData.vendorCommissionFMC || 0) / 100 * (fundManagementCharges[index] || 0);
      const v4 = (formData.vendorCommissionSurrender || 0) / 100 * (surrenderCharges[index] || 0);
      const v5_base = (allocationCharges[index] || 0) - (initialCommission[index] || 0) - (renewalCommission[index] || 0);
      const v5 = (formData.vendorCommissionAllocationLessCommission || 0) / 100 * Math.max(v5_base, 0);
      return v1 + v2 + v3 + v4 + v5;
    });

     // --- NEW: Calculate Investment Expenses ---
    const investmentExpenses = (() => {
      // Step 1: Get the cumulative sum of 'Change in Unit Reserves'
      let cumulativeSum = 0;
      const cumulativeChange = changeInUnitReserves.map(value => {
        cumulativeSum += (value || 0);
        return cumulativeSum;
      });

      // Step 2: Get the expense rate from formData
      const invExpRate = (formData.fundManagementExpense || 0) / 100;

      // Step 3: Map cumulative sum to final expense value
      return cumulativeChange.map(cumulativeValue => {
        const expense = cumulativeValue * invExpRate;
        return Math.max(expense, 0); // Take the maximum of the calculated expense and 0
      });
    })();

     // --- UPDATED: Reinsurance BEL Calculation ---
    const reinsuranceBEL = calculateRow('reinsuranceBEL')





    return {
      years,
      financialYears,
      averagePremiumScalar,
      noPScalarTab,
      grossWrittenPremiums,
      premiumsCeded,
      netWrittenContributions,
      allocationCharges,
      riderCharges,
      adminFee,
      coi,
      fundManagementCharges,
      surrenderCharges,
      totalRevenue,
      grossDeathClaimsUnit,
      grossDeathClaimsNonUnit,
      grossSurrenderUnitClaims,
      grossSurrenderClaimsNonUnit,
      grossMaturityClaims,
      reinsuranceShare,
      netClaimsPaid,
      loyaltyBonus,
      initialCommission,
      renewalCommission,
      acquisitionExpenses,
      maintenanceExpenses,
      changeInUnitReserves,
      changesInNonUnittechnicalReserves, // Add new data to the returned object
      interestEarnedUnit,
      interestEarnedNonUnit,
      netProfit,
      zakat,
      netProfitAfterZakat,
      activeNop,
      hdfcChargeFee,
      hdfcFixedFee,
      investmentExpenses, 
      reinsuranceBEL
    };
  }, [formData, Year2025IFRS4Data, projectionStartYear]);


  //in this the memo name is used or the state name is used ??? -------------
  useEffect(() => {
    if (onDataCalculatedIFRS4) {
      onDataCalculatedIFRS4(IFRS4Data);
    }
  }, [IFRS4Data, onDataCalculatedIFRS4]);

  const formatNumber = (num, decimalPlaces = 2) => {
    if (typeof num !== 'number') return num;
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">Financials {projectionStartYear} (IFRS4)</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          {/* ... table thead ... */}
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border" style={{ minWidth: '250px' }}></th>
              {IFRS4Data.years.map(year => ( <th key={year} className="py-3 px-4 text-center font-semibold text-gray-700 border">{year}</th> ))}
            </tr>
          </thead>
          <tbody>

            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Average Premium Scalar</td>
              {IFRS4Data.averagePremiumScalar.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">NoP Scalar</td>
              {IFRS4Data.noPScalarTab.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 2)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Financial Year in SAR</td>
              {IFRS4Data.financialYears.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{value}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Gross Written Premiums</td>
              {IFRS4Data.grossWrittenPremiums.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Premiums Ceded</td>
              {IFRS4Data.premiumsCeded.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 2)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Net Written Contributions</td>
              {IFRS4Data.netWrittenContributions.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 2)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Allocation Charges</td>
              {IFRS4Data.allocationCharges.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Rider Charges</td>
              {IFRS4Data.riderCharges.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

            {/* --- NEW ROWS --- */}
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Admin Fee</td>
              {IFRS4Data.adminFee.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">COI</td>
              {IFRS4Data.coi.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Fund Management Charges</td>
              {IFRS4Data.fundManagementCharges.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Surrender Charges</td>
              {IFRS4Data.surrenderCharges.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
          
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Total Revenue</td>
              {IFRS4Data.totalRevenue.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 2)}</td> ))}
            </tr>

            {/* --- NEW CLAIMS ROWS --- */}
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Gross Death Claims from Unit Fund</td>
              {IFRS4Data.grossDeathClaimsUnit.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Gross Death Claims from Non Unit Fund</td>
              {IFRS4Data.grossDeathClaimsNonUnit.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Gross Surrender Claims from Unit Fund</td>
              {IFRS4Data.grossSurrenderUnitClaims.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

             <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Gross Surrender Claims from Non Unit Fund</td>
              {IFRS4Data.grossSurrenderClaimsNonUnit.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Gross Maturity Claims</td>
              {IFRS4Data.grossMaturityClaims.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Reinsurance Share of Claims Paid</td>
              {IFRS4Data.reinsuranceShare.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Net Claims Paid</td>
              {IFRS4Data.netClaimsPaid.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

             <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Loyalty Bonus</td>
              {IFRS4Data.loyaltyBonus.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Initial Commission</td>
              {IFRS4Data.initialCommission.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Renewal Commission</td>
              {IFRS4Data.renewalCommission.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Acquisition Expenses</td>
              {IFRS4Data.acquisitionExpenses.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Maintenance Expenses</td>
              {IFRS4Data.maintenanceExpenses.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Change in Unit Reserves</td>
              {IFRS4Data.changeInUnitReserves.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

             {/* --- NEW ROW --- */}
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Changes in Non Unit Technical Reserves: Net</td>
              {IFRS4Data.changesInNonUnittechnicalReserves.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

             <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Interest Earned on Unit Fund</td>
              {IFRS4Data.interestEarnedUnit.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Interest Earned on Non Unit Fund (Net)</td>
              {IFRS4Data.interestEarnedNonUnit.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Net Profit</td>
              {IFRS4Data.netProfit.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

             <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Zakat</td>
              {IFRS4Data.zakat.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Net Profit After Zakat</td>
              {IFRS4Data.netProfitAfterZakat.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Active NoP</td>
              {IFRS4Data.activeNop.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">HDFC % of Charge Fee</td>
              {IFRS4Data.hdfcChargeFee.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">HDFC % of Fixed Fee</td>
              {IFRS4Data.hdfcFixedFee.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

             {/* --- NEW ROW --- */}
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Investment Expenses</td>
              {IFRS4Data.investmentExpenses.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

             <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Reinsurance BEL</td>
              {IFRS4Data.reinsuranceBEL.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>


          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubsequentYearIFRS4Tab;
