// SummaryIFRS4Tab.jsx

import React, { useMemo, useEffect } from 'react';

const BaseIFRS4Tab = ({ formData, extractionResults,  onDataCalculated2025IFRS4, projectionStartYear  }) => {

  const Year2025IFRS4Data = useMemo(() => {
    
    const years = Array.from({ length: 30 }, (_, i) => i + 1);
    const modelPoints = formData.modelPointInputs || [];
    const policyCounts = formData.businessProjections?.policyCount || {};
    const valuationDate = formData.valuationDate;

    // --- CHANGE 2: Use the prop to calculate the years ---
    const baseYear = projectionStartYear || new Date(valuationDate).getFullYear(); 

    const financialYears = years.map((_, index) => baseYear + index);

    const averagePremiumScalar = years.map(() => 1);

    const newBusinessPolicies = policyCounts[projectionStartYear] || 0;
    const totalWeight = modelPoints.reduce((sum, point) => sum + (point['Weightage'] || 0), 0);
    const noPScalarValue = totalWeight > 0 ? newBusinessPolicies / totalWeight : 0;
    const noPScalar = years.map(() => noPScalarValue);
    

    const calculateFinancialRow = (columnName) => {
      return financialYears.map((year, index) => {
        if (!Array.isArray(extractionResults)) return 0;

        const sumForYear = extractionResults
          .filter(row => row.Year === year)
          .reduce((sum, row) => sum + (row[columnName] || 0), 0);
        
        const avgPremiumScalarForYear = averagePremiumScalar[index] || 0;
        const noPScalarForYear = noPScalar[index] || 0;

        return sumForYear * avgPremiumScalarForYear * noPScalarForYear;
      });
    };

    const grossWrittenPremiums = calculateFinancialRow('PremiumIncome');
    const premiumsCeded = calculateFinancialRow('RIPremiums');

     const netWrittenContributions = grossWrittenPremiums.map((gwp, index) => {
      const pc = premiumsCeded[index] || 0;
      return gwp - pc;
    });


    const allocationCharges = calculateFinancialRow('AllocationChargeAmount');
     const riderCharges = financialYears.map(() => 0);
    const adminFee = calculateFinancialRow('AdminFee');
    const coi = calculateFinancialRow('COI');
    const fundManagementCharges = calculateFinancialRow('FundManagementChargeAmount');
    const surrenderCharges = calculateFinancialRow('SurrenderChargesAmount');

    const totalRevenue = netWrittenContributions;

    const grossDeathClaimsUnit = calculateFinancialRow('DeathUnitOutgo');
    const grossDeathClaimsNonUnit = calculateFinancialRow('NUDeathClaims');
    const grossSurrenderUnitClaims = calculateFinancialRow('SurrUnitOutgo');
    const grossSurrenderClaimsNonUnit = financialYears.map(() => 0);
    const grossMaturityClaims = calculateFinancialRow('UnitMaturityOutgo');
    const reinsuranceShare = calculateFinancialRow('RIShareOfClaimsPaid');

    const netClaimsPaid = grossDeathClaimsUnit.map((gdcU, index) => {
      const gdcNU = grossDeathClaimsNonUnit[index] || 0;
      const gsc = grossSurrenderUnitClaims[index] || 0;
      const gmc = grossMaturityClaims[index] || 0;
      const rsc = reinsuranceShare[index] || 0;
      return (gdcU + gdcNU + gsc + gmc) - rsc;
    });

    // --- NEW: Calculate next set of rows ---
    const loyaltyBonus = calculateFinancialRow('LoyaltyBonusAmount');
    const initialCommission = calculateFinancialRow('InitialCommission');
    const renewalCommission = calculateFinancialRow('RenewalCommission');
    const acquisitionExpenses = calculateFinancialRow('InitialExpense');
    const maintenanceExpenses = calculateFinancialRow('RenewalExpense');
    const changeInUnitReserves = calculateFinancialRow('ChangeInUnitFund');

      // --- CORRECTED: Calculate Changes in Non Unit Technical Reserves ---
    const scaledGrossNonUnitChange = calculateFinancialRow('ChangeInGrossNonUnitReserves');
    const scaledRiReservesChange = calculateFinancialRow('ChangeInRIReserves');
    
    const changesInNonUnittechnicalReserves = scaledGrossNonUnitChange.map((value, index) => {
      return value + (scaledRiReservesChange[index] || 0);
    });

    //  Calculate Interest Earned rows ---
    const interestEarnedUnit = calculateFinancialRow('InvestmentIncomeUF');
    const interestEarnedNonUnit = calculateFinancialRow('InvestmentIncomeNUF');


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
    const activeNop = financialYears.map((year, index) => {
      if (!Array.isArray(extractionResults)) return 0;

      // Define the target date as the last day of the year
      const endOfYearDate = `${year}-12-31`;

      // Sum the 'NoPEoP' for that specific date only
      const sumForDate = extractionResults
        .filter(row => row.ValuationDate === endOfYearDate)
        .reduce((sum, row) => sum + (row.NoPEoP || 0), 0);

      // Apply scalars
      const avgPremiumScalarForYear = averagePremiumScalar[index] || 0;
      const noPScalarForYear = noPScalar[index] || 0;

      return sumForDate * avgPremiumScalarForYear * noPScalarForYear;
    });


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

    // what about the vfixed vendor fee ??? 

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
    const reinsuranceBEL = financialYears.map((year, index) => {
      if (!Array.isArray(extractionResults)) return 0;
      const endOfYearDate = `${year}-12-31`;
      const sumForDate = extractionResults
        .filter(row => row.ValuationDate === endOfYearDate)
        .reduce((sum, row) => sum + (row.RIReservesIfrs || 0), 0);
      const avgPremiumScalarForYear = averagePremiumScalar[index] || 0;
      const noPScalarForYear = noPScalar[index] || 0;
      return sumForDate * avgPremiumScalarForYear * noPScalarForYear;
    });

    //---------------------------------------------------------------------extra stuff -------------fore expenses 
    const targetYears = ['2025', '2026', '2027', '2028', '2029'];

    
    const allActiveNopArrays = targetYears.map((ty, tyIndex) => {

      const singleTargetYearArray = financialYears.map((year, index) => {
        // Skip years before the target year
        if (year < parseInt(ty)) {
          return 0;
        }
        const yearNo = year - tyIndex;
        console.log(`year No is ${yearNo}`);

        const endOfYearDate = `${yearNo}-12-31`; // Use actual financial year in date

        const sumForDate = extractionResults // chnage this to calculations for extractionTab
          .filter(row => row.ValuationDate === endOfYearDate)
          .reduce((sum, row) => sum + (row.NoPEoP || 0), 0);

        const noPScalarForTargetYear = formData.businessProjections?.policyCount?.[ty] || 0;

        return sumForDate * noPScalarForTargetYear;
      });

      return singleTargetYearArray;
    });
    const sumAciveNop = allActiveNopArrays[0].map((_, i) => {
        return (
          (allActiveNopArrays[0]?.[i] || 0) +
          (allActiveNopArrays[1]?.[i] || 0) +
          (allActiveNopArrays[2]?.[i] || 0) +
          (allActiveNopArrays[3]?.[i] || 0) +
          (allActiveNopArrays[4]?.[i] || 0)
        );
      });

      const allMaintenanceExpenses = [];
      targetYears.forEach((year, yearIndex) => {

        const maintenanceExp = [];

          financialYears.forEach((finYear, i) => {
            const activeNop = allActiveNopArrays[yearIndex];
            
            try {
              const scale = formData.businessProjections?.maintenanceExpense?.[finYear];
              const nopRatio = activeNop[i] / sumAciveNop[i];

              // Case 1: Directly use known projection (2025–2029)
              if (scale !== undefined && !isNaN(nopRatio)) {
                maintenanceExp[i] = scale * nopRatio;
              } 
              // Case 2: After 2029, project based on previous
              else if (i > 0 && activeNop[i - 1] !== 0) {
                maintenanceExp[i] = maintenanceExp[i - 1] * 1.05 * (activeNop[i ] / activeNop[i - 1]);
              } 
              // Fallback
              else {
                maintenanceExp[i] = 0;
              }
            } catch (e) {
              maintenanceExp[i] = 0;
            }
          });

          allMaintenanceExpenses.push(maintenanceExp);
      });

      const allVendorFixedFee = [];

      targetYears.forEach(( year, yearIndex) => {

        const VendorFixedFeeArray = [];
        financialYears.forEach(( finYear, i) => {

          const activeNop = allActiveNopArrays[yearIndex];

          try {
            if ( finYear <= baseYear + 4 ){
              VendorFixedFeeArray[i] =  formData.flatAnnualFeeToVendor * activeNop[i]/ sumAciveNop[i]; 
            }
            else if (i > 0 && activeNop[i -1 ] !== 0){
              VendorFixedFeeArray[i] = VendorFixedFeeArray[i - 1] * (activeNop[i] / activeNop[i - 1]) ;
            } 
            else {
              VendorFixedFeeArray[i]= 0 //  define base year for extraction tab later
          }
        }
        catch (e) {
              VendorFixedFeeArray[i] = 0;
            }
        });

        allVendorFixedFee.push(VendorFixedFeeArray);

      });

      const allNoPolsIfsm = [];
        targetYears.forEach(( tyYear, tyIndex) => {

          const noPolsIfsm = [];
          financialYears.forEach((value, i) =>{

            if( value< tyYear ) noPolsIfsm[i] = 0 ;

            const year = value - tyIndex ;

             if (!Array.isArray(extractionResults)){
              noPolsIfsm[i] = 0 ;
             };

             const sumForYear = extractionResults // CHANGE IT TO CALCULATIONS FOR EXTRACTION
              .filter(row => row.Year === year)
              .reduce((sum, row) => sum + (row.NoPBoP || 0), 0);

               noPolsIfsm[i] = sumForYear
          }) ;
          allNoPolsIfsm.push(noPolsIfsm)
        });



      const allMaintExp = [];
      const allVFF = [];

      targetYears.forEach((tyYear, tyIndex) => {
        const maintenanceExpenseOg = allMaintenanceExpenses[tyIndex];
      
        const scalar = formData.businessProjections?.policyCount?.[tyYear] || 1;
        const noPolsIfsm = allNoPolsIfsm[tyIndex] || [];

        const singleMaintExpArray = maintenanceExpenseOg.map((value, i) => {
          const pols = noPolsIfsm[i] || 0;
          return pols !== 0 ? value / pols / scalar : 0;
        });
          allMaintExp.push(singleMaintExpArray);
      });
      
 // check for this later
      targetYears.forEach((tyYear, tyIndex) => {
      
        const singleVFF = allVendorFixedFee.map((value, i) => {
        const pols = allNoPolsIfsm[i] || 0;
        const scalar = formData.businessProjections?.policyCount?.[tyYear] || 1;
        
        // Convert to numbers and validate
        const numValue = Number(value) || 0;
        const numPols = Number(pols) || 0;
        const numScalar = Number(scalar) || 1;
        
        // Check if any values are invalid
        if (numPols === 0 || numScalar === 0) return 0;
        
        const result = numValue / numPols/  numScalar;
        
        // Debug: log the calculation
        console.log(`Calc: ${numValue} / ${numPols} / ${numScalar} = ${result}`);
        
        return result;
      });
        allVFF.push(singleVFF);
      });





      

      
       

        
        



      











   //=======================================================================================================================
    return {
      years,
      financialYears,
      averagePremiumScalar,
      noPScalar,
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
      reinsuranceBEL,
      targetYears,
      allActiveNopArrays,
      allMaintenanceExpenses,
      allVendorFixedFee,
      allNoPolsIfsm,
      allMaintExp,
      allVFF
    };
    
  }, [formData, extractionResults, projectionStartYear]);


  //in this the memo name is used or the state name is used ??? -------------
  useEffect(() => {
    if (onDataCalculated2025IFRS4) {
      onDataCalculated2025IFRS4(Year2025IFRS4Data);
    }
  }, [Year2025IFRS4Data, onDataCalculated2025IFRS4]);





  const formatNumber = (num, decimalPlaces = 2) => {
    if (typeof num !== 'number') return num;
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6"> Financials {projectionStartYear} (IFRS4)</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          {/* ... table thead ... */}
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border" style={{ minWidth: '250px' }}></th>
              {Year2025IFRS4Data.years.map(year => ( <th key={year} className="py-3 px-4 text-center font-semibold text-gray-700 border">{year}</th> ))}
            </tr>
          </thead>
          <tbody>

            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Average Premium Scalar</td>
              {Year2025IFRS4Data.averagePremiumScalar.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">NoP Scalar</td>
              {Year2025IFRS4Data.noPScalar.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 2)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Financial Year in SAR</td>
              {Year2025IFRS4Data.financialYears.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{value}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Gross Written Premiums</td>
              {Year2025IFRS4Data.grossWrittenPremiums.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Premiums Ceded</td>
              {Year2025IFRS4Data.premiumsCeded.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 2)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Net Written Contributions</td>
              {Year2025IFRS4Data.netWrittenContributions.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 2)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Allocation Charges</td>
              {Year2025IFRS4Data.allocationCharges.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Rider Charges</td>
              {Year2025IFRS4Data.riderCharges.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

            {/* --- NEW ROWS --- */}
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Admin Fee</td>
              {Year2025IFRS4Data.adminFee.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">COI</td>
              {Year2025IFRS4Data.coi.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Fund Management Charges</td>
              {Year2025IFRS4Data.fundManagementCharges.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Surrender Charges</td>
              {Year2025IFRS4Data.surrenderCharges.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
          
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Total Revenue</td>
              {Year2025IFRS4Data.totalRevenue.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 2)}</td> ))}
            </tr>

            {/* --- NEW CLAIMS ROWS --- */}
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Gross Death Claims from Unit Fund</td>
              {Year2025IFRS4Data.grossDeathClaimsUnit.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Gross Death Claims from Non Unit Fund</td>
              {Year2025IFRS4Data.grossDeathClaimsNonUnit.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Gross Surrender Claims from Unit Fund</td>
              {Year2025IFRS4Data.grossSurrenderUnitClaims.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

             <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Gross Surrender Claims from Non Unit Fund</td>
              {Year2025IFRS4Data.grossSurrenderClaimsNonUnit.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>



            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Gross Maturity Claims</td>
              {Year2025IFRS4Data.grossMaturityClaims.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Reinsurance Share of Claims Paid</td>
              {Year2025IFRS4Data.reinsuranceShare.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Net Claims Paid</td>
              {Year2025IFRS4Data.netClaimsPaid.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

             <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Loyalty Bonus</td>
              {Year2025IFRS4Data.loyaltyBonus.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Initial Commission</td>
              {Year2025IFRS4Data.initialCommission.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Renewal Commission</td>
              {Year2025IFRS4Data.renewalCommission.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Acquisition Expenses</td>
              {Year2025IFRS4Data.acquisitionExpenses.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Maintenance Expenses</td>
              {Year2025IFRS4Data.maintenanceExpenses.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Change in Unit Reserves</td>
              {Year2025IFRS4Data.changeInUnitReserves.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

             {/* --- NEW ROW --- */}
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Changes in Non Unit Technical Reserves: Net</td>
              {Year2025IFRS4Data.changesInNonUnittechnicalReserves.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

             <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Interest Earned on Unit Fund</td>
              {Year2025IFRS4Data.interestEarnedUnit.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Interest Earned on Non Unit Fund (Net)</td>
              {Year2025IFRS4Data.interestEarnedNonUnit.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Net Profit</td>
              {Year2025IFRS4Data.netProfit.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

             <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Zakat</td>
              {Year2025IFRS4Data.zakat.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Net Profit After Zakat</td>
              {Year2025IFRS4Data.netProfitAfterZakat.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Active NoP</td>
              {Year2025IFRS4Data.activeNop.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">HDFC % of Charge Fee</td>
              {Year2025IFRS4Data.hdfcChargeFee.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">HDFC % of Fixed Fee</td>
              {Year2025IFRS4Data.hdfcFixedFee.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

             {/* --- NEW ROW --- */}
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Investment Expenses</td>
              {Year2025IFRS4Data.investmentExpenses.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

             <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Reinsurance BEL</td>
              {Year2025IFRS4Data.reinsuranceBEL.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            </tbody>

            <tbody>

            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">2025 </td>
              {Year2025IFRS4Data.allActiveNopArrays[0].map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">2026</td>
              {Year2025IFRS4Data.allActiveNopArrays[1].map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
             <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">ME 25 </td>
              {Year2025IFRS4Data.allMaintenanceExpenses[0].map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            
             <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">ME 26 </td>
              {Year2025IFRS4Data.allMaintenanceExpenses[1].map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
             <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">ME 27</td>
              {Year2025IFRS4Data.allMaintenanceExpenses[2].map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
             <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">ME 28 </td>
              {Year2025IFRS4Data.allMaintenanceExpenses[3].map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
             <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">ME 29 </td>
              {Year2025IFRS4Data.allMaintenanceExpenses[4].map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

            
             <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">vf 25 </td>
              {Year2025IFRS4Data.allVendorFixedFee[0].map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">vf 26 </td>
              {Year2025IFRS4Data.allVendorFixedFee[1].map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">no of policies ifsm 25 </td>
              {Year2025IFRS4Data.allNoPolsIfsm[0].map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">no of policies ifsm 26 </td>
              {Year2025IFRS4Data.allNoPolsIfsm[1].map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">maint expense again 25  </td>
              {Year2025IFRS4Data.allMaintExp[0].map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
             <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">maint expense again 26  </td>
              {Year2025IFRS4Data.allMaintExp[1].map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">VFF again 25  </td>
              {Year2025IFRS4Data.allVFF[0].map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>




          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BaseIFRS4Tab;

// the NPV VALUES AFTER THE NET PROFIT ZAKAT 
// the gross surrender claims non unit fund 