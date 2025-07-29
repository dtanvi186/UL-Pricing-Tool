import React, { useState } from 'react';

const ExtractionTab = ({  extractionResults,   }) => {
  const { newData: extractionData } = extractionResults;
  const [filterBySrNo, setFilterBySrNo] = useState('all');
  const targetYears = ['2025', '2026', '2027', '2028', '2029'];

  
  // Helper functions
  const yearlyHeaderKeys = [
        'InitialExpense', 'RenewalExpense', 'VendorCommission', 'VendorFixedFee', 'NlCfsSm',
        'GrossNonUnitFundReserves', 'ChangeInNetNonUnitReserves', 'InvestmentIncomeNuf', 'InvestmentIncomeNufIfrs17',
        'GrossNonUnitFundReservesIfrs17', 'GrossBEL', 'OpeningCsmMax', 'CSMVariableFeesMax', 'CSMReleaseMax', 'ClosingCsmMax',
        'PvOfTotalOutgo', 'RA', 'OpeningRA', 'RARelease', 'ClosingRA',
        'OpeningCSM', // Placeholder for potential future data key
        'CSMVariableFees', // Placeholder
        'CSMRelease', // Placeholder
        'ClosingCSM', // Placeholder
        'OpeningLossComponent', 'ClosingLossComponent', 'IncreaseInLosses'
      ];

  //create an array for headers 
  const generateYearlyHeaders = (year) => {
  const headerTitles = [
    "Initial Expense",
    "Renewal Expense",
    "Vendor Commission",
    "Vendor Fixed Fee",
    "NL CFS SM",
    "Gross Non Unit Fund Reserves",
    "Change in Net Non Unit Fund",
    "Investment Income NUF",
    "Investment Income NUF IFRS 17",
    "Gross Non Unit Fund Reserves IFRS 17",
    "Gross BEL",
    "Opening CSM",
    "CSM Variable Fees",
    "CSM Release",
    "Closing CSM",
    "PV of the Total Outgo",
    "RA",
    "Opening RA",
    "RA Release",
    "Closing RA",
    "Opening CSM (Reinsurance)", // Assuming this is for reinsurance based on pattern
    "CSM Variable Fees (Reinsurance)",
    "CSM Release (Reinsurance)",
    "Closing CSM (Reinsurance)",
    "Opening Loss Component",
    "Closing Loss Component",
    "Increase in Losses",
  ];

  return headerTitles.map(title => (
    <th key={`${title}-${year}`} className="py-3 px-4 text-left font-semibold text-gray-700 border">
      {`${title} ${year}`}
    </th>
  ));
};
  
  // Get filtered data based on selected SR_NO
  const getFilteredData = () => {
    if (filterBySrNo === 'all') {
      return extractionData;
    } else {
      const srNo = parseInt(filterBySrNo, 10);
      return extractionData.filter(row => row.SR_NO === srNo);
    }
  };
  
  // Get unique SR_NO values for the filter dropdown
  const getUniqueSrNos = () => {
    return Array.from(new Set(extractionData.map(row => row.SR_NO))).sort((a, b) => a - b);
  };
  
  const filteredData = getFilteredData();
  // A helper function to format the cell data
  const formatCell = (value) => {
    if (value === undefined || value === null) return '';
    return typeof value === 'number' ? value.toFixed(2) : value;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Extraction Data</h2>
      <p className="text-gray-600 mb-4">
        This table shows time series data for each model point from month 0 to Policy Term * 12 + 1 months.
      </p>
      
      <div className="mb-6">
        <div className="w-64">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by SR_NO</label>
          <select
            value={filterBySrNo}
            onChange={(e) => setFilterBySrNo(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="all">Show All</option>
            {getUniqueSrNos().map(srNo => (
              <option key={srNo} value={srNo}>{srNo}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredData.length} rows
        {filterBySrNo !== 'all' && ` for SR_NO: ${filterBySrNo}`}
      </div>
      
      <div className="overflow-y-auto max-h-[600px]">
        <table className="min-w-full border-collapse sticky-header">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="bg-gray-100">
             
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">SR_NO</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Policy Term</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">PPT</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Time in Months</th>
               
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Valuation Date</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Year</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Policy Year</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Age</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Loyalty Bonus</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Scalar</th>
             
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Surrender Charge fixed </th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Surrender Charge percent</th>



               

              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Commission</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Allocation Charge</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Death Option</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Sum Assured</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Monthly Interest Rate</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Death Rate</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Surrender Rate</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">NoP BoP</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">No of Deaths</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">No of Surrs</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">No of Mats</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">NoP EoP</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Premium Income</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Allocation Charge Amount</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Admin Fee</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Initial Commission</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Renewal Commission</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Initial Expense</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Renewal Expense</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Unit Fund Before Deduction</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Unit Fund After Deduction</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Unit Fund After Growth</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Unit Fund Inforce</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Fund Management Charge Amount</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Undecremented FV Before Deduction</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Undecremented FV After Unit Deductions</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Undecremented FV After Deduction BB</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Loyalty Bonus Amount</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Loyalty Bonus Per Policy</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Undecremented FV</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Undecremented Gross Sum at Risk</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Decremented Gross Sum at Risk</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">COI</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Death Unit Outgo</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Surrender Charges Amount</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Surr Unit Outgo</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Unit Maturity Outgo</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Death Benefit PP</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Death Outgo</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">NU Death Claims</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Non Unit Fund Reserves</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Undecremented RI Sum at Risk</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Decremented RI Sum at Risk</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">RI Share of Claims Paid</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">RI Premiums</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">RI Reserves</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Change in Unit Fund</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Change in Gross Non Unit Reserves</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Change in RI Reserves</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Investment Income UF</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">NL CFS SM</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">NL CFS EM</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Investment Income NUF</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Gross Coverage Units Inforce</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Rein Coverage Units Inforce</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Non Unit Fund Reserves IFRS</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">RI Reserves IFRS</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Gross BEL</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">PV of Premium</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">PV of Tot Outgo</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Gross RA</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">PV of RI Recovery</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Rein RA</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Opening Gross CSM</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">CSM Variable Fee</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">CSM Release Pattern</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">CSM Release</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Closing Gross CSM</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Opening Gross RA</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">RA Release</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Closing Gross RA</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Opening RI CSM</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">RI CSM Release Pattern</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Interest Earned on RI CSM</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">RI CSM Release</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Closing RI CSM</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Opening RI RA</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Rein RA Release</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Closing Rein RA</th>
              {/* new values here */}
              {/* --- DYNAMIC YEARLY HEADERS --- */}
              {targetYears.map(year => generateYearlyHeaders(year))}
             
              
              {/*<th className="py-3 px-4 text-left font-semibold text-gray-700 border">Initial Expense 2025</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Renewal Expense 2025</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">vendor commission 2025</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">vendor Fixed Fee 2025</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">NL CFS SM 2025</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">GROSS NON UNIT FUND RESERVES 2025</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Change in net non unit fund 2025</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">investment incoume NUF 2025</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">investment incoume NUF IFRS 17 2025</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">GROSS NON UNIT FUND RESERVES 17 2025</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Gross BEL 2025</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Opening CSM 2025</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">CSM Variable Fees 2025</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">CSM Release 2025</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Closing CSM 2025</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Pv of the Total Outgo 2025</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">RA 2025</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">OpeningRA 2025</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">RA Release 2025</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Closing RA 2025</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Opening CSM 2025</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">CSM Variable Fees 2025</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">CSM Release 2025</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Closing CSM 2025</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Opening loss component 2025</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Closing loss component 2025</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Increase in Losses 2025</th>

              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Initial Expense 2026</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Renewal Expense 2026</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">vendor commission 2026</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">vendor Fixed Fee 2026</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">NL CFS SM 2026</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">GROSS NON UNIT FUND RESERVES 2026</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Change in net non unit fund 2026</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">investment incoume NUF 2026</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">investment incoume NUF IFRS 17 2026</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">GROSS NON UNIT FUND RESERVES 17 2026</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Gross BEL 2026</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Opening CSM 2026</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">CSM Variable Fees 2026</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">CSM Release 2026</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Closing CSM 2026</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Pv of the Total Outgo 2026</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">RA 2026</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">OpeningRA 2026</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">RA Release 2026</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Closing RA 2026</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Opening CSM 2026</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">CSM Variable Fees 2026</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">CSM Release 2026</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Closing CSM 2026</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Opening loss component 2026</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Closing loss component 2026</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Increase in Losses 2026</th>
*/}


            </tr>
          </thead>
          <tbody>
            {filteredData.map((row) => (
              <tr key={`${row.SR_NO}-${row.TimeInMonths}`} className="hover:bg-gray-50">
                
                <td className="py-2 px-4 border">{row.SR_NO}</td>
                <td className="py-2 px-4 border">{row.PolicyTerm}</td>
                <td className="py-2 px-4 border">{row.PPT}</td>
                <td className="py-2 px-4 border">{row.TimeInMonths}</td>
                
                <td className="py-2 px-4 border">{row.ValuationDate}</td>
                <td className="py-2 px-4 border">{row.Year}</td>
                <td className="py-2 px-4 border">{row.PolicyYear}</td>
                <td className="py-2 px-4 border">{row.Age}</td>
                <td className="py-2 px-4 border">{row.LoyaltyBonus !== undefined ? `${row.LoyaltyBonus.toFixed(2)}%` : '0.00%'}</td>
                <td className="py-2 px-4 border">{row.Scalar !== undefined ? row.Scalar.toFixed(2) : '0.00'}</td>
                {/* 🔴 FIX: Change from percentage formatting to number formatting */}
                <td className="py-2 px-4 border">{row.SurrenderChargeFixed !== undefined ? row.SurrenderChargeFixed.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.SurrenderChargePercent !== undefined ? row.SurrenderChargePercent.toFixed(2) : '0.00'}</td>

                <td className="py-2 px-4 border">{row.Commission !== null && row.Commission !== undefined ? `${row.Commission.toFixed(2)}%` : ''}</td>
                <td className="py-2 px-4 border">{row.AllocationCharge !== null && row.AllocationCharge !== undefined ? `${row.AllocationCharge.toFixed(2)}%` : ''}</td>
                <td className="py-2 px-4 border">{row.Death_Option}</td>
                <td className="py-2 px-4 border">{row.SumAssured?.toLocaleString() || '0'}</td>
                <td className="py-2 px-4 border">{row.MonthlyInterestRate !== undefined ? (row.MonthlyInterestRate * 100).toFixed(4) + '%' : '0.0000%'}</td>
                <td className="py-2 px-4 border">{row.DeathRate !== undefined ? (row.DeathRate * 100).toFixed(8) + '%' : '0.00000000%'}</td>
                <td className="py-2 px-4 border">{row.SurrenderRate !== undefined ? (row.SurrenderRate * 100).toFixed(8) + '%' : '0.00000000%'}</td>
                <td className="py-2 px-4 border">{row.NoPBoP !== undefined ? row.NoPBoP.toFixed(6) : '0.000000'}</td>
                <td className="py-2 px-4 border">{row.NoOfDeaths !== undefined ? row.NoOfDeaths.toFixed(6) : '0.000000'}</td>
                <td className="py-2 px-4 border">{row.NoOfSurrs !== undefined ? row.NoOfSurrs.toFixed(6) : '0.000000'}</td>
                <td className="py-2 px-4 border">{row.NoOfMats !== undefined ? row.NoOfMats.toFixed(6) : '0.000000'}</td>
                <td className="py-2 px-4 border">{row.NoPEoP !== undefined ? row.NoPEoP.toFixed(6) : '0.000000'}</td>
                <td className="py-2 px-4 border">{row.PremiumIncome !== undefined ? row.PremiumIncome.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.AllocationChargeAmount !== undefined ? row.AllocationChargeAmount.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.AdminFee !== undefined ? row.AdminFee.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.InitialCommission !== undefined ? row.InitialCommission.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.RenewalCommission !== undefined ? row.RenewalCommission.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.InitialExpense !== undefined ? row.InitialExpense.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.RenewalExpense !== undefined ? row.RenewalExpense.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.UnitFundBeforeDeduction !== undefined ? row.UnitFundBeforeDeduction.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.UnitFundAfterDeduction !== undefined ? row.UnitFundAfterDeduction.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.UnitFundAfterGrowth !== undefined ? row.UnitFundAfterGrowth.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.UnitFundInforce !== undefined ? row.UnitFundInforce.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.FundManagementChargeAmount !== undefined ? row.FundManagementChargeAmount.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.UndecrementedFVBeforeDeduction !== undefined ? row.UndecrementedFVBeforeDeduction.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.UndecrementedFVAfterUnitDeductions !== undefined ? row.UndecrementedFVAfterUnitDeductions.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.UndecrementedFVAfterDeductionBB !== undefined ? row.UndecrementedFVAfterDeductionBB.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.LoyaltyBonusAmount !== undefined ? row.LoyaltyBonusAmount.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.LoyaltyBonusPerPolicy !== undefined ? row.LoyaltyBonusPerPolicy.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.UndecrementedFV !== undefined ? row.UndecrementedFV.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.UndecrementedGrossSumAtRisk !== undefined ? row.UndecrementedGrossSumAtRisk.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.DecrementedGrossSumAtRisk !== undefined ? row.DecrementedGrossSumAtRisk.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.COI !== undefined ? row.COI.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.DeathUnitOutgo !== undefined ? row.DeathUnitOutgo.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.SurrenderChargesAmount !== undefined ? row.SurrenderChargesAmount.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.SurrUnitOutgo !== undefined ? row.SurrUnitOutgo.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.UnitMaturityOutgo !== undefined ? row.UnitMaturityOutgo.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.DeathBenefitPP !== undefined ? row.DeathBenefitPP.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.DeathOutgo !== undefined ? row.DeathOutgo.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.NUDeathClaims !== undefined ? row.NUDeathClaims.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.NonUnitFundReserves !== undefined ? row.NonUnitFundReserves.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.UndecrementedRISumAtRisk !== undefined ? row.UndecrementedRISumAtRisk.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.DecrementedRISumAtRisk !== undefined ? row.DecrementedRISumAtRisk.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.RIShareOfClaimsPaid !== undefined ? row.RIShareOfClaimsPaid.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.RIPremiums !== undefined ? row.RIPremiums.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.RIReserves !== undefined ? row.RIReserves.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.ChangeInUnitFund !== undefined ? row.ChangeInUnitFund.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.ChangeInGrossNonUnitReserves !== undefined ? row.ChangeInGrossNonUnitReserves.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.ChangeInRIReserves !== undefined ? row.ChangeInRIReserves.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.InvestmentIncomeUF !== undefined ? row.InvestmentIncomeUF.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.NLCfsSm !== undefined ? row.NLCfsSm.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.NLCfsEm !== undefined ? row.NLCfsEm.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.InvestmentIncomeNUF !== undefined ? row.InvestmentIncomeNUF.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.GrossCoverageUnitsInforce !== undefined ? row.GrossCoverageUnitsInforce.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.ReinCoverageUnitsInforce !== undefined ? row.ReinCoverageUnitsInforce.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.NonUnitFundReservesIfrs !== undefined ? row.NonUnitFundReservesIfrs.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.RIReservesIfrs !== undefined ? row.RIReservesIfrs.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.GrossBel !== undefined ? row.GrossBel.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.PVOfPremium !== undefined ? row.PVOfPremium.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.PVOfTotOutgo !== undefined ? row.PVOfTotOutgo.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.GrossRA !== undefined ? row.GrossRA.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.PVOfRIRecovery !== undefined ? row.PVOfRIRecovery.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.ReinRA !== undefined ? row.ReinRA.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.OpeningGrossCSM !== undefined ? row.OpeningGrossCSM.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.CSMVariableFee !== undefined ? row.CSMVariableFee.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.CSMReleasePattern !== undefined ? (row.CSMReleasePattern * 100).toFixed(4) + '%' : '0.0000%'}</td>
                <td className="py-2 px-4 border">{row.CSMRelease !== undefined ? row.CSMRelease.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.ClosingGrossCSM !== undefined ? row.ClosingGrossCSM.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.OpeningGrossRA !== undefined ? row.OpeningGrossRA.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.RARelease !== undefined ? row.RARelease.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.ClosingGrossRA !== undefined ? row.ClosingGrossRA.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.OpeningRICSM !== undefined ? row.OpeningRICSM.toFixed(5) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.RICSMReleasePattern !== undefined ? (row.RICSMReleasePattern * 100).toFixed(5) + '%' : '0.0000%'}</td>
                <td className="py-2 px-4 border">{row.InterestEarnedOnRICSM !== undefined ? row.InterestEarnedOnRICSM.toFixed(5) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.RICSMRelease !== undefined ? row.RICSMRelease.toFixed(5) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.ClosingRICSM !== undefined ? row.ClosingRICSM.toFixed(5) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.OpeningRIRA !== undefined ? row.OpeningRIRA.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.ReinRARelease !== undefined ? row.ReinRARelease.toFixed(2) : '0.00'}</td>
                <td className="py-2 px-4 border">{row.ClosingReinRA !== undefined ? row.ClosingReinRA.toFixed(2) : '0.00'}</td> 
                
                 {/* --- DYNAMIC YEARLY DATA CELLS ---  */}
                  {targetYears.map(year => (
                  <React.Fragment key={year}>
                    {yearlyHeaderKeys.map(key => (
                      <td key={`${key}_${year}`} className="py-2 px-4 border">
                        {/* Access the flattened data using the dynamic key */}
                        {formatCell(row[`${key}_${year}`])}
                      </td>
                    ))}
                  </React.Fragment>
                ))}
                
                {/*}
                <td className="py-2 px-4 border">{row.InitialExpense_2025?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.RenewalExpense_2025?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.VendorCommission_2025?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.VendorFixedFee_2025?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.NlCfsSm_2025?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.GrossNonUnitFundReserves_2025?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.ChangeInNetNonUnitReserves_2025?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.InvestmentIncomeNuf_2025?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.InvestmentIncomeNufIfrs17_2025?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.GrossNonUnitFundReservesIfrs17_2025?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.GrossBEL_2025?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.OpeningCsmMax_2025?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.CSMVariableFeesMax_2025?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.CSMReleaseMax_2025?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.ClosingCsmMax_2025?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.PvOfTotalOutgo_2025?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.RA_2025?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.OpeningRA_2025?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.RARelease_2025?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.ClosingRA_2025?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.OpeningCSM_2025?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.CSMVariableFees_2025?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.CSMRelease_2025?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.ClosingCSM_2025?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.OpeningLossComponent_2025?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.ClosingLossComponent_2025?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.IncreaseInLosses_2025?.toFixed(2)}</td> 


                <td className="py-2 px-4 border">{row.InitialExpense_2026?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.RenewalExpense_2026?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.VendorCommission_2026?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.VendorFixedFee_2026?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.NlCfsSm_2026?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.GrossNonUnitFundReserves_2026?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.ChangeInNetNonUnitReserves_2026?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.InvestmentIncomeNuf_2026?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.InvestmentIncomeNufIfrs17_2026?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.GrossNonUnitFundReservesIfrs17_2026?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.GrossBEL_2026?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.OpeningCsmMax_2026?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.CSMVariableFeesMax_2026?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.CSMReleaseMax_2026?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.ClosingCsmMax_2026?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.PvOfTotalOutgo_2026?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.RA_2026?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.OpeningRA_2026?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.RARelease_2026?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.ClosingRA_2026?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.OpeningCSM_2026?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.CSMVariableFees_2026?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.CSMRelease_2026?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.ClosingCSM_2026?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.OpeningLossComponent_2026?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.ClosingLossComponent_2026?.toFixed(2)}</td>
                <td className="py-2 px-4 border">{row.IncreaseInLosses_2026?.toFixed(2)}</td> */}

              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan="90" className="py-4 px-4 border text-center text-gray-500">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExtractionTab;