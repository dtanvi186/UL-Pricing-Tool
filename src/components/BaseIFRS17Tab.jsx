import React, { useMemo, useEffect } from 'react';

const BaseIFRS17Tab = ({ formData, extractionResults,  onDataCalculated2025IFRS17,  projectionStartYear }) => {

  const Year2025IFRS17Data = useMemo(() => {
    
    const years = Array.from({ length: 30 }, (_, i) => i + 1);
    const modelPoints = formData.modelPointInputs || [];
    const policyCounts = formData.businessProjections?.policyCount || {};
    const valuationDate = formData.valuationDate;

    // --- CHANGE 2: Use the prop to calculate the years ---
    const baseYear = projectionStartYear || new Date(valuationDate).getFullYear(); 

    const financialYears = years.map((_, index) => baseYear + index);

    const date = financialYears.map((year) => new Date(`${year}-12-31`));


    // always is one 
    const averagePremiumScalar = years.map(() => 1);
    // dpends on the year 
    const newBusinessPolicies = policyCounts[projectionStartYear] || 0;
    const totalWeight = modelPoints.reduce((sum, point) => sum + (point['Weightage'] || 0), 0);
    const noPScalarValue = totalWeight > 0 ? newBusinessPolicies / totalWeight : 0;
    const noPScalar = years.map(() => noPScalarValue);
    
    //FUNCTION TO Calculate the sum based on year from the extraction tab 
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

    
    // --- 2. BASE ROW CALCULATIONS ---
   
    
    // ------GROSS -------------//
    const expectedClaims = calculateFinancialRow('NUDeathClaims');

    const renewalCommission = calculateFinancialRow('RenewalCommission');
    const maintenanceExpenses = calculateFinancialRow('RenewalExpense');
    
    // This is a summary of other calculated rows
    const expectedExpensesAndCommissions = renewalCommission.map((value, index) => {
      return value + (maintenanceExpenses[index] || 0);
    });

    const releaseRA = calculateFinancialRow('RARelease');

    const releaseCSM =  financialYears.map(() => 0); 
   

    const insuranceServiceRevenue =  financialYears.map(() => 0); 

    const actualClaims = expectedClaims;
    const actualExpenses = expectedExpensesAndCommissions;

    const increseInLoses = financialYears.map(() => 0);
    const insuranceServiceExpense = financialYears.map(() => 0);

    const insuranceServiceResult = insuranceServiceRevenue.map((isr, index) => {
      const ise = insuranceServiceExpense[index] || 0;
      return isr + ise;
    });

    // ------------REINSURANCE --------//
    // multiplied by -1 
    const eCR =  calculateFinancialRow('RIShareOfClaimsPaid') ;
    const expectedClaimsRecovery = eCR.map(eCR => eCR * (-1)); 

    const rRIRA = calculateFinancialRow ('ReinRARelease');
    const releaseOfRIRA = rRIRA.map(rRIRA => rRIRA *(-1));

    const releaseOfRICSM = calculateFinancialRow ('RICSMRelease');
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

    // not calculasted for the first year 
    const IFRS17Profit = financialYears.map(() => 0);

  


     return {
      years,
      financialYears,
      date,
      averagePremiumScalar,
      noPScalar,
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
  }, [formData, extractionResults, projectionStartYear ]);

  useEffect(() => {
    if ( onDataCalculated2025IFRS17) {
       onDataCalculated2025IFRS17(Year2025IFRS17Data);
    }
  }, [Year2025IFRS17Data,  onDataCalculated2025IFRS17]);

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
              {Year2025IFRS17Data.years.map(year => ( <th key={year} className="py-3 px-4 text-center font-semibold text-gray-700 border">{year}</th> ))}
            </tr>
          </thead>
          <tbody>

            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Average Premium Scalar</td>
              {Year2025IFRS17Data.averagePremiumScalar.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">NoP Scalar</td>
              {Year2025IFRS17Data.noPScalar.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 2)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Financial Year in SAR</td>
              {Year2025IFRS17Data.financialYears.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{value}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
               {/* ---change the setting here to fix the wrapping --- */}         
              <td className="py-2 px-4 border font-medium ">Date</td>
              {Year2025IFRS17Data.date.map((date, index) => (
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
              {Year2025IFRS17Data.expectedClaims.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Expected Expenses and Commissions </td>
              {Year2025IFRS17Data.expectedExpensesAndCommissions.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Release RA</td>
              {Year2025IFRS17Data.releaseRA.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
             <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Release of CSM</td>
              {Year2025IFRS17Data.releaseCSM.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

             <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Insurance Service Revenue</td>
              {Year2025IFRS17Data.insuranceServiceRevenue.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
             <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Actual Claims (excl. investment component)</td>
              {Year2025IFRS17Data.actualClaims.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
             <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Actual Expenses</td>
              {Year2025IFRS17Data.actualExpenses.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Increase in Loses </td>
              {Year2025IFRS17Data.increseInLoses.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Insurance Service Expense</td>
              {Year2025IFRS17Data.insuranceServiceExpense.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Insurance Service Result</td>
              {Year2025IFRS17Data.insuranceServiceResult.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            {/* --- REINSURANCE --- */}
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">REINSURANCE</td>
            </tr>
            <tr className="hover:bg-gray-50">
              {/* ---change the setting here to fix the wrapping --- */}
              <td className="py-2 px-4 border font-medium whitespace-nowrap">Expected Claims Recovery(excl. investment component)</td>
              {Year2025IFRS17Data.expectedClaimsRecovery.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Release of RI RA </td>
              {Year2025IFRS17Data.releaseOfRIRA.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Release of RI CSM </td>
              {Year2025IFRS17Data.releaseOfRICSM.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Reinsurance Revenue</td>
              {Year2025IFRS17Data.reinsuranceRevenue.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Actual Claims Recovery( excl. Investment Component)</td>
              {Year2025IFRS17Data.actualClaimsRecovery.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Amount Recovered From Insurance</td>
              {Year2025IFRS17Data.amtRecoveredFromRe.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Reinsurance Service Result </td>
              {Year2025IFRS17Data.reServiceResult.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium">Net Insurance Finance Income and Expense</td>
              {Year2025IFRS17Data.netInsuranceFinINandEX.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

            <tr className="hover:bg-gray-50">
              <td className="py-2 px-4 border font-medium"> IFRS17 Profit </td>
              {Year2025IFRS17Data.IFRS17Profit.map((value, index) => ( <td key={index} className="py-2 px-4 border text-right">{formatNumber(value, 0)}</td> ))}
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BaseIFRS17Tab;





