
// IFRS4Out.jsx (Corrected)

import React, { useEffect, useMemo, useState} from "react";
import { irr } from 'financial'; // Correct
import { npv } from "financial";
import { ChevronRight, ChevronDown } from 'lucide-react';


const IFRS17Out = ({
  formData,
  extractionResults,
  onDataCalculatedIFRS17Out

}) => {
  const ifrs17OutputData = useMemo(() => {

    // Add this check at the very beginning
    if (!extractionResults ) {
      return null; // Exit early if the required data isn't ready
    }
  
   
    const years = Array.from({ length: 30 }, (_, i) => i + 1); // chnage this to make it dynamic 
    const financialYears = years.map((_, index) => 2025 + index); // chnage this to make it dynamic 
    const modelPoints = formData.modelPointInputs || [];
    const policyCounts = formData.businessProjections?.policyCount || {};
    const valuationDate = formData.valuationDate; 
    const totalWeight = modelPoints.reduce((sum, point) => sum + (point['Weightage'] || 0), 0);
    const targetYears = [2025,2026,2027,2028,2029];// this can be made dynamic later

    const calculateFromSameFinancialRow = (columnName) => {
      return financialYears.map((financialYear) => {
        if (!Array.isArray(extractionResults.newData)) return 0;
        let total = 0;
        targetYears.forEach((tyYear , i) => {
          const yearToFind = financialYear - i;

          const sumForYear = extractionResults.newData
            .filter(row => row.Year === yearToFind)
            .reduce((sum, row) => sum + (row[columnName] || 0), 0);

          total += sumForYear * policyCounts[tyYear];
        });
        return total;
      });
    };
    const calculateFromDifferentFinancialRow = (columnName) => {
      return financialYears.map((financialYear) => {
        if (!Array.isArray(extractionResults.newData)) return 0;
        let total = 0;

        targetYears.forEach((tyYear , i) => {
          const columnToFind = `${columnName}_${tyYear}`
          const yearToFind = financialYear - i;

          const sumForYear = extractionResults.newData
             .filter(row => row.Year === yearToFind)
            .reduce((sum, row) => sum + (row[columnToFind] || 0), 0);
          total += sumForYear * policyCounts[tyYear];
        });

        return total;
      });
    };

        // NPV helper function - this is correct
    const calculateNPV = (rate, cashFlows) => {
      return cashFlows.reduce((npv, cashFlow, index) => {
        return npv + cashFlow / Math.pow(1 + rate, index + 1);
      }, 0);
    };




    // DONT USE THE OUT PUT DATA FOR CALCULATIONS USE THE EXTRACTION DATA DIRECTLY -- 
    const expectedClaimExclInvestmentComponenet = financialYears.map(( val, i ) => {
        return calculateFromSameFinancialRow('NUDeathClaims')[i] + calculateFromSameFinancialRow('SurrenderClaimsNU')[i] ;
    })

    const expectedRenewalExpenses  = financialYears.map (( val , i ) =>{
    return calculateFromSameFinancialRow('RenewalCommission')[i]
    + calculateFromDifferentFinancialRow('VendorCommission')[i] 
    + calculateFromDifferentFinancialRow( 'VendorFixedFee')[i]
    + calculateFromDifferentFinancialRow('RenewalExpense')[i] 
    + calculateFromSameFinancialRow('InvestmentExpenses')[i]
    }
    )
    const expectedRenewalCommission = calculateFromSameFinancialRow('RenewalCommission');

    const releaseOfRa = calculateFromDifferentFinancialRow('RARelease');
    const releaseOfCsm = calculateFromDifferentFinancialRow('CSMReleaseMax')
    const insuranceServiceRevenue = financialYears.map (( val, i ) => {
        return expectedClaimExclInvestmentComponenet[i]+ 
        expectedRenewalExpenses[i] + expectedRenewalCommission[i]
        + releaseOfRa[i] + releaseOfCsm[i]
    })

    const actualClaims = expectedClaimExclInvestmentComponenet;
    const actualRenewalExpenses = expectedRenewalExpenses;
    const actualRenewalCommission = expectedRenewalCommission;
    const increaseInLosses = calculateFromDifferentFinancialRow('IncreaseInLosses')

    const insuranceServiceExpense = actualClaims.map (( val, i ) => 
    val + actualRenewalExpenses[i] + actualRenewalCommission[i] + increaseInLosses[i])
    
    const insuranceServiceResult =  insuranceServiceRevenue.map (( val , i ) => val - insuranceServiceExpense[i])

    const expectedClaimRecoveryExclIvestmentComponenet = financialYears.map((val , i) => -1 * calculateFromSameFinancialRow('RIShareOfClaimsPaid')[i]) ;

    const releaseOfRiRa = calculateFromSameFinancialRow( 'ReinRARelease');
    // this has slightly different values - coming from extraction tab
    const releaseOfRiCsm = calculateFromSameFinancialRow( 'RICSMRelease');
    const reinsuranceRevenue = expectedClaimRecoveryExclIvestmentComponenet.map (( val , i ) =>
    val + releaseOfRiRa[i] + releaseOfRiCsm[i] )

    const actualClaimsRecovery = expectedClaimRecoveryExclIvestmentComponenet;
    const amountRecoveredFromReinsurance = actualClaimsRecovery;
    const reinsuranceServiceResult = reinsuranceRevenue.map (( val , i ) => val - amountRecoveredFromReinsurance[i])

    const netInsuranceFinanceIncomeAndExpense = financialYears.map( (val, i) => - 1 * calculateFromSameFinancialRow('InterestEarnedOnRICSM')[i] );

    const investmentIncomeNuLiability = calculateFromDifferentFinancialRow('InvestmentIncomeNufIfrs17');

    const ifrs17Profit = investmentIncomeNuLiability.map (( val , i) => {
        return val + netInsuranceFinanceIncomeAndExpense[i] +
        reinsuranceServiceResult[i] + insuranceServiceResult[i] 
    })

    const wht =  calculateFromDifferentFinancialRow( 'VendorFixedFee').map((vf, index) => {
      const vc =calculateFromDifferentFinancialRow('VendorCommission')[index] || 0;
      const pc = calculateFromSameFinancialRow('RIPremiums')[index] || 0;
      const rs = calculateFromSameFinancialRow('RIShareOfClaimsPaid')[index] || 0;
      const whtVenPay = formData.whtOnVendorPayments / 100 || 0;

      return whtVenPay * (vf + vc + pc - rs);
    });
    
    const zakat = ifrs17Profit.map ((val , i ) => 
        Math.max( formData.zakatTax/ 100 * ( val - wht[i]) , 0 ) )
    const policyHolderSurplusAt10Percent17 = ifrs17Profit.map(( val ,i ) =>
    0.1 * Math.max( val - zakat[i] - wht[i] , 0 ) 
    )   

    const netProfit17 = ifrs17Profit.map(( val , i ) => {
        return val - wht[i] - zakat[i] - 
        policyHolderSurplusAt10Percent17[i]
    })

  

    const npvpremiumAt6Percent17 = calculateNPV((1 + formData.flatInvestmentIncomeRate)/ 100, calculateFromSameFinancialRow('PremiumIncome')) * (1 + (1 + formData.flatInvestmentIncomeRate) / 100);
    const npvprofitAt6Percent17 = calculateNPV( (1 + formData.flatInvestmentIncomeRate)/100 , netProfit17 )

    const profitMargin17 = (npvprofitAt6Percent17 / npvpremiumAt6Percent17) * 100
    


    return {
        financialYears,
        expectedClaimExclInvestmentComponenet, 
        expectedRenewalExpenses, 
        expectedRenewalCommission, 
        releaseOfRa,
        releaseOfCsm,
        insuranceServiceRevenue, 
        actualClaims,
        actualRenewalExpenses,
        actualRenewalCommission,
        increaseInLosses,
        insuranceServiceExpense,
        insuranceServiceResult,

        
        expectedClaimRecoveryExclIvestmentComponenet,
        releaseOfRiRa,
        releaseOfRiCsm,
        reinsuranceRevenue,
        actualClaimsRecovery,
        amountRecoveredFromReinsurance,
        reinsuranceServiceResult,
        netInsuranceFinanceIncomeAndExpense,
        investmentIncomeNuLiability,
        ifrs17Profit,
        wht,
        zakat,
        policyHolderSurplusAt10Percent17,
        netProfit17,
        npvpremiumAt6Percent17,
        npvprofitAt6Percent17,
        profitMargin17
    
    };

  }, [formData, extractionResults ]);

  

  useEffect(() => {
    if (onDataCalculatedIFRS17Out) {
      onDataCalculatedIFRS17Out(ifrs17OutputData);
    }
  }, [ifrs17OutputData, onDataCalculatedIFRS17Out]);


  // a state to tract all the 
   const [expandedSections, setExpandedSections] = useState({});

  const formatNumber = (num) => {
  // Return a placeholder if the input isn't a valid number
  if (typeof num !== 'number' || isNaN(num)) {
    return '-';
  }

  // Check if the number is negative
  if (num < 0) {
    // Format the absolute value and wrap it in parentheses
    const formattedValue = Math.abs(num).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `(${formattedValue})`;
  }

  // Format positive numbers and zero as before
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};


   const formatPercent = (num, decimal) => {
    if (typeof num !== 'number') return '-';
    // Check if the number is negative
  if (num < 0) {
    // Format the absolute value and wrap it in parentheses
    const formattedValue = Math.abs(num).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `(${formattedValue})`;
  }

    return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: decimal });
  };
// ADD THIS 
  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };


  // Define the table structure with summary and detail fields

  const tableStructureGross = [
    {
      type: 'summary',
      key: 'insuranceServiceRevenue',
      label: 'Insurance Service Revenue',
      data: ifrs17OutputData.insuranceServiceRevenue,
      details: [
        {
          key: 'expectedClaimExclInvestmentComponenet',
          label: 'Expected Claim (Excl Investment Component)',
          data: ifrs17OutputData.expectedClaimExclInvestmentComponenet
        },
        {
          key: 'expectedRenewalExpenses',
          label: 'Expected Renewal Expenses',
          data: ifrs17OutputData.expectedRenewalExpenses
        },
        {
          key: 'expectedRenewalCommission',
          label: 'Expected Renewal Commission',
          data: ifrs17OutputData.expectedRenewalCommission
        },
        {
          key: 'releaseOfRa',
          label: 'Release Of RA',
          data: ifrs17OutputData.releaseOfRa
        },
        {
          key: 'releaseOfCsm',
          label: 'Release Of CSM',
          data: ifrs17OutputData.releaseOfCsm
        }
      ]
    },

    {
      type: 'summary',
      key: 'insuranceServiceExpense',
      label: 'Insurance Service Expense',
      data: ifrs17OutputData.insuranceServiceExpense,
      details: [
        {
          key: 'actualClaims',
          label: 'Actual Claims',
          data: ifrs17OutputData.actualClaims
        },
        {
          key: 'actualRenewalExpenses',
          label: 'Actual Renewal Expenses',
          data: ifrs17OutputData.actualRenewalExpenses
        },
        {
          key: 'actualRenewalCommission',
          label: 'Actual Renewal Commission',
          data: ifrs17OutputData.actualRenewalCommission
        },
        {
          key: 'increaseInLosses',
          label: 'Increase In Losses',
          data: ifrs17OutputData.increaseInLosses
        }
      ]
    },
    {
      type: 'standalone',
      key: 'insuranceServiceResult',
      label: 'Insurance Service Result',
      data: ifrs17OutputData.insuranceServiceResult,
     
    },
  ]
  const tableStructureRe = [
    {
      type : 'summary',
      key : 'reinsuranceRevenue', 
      label : 'Reinsurance Revenue' , 
      data : ifrs17OutputData.reinsuranceRevenue,
      details: [
        {
          key : 'expectedClaimRecoveryExclIvestmentComponenet' ,
          label : 'Expected Claim Recovery (Excl. Ivestment Componenet)' , 
          data: ifrs17OutputData.expectedClaimRecoveryExclIvestmentComponenet
        },
        {
          key : 'releaseOfRiRa' , 
          label : 'Release Of RI RA' ,
          data: ifrs17OutputData.releaseOfRiRa
        },
        {
          key : 'releaseOfRiCsm' ,
          label : 'Release Of RI CSM' ,
            data: ifrs17OutputData.releaseOfRiCsm
        }
      ]
    },

    {
      type : 'summary',
      key : 'amountRecoveredFromReinsurance',
        label : 'Amount Recovered  From Reinsurance'  , 
        data : ifrs17OutputData.amountRecoveredFromReinsurance,
      details: [
        {
          key : 'actualClaimsRecovery' ,
          label : 'Actual Claims Recovery (excl. Investment Component)' 
          , data: ifrs17OutputData.actualClaimsRecovery
        },
      ]
    },

    {
      type : 'standalone',
      key : 'reinsuranceServiceResult', 
      label : 'Reinsurance Service Result'  ,
      data : ifrs17OutputData.reinsuranceServiceResult,
      },

    ]
  const profitKeys = [
     
        {
          type : 'standalone',
          key : 'netInsuranceFinanceIncomeAndExpense', 
          label : 'Net Insurance Finance Income and Expense'  ,
          data : ifrs17OutputData.netInsuranceFinanceIncomeAndExpense,
        },
        {
          type : 'standalone',
          key : 'investmentIncomeNuLiability',
          label : 'Investment Income on Non-Unit Liability'  ,
          data : ifrs17OutputData.investmentIncomeNuLiability,
        },
         {
        type: 'standalone',
        key : 'ifrs17Profit',
        label : 'Net Insurance Service Result'  ,
        data : ifrs17OutputData.ifrs17Profit,
          },

      {
      type: 'summary',
      key: 'netProfit17', // Use the actual calculated data key
      label: 'Net Profit after Surplus, WHT and Zakat',
      data: ifrs17OutputData.netProfit17, // Add the missing data property
      details: [
        { 
          key: 'wht',
          label: 'WHT',
          data: ifrs17OutputData.wht
        },
        { 
          key: 'zakat',
          label: 'Zakat',
          data: ifrs17OutputData.zakat
        },
        {
          key: 'policyHolderSurplusAt10Percent17',
          label: 'Policyholder Surplus @ 10%',
          data: ifrs17OutputData.policyHolderSurplusAt10Percent17
        },
        { 
          key: 'ifrs17Profit',
          label: 'Net Insurance Service Resul',
          data: ifrs17OutputData.ifrs17Profit
        },
      ]
      } 
    ];  

  const renderRow = (item, isDetail = false, detailLevel = 0) => {
   const paddingLeft = isDetail ? `${(detailLevel + 1) * 48}px` : item.type === 'summary'? '16px' : '20px';
    
    return (
      <tr key={item.key} className={`hover:bg-gray-50 ${isDetail ? 'bg-gray-25' : ''}`}>
        <td className="py-2 px-4 border font-medium" style={{ minWidth: '350px' }}>
          <div className="flex items-center" style={{ paddingLeft }}>
            {item.type === 'summary' && (
              <button
                onClick={() => toggleSection(item.key)}
                className="mr-2 p-1 hover:bg-gray-200 rounded"
              >
                {expandedSections[item.key] ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            )}
            <span className={(item.type === 'summary' || item.type === 'standalone') ? 'font-bold' : 'font-medium'}>
              {item.label}
            </span>
          </div>
        </td>
        {item.data.map((val, i) => (
          <td key={i} className="py-2 px-4 border text-right">
            {formatNumber(val, 2)}
          </td>
        ))}
      </tr>
    );
  };


  if (!ifrs17OutputData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">IFRS17 Output Summary</h2>
        <p>Calculating IFRS17 output data...</p>
      </div>
    );
  }

  // --- FIX 1: The JSX now maps directly over the arrays in ifrs4OutputData ---
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">Financials Output in {formData.currency} </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            
          
            <tr className="bg-gray-100">
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border" style={{ minWidth: '390px' }}>Financial Year</th>
              {ifrs17OutputData?.financialYears?.map(year => (<th key={year} className="py-3 px-4 text-center font-semibold text-gray-700 border">{year}</th>))}
            </tr>
              <tr className="bg-gray-60">
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border " style={{ minWidth: '350px' }}>GROSS</th>
              {ifrs17OutputData?.financialYears?.map(year => (<th key={year} className="py-3 px-4 text-center font-semibold text-gray-700 border"></th>))}
            </tr>
          </thead>
          <tbody>
              
            {tableStructureGross.map(section => (
              <React.Fragment key={section.key}>
                {renderRow(section)}
                {expandedSections[section.key] && section.details.map(detail => 
                  renderRow(detail, true, 0)
                )}
              </React.Fragment>
            ))}
          </tbody>
          
          
            <tr className="bg-gray-60">
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border " style={{ minWidth: '350px' }}>REINSURANCE</th>
              {ifrs17OutputData?.financialYears?.map(year => (<th key={year} className="py-3 px-4 text-center font-semibold text-gray-700 border"></th>))}
            </tr>
           <tbody>
            {tableStructureRe.map(section => (
              <React.Fragment key={section.key}>
                {renderRow(section)}
                {expandedSections[section.key] && section.details.map(detail => 
                  renderRow(detail, true, 0)
                )}
              </React.Fragment>
            ))}
          </tbody>
          <tr>
              <td colSpan={ifrs17OutputData?.financialYears?.length + 1} className="border py-2">
                &nbsp;
              </td>
            </tr>
          
          
            <tbody>
            {profitKeys.map(section => (
              <React.Fragment key={section.key}>
                {renderRow(section)}
                {expandedSections[section.key] && section.details.map(detail => 
                  renderRow(detail, true, 0)
                )}
              </React.Fragment>
            ))}
          </tbody>
          <tr>
              <td colSpan={ifrs17OutputData?.financialYears?.length + 1} className="border py-2">
                &nbsp;
              </td>
            </tr>

        </table>
    
      </div>
      <div className="flex justify-between gap-3 text-base font-medium bg-white p-4 rounded-md shadow">
         
        <div className="flex-1 border p-4 hover:bg-gray-50 flex flex-col">
          <span className="text-gray-700 text-base font-medium">NPV Premiums @ 6%</span>
          <span className="text-right text-base font-medium text-black">{formatNumber(ifrs17OutputData.npvpremiumAt6Percent17)}</span>
        </div>
        <div className="flex-1 border p-4 hover:bg-gray-50 flex flex-col">
          <span className="text-gray-700 text-base font-medium">NPV Profit @ 6%</span>
          <span className="text-right text-base font-medium text-black">{formatNumber(ifrs17OutputData.npvprofitAt6Percent17)}</span>
        </div>
        <div className="flex-1 border p-4 hover:bg-gray-50 flex flex-col">
          <span className="text-gray-700 text-base font-medium">Profit Margin</span>
          <span className="text-right text-base font-medium text-black">{formatPercent(ifrs17OutputData.profitMargin17, 2) + "%"}</span>
        </div>
      </div>
    </div>
  );
};

export default IFRS17Out;

// ------------------------------------------------------------deal with thsi 
// the npv prfits for ifrs 4 - why is it not working 
// the IRR ISSUE HOW IS IT SUPPOSE TO BE CALCULATED 
// CSM RELEASE OR THE RA RELEASE THAT DOESNT WORK OUT IN THE IFRS 17 ONE, THIS IS MAKING THE VALUES GO HAYWIRE 
// CHNAGE THE NAMES FOR THE IFRS 17 ONES AND THE FONT SIZE FOR THE IFRS 4 ONES 
