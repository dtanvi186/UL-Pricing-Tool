import React, { useMemo, useEffect } from 'react';

const SubsequentYearIFRS17Tab = ({ formData, Year2025IFRS17Data, onDataCalculatedIFRS17, projectionStartYear, difference }) => {
  
  const IFRS17Data = useMemo(() => {
   console.log('Year2025IFRS17Data in 2026 component:', Year2025IFRS17Data);
    
    // Early return with default structure if base data is not available
    if (!Year2025IFRS17Data || Object.keys(Year2025IFRS17Data).length === 0) {
      console.warn('Year2025IFRS17Data is null, undefined, or empty - returning default structure');
      
      // Match the exact structure of the working IFRS4 component
      const years = Array.from({ length: 30 }, (_, i) => i + 1);
      const defaultArray = years.map(() => 0);
      const valuationDate = formData.valuationDate;
      const baseYear = new Date(valuationDate).getFullYear();
      const financialYears = years.map((_, index) => baseYear + index);
      
      // Optional: Create date array if needed
      // const date = financialYears.map((year) => new Date(`${year}-12-31`));
      
      return {
        years,
        financialYears,
        // date,
        
        averagePremiumScalar: defaultArray,
        // Add the new rows to the return object
        expectedClaims: defaultArray,
        expectedExpensesAndCommissions: defaultArray,
        releaseRA: defaultArray,
        releaseCSM: defaultArray,
        insuranceServiceRevenue: defaultArray,
        actualClaims: defaultArray,
        actualExpenses: defaultArray,
        increseInLoses: defaultArray, // Note: consider fixing typo to "increaseInLosses"
        insuranceServiceExpense: defaultArray,
        insuranceServiceResult: defaultArray,
        expectedClaimsRecovery: defaultArray,
        releaseOfRIRA: defaultArray,
        releaseOfRICSM: defaultArray,
        reinsuranceRevenue: defaultArray,
        actualClaimsRecovery: defaultArray,
        amtRecoveredFromRe: defaultArray,
        reServiceResult: defaultArray,
        netInsuranceFinINandEX: defaultArray,
        IFRS17Profit: defaultArray
      };
    }
    
  
    const years = Array.from({ length: 30 }, (_, i) => i + 1);
    const modelPoints = formData.modelPointInputs || [];
    const policyCounts = formData.businessProjections?.policyCount || {};
    const valuationDate = formData.valuationDate;

    // --- CHANGE 2: Use the prop to calculate the years ---
    const baseYear = new Date(valuationDate).getFullYear();  // lets keep the base year as 2025
    const financialYears = years.map((_, index) => baseYear + index);
    const date = financialYears.map((year) => new Date(`${year}-12-31`));
    const tabYear = projectionStartYear;
    const averagePremiumScalar = years.map(() => 1); // same across all the tabs -- can chnage here 

    const newBusinessPoliciesBase = policyCounts[baseYear] || 0; // the base scalar to divide by
    const newBusinessPoliciesTab = policyCounts[tabYear] || 0;  // the new business policy count for this year

    const totalWeight = modelPoints.reduce((sum, point) => sum + (point['Weightage'] || 0), 0); // this remains the same
    
   
    const noPScalarValueBase = totalWeight > 0 ? newBusinessPoliciesBase / totalWeight : 0; 
    const noPScalarValueTab = totalWeight > 0 ? newBusinessPoliciesTab / totalWeight : 0;

    const noPScalarTab = years.map(() => noPScalarValueTab); // the scalar for the present year

    
    
    // the function to calculatee rows
    const calculateRow = (rowName) => {
        // Use the simple, effective guard clause from your IFRS 4 component.
        if (!Year2025IFRS17Data || !Array.isArray(Year2025IFRS17Data[rowName])) {
            console.warn(`IFRS17: Missing or invalid base data for row: ${rowName}`);
            // Return an empty array. This is safe and prevents crashes.
            return [];
        }

        // The 'difference' prop is crucial for IFRS 17 cohorts.
        const offset = (tabYear - baseYear) + difference;
        const ratio = noPScalarValueBase > 0 ? (noPScalarValueTab / noPScalarValueBase) : 0;

        return financialYears.map((_, index) => {
            const fromIndex = index - offset;
            
            // Safety check for array bounds
            if (fromIndex < 0 || fromIndex >= Year2025IFRS17Data[rowName].length) {
                return 0;
            }
            
            const valueFromBase = Year2025IFRS17Data[rowName][fromIndex] || 0;
            return valueFromBase * ratio;
        });
    };



     // ------GROSS -------------//
    const expectedClaims = calculateRow('expectedClaims');

    // This is a summary of other calculated rows
    const expectedExpensesAndCommissions = calculateRow ('expectedExpensesAndCommissions')
    const releaseRA = calculateRow('releaseRA');
    const releaseCSM =  calculateRow ('releaseCSM'); 
   
    const insuranceServiceRevenue = expectedClaims.map(( isr, index) => {
      const eec = expectedExpensesAndCommissions[index] || 0;
      const rRA = releaseRA[index] || 0;
      const rCSM = releaseCSM[index] || 0;
      return isr + eec + rRA +rCSM;
    });

    const actualClaims = expectedClaims;
    const actualExpenses = expectedExpensesAndCommissions;

    const increseInLoses = financialYears.map(() => 0);

    const insuranceServiceExpense = actualClaims.map((ac, index) => {
      const ae = actualExpenses[index] || 0;
      return ae + ac;
    }); 

    const insuranceServiceResult = insuranceServiceRevenue.map((isr, index) => {
      const ise = insuranceServiceExpense[index] || 0;
      return isr - ise;
    });

    // ------------REINSURANCE --------//
    // multiplied by -1 
    
    const expectedClaimsRecovery = calculateRow('expectedClaimsRecovery');

    const releaseOfRIRA = calculateRow('releaseOfRIRA');

    const releaseOfRICSM = calculateRow ('releaseOfRICSM');
    const reinsuranceRevenue = expectedClaimsRecovery.map((ecr, index) =>{
      const rRIRA = releaseOfRIRA[index] || 0;
      const rRICSM = releaseOfRICSM[index] || 0;
      return ecr+ rRIRA + rRICSM;
    } );

    const actualClaimsRecovery = expectedClaimsRecovery;
    const amtRecoveredFromRe = actualClaimsRecovery;

    const reServiceResult = amtRecoveredFromRe.map((arfr, index) => {
      const rr = reinsuranceRevenue[index] || 0 ;
      return rr - arfr;
    });

    const netInsuranceFinINandEX = financialYears.map(() => 0);
    
   const IFRS17Profit = insuranceServiceResult.map((isr, index) => {
      const rsr = reServiceResult[index] || 0 ;
      const nifie = netInsuranceFinINandEX[index]|| 0;
      return isr + rsr - nifie;
    });


   


 return {
      years,
      financialYears,
      date,
      averagePremiumScalar,
      noPScalarTab,
      // Add the new rows to the return object
      expectedClaims,
      expectedExpensesAndCommissions,
      releaseRA,
      releaseCSM,
      insuranceServiceRevenue,
      actualClaims,
      actualExpenses,
      increseInLoses,
      insuranceServiceExpense,
      insuranceServiceResult,
      expectedClaimsRecovery,
      releaseOfRIRA,
      releaseOfRICSM,
      reinsuranceRevenue,
      actualClaimsRecovery,
      amtRecoveredFromRe,
      reServiceResult,
      netInsuranceFinINandEX,
      IFRS17Profit
    };
  }, [formData, Year2025IFRS17Data, projectionStartYear, difference ]);



  useEffect(() => {
    if ( onDataCalculatedIFRS17) {
       onDataCalculatedIFRS17(IFRS17Data);
    }
  }, [IFRS17Data, onDataCalculatedIFRS17]);

  //format numbers - chnage here if needed 
  const formatNumber = (num, decimalPlaces = 2) => {
    if (typeof num !== 'number') return num;
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">Financials {projectionStartYear} (IFRS17)</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          {/* ... table thead ... */}
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border" style={{ minWidth: '250px' }}></th>
              {IFRS17Data.years.map(year => ( <th key={year} className="py-3 px-4 text-center font-semibold text-gray-700 border">{year}</th> ))}
            </tr>
          </thead>
          <tbody>

            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Average Premium Scalar</td>
              {IFRS17Data.averagePremiumScalar.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">NoP Scalar</td>
              {IFRS17Data.noPScalarTab.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 2)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Financial Year in SAR</td>
              {IFRS17Data.financialYears.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{value}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
               {/* ---change the setting here to fix the wrapping --- */}         
              <td className="py-2 px-4 border font-medium ">Date</td>
              {IFRS17Data.date.map((date, index) => (
                <td key={index} className="py-2 px-4 border text-right whitespace-nowrap ">
                  {/* why is the 0 there */}
                  {date.toISOString().split('T')[0]}
                </td>

              ))}
            </tr>
            
            {/* --- ADD THE NEW ROWS TO THE TABLE --- */}
            {/* --- GROSS --- */}
             <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">GROSS</td>
            </tr>

            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium"> Expected Claims (excl. investment component)</td>
              {IFRS17Data.expectedClaims.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Expected Expenses and Commissions </td>
              {IFRS17Data.expectedExpensesAndCommissions.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Release RA</td>
              {IFRS17Data.releaseRA.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
             <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Release of CSM</td>
              {IFRS17Data.releaseCSM.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

             <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Insurance Service Revenue</td>
              {IFRS17Data.insuranceServiceRevenue.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
             <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Actual Claims (excl. investment component)</td>
              {IFRS17Data.actualClaims.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
             <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Actual Expenses</td>
              {IFRS17Data.actualExpenses.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Increase in Loses </td>
              {IFRS17Data.increseInLoses.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Insurance Service Expense</td>
              {IFRS17Data.insuranceServiceExpense.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Insurance Service Result</td>
              {IFRS17Data.insuranceServiceResult.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            {/* --- REINSURANCE --- */}
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">REINSURANCE</td>
            </tr>
            <tr className="hover:bg-gray-50">
              {/* ---change the setting here to fix the wrapping --- */}
              <td className="py-2 px-4 border font-medium whitespace-nowrap">Expected Claims Recovery(excl. investment component)</td>
              {IFRS17Data.expectedClaimsRecovery.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Release of RI RA </td>
              {IFRS17Data.releaseOfRIRA.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Release of RI CSM </td>
              {IFRS17Data.releaseOfRICSM.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Reinsurance Revenue</td>
              {IFRS17Data.reinsuranceRevenue.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Actual Claims Recovery( excl. Investment Component)</td>
              {IFRS17Data.actualClaimsRecovery.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Amount Recovered From Insurance</td>
              {IFRS17Data.amtRecoveredFromRe.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Reinsurance Service Result </td>
              {IFRS17Data.reServiceResult.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Net Insurance Finance Income and Expense</td>
              {IFRS17Data.netInsuranceFinINandEX.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium"> IFRS17 Profit </td>
              {IFRS17Data.IFRS17Profit.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubsequentYearIFRS17Tab;
