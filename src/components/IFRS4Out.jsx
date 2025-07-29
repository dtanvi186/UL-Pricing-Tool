
// IFRS4Out.jsx (Corrected)

import  React, { useEffect, useMemo, useState } from "react";
import { ChevronRight, ChevronDown } from 'lucide-react';
import { irr } from 'financial'; // Correct
import { npv } from "financial";
import  WaterfallChart from './Charts'; // Adjust path as needed
import CustomPieChart from "./Piechart"

const IFRS4Out = ({
  formData,
  extractionResults,
  onDataCalculatedIFRS4Out
}) => {



  const ifrs4OutputData = useMemo(() => {
  
   
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

     // NPV helper function - this is correct
    const calculateNPV = (rate, cashFlows) => {
      return cashFlows.reduce((npv, cashFlow, index) => {
        return npv + cashFlow / Math.pow(1 + rate, index + 1);
      }, 0);
    };

    const grossWrittenPremiums = calculateFromSameFinancialRow('PremiumIncome');
    const premiumsCeded = calculateFromSameFinancialRow('RIPremiums');
    const netWrittenContributions = premiumsCeded.map((val, i ) => grossWrittenPremiums[i] - val );

    const allocationCharges = calculateFromSameFinancialRow('AllocationChargeAmount');
    

    const adminFee = calculateFromSameFinancialRow('AdminFee');
    const coi = calculateFromSameFinancialRow('COI');
    const fundManagementCharges = calculateFromSameFinancialRow('FundManagementChargeAmount');
    const surrenderCharges = calculateFromSameFinancialRow('SurrenderChargesAmount');
    const totalRevenue = netWrittenContributions;
    const grossDeathRiderClaimsUnit = calculateFromSameFinancialRow('DeathUnitOutgo');
    const grossDeathRiderClaimsNonUnit = calculateFromSameFinancialRow('NUDeathClaims');
    const grossSurrenderClaimsUnit = calculateFromSameFinancialRow('SurrUnitOutgo');
    const grossSurrenderClaimsNonUnit = calculateFromSameFinancialRow('SurrenderClaimsNU');
    const grossMaturityClaims = calculateFromSameFinancialRow('UnitMaturityOutgo');
    const reinsuranceShare = calculateFromSameFinancialRow('RIShareOfClaimsPaid');

    const netClaimsPaid = grossDeathRiderClaimsUnit.map((gdcU, index) => {
      const gdcNU = grossDeathRiderClaimsNonUnit[index] || 0;
      const gsc = grossSurrenderClaimsUnit[index] || 0;
      const gscNU = grossSurrenderClaimsNonUnit[index] || 0;
      const gmc = grossMaturityClaims[index] || 0;
      const rsc = reinsuranceShare[index] || 0;
      return (gdcU + gdcNU + gsc + gscNU + gmc) - rsc;
    });

    const loyaltyBonus = calculateFromSameFinancialRow('LoyaltyBonusAmount');
    const initialCommission = calculateFromSameFinancialRow('InitialCommission');
    const renewalCommission = calculateFromSameFinancialRow('RenewalCommission');


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

    const acquisitionExpenses = calculateFromDifferentFinancialRow('InitialExpense');
    const maintenanceExpenses = calculateFromDifferentFinancialRow('RenewalExpense');
    const vendorCommission = calculateFromDifferentFinancialRow('VendorCommission');
    const vendorFixedFee = calculateFromDifferentFinancialRow( 'VendorFixedFee');
    const changeInUnitReserves = calculateFromSameFinancialRow('ChangeInUnitFund');
    const changeInNetNonUnitReserves = calculateFromDifferentFinancialRow('ChangeInNetNonUnitReserves')
    const fundManagementExpense = calculateFromSameFinancialRow('InvestmentExpenses');
    const interestEarnedUnitFund = calculateFromSameFinancialRow('InvestmentIncomeUF');
    const interestEarnedNonUnitFund = calculateFromDifferentFinancialRow('InvestmentIncomeNuf')

    // used for collapsed values
    const totalExpenses = initialCommission.map(( val , i) => {
      return val +
      renewalCommission[i]+ acquisitionExpenses[i] + maintenanceExpenses[i] + vendorCommission[i] + vendorFixedFee[i] + fundManagementExpense[i] 
    })
    const changesInReserves = changeInUnitReserves.map (( val , i ) => val + changeInNetNonUnitReserves[i])
    const investmentIncome = interestEarnedUnitFund.map(( val , i) => val + interestEarnedNonUnitFund[i])
    const emptyArray = financialYears.map(() => "");

    const netProfit = totalRevenue.map ((tr , index ) => {

        const ncp = netClaimsPaid[index] || 0;
        
        const ic = initialCommission[index] || 0;
        const rc = renewalCommission[index] || 0;
        const ae = acquisitionExpenses[index] || 0;
        const me = maintenanceExpenses[index] || 0;
        const vc = vendorCommission[index] || 0;
        const vf = vendorFixedFee[index] || 0;
        const fme = fundManagementExpense[index] || 0;
        const cu = changeInUnitReserves[index] || 0;
        const cnu = changeInNetNonUnitReserves[index] || 0;

        const iu = interestEarnedUnitFund[index] || 0;
        const inu = interestEarnedNonUnitFund[index] || 0;

        return tr - ncp - (ic+ rc + ae  + me + vc + vf  + fme + cu + cnu ) + (iu + inu) 

    });


    const whtOnVendorPayouts = vendorFixedFee.map((vf, index) => {
      const vc = vendorCommission[index] || 0;
      const pc = premiumsCeded[index] || 0;
      const rs = reinsuranceShare[index] || 0;
      const wht = formData.whtOnVendorPayments / 100 || 0;

      return wht * (vf + vc + pc - rs);
    });

     const zakat = netProfit.map((np , index) => {
        const wht = whtOnVendorPayouts[index]|| 0;
       return Math.max( (np - wht ) * formData.zakatTax / 100 , 0 )
    })

    
    
    const policyHolderSurplus  = netProfit.map ((np , index ) => {
        const wht = whtOnVendorPayouts[index] || 0;
        const z = zakat[index] || 0;
        return Math.max( (np - wht - z) * 0.1 , 0 )
    })

   
    // this is after wht zakat phs 
    const netProfitAfterZakat = zakat.map((z, index) => {
        const np = netProfit[index] || 0;
        const wht = whtOnVendorPayouts[index] || 0 ;
        const phs = policyHolderSurplus[index] || 0 ;
        return np - z - wht - phs;

    })


    const pvZakat = calculateNPV( 0.06, zakat )
    const pvnp = calculateNPV( 0.06, netProfit) ;
    const pvwht = calculateNPV( 0.06 , whtOnVendorPayouts)
    const pvphs = calculateNPV( 0.06, policyHolderSurplus) 
    


const npvPremiumsAt6Percent = calculateNPV((formData.flatInvestmentIncomeRate + 1)/100, grossWrittenPremiums) * (1 + (formData.flatInvestmentIncomeRate + 1)/100);
let checkNpcpremium = [];
 
        try {
          // Use the library's IRR function. The spread operator (...) is important
          checkNpcpremium = npv((formData.flatInvestmentIncomeRate + 1)/100, grossWrittenPremiums) ; // The result is already a percentage value from this library
        } catch (e) {
         
          checkNpcpremium = NaN; // Set to NaN if calculation fails
        }

       


//ask about this later --- dont forhettttt
const npvProfitAt6Percent =  calculateNPV( (formData.flatInvestmentIncomeRate + 1)/100, netProfitAfterZakat) ; 
const npvProfitAt5Percent =  calculateNPV( (formData.flatInvestmentIncomeRate )/100, netProfitAfterZakat)  

const profitMargin = (npvProfitAt6Percent / npvPremiumsAt6Percent ) * 100; 

const policyHolderIrrCashflow = grossWrittenPremiums.map((gwp, index) => {
  const gdcU = grossDeathRiderClaimsUnit[index] || 0;
  const gdcNU = grossDeathRiderClaimsNonUnit[index] || 0;
  const gsc = grossSurrenderClaimsUnit[index] || 0;
  const gscNU = grossSurrenderClaimsNonUnit[index] || 0;
  const gmc = grossMaturityClaims[index] || 0;
  return - gwp + gdcNU + gdcU + gsc + gscNU + gmc;
});
        // 3. NEW IRR CALCULATION
        let phirr = 0; // Policyholder IRR
        try {
          // Use the library's IRR function. The spread operator (...) is important!
         
          phirr = irr(policyHolderIrrCashflow) * 100; // The result is already a percentage value from this library
        } catch (e) {
          console.error("Could not calculate Policyholder IRR:", e);
          phirr = NaN; // Set to NaN if calculation fails
        }

        console.log(`this is my IRR: ${(phirr).toFixed(4)}%`); 

        //calculate  the vendor profit - take the npv at 5 % -- hardcoded 
        const vendorProfit =  
        calculateNPV(formData.flatInvestmentIncomeRate/ 100 , premiumsCeded ) -
        calculateNPV( formData.flatInvestmentIncomeRate/ 100 , reinsuranceShare )+
        calculateNPV( formData.flatInvestmentIncomeRate/ 100, vendorCommission )+
        calculateNPV( formData.flatInvestmentIncomeRate/ 100 , vendorFixedFee) // dsiplayed 

        const SAICOProfit = npvProfitAt6Percent; // displayed 
        
        const profitBeforeVendorPayment  =  vendorProfit + SAICOProfit; // displayed 

        const costToCompany = financialYears.map(( val, i ) =>
        - grossWrittenPremiums[i] + premiumsCeded[i] + 
        initialCommission[i] + renewalCommission[i] +
        acquisitionExpenses[i] + maintenanceExpenses[i]+
        vendorCommission[i] + vendorFixedFee[i] +
        netClaimsPaid[i] + whtOnVendorPayouts[i] + 
        zakat[i] + policyHolderSurplus[i]
       )

       let costToCompanyIrr = 0; // Policyholder IRR
        try {
          // Use the library's IRR function. The spread operator (...) is important!
          costToCompanyIrr = irr(costToCompany) * 100; // The result is already a percentage value from this library
        } catch (e) {
          console.error("Could not calculate cost to company  IRR:", e);
          costToCompanyIrr = NaN; // Set to NaN if calculation fails
        }

       const shareholderIrr = 5 - costToCompanyIrr;  // displayed 


       // --------------------------------------------------------------------------------------------------------chart data - calculate npvs - calculated at 5% 

       const PVCharges = 
       (calculateNPV( formData.flatInvestmentIncomeRate/ 100 , allocationCharges) + 
       calculateNPV(formData.flatInvestmentIncomeRate/ 100, adminFee)+
       calculateNPV( formData.flatInvestmentIncomeRate/ 100, fundManagementCharges) +
       calculateNPV( formData.flatInvestmentIncomeRate/ 100 , coi) +
       calculateNPV( formData.flatInvestmentIncomeRate/ 100 , surrenderCharges) ) 

       const pvLoyaltyBonus = calculateNPV(formData.flatInvestmentIncomeRate/ 100 , loyaltyBonus);
       const pvsalescommission = calculateNPV( formData.flatInvestmentIncomeRate/ 100 ,initialCommission ) + calculateNPV( formData.flatInvestmentIncomeRate/ 100 , renewalCommission);
       const pvacqexpenses = calculateNPV(formData.flatInvestmentIncomeRate/ 100, acquisitionExpenses);
      const pvmainexpesn = calculateNPV(formData.flatInvestmentIncomeRate/ 100, maintenanceExpenses);
      const pvfundManagementExpense = calculateNPV(formData.flatInvestmentIncomeRate/ 100, fundManagementExpense);
      const pvtotalExpenses = pvacqexpenses+ pvmainexpesn+pvfundManagementExpense;
      const pvceded = calculateNPV(formData.flatInvestmentIncomeRate/ 100, premiumsCeded);
      const pvgrossClaims = calculateNPV(formData.flatInvestmentIncomeRate/ 100, grossDeathRiderClaimsNonUnit);
      const pvrirecovery = calculateNPV(formData.flatInvestmentIncomeRate/ 100, reinsuranceShare);
      const pvvendorCom = calculateNPV(formData.flatInvestmentIncomeRate/ 100, vendorCommission) + calculateNPV(formData.flatInvestmentIncomeRate/ 100, vendorFixedFee);
      const pvzakat = calculateNPV(formData.flatInvestmentIncomeRate/ 100, zakat);
      const pvpolicyHolderSurplus = calculateNPV(formData.flatInvestmentIncomeRate/ 100, policyHolderSurplus);
      const pvnetprofit  = PVCharges - ( pvLoyaltyBonus +
        pvsalescommission + pvacqexpenses + pvmainexpesn+ pvfundManagementExpense + 
      pvceded + pvgrossClaims + pvvendorCom  +
       pvzakat +pvpolicyHolderSurplus ) + pvrirecovery;

      const costOfReserves  = npvProfitAt5Percent - npvProfitAt6Percent;

      console.log( " this is the cost of reserves", costOfReserves)
      
      const ratioofprofits  = 1;
      const finalpvcharges = ratioofprofits * PVCharges / 1000000;
      const finalpvLoyaltyBonus = ratioofprofits * pvLoyaltyBonus / 1000000;
      const finalpvsalescommission = ratioofprofits * pvsalescommission / 1000000;
      const finalpvtotalExpenses = ratioofprofits * pvtotalExpenses / 1000000;
      const finalpvacqexpenses = ratioofprofits* pvacqexpenses / 1000000
      const finalpvmainexp = ratioofprofits*pvmainexpesn / 1000000
      const finalpvfundexpense = ratioofprofits* pvfundManagementExpense / 1000000;
      const finalpvceded = ratioofprofits * pvceded / 1000000;
      const finalpvgrossClaims = ratioofprofits * pvgrossClaims / 1000000;
      const finalpvrirecovery = ratioofprofits * pvrirecovery / 1000000;
      const finalpvvendorCom = ratioofprofits * pvvendorCom / 1000000;
      const finalpvzakat = ratioofprofits * pvzakat / 1000000;
      const finalpvpolicyHolderSurplus = ratioofprofits * pvpolicyHolderSurplus / 1000000;
      const finalpvcostOfReserves = ratioofprofits * costOfReserves/ 1000000;


const finalpvnetprofit = finalpvcharges - (
  finalpvLoyaltyBonus +
  finalpvsalescommission +
  finalpvtotalExpenses +
  finalpvceded +
  finalpvgrossClaims+
  finalpvvendorCom + 
  finalpvzakat +
  finalpvpolicyHolderSurplus+
  finalpvcostOfReserves
  ) + finalpvrirecovery;


 const waterfallChartData = [
  { name: "Premiums", value: finalpvcharges },
  { name: "Loyalty Bonus", value: -finalpvLoyaltyBonus },
  { name: "Sales Commission", value: -finalpvsalescommission },
  { name: "Total Expenses", value: -finalpvtotalExpenses },
  { name: "Premiums Ceded", value: -finalpvceded },
  { name: "Gross Claims", value: -finalpvgrossClaims },
  { name: "RI Recovery", value: finalpvrirecovery },
  { name: "Vendor Commissions", value: -finalpvvendorCom },
  { name: "Zakat", value: -finalpvzakat },
  { name: "Policyholder Surplus", value: -finalpvpolicyHolderSurplus },
  { name: "Cost Of Reserves", value: -finalpvcostOfReserves },
  { name: "Net Profit", value: finalpvnetprofit, isTotal: true } // Optional: mark final row as "total"
];

const pieChartData = [
  { name: "Direct Expenses" , value : finalpvacqexpenses},
  { name: "Indirect Expenses", value : finalpvmainexp} ,
  { name: "Investment Expenses", value : finalpvfundexpense}
]



const pvAllocationCharges = calculateNPV(formData.flatInvestmentIncomeRate/ 100, allocationCharges);
const pvAdminFee = calculateNPV(formData.flatInvestmentIncomeRate/ 100, adminFee);
const pvFundManagementCharges = calculateNPV(formData.flatInvestmentIncomeRate/ 100, fundManagementCharges);
const pvCOI = calculateNPV(formData.flatInvestmentIncomeRate/ 100, coi);
const pvSurrenderCharges = calculateNPV(formData.flatInvestmentIncomeRate/ 100, surrenderCharges);

const finalpvAllocationCharges = ratioofprofits * pvAllocationCharges / 1000000;
const finalpvAdminFee = ratioofprofits * pvAdminFee / 1000000;
const finalpvFundManagementCharges = ratioofprofits * pvFundManagementCharges / 1000000;
const finalpvCOI = ratioofprofits * pvCOI / 1000000;
const finalpvSurrenderCharges = ratioofprofits * pvSurrenderCharges / 1000000;

const pvChargeBreakdown = [
  { name: "Allocation Charges", value: finalpvAllocationCharges },
  { name: "Admin Fee", value: finalpvAdminFee },
  { name: "Fund Management Charges", value: finalpvFundManagementCharges },
  { name: "Risk Charges)", value: finalpvCOI },
  { name: "Surrender Charges", value: finalpvSurrenderCharges }
];


    return {
      financialYears, grossWrittenPremiums, premiumsCeded, netWrittenContributions,
      allocationCharges, adminFee, coi, fundManagementCharges, surrenderCharges,
      totalRevenue, grossDeathRiderClaimsUnit, grossDeathRiderClaimsNonUnit,
      grossSurrenderClaimsUnit, grossSurrenderClaimsNonUnit, grossMaturityClaims,
      reinsuranceShare, netClaimsPaid, loyaltyBonus, initialCommission,
      renewalCommission, acquisitionExpenses, maintenanceExpenses,
      vendorCommission, vendorFixedFee , changeInUnitReserves,changeInNetNonUnitReserves, interestEarnedUnitFund,
      interestEarnedNonUnitFund, netProfit,  whtOnVendorPayouts, zakat, netProfitAfterZakat, policyHolderSurplus, fundManagementExpense,
      npvPremiumsAt6Percent, npvProfitAt6Percent, policyHolderIrrCashflow, phirr, profitMargin,
      vendorProfit, SAICOProfit, profitBeforeVendorPayment, shareholderIrr, 
      finalpvnetprofit ,waterfallChartData, pieChartData,pvChargeBreakdown ,
       totalExpenses,
       changesInReserves , 
       investmentIncome,
       emptyArray
       // print to show the out put for the policy 
    };

  }, [formData, extractionResults ]);

  useEffect(() => {
    if (onDataCalculatedIFRS4Out) {
      onDataCalculatedIFRS4Out(ifrs4OutputData);
    }
  }, [ifrs4OutputData, onDataCalculatedIFRS4Out]);
  
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

   const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // render values - 
  const tableNetWrittenContributions = [
    {
      type: 'summary' ,
      key : 'netWrittenContributions',
      label: "Net Written Contributions",
      data : ifrs4OutputData.netWrittenContributions,
      details : [
        {

          key: 'grossWrittenPremiums',
          label : "Gross Written Premium",
          data: ifrs4OutputData.grossWrittenPremiums,
        },
        {
          key: 'premiumsCeded',
          label : "Premiums Ceded ",
          data: ifrs4OutputData.premiumsCeded,
        }
      ]
    },
  ]
  const tableNetClaimsPaid = [
    {
      type: 'summary',
      key : 'netClaimsPaid',
      label : 'Net Claims Paid',
      data : ifrs4OutputData.netClaimsPaid,
      details : [
        {
          key: 'grossDeathRiderClaimsUnit',
          label: 'Gross Death and Rider Claims from Unit Fund',
          data : ifrs4OutputData.grossDeathRiderClaimsUnit
        },
        {
          key: 'grossDeathRiderClaimsNonUnit',
          label : " Gross Death and Rider Claims from non unit fund ",
          data : ifrs4OutputData.grossDeathRiderClaimsNonUnit,
        },
        {
          key: 'grossSurrenderClaimsUnit',
          label : "Gross Surrender Claims from Unit fund",
          data : ifrs4OutputData.grossSurrenderClaimsUnit
        },
        {
          key: 'grossSurrenderClaimsNonUnit',
          label: " Gross Surrender Claims from Non Unit fund",
          data : ifrs4OutputData.grossSurrenderClaimsNonUnit
        },
        {
          key: 'grossMaturityClaims',
          label : "Gross Maturity Claims",
          data : ifrs4OutputData.grossMaturityClaims
        },
        {
          key : 'reinsuranceShare',
          label : "Reinsurance Share of Claims Paid ",
          data : ifrs4OutputData.reinsuranceShare
        }
      ]
    },
    {
      type: 'summary',
      key: 'totalExpenses' ,
      label : " Total Expenses",
      data : ifrs4OutputData.totalExpenses ,
      details : [
        {
          key: 'initialCommission',
          label : " Initial Commission",
          data : ifrs4OutputData.initialCommission
        },
        {
          key: 'renewalCommission',
          label : " Renewal Commission",
          data : ifrs4OutputData.renewalCommission
        },
         {
          key: 'acquisitionExpenses',
          label : "Acquisition Expenses ",
          data : ifrs4OutputData.acquisitionExpenses
        },
        {
          key: 'maintenanceExpenses',
          label: " Maintenance Expenses",
          data : ifrs4OutputData.maintenanceExpenses
        },
        {
          key : 'vendorCommission',
          label: " Vendor Commission ( % of charges)",
          data: ifrs4OutputData.vendorCommission
        },
        {
          key : 'vendorFixedFee',
          label : " Vendor Fixd Fee",
          data : ifrs4OutputData.vendorFixedFee
        },
        {
          key : 'fundManagemnetExpenses',
          label : " Fund Management Expense (Inv Exp) ",
          data: ifrs4OutputData.fundManagementExpense
        }
      ]
    },
    {
      type: 'summary',
      key : 'changesInReserves',
      label : " Changes in Reserves ",
      data : ifrs4OutputData.changesInReserves,
      details: [
        {
          key : 'changeInUnitReserves',
          label : " Changes in Unit Reserves" ,
          data : ifrs4OutputData.changeInUnitReserves
        },
        {
          key: 'changeInNetNonUnitReserves',
          label : " changes In Non Unit Reserves",
          data : ifrs4OutputData.changeInNetNonUnitReserves
        }
      ]
    },
    {
      type: 'summary' ,
      key : 'investmentIncome',
      label : " Investment Income",
      data : ifrs4OutputData.investmentIncome,
      details : [
        {
          key: 'interestEarnedUnitFund',
          label : " Interest Earned on Unit Fund ",
          data : ifrs4OutputData.interestEarnedUnitFund
        },
        {
          key: 'interestEarnedNonUnitFund',
          label : ' Interest Earned on Non Unit Fund ',
          data : ifrs4OutputData.interestEarnedNonUnitFund
        }
      ]
    },
  ]
  const tableProfitKeys = [
    {
      type: 'standalone',
      key : 'netProfit' ,
      label: " Net Profit before WHT, Zakat and PHS surplus",
      data : ifrs4OutputData.netProfit
    },
    {
      type: 'standalone',
      key : 'whtOnVendorPayouts' ,
      label: " WHT @ 15% on Vendor payouts ",
      data : ifrs4OutputData.whtOnVendorPayouts
    },
    {
       type: 'standalone',
      key : 'zakat' ,
      label: "Zakat @ 2.5%",
      data : ifrs4OutputData.zakat
    },
    {
      type: 'standalone',
      key : 'policyHolderSurplus',
      label: " Policyholder surplus @ 10%",
      data : ifrs4OutputData.policyHolderSurplus
    },
    {
      type: 'standalone',
      key: 'netProfitAfterZakat',
      label : "Net Profit after Surplus, WHT and Zakat",
      data : ifrs4OutputData.netProfitAfterZakat
    }
  ]
  const tableOtherCharges = [
    {
      type: 'summary',
      key : [],
      label : " Policy Charges",
      data :[],
      details: [
        {
          key : 'allocationCharges',
          label : ' Allocation Charges',
          data : ifrs4OutputData.allocationCharges,
        },
        {
          key : 'adminFee',
          label: ' Admin Fee',
          data : ifrs4OutputData.adminFee
        },
        {
          key : 'coi',
          label : "COI (Mortality and Rider Charge)",
          data : ifrs4OutputData.coi
        },
        {
          key: 'fundManagementCharges',
          label : 'Fund Management Charges',
          data : ifrs4OutputData.fundManagementCharges
        },
         {
          key: 'surrenderCharges',
          label : 'Surrender Charges',
          data : ifrs4OutputData.surrenderCharges
        },
        {
          key: 'loyaltyBonus',
          label : 'Loyalty Bonus',
          data : ifrs4OutputData.loyaltyBonus
        },
        {
          key : 'totalRevenue',
          label : "Total Revenue",
          data : ifrs4OutputData.totalRevenue
        }
      ]
    }
  ]

  const renderRow = (item, isDetail = false, detailLevel = 0) => {
    
    const paddingLeft = isDetail ? `${(detailLevel + 1) * 48}px` : item.type === 'summary'? '16px' : '20px';
    const isCollapsedSummary =
      item.type === 'summary' &&
      item.label === 'Policy Charges' &&
      !expandedSections[item.key];

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
         {/* Conditionally render data cells only if it's NOT a collapsed summary row */}
      {!isCollapsedSummary &&
        item.data?.map((val, i) => (
          <td key={i} className="py-2 px-4 border text-right">
            {formatNumber(val)}
          </td>
        ))}
      </tr>
    );
  };

  if (!ifrs4OutputData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">IFRS4 Output Summary</h2>
        <p>Calculating IFRS4 output data...</p>
      </div>
    );
  } 


  // --- FIX 1: The JSX now maps directly over the arrays in ifrs4OutputData ---
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6"> `Financials Output in {formData.currency}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border" style={{ minWidth: '420px' }}>Financial Year</th>
              {ifrs4OutputData.financialYears.map(year => (<th key={year} className="py-3 px-4 text-center font-semibold text-gray-700 border">{year}</th>))}
            </tr>
          </thead>

           <tbody>     
                      {tableNetWrittenContributions.map(section => (
                        <React.Fragment key={section.key}>
                          {renderRow(section)}
                          {expandedSections[section.key] && section.details.map(detail => 
                            renderRow(detail, true, 0)
                          )}
                        </React.Fragment>
                      ))}
           </tbody>
           
           <tbody>     
                      {tableNetClaimsPaid.map(section => (
                        <React.Fragment key={section.key}>
                          {renderRow(section)}
                          {expandedSections[section.key] && section.details.map(detail => 
                            renderRow(detail, true, 0)
                          )}
                        </React.Fragment>
                      ))}
           </tbody>
           
            <tr>
              <td colSpan={ifrs4OutputData?.financialYears?.length + 1} className="border py-2">
                &nbsp;
              </td>
            </tr>
        
            <tbody>     
                      {tableProfitKeys.map(section => (
                        <React.Fragment key={section.key}>
                          {renderRow(section)}
                          {expandedSections[section.key] && section.details.map(detail => 
                            renderRow(detail, true, 0)
                          )}
                        </React.Fragment>
                      ))}
           </tbody>
            <tr>
              <td colSpan={ifrs4OutputData?.financialYears?.length + 1} className="border py-2">
                &nbsp;
              </td>
            </tr>

            <tbody>     
                      {tableOtherCharges.map(section => (
                        <React.Fragment key={section.key}>
                          {renderRow(section)}
                          {expandedSections[section.key] && section.details.map(detail => 
                            renderRow(detail, true, 0)
                          )}
                        </React.Fragment>
                      ))}
           </tbody>
            <tr>
              <td colSpan={ifrs4OutputData?.financialYears?.length + 1} className="border py-2">
                &nbsp;
              </td>
            </tr>


        </table>
      </div>

    { /* water fall chart and the profit summary*/}
      <div className="flex flex-col lg:flex-row gap-6 mt-10">
        
          {/* Waterfall Chart */}
            <div className="flex-1 bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Summary Profit Metrics</h3>
            <table className="min-w-full border-collapse">
              
            
            <tbody> 
            <tr className="hover:bg-gray-50 font-bold">
                <td className="py-2 px-4 border">NPV Premiums at 6%</td>
                <td className="py-2 px-4 border text-right" >
                    {formatNumber(ifrs4OutputData.npvPremiumsAt6Percent) }
                </td>
                </tr>
            <tr className="hover:bg-gray-50 font-bold">
                <td className="py-2 px-4 border">NPV Profit at 6%</td>
                <td className="py-2 px-4 border text-right" >
                    {formatNumber(ifrs4OutputData.npvProfitAt6Percent)}
                </td>
                </tr>
            <tr className="hover:bg-gray-50 font-bold">
                <td className="py-2 px-4 border">Profit Margin</td>
                <td className="py-2 px-4 border text-right" >
                    {formatPercent(ifrs4OutputData.profitMargin) + "%" }
                </td>
                </tr>

            <tr className="hover:bg-gray-50 font-bold">
                <td className="py-2 px-4 border">Policyholdor IRR</td>
                <td className="py-2 px-4 border text-right" >
                    {formatPercent(ifrs4OutputData.phirr) + "%"}
                </td>
                </tr>
            <tr className="hover:bg-gray-50 font-bold">
                <td className="py-2 px-4 border">Shareholder IRR</td>
                <td className="py-2 px-4 border text-right" >
                    {formatPercent(ifrs4OutputData.shareholderIrr) + "%"}
                </td>
                </tr>
            
            
            <tr className="hover:bg-gray-50 font-bold">
                <td className="py-2 px-4 border">Profit Before vendor payments </td>
                <td className="py-2 px-4 border text-right" >
                    {formatNumber(ifrs4OutputData.profitBeforeVendorPayment)}
                </td>
                </tr>
            <tr className="hover:bg-gray-50 font-bold">
                <td className="py-2 px-4 border">Vendor Profit</td>
                <td className="py-2 px-4 border text-right" >
                    {formatNumber(ifrs4OutputData.vendorProfit)}
                </td>
                </tr>
            <tr className="hover:bg-gray-50 font-bold">
                <td className="py-2 px-4 border"> Company Profit</td>
                <td className="py-2 px-4 border text-right" >
                    {formatNumber(ifrs4OutputData.SAICOProfit)}
                </td>
                </tr>
              </tbody>
            </table>
            </div>
            <div className="flex-1 bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold mb-4">Net Profit Walk ({formData.currency})</h3>
              <WaterfallChart data={ifrs4OutputData.waterfallChartData} />
            </div>


        </div>
         <div className="flex flex-col lg:flex-row gap-6 mt-10">
  <div className="flex-1 bg-white rounded-lg shadow-md p-4">
    <h3 className="text-lg font-semibold mb-4">Expenses Break up</h3>
    <CustomPieChart 
      data={ifrs4OutputData.pieChartData} 
      colors={['#ffac4dff', '#bc572fff', '#ffd620ff', ]} // green tones
    />
  </div>
  
  <div className="flex-1 bg-white rounded-lg shadow-md p-4">
    <h3 className="text-lg font-semibold mb-4">Charges Break up</h3>
    <CustomPieChart 
      data={ifrs4OutputData.pvChargeBreakdown}
      colors={['#7796c1ff', '#375da3ff', '#0c3286ff', '#5d6476ff' , '#16213fff', ]} 
    />
  </div>
</div>

    </div>
  );
};

export default IFRS4Out;
