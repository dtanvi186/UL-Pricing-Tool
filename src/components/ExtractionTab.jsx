import React, { useState, useEffect } from 'react';

const ExtractionTab = ({ formData, onResultsChange }) => {
  const [extractionData, setExtractionData] = useState([]);
  const [filterBySrNo, setFilterBySrNo] = useState('all');
  
  // Helper functions
  const addMonths = (dateString, months) => {
    const date = new Date(dateString);
    date.setMonth(date.getMonth() + months);
    return date;
  };
  
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };
  
  const getNearestValidTerm = (ppt) => {
    const validTerms = [1, 3, 5, 10];
    if (validTerms.includes(ppt)) return ppt;
    
    let nearest = validTerms[0];
    let minDiff = Math.abs(ppt - nearest);
    
    for (let i = 1; i < validTerms.length; i++) {
      const diff = Math.abs(ppt - validTerms[i]);
      if (diff < minDiff) {
        nearest = validTerms[i];
        minDiff = diff;
      }
    }
    return nearest;
  };

  // Safe lookup helper
  const safeLookup = (obj, ...keys) => {
    try {
      let current = obj;
      for (const key of keys) {
        if (current == null || !current.hasOwnProperty(key)) return null;
        current = current[key];
      }
      return current;
    } catch (error) {
      return null;
    }
  };

   const targetYears = ['2025', '2026', '2027', '2028', '2029'];

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


  // Process model point data to create extraction data
  useEffect(() => {
    if (!formData.modelPointInputs || formData.modelPointInputs.length === 0) {
      setExtractionData([]);
      return;
    }
    
    const newData = [];
    const allMaintExp = [];
    const allVFF = [];
    const allMaintenanceExpenses = [];
    const allVendorFixedFee = [];
    const allNoPolsIfsm = [];
    let allActiveNopArrays = [];
    let sumAciveNop = [];
    const valuationDate = formData.valuationDate || '2025-05-31';
   
      const projectionYears = 30 // change if needed
      const baseYear = 2025 // chnage if needed 
      const years = Array.from({ length: projectionYears }, (_, i) => i + 1);
      const financialYears = years.map((_, index) => baseYear + index);
    


    // calculation for each model point
    formData.modelPointInputs.forEach((modelPoint, index) => {
      const srNo = index + 1;
      const policyTerm = modelPoint['Policy Term (in years)'];
      const scalar = modelPoint['Weightage'] || 0;
      const ppt = modelPoint['Premium Payment Term'] || 0;
      const death_option = modelPoint['Death Benefit'] || 0;
      const ageAtEntry = modelPoint['Age at entry'] || 0;
      const sumAssured = modelPoint['Sum Assured'] || 0;
      const annualPremium = modelPoint['Annual Premium'] || 0;
      
      // Initialize tracking variables
      const calculations = [];
      let prevNoPEoP = 0;
      let prevNoOfMats = 0;
      let prevUnitFundInforce = 0;
      let prevUndecrementedFV = 0;
      let prevLoyaltyBonusAmount = 0;
      
      // PASS 1: Calculate basic values and most calculations
      for (let month = 0; month <= (policyTerm * 12) + 1; month++) {
        const currentValuationDate = addMonths(valuationDate, month);
        const formattedValuationDate = formatDate(currentValuationDate);
        const valuationYear = currentValuationDate.getFullYear();
        const policyYear = month === 0 ? 0 : Math.floor((month - 1) / 12) + 1;
        const age = policyYear === 0 ? ageAtEntry : ageAtEntry + policyYear - 1;
        
        // Calculate basic rates and charges
        let loyaltyBonus = 0;
        if (month > 0 && policyYear !== Math.floor(((month - 1) - 1) / 12) + 1) {
          loyaltyBonus = safeLookup(formData.loyaltyBonus, policyYear) || 0;
        }

        let surrenderCharge = 0; 
        if (month > 0) {
          // 1. Look up the surrender charge object for the policy year
          const surrenderChargeValues = safeLookup(formData.surrenderCharge, policyYear) || { fixed: 0, percent: 0 };
          
          // 2. Get the fixed and percent values, defaulting to 0 if not found
          const fixedCharge = surrenderChargeValues.fixed || 0;
          const percentCharge = surrenderChargeValues.percent || 0;
          // 4. The total surrender charge is the sum of both parts
          surrenderCharge = fixedCharge + percentCharge;
        }

        let commission = null;
        if (month > 0) {
          const nearestTerm = getNearestValidTerm(ppt);
          commission = safeLookup(formData.commission, policyYear, nearestTerm);
        }

        let allocationCharge = null;
        if (month > 0) {
          if (policyYear > ppt) {
            allocationCharge = 0;
          } else {
            const nearestTerm = getNearestValidTerm(ppt);
            const allocCharge = safeLookup(formData.premiumAllocationCharge, policyYear, nearestTerm);
            if (allocCharge !== null) {
              allocationCharge = 100 - allocCharge;
            }
          }
        }

        let monthlyInterestRate = 0;
        if (month > 0) {
          monthlyInterestRate = safeLookup(formData.yieldCurves, month) || 0;
        }

        let deathRate = 0;
        if (month > 0) {
          const baseMortalityRate = safeLookup(formData.mortalityData, age, 0);
          if (baseMortalityRate !== null) {
            const mortalityMultiplier = (formData.mortalityRateMultiple || 100) / 100;
            const adjustedMortalityRate = baseMortalityRate * mortalityMultiplier;
            deathRate = 1 - Math.pow(1 - adjustedMortalityRate, 1/12);
          }
        }

        let surrenderRate = 0;
        if (month > 0 && month <= (policyTerm * 12)) {
          const annualLapseRate = (safeLookup(formData.lapseRate, policyYear) || 0) / 100;
          surrenderRate = 1 - Math.pow(1 - annualLapseRate, 1/12);
        }
        
        // Calculate policy movement
        let noPBoP = 0;
        if (month === 1) {
          noPBoP = 1;
        } else if (month > 0 && month <= (policyTerm * 12)) {
          noPBoP = prevNoPEoP - prevNoOfMats;
        }

        const noOfDeaths = noPBoP > 0 ? deathRate * (1 - 0.5 * surrenderRate) * noPBoP : 0;
        const noOfSurrs = noPBoP > 0 ? noPBoP * surrenderRate : 0;
        const noOfMats = month === (policyTerm * 12) + 1 ? prevNoPEoP : 0;
        const noPEoP = noPBoP > 0 ? noPBoP - noOfDeaths - noOfSurrs - noOfMats : 0;
        
        // Calculate monthly FMC
        const monthlyFMC = Math.pow(1 + (formData.fundManagementCharge || 0)/100, 1/12) - 1;
        
        // Unit maturity outgo
        const unitMaturityOutgo = month === (policyTerm * 12) + 1 ? prevUnitFundInforce : 0;
        
        // Calculate premium income
        let premiumIncome = 0;
        if (month > 0 && month <= (ppt * 12)) {
          if (ppt === 1) {
            premiumIncome = (month === 1 ? 1 : 0) * annualPremium * scalar * noPBoP;
          } else {
            premiumIncome = (annualPremium * scalar * noPBoP) / 12;
          }
        }
        
        // Allocation charge amount
        const allocationChargeAmount = (allocationCharge !== null && allocationCharge !== undefined) 
          ? (premiumIncome * allocationCharge) / 100 : 0;
        
        // Admin fee
        const adminFee = (formData.adminCharge || 0) * noPBoP * scalar;
        
        // Calculate undecremented fund values
        const undecrementedFVBeforeDeduction = noPBoP > 0 ? Math.max(
          (premiumIncome - allocationChargeAmount - unitMaturityOutgo) / noPBoP / scalar + prevUndecrementedFV, 0) : 0;
        
        const undecrementedGrossSumAtRisk = death_option === "Sum Assured + Fund Value" ? 
          sumAssured : Math.max(sumAssured - undecrementedFVBeforeDeduction, 0);
        
        const decrementedGrossSumAtRisk = undecrementedGrossSumAtRisk * noPBoP;
        
        // COI calculation
        let coi = 0;
        const coiRate = safeLookup(formData.coiCharges, age, 0, 0, 'SP');
        if (coiRate !== null) {
          const coiRiskChargeMultiple = (formData.coiRiskChargeMultiple || 100) / 100;
          coi = coiRiskChargeMultiple * coiRate / 12 * scalar * decrementedGrossSumAtRisk;
        }
        
        const undecrementedFVAfterUnitDeductions = noPBoP > 0 ? Math.max(
          undecrementedFVBeforeDeduction - (adminFee + coi) / noPBoP / scalar, 0) : 0;
        
        const undecrementedFVAfterDeductionBB = Math.max(
          undecrementedFVAfterUnitDeductions * (1 + monthlyInterestRate) * (1 - monthlyFMC), 0);
        
        // Unit fund calculations
        const unitFundBeforeDeduction = noPBoP === 0 ? 0 : 
          premiumIncome - allocationChargeAmount + prevUnitFundInforce - unitMaturityOutgo;
        
        const loyaltyBonusAmount = (loyaltyBonus / 100) * unitFundBeforeDeduction;
        const loyaltyBonusPerPolicy = noPBoP > 0 ? loyaltyBonusAmount / noPBoP / scalar : 0;
        
        const undecrementedFV = undecrementedFVAfterDeductionBB + loyaltyBonusPerPolicy;
        
        const unitFundAfterDeduction = Math.max(
          unitFundBeforeDeduction - Math.min(adminFee + coi, unitFundBeforeDeduction), 0);
        
        const fundManagementChargeAmount = monthlyFMC < 1 ? 
          unitFundAfterDeduction * (1 + monthlyInterestRate) * monthlyFMC / (1 - monthlyFMC) : 0;
        
        const unitFundAfterGrowth = (unitFundAfterDeduction + prevLoyaltyBonusAmount) * (1 + monthlyInterestRate);
        
        // Commission and expenses
        const initialCommission = (policyYear === 1 && commission !== null && commission !== undefined) ? 
          (premiumIncome * commission) / 100 : 0;
        const renewalCommission = (policyYear > 1 && commission !== null && commission !== undefined) ? 
          (premiumIncome * commission) / 100 : 0;
        const initialExpense = month === 1 ? 500 * scalar: 0;
        const renewalExpense = (month > 0 && month <= (policyTerm * 12)) ? 500 * scalar * noPBoP : 0;
        
        // Death calculations
        const deathUnitOutgo = undecrementedFV * noOfDeaths * scalar;

      /*const surrenderChargeValues = safeLookup(formData.surrenderCharge, policyYear);
      const fixed = surrenderChargeValues?.fixed ?? 0;
      const percent = surrenderChargeValues?.percent ?? 0;
      const surrenderChargeRate = fixed + percent; */
      
      const surrenderChargeRate = surrenderCharge;

        console.log( " this is the surrender charge rate" ,surrenderChargeRate , ' this is the policy year', policyYear )
        
        const surrenderChargesAmount = surrenderChargeRate > 100 ? 
          Math.min(undecrementedFVAfterDeductionBB, surrenderChargeRate) * noOfSurrs * scalar :
          undecrementedFVAfterDeductionBB * scalar * (surrenderChargeRate / 100) * noOfSurrs;
        const nuSurrenderClaims = 0;
        const surrUnitOutgo = Math.max(
          undecrementedFVAfterDeductionBB * noOfSurrs * scalar - surrenderChargesAmount, 0);
        
        // Final unit fund inforce
        const unitFundInforce = noPBoP === 0 ? 0 : Math.max(
          (unitFundAfterDeduction + prevLoyaltyBonusAmount) * (1 + monthlyInterestRate) - 
          fundManagementChargeAmount - surrenderChargesAmount - deathUnitOutgo - surrUnitOutgo, 0);

      
        
        // Store calculation
        calculations.push({
          month, policyYear, age, formattedValuationDate, valuationYear,
          loyaltyBonus, surrenderCharge, surrenderChargeRate,commission, allocationCharge, monthlyInterestRate,
          deathRate, surrenderRate, scalar, death_option, sumAssured, policyTerm, ppt,
          noPBoP, noOfDeaths, noOfSurrs, noOfMats, noPEoP, 
          premiumIncome, allocationChargeAmount, adminFee, initialCommission, renewalCommission,
          initialExpense, renewalExpense, unitFundBeforeDeduction, unitFundAfterDeduction,
          unitFundAfterGrowth, unitFundInforce, fundManagementChargeAmount,
          undecrementedFVBeforeDeduction, undecrementedFVAfterUnitDeductions,
          undecrementedFVAfterDeductionBB, loyaltyBonusAmount, loyaltyBonusPerPolicy,
          undecrementedFV, undecrementedGrossSumAtRisk, decrementedGrossSumAtRisk,
          coi, deathUnitOutgo, surrenderChargesAmount, surrUnitOutgo, unitMaturityOutgo,nuSurrenderClaims
        });
        
        // Update previous values
        prevNoPEoP = noPEoP;
        prevNoOfMats = noOfMats;
        prevUnitFundInforce = unitFundInforce;
        prevUndecrementedFV = undecrementedFV;
        prevLoyaltyBonusAmount = loyaltyBonusAmount;
      }
      
      // PASS 2: Calculate non-recursive forward calculations
      for (let i = 0; i < calculations.length; i++) {
        const calc = calculations[i];
        
        // Death benefit calculations
        calc.deathBenefitPP = calc.undecrementedGrossSumAtRisk + calc.undecrementedFV;
        calc.deathOutgo = calc.deathBenefitPP * calc.noOfDeaths * calc.scalar;
        calc.nuDeathClaims = calc.deathOutgo - calc.deathUnitOutgo;

        //investment Expenses calculations
        calc.investmentExpenses = (formData.fundManagementExpense/ 12 * calc.unitFundInforce )/ 100  ;

        // Reinsurance calculations
        const reinsuranceQuotaShare = (formData.reinsuranceQuotaShare || 0) / 100;
        calc.undecrementedRISumAtRisk = calc.undecrementedGrossSumAtRisk * reinsuranceQuotaShare;
        calc.decrementedRISumAtRisk = calc.undecrementedRISumAtRisk * calc.noPBoP;
        calc.riShareOfClaimsPaid = calc.undecrementedRISumAtRisk * calc.noOfDeaths * calc.scalar;
        
        // RI Premiums calculation
        const prevCalc = calculations[i - 1] || {};
        const prevPolicyYear = prevCalc.policyYear || 0;
        
        if (calc.month === 0 || calc.policyYear === prevPolicyYear) {
          calc.riPremiums = 0;
        } else {
          const riRate = safeLookup(formData.riRates, calc.age, 0, 0);
          if (riRate !== null) {
            const reinsuranceRates = (formData.reinsuranceRates || 100) / 100;
            calc.riPremiums = calc.undecrementedRISumAtRisk * calc.scalar * calc.noPBoP * reinsuranceRates * riRate;
          } else {
            calc.riPremiums = 0;
          }
        }
        
        // Initialize recursive fields
        calc.nonUnitFundReserves = 0;
        calc.riReserves = 0;
      }
      
      // PASS 3: Calculate recursive reserves (backwards)
      for (let i = calculations.length - 1; i >= 0; i--) {
        const current = calculations[i];
        const next = calculations[i + 1] || {};
        
        // Non Unit Fund Reserves
        if (current.noPBoP === 0 || current.month > (current.policyTerm * 12)) {
          current.nonUnitFundReserves = 0;
        } else {
          current.nonUnitFundReserves = 
            (next.initialCommission + next.renewalCommission + next.initialExpense + next.renewalExpense - 
             next.allocationChargeAmount - next.adminFee - next.coi + current.loyaltyBonusAmount) +
           ((next.nuDeathClaims - next.fundManagementChargeAmount - next.surrenderChargesAmount + next.nonUnitFundReserves)) / (1 + next.monthlyInterestRate);
        }
        
        // RI reserves
        if (current.noPBoP === 0 || current.month > (current.policyTerm * 12)) {
          current.riReserves = 0;
        } else {
          current.riReserves = next.riPremiums + 
            ((next.riReserves - next.riShareOfClaimsPaid)) / (1 + next.monthlyInterestRate);
        }
        
        // PV of Premium (item 1)
        if (current.month === 0 || current.month === (current.policyTerm * 12) + 1) {
          current.pvOfPremium = 0;
        } else {
          current.pvOfPremium = (next.pvOfPremium || 0) / (1 + (next.monthlyInterestRate || 0)) + (next.premiumIncome || 0);
        }
        
        // PV of RI Recovery (item 4)
        if (current.month === 0 || current.month === (current.policyTerm * 12) + 1) {
          current.pvOfRiRecovery = 0;
        } else {
          current.pvOfRiRecovery = ((next.pvOfRiRecovery || 0) + (next.riShareOfClaimsPaid || 0)) / (1 + (next.monthlyInterestRate || 0));
        }
      }

      // PASS 4: Calculate change and investment income fields
      for (let i = 0; i < calculations.length; i++) {
        const current = calculations[i];
        const prev = calculations[i - 1] || {};
        
        // Change calculations
        current.changeInUnitFund = current.month === 0 ? 0 : 
          (current.unitFundInforce || 0) - (prev.unitFundInforce || 0);
        
        current.changeInGrossNonUnitReserves = current.month === 0 ? 0 : 
          (current.nonUnitFundReserves || 0) - (prev.nonUnitFundReserves || 0);
        
        current.changeInRIReserves = current.month === 0 ? 0 : 
          (current.riReserves || 0) - (prev.riReserves || 0);
        
          // ---- made changes tothe formula here----------
        // NL CFS calculations
        current.nlCfsSm = current.month === 0 ? 0 : 
          (current.initialCommission || 0) + (current.renewalCommission || 0) + 
          (current.initialExpense || 0) + (current.renewalExpense || 0) + 
          (current.loyaltyBonusAmount || 0) - (current.allocationChargeAmount || 0) - 
          (current.adminFee || 0) - (current.coi || 0);
        
        current.nlCfsEm = (current.nuDeathClaims || 0) - (current.fundManagementChargeAmount || 0) - 
                        (current.surrenderChargesAmount || 0);
        
        // Investment income calculations
        current.investmentIncomeNuf = current.month === 0 ? 0 : 
          (prev.nonUnitFundReserves - current.nlCfsSm) * current.monthlyInterestRate;
        
        current.investmentIncomeUf = current.changeInUnitFund - current.premiumIncome - (current.loyaltyBonusAmount || 0) + 
          (current.allocationChargeAmount || 0) + (current.adminFee || 0) + (current.coi || 0) + 
          (current.fundManagementChargeAmount || 0) + (current.surrenderChargesAmount || 0) + 
          (current.deathUnitOutgo || 0) + (current.surrUnitOutgo || 0) + (current.unitMaturityOutgo || 0);
        
        // IFRS calculations
        const next = calculations[i + 1] || {};
        if (current.month === 0) {
          current.nonUnitFundReservesIfrs = 
            (next.initialCommission + next.renewalCommission + next.initialExpense + next.renewalExpense - 
            next.allocationChargeAmount - next.adminFee - next.coi + current.loyaltyBonusAmount) +
            (next.nuDeathClaims - next.fundManagementChargeAmount - next.surrenderChargesAmount + next.nonUnitFundReserves) / (1 + next.monthlyInterestRate);
        } else {
          current.nonUnitFundReservesIfrs = (next.noPBoP === 0 && current.month !== 0) ? 0 : 
            current.nonUnitFundReserves || 0;
        }
        
        current.riReservesIfrs = current.month === 0 ? 
          (next.riReserves || 0) + (next.riPremiums || 0) : current.riReserves || 0;
        
        current.grossBel = current.nonUnitFundReservesIfrs + (current.unitFundInforce || 0);

        // PV of Tot Outgo (item 2)
        current.pvOfTotOutgo = current.month === 0 ? 0 : (current.grossBel || 0) + (current.pvOfPremium || 0);
        
        // Gross RA (item 3)
        current.grossRa = (current.pvOfTotOutgo || 0) * 0.022;
        
        // Rein RA (item 5)
        current.reinRa = (current.pvOfRiRecovery || 0) * -0.01;
        
        // Opening Gross CSM (item 6)
        if (current.policyYear > current.policyTerm || current.month === 0) {
          current.openingGrossCsm = 0;
        } else if (current.month === 1) {
          current.openingGrossCsm = -((prev.grossBel || 0) + (current.grossRa || 0));
        } else {
          // Ensure we have the previous period's closing CSM calculated first
          if (prev.closingGrossCsm === undefined) {
            // Calculate previous period's closing CSM if not already done
            prev.closingGrossCsm = (prev.openingGrossCsm || 0) + (prev.csmVariableFee || 0) - (prev.csmRelease || 0);
          }
          current.openingGrossCsm = prev.closingGrossCsm || 0;
        }
        
        // Opening RI CSM (item 14)
        if (current.month === 0) {
          current.openingRiCsm = 0;
        } else if (current.month === 1) {
          current.openingRiCsm = -((prev.riReservesIfrs || 0) + (current.reinRa || 0));
        } else {
          current.openingRiCsm = 0; // Will be set properly in PASS 7
        }
        
        // Opening RI RA (item 19)
        if (current.month === 0) {
          current.openingRiRa = 0;
        } else if (current.month === 1) {
          current.openingRiRa = current.reinRa || 0;
        } else {
          current.openingRiRa = 0; // Will be set properly in PASS 7
        }
        
        // CSM Variable Fee (item 7)
        if ((current.openingGrossCsm || 0) === 0) {
          current.csmVariableFee = 0;
        } else {
          current.csmVariableFee = (prev.nonUnitFundReservesIfrs || 0) - (current.nonUnitFundReservesIfrs || 0) - 
            (current.nuDeathClaims || 0) - (current.initialExpense || 0) - (current.renewalExpense || 0) - 
            (current.initialCommission || 0) - (current.renewalCommission || 0) + (current.allocationChargeAmount || 0) + 
            (current.adminFee || 0) + (current.coi || 0) + (current.fundManagementChargeAmount || 0) + 
            (current.surrenderChargesAmount || 0);
        }
        
        // Interest earned on RI CSM (item 16)
        current.interestEarnedOnRiCsm = (current.openingRiCsm || 0) * (current.monthlyInterestRate || 0);
        
        // Initialize opening gross RA temporarily (will be fixed in PASS 7)
        if (current.month === 0) {
          current.openingGrossRa = 0;
        } else if (current.month === 1) {
          current.openingGrossRa = current.grossRa || 0;
        } else {
          current.openingGrossRa = 0; // Will be set properly in PASS 7
        }
      }
      
      // PASS 5: Calculate coverage units (backwards)
      for (let i = calculations.length - 1; i >= 0; i--) {
        const current = calculations[i];
        const next = calculations[i + 1] || {};
        
        current.grossCoverageUnitsInforce = next.noPEoP === 0 ? 0 : 
          (current.sumAssured / 12) * current.noPEoP * current.scalar + 
          (current.month === (current.policyTerm * 12) ? 0 : (next.grossCoverageUnitsInforce || 0));
        
        current.reinCoverageUnitsInforce = next.noPEoP === 0 ? 0 : 
          (current.undecrementedRISumAtRisk / 12) * current.noPEoP * current.scalar + 
          (current.month === (current.policyTerm * 12) ? 0 : (next.reinCoverageUnitsInforce || 0));
      }

      // PASS 6: Calculate CSM patterns and dependent fields (after coverage units are calculated)
      for (let i = 0; i < calculations.length; i++) {
        const current = calculations[i];
        const prev = calculations[i - 1] || {};
        
        // CSM Release Pattern (item 8)
        if (current.month === 0) {
          current.csmReleasePattern = 0;
        } else if ((prev.grossCoverageUnitsInforce || 0) === 0) {
          current.csmReleasePattern = 0;
        } else {
          const prevCoverageUnits = prev.grossCoverageUnitsInforce || 0;
          if (prevCoverageUnits === 0) {
            current.csmReleasePattern = 0;
          } else {
            current.csmReleasePattern = (prevCoverageUnits - (current.grossCoverageUnitsInforce || 0)) / prevCoverageUnits;
          }
        }
        
        // RI CSM Release Pattern (item 15)
        if (current.month === 0) {
          current.riCsmReleasePattern = 0;
        } else if ((prev.reinCoverageUnitsInforce || 0) === 0) {
          current.riCsmReleasePattern = 0;
        } else {
          const prevReinCoverageUnits = prev.reinCoverageUnitsInforce || 0;
          if (prevReinCoverageUnits === 0) {
            current.riCsmReleasePattern = 0;
          } else {
            current.riCsmReleasePattern = (prevReinCoverageUnits - (current.reinCoverageUnitsInforce || 0)) / prevReinCoverageUnits;
          }
        }
        
        // Calculate CSM release (item 9) with correct pattern
        current.csmRelease = Math.max((current.csmReleasePattern || 0) * ((current.openingGrossCsm || 0) + (current.csmVariableFee || 0)), 0);
        
        // Calculate RA release (item 12) with correct pattern
        current.raRelease = (current.openingGrossRa || 0) * (current.csmReleasePattern || 0);
        
        // Calculate RI CSM release (item 17) with correct pattern
        current.riCsmRelease = Math.max((current.riCsmReleasePattern || 0) * (current.openingRiCsm || 0), 0);
        
        // Calculate Rein RA release (item 20) with correct pattern
        current.reinRaRelease = (current.riCsmReleasePattern || 0) * (current.openingRiRa || 0);
        
        // Calculate Closing Gross CSM (item 10)
        current.closingGrossCsm = (current.openingGrossCsm || 0) + (current.csmVariableFee || 0) - (current.csmRelease || 0);
        
        // Calculate Closing Gross RA (item 13)
        current.closingGrossRa = (current.openingGrossRa || 0) - (current.raRelease || 0);
        
        // Calculate Closing RI CSM (item 18)
        current.closingRiCsm = (current.openingRiCsm || 0) + (current.interestEarnedOnRiCsm || 0) - (current.riCsmRelease || 0);
        
        // Calculate Closing Rein RA (item 21)
        current.closingReinRa = (current.openingRiRa || 0) - (current.reinRaRelease || 0);
      }

      // PASS 7: Fix Opening values based on previous period's Closing values
      for (let i = 0; i < calculations.length; i++) {
        const current = calculations[i];
        const prev = calculations[i - 1] || {};
        
        // Opening Gross RA (item 11) - Corrected Logic
        if (current.month === 0) {
          current.openingGrossRa = 0;
        } else if (current.month === 1) {
          current.openingGrossRa = current.grossRa || 0;
        } else {
          // For time period > 1: Opening Gross RA = Closing Gross RA of previous time period
          current.openingGrossRa = prev.closingGrossRa || 0;
        }
        
        // Opening RI RA (item 19) - Corrected Logic
        if (current.month === 0) {
          current.openingRiRa = 0;
        } else if (current.month === 1) {
          current.openingRiRa = current.reinRa || 0;
        } else {
          // For time period > 1: Opening RI RA = Closing RI RA of previous time period
          current.openingRiRa = prev.closingReinRa || 0;
        }
        
        // Opening RI CSM (item 14) - Corrected Logic
        if (current.month === 0) {
          current.openingRiCsm = 0;
        } else if (current.month === 1) {
          current.openingRiCsm = -((prev.riReservesIfrs || 0) + (current.reinRa || 0));
        } else {
          // For time period > 1: Opening RI CSM = Closing RI CSM of previous time period
          current.openingRiCsm = prev.closingRiCsm || 0;
        }
        
        // Recalculate Interest earned on RI CSM with corrected Opening RI CSM
        current.interestEarnedOnRiCsm = (current.openingRiCsm || 0) * (current.monthlyInterestRate || 0);
        
        // Recalculate RA release with corrected opening RA
        current.raRelease = (current.openingGrossRa || 0) * (current.csmReleasePattern || 0);
        
        // Recalculate Rein RA release with corrected opening RI RA
        current.reinRaRelease = (current.riCsmReleasePattern || 0) * (current.openingRiRa || 0);
        
        // Recalculate RI CSM release with corrected opening RI CSM -- there are two places defined ri csm 
        current.riCsmRelease = Math.max((current.riCsmReleasePattern || 0) *
        ( (current.openingRiCsm || 0) + 

         (current.interestEarnedOnRiCsm || 0) )
          , 0);
        
        // Recalculate Closing values with corrected opening values
        current.closingGrossRa = (current.openingGrossRa || 0) - (current.raRelease || 0);
        current.closingReinRa = (current.openingRiRa || 0) - (current.reinRaRelease || 0);
        current.closingRiCsm = (current.openingRiCsm || 0) + (current.interestEarnedOnRiCsm || 0) - (current.riCsmRelease || 0);
      }

      //-----------------------------------------------------------------------------------------------------------------------------------------Summary calculations start

      
    
      
      allActiveNopArrays = targetYears.map((ty, tyIndex) => {
      const singleTargetYearArray = financialYears.map((year, index) => {
        // Skip years before the target year
        if (year < parseInt(ty)) {
          return 0;
        }
        const yearNo = year - tyIndex;
        //console.log(`year No is ${yearNo}`);

        const endOfYearDate = `${yearNo}-12-31`; // Use actual financial year in date

        const sumForDate = calculations // chnage this to calculations for extractionTab
          .filter(row => row.formattedValuationDate === endOfYearDate)
          .reduce((sum, row) => sum + (row.noPEoP || 0), 0);

        const noPScalarForTargetYear = formData.businessProjections?.policyCount?.[ty] || 0;

        return sumForDate * noPScalarForTargetYear;
      });

      return singleTargetYearArray;
    });

      sumAciveNop = allActiveNopArrays[0].map((_, i) => {
        return (
          (allActiveNopArrays[0]?.[i] || 0) +
          (allActiveNopArrays[1]?.[i] || 0) +
          (allActiveNopArrays[2]?.[i] || 0) +
          (allActiveNopArrays[3]?.[i] || 0) +
          (allActiveNopArrays[4]?.[i] || 0)
        );
      });

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

      targetYears.forEach(( tyYear, tyIndex) => {

          const noPolsIfsm = [];
          financialYears.forEach((value, i) =>{

            if( value< tyYear ) noPolsIfsm[i] = 0 ;

            const year = value - tyIndex ;

             if (!Array.isArray(calculations)){
              noPolsIfsm[i] = 0 ;
             };

             const sumForYear = calculations // CHANGE IT TO CALCULATIONS FOR EXTRACTION
              .filter(row => row.valuationYear === year)
              .reduce((sum, row) => sum + (row.noPBoP || 0), 0);

               noPolsIfsm[i] = sumForYear
          }) ;
          allNoPolsIfsm.push(noPolsIfsm)
      });   

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
        
        const result = numValue / numPols / numScalar;
        
        // Debug: log the calculation
        //console.log(`Calc: ${numValue} / ${numPols} / ${numScalar} = ${result}`);
        
        return result;

        });
        allVFF.push(singleVFF);
      });

      

  // ---------------------------------------------------------------------------------------------------------------summary data calculations end hear
  // ----------------------------------------------------------------------------------------------------------------Pass 8


  calculations.forEach(calc => {
    calc.yearlyMetrics = {};
  });

  // PASS 8 - Forward loop for each target year
  targetYears.forEach((tyYear, tyIndex) => {

   

      for (let i = 0; i < calculations.length; i++) {
          const current = calculations[i];
          const prev = calculations[i - 1] || {};
          
      
          // --- Get the inputs for the current year ---
          const mainExpForYear = formData.businessProjections?.maintenanceExpense?.[tyYear] || 0;
          const acqExpForYear = formData.businessProjections?.acquisitionExpense?.[tyYear] || 0;
          const nbPolForYear = formData.businessProjections?.policyCount?.[tyYear] || 0;

          const vendorAdmin = formData.vendorCommissionPolicy;
          const vendorAllocation = formData.vendorCommissionAllocation;
          const vendorFMC = formData.vendorCommissionFMC;
          const vendorSurr = formData.vendorCommissionSurrender;

          // Add this to check the rates
         // console.log('Vendor Rates:', { vendorAdmin, vendorAllocation, vendorFMC, vendorSurr });
          const modelPointWeight = current.scalar || 0;

          

          // Calculation for initial expenses
          let initialExpenseFixed = 0;
          if (current.month === 1) {
            
              let value = 0;
              if (nbPolForYear !== 0) {
                  initialExpenseFixed = (acqExpForYear / nbPolForYear) * modelPointWeight;
              } 
              
          } else {
              initialExpenseFixed = 0;
          }

          let initialExpensePrem = 0;
          let initialExpenseYearly = initialExpenseFixed + initialExpensePrem;

          // Calculations for renewal expenses
          let renewalExpenseFixed = 0;
          if (current.month !== 0) {
              const lookupYear = current.valuationYear + tyIndex;
              const yearIndex = financialYears.indexOf(lookupYear);

              if (yearIndex !== -1) {
                  const maintExp = allMaintExp[tyIndex]?.[yearIndex] || 0;
                  renewalExpenseFixed = maintExp * (current.noPBoP || 0);
              }
          }
          //console.log("Renewal Expense Fixed:", renewalExpenseFixed);

          let renewalExpensePrem = 0;
          let renewalExpense = renewalExpenseFixed + renewalExpensePrem;

          // Calculations for vendor Commission
          let vendorCommission = 0;
          if (current.month !== 0) {
              vendorCommission = (vendorAdmin * current.adminFee + 
                              vendorAllocation * current.allocationChargeAmount + 
                              vendorFMC * current.fundManagementChargeAmount + 
                              vendorSurr * current.surrenderChargesAmount ) / 100;
          }

          // Calculations for vendor fixed fee ----- check later 
          let vendorFixedFee = 0;
          if (current.month !== 0) {
              const lookupYear = current.valuationYear + tyIndex;
              const yearIndex = financialYears.indexOf(lookupYear);

              if (yearIndex !== -1) {
                  const vendorFee = allVFF[tyIndex]?.[yearIndex] || 0;
                  vendorFixedFee = vendorFee * (current.noPBoP || 0);
              }
          } else {
              vendorFixedFee = 0;
          }

       


      


          let nlCfsSm = 0;
          if (current.month !== 0) {
            // CORRECT: Sum all outflows and subtract all inflows
            nlCfsSm =
              (current.initialCommission || 0) +
              (current.renewalCommission || 0) +
              (initialExpenseYearly || 0) +
              (renewalExpense || 0) +
              (current.investmentExpenses || 0) +
              (vendorCommission || 0) +
              (vendorFixedFee || 0) +
              (prev.loyaltyBonusAmount || 0) - // CORRECT: Use current month's loyalty bonus
              (current.allocationChargeAmount || 0) -
              (current.adminFee || 0) -
              (current.coi || 0);
          } 



          // Store metrics for this target year
          current.yearlyMetrics[tyYear] = {

              initialExpense:  initialExpenseYearly,
              renewalExpense: renewalExpense,
              renewalExpenseFixed: renewalExpenseFixed,
              vendorFixedFee: vendorFixedFee,
              nlCfsSm: nlCfsSm, // Added this as it seems important,
              vendorCommission: vendorCommission,
          };
      }

  });

  // PASS 9 - Backward loop for each target year
  targetYears.forEach((tyYear, tyIndex) => {
    //console.log(`Processing PASS 9 for target year: ${tyYear}`);

    for (let i = calculations.length - 1; i >= 0; i--) {
        const current = calculations[i];
        const next = calculations[i + 1] || {};
    
        let grossNonUnitFundReserves = 0;
        
        if (current.noPBoP !== 0) {
            // FIXED: Use yearlyMetrics values from next calculation instead of direct properties
            const nextYearlyMetrics = next.yearlyMetrics?.[tyYear] || {};
            const firstYear = tyYear - tyIndex ;

            
            const nextInflows = (next.allocationChargeAmount || 0) + 
                              (next.adminFee || 0) + 
                              (next.coi || 0);
            
            const nextOutflows = (next.initialCommission || 0) + 
                               (next.renewalCommission || 0) + 
                               (next.investmentExpenses || 0) + 
                               (current.loyaltyBonusAmount || 0) + 
                               (nextYearlyMetrics.initialExpense || 0) + 
                               (nextYearlyMetrics.renewalExpenseFixed || 0) + 
                               (nextYearlyMetrics.vendorCommission || 0) + 
                               (nextYearlyMetrics.vendorFixedFee || 0);
            
            const nextReserveComponent = ((next.nuDeathClaims || 0) - 
                                        (next.fundManagementChargeAmount || 0) - 
                                        (next.surrenderChargesAmount || 0) + 
                                        (next.yearlyMetrics?.[firstYear]?.grossNonUnitFundReserves || 0)) / 
                                       (1 + (next.monthlyInterestRate || 0));

            grossNonUnitFundReserves = -nextInflows + nextOutflows + nextReserveComponent;
            
            /*console.log(`GNUF calculation for row ${i}:`, {
                nextInflows,
                nextOutflows,
                nextReserveComponent,
                result: grossNonUnitFundReserves
            }); */
        } else {
            grossNonUnitFundReserves = 0;
        }
        // year 2 
        //=IF($A6="","",IF(AND($DG6=0,$A6<>0),0,(+$AL7+$AM7+FA7+FD7+$AT7+FG7+FH7-$R7-$T7-$U7-$S7+$BG6)+($AC7+$AF7-$AA7-$AB7+FN7)/(1+$DS7)))
        // year 1 
        //=IF($A6="","",IF(AND($DG6=0,$A6<>0),0,(+$AL7+$AM7+DU7+DX7+$AT7+EA7+EB7-$R7-$T7-$U7-$S7+$BG6)+($AC7+$AF7-$AA7-$AB7+EH7)/(1+$DS7)))

        let grossNonUnitFundReservesIfrs17 = 0;
        if (current.month !== "") {
            if (current.month !== 0 && current.noPBoP === 0) {
                grossNonUnitFundReservesIfrs17 = 0;
            } else {
                // FIXED: Same logic as above
                const nextYearlyMetrics = next.yearlyMetrics?.[tyYear] || {};
                
                const nextInflows = (next.allocationChargeAmount || 0) + 
                                  (next.adminFee || 0) + 
                                  (next.coi || 0);
                
                const nextOutflows = (next.initialCommission || 0) + 
                                   (next.renewalCommission || 0) + 
                                   (next.investmentExpenses || 0) + 
                                   (current.loyaltyBonusAmount || 0) + 
                                   (nextYearlyMetrics.initialExpense || 0) + 
                                   (nextYearlyMetrics.renewalExpenseFixed || 0) + 
                                   (nextYearlyMetrics.vendorCommission || 0) + 
                                   (nextYearlyMetrics.vendorFixedFee || 0);
                
                const nextReserveComponent = ((next.nuDeathClaims || 0) - 
                                            (next.fundManagementChargeAmount || 0) - 
                                            (next.surrenderChargesAmount || 0) + 
                                            (next.yearlyMetrics?.[tyYear]?.grossNonUnitFundReservesIfrs17 || 0)) / (1 + (next.monthlyInterestRate || 0));

                grossNonUnitFundReservesIfrs17 = -nextInflows + nextOutflows + nextReserveComponent;
            }
        }


          // Store in yearlyMetrics for this target year
          if (!current.yearlyMetrics[tyYear]) {
                  current.yearlyMetrics[tyYear] = {};
              }   
              
              current.yearlyMetrics[tyYear] = {
                ...current.yearlyMetrics[tyYear],
                grossNonUnitFundReserves : grossNonUnitFundReserves,
                grossNonUnitFundReservesIfrs17: grossNonUnitFundReservesIfrs17,

              }
          } 
  });

  // PASS 10 - FORWARD 
  targetYears.forEach((tyYear, tyIndex) => {

      for (let i = 0; i < calculations.length; i++) {
          const current = calculations[i];
          const prev = calculations[i - 1] || {};
          const prevYearlyMetrics =prev.yearlyMetrics?.[tyYear] || {};
          const currentYearlyMetrics = current.yearlyMetrics?.[tyYear] || {};

          let changeInNetNonUnitReserves = currentYearlyMetrics.grossNonUnitFundReserves -  prevYearlyMetrics.grossNonUnitFundReserves + current.riReserves - prev.riReserves ;
          let investmentIncomeNuf = (prevYearlyMetrics.grossNonUnitFundReserves + prev.riReserves - currentYearlyMetrics.nlCfsSm - current.riPremiums ) * current.monthlyInterestRate ;
          let grossBEL = (current.month !=="")? currentYearlyMetrics.grossNonUnitFundReservesIfrs17 + current.unitFundInforce : 0 ;
          let pvOfTotalOutgo = (current.month === "" || current.month === 0) ? 0 : grossBEL + current.pvOfPremium  ;
          let RA = (current.month !== "")? pvOfTotalOutgo * formData.grossRiskAdjustment / 100 : 0 ;

          //------------------------------------------check for these-----------------csm related caclulations
          let openingCSM = 0;
          let closingCSM = 0;
          let csmVariableFees = 0;

          // calculate opening csm
          if (current.month !== "" ) {
              if (current.policyYear > current.policyTerm ||current.month === 0 ) {
                  openingCSM = 0;
              } else {
                  if (current.month === 1) {
                      // FIXED: For month 1, opening CSM should be negative of (grossBEL + RA)
                      openingCSM = -(prevYearlyMetrics.grossBEL + RA);
                  } else {
                      // FIXED: For other months, use previous month's closing CSM
                      openingCSM = prevYearlyMetrics.closingCSM || 0;
                  }
              }
          }

          let openingCsmMax = Math.max ( openingCSM, 0);


          // Calculate CSM Variable Fees
          if (current.month !== "") {
              const changeInGrossNUFReserves = (currentYearlyMetrics.grossNonUnitFundReservesIfrs17 || 0) - 
                                            (prevYearlyMetrics.grossNonUnitFundReservesIfrs17 || 0);
            
              csmVariableFees = - changeInGrossNUFReserves -  (currentYearlyMetrics.nlCfsSm + current.nlCfsEm);
            
              /*/ Debug logging
              console.log(`CSM Variable Fees calculation for row ${i}:`, {
                  changeInGrossNUFReserves,
                  result: csmVariableFees
              });*/
          }

          // Calculate csm variable fees max 

          let csmVariableFeesMax = 0
          if( current.month !==""){
            csmVariableFeesMax = Math.min(  Math.max( openingCSM + csmVariableFees, 0) , csmVariableFees)
          }


          // Calculate csmRelease

         let csmRelease = 0
          if (current.month !== "") {
              csmRelease = Math.max( ((openingCSM + csmVariableFees) * (current.csmReleasePattern|| 0)) , 0 );
          }
          //calculate csm release max 
          let csmReleaseMax = csmRelease;

          // calculate closing csm 
          if(current.month !== "" ) {
            // safe condition set the first ever value based on the month 0 
            closingCSM = current.month === 0? 0 : openingCSM +  csmVariableFees - csmRelease;
          };
          // calculate closing csm max 
          let closingCsmMax = current.month !== 0 ? openingCsmMax + csmVariableFeesMax - csmReleaseMax : 0;

          
          

          // ----------------------------RA related caluclations
          let openingRA = 0
          if( current.month !== ""){
            //SAFE CONDITION FOR THE BACKWORD LOOP
            if ( current.month ===0){
              openingRA = 0
            }
            else if ( current.month === 1){
              openingRA = RA;
            }else {
              openingRA = prevYearlyMetrics.closingRA;
            }

          }

          let raRelease = 0;
          if (current.month !== "") {
            try {
              raRelease = (openingRA) * current.csmReleasePattern;
            } catch (e) {
              raRelease = 0;
              console.warn("Error in RA release calculation:", e);
            }
          }

          let closingRA = 0;
          if ( current.month !== ""){
            closingRA  = openingRA - raRelease;
          }

          // calculate the investmentIncomeNufIfrs17
          let investmentIncomeNufIfrs17 = current.month !== "" ? 
            ( prev.riReserves + prevYearlyMetrics.grossNonUnitFundReserves + prevYearlyMetrics.closingRA 
              + prevYearlyMetrics.closingCSM + prev.closingReinRa + prev.closingRiCsm - currentYearlyMetrics.nlCfsSm
              - current.riPremiums) * current.monthlyInterestRate 
            : 0;

              // calculate the openeing loss component 
          let openingLossComponent = openingCSM < 0 ? - openingCSM : 0;
          let closingLossComponent = closingCSM < 0 ? - closingCSM : 0;
          let increaseInLosses =  current.month === 1 ? Math.max ( 0 , -openingCSM - csmVariableFees) : 

              ( openingCSM < 0 ? -1*( Math.min (csmVariableFees , -openingCSM)) 
                : ( closingCSM < 0 ? - closingCSM: 0)
              );


          // Store in yearlyMetrics for this target year
          if (!current.yearlyMetrics[tyYear]) {
                  current.yearlyMetrics[tyYear] = {};
              }   
              
              current.yearlyMetrics[tyYear] = {
                 ...current.yearlyMetrics[tyYear], 
                changeInNetNonUnitReserves : changeInNetNonUnitReserves,
                investmentIncomeNuf :investmentIncomeNuf,
                investmentIncomeNufIfrs17 : investmentIncomeNufIfrs17,

                grossBEL : grossBEL,
                pvOfTotalOutgo: pvOfTotalOutgo,
                RA : RA ,
                openingCSM: openingCSM,
                openingCsmMax : openingCsmMax,
                csmVariableFees : csmVariableFees,
                csmVariableFeesMax : csmVariableFeesMax,

                csmRelease : csmRelease,
                csmReleaseMax : csmReleaseMax,
                closingCSM: closingCSM,
                closingCsmMax : closingCsmMax,
                openingRA : openingRA,
                raRelease : raRelease,
                closingRA : closingRA,

                openingLossComponent : openingLossComponent,
                closingLossComponent : closingLossComponent,
                increaseInLosses : increaseInLosses,

              }
          } 
  });


  // Add all calculations to newData
  calculations.forEach(calc => {
      const flatYearlyMetrics = {};
      if (calc.yearlyMetrics) {

          targetYears.forEach(year => {
              
              flatYearlyMetrics[`InitialExpense_${year}`] = calc.yearlyMetrics[year]?.initialExpense || 0;
              flatYearlyMetrics[`RenewalExpense_${year}`] = calc.yearlyMetrics[year]?.renewalExpense || 0;
              flatYearlyMetrics[`VendorCommission_${year}`] = calc.yearlyMetrics[year]?.vendorCommission || 0;
              flatYearlyMetrics[`VendorFixedFee_${year}`] = calc.yearlyMetrics[year]?.vendorFixedFee || 0;
              flatYearlyMetrics[`NlCfsSm_${year}`] = calc.yearlyMetrics[year]?.nlCfsSm || 0;
              
              
              flatYearlyMetrics[`GrossNonUnitFundReserves_${year}`] = calc.yearlyMetrics[year]?.grossNonUnitFundReserves || 0; 
              flatYearlyMetrics[`ChangeInNetNonUnitReserves_${year}`] = calc.yearlyMetrics[year]?.changeInNetNonUnitReserves || 0;
              flatYearlyMetrics[`InvestmentIncomeNuf_${year}`] = calc.yearlyMetrics[year]?.investmentIncomeNuf || 0;
              flatYearlyMetrics[`InvestmentIncomeNufIfrs17_${year}`] = calc.yearlyMetrics[year]?.investmentIncomeNufIfrs17 || 0;
              flatYearlyMetrics[`GrossNonUnitFundReservesIfrs17_${year}`] = calc.yearlyMetrics[year]?.grossNonUnitFundReservesIfrs17 || 0;

              flatYearlyMetrics[`GrossBEL_${year}`] = calc.yearlyMetrics[year]?.grossBEL || 0;
              flatYearlyMetrics[`OpeningCsmMax_${year}`] = calc.yearlyMetrics[year]?.openingCsmMax || 0;
              flatYearlyMetrics[`CSMVariableFeesMax_${year}`] = calc.yearlyMetrics[year]?.csmVariableFeesMax || 0;
              flatYearlyMetrics[`CSMReleaseMax_${year}`] = calc.yearlyMetrics[year]?.csmReleaseMax || 0;
              flatYearlyMetrics[`ClosingCsmMax_${year}`] = calc.yearlyMetrics[year]?.closingCsmMax || 0;

              flatYearlyMetrics[`PvOfTotalOutgo_${year}`] = calc.yearlyMetrics[year]?.pvOfTotalOutgo || 0;
              flatYearlyMetrics[`RA_${year}`] = calc.yearlyMetrics[year]?.RA || 0;

              flatYearlyMetrics[`OpeningRA_${year}`] = calc.yearlyMetrics[year]?.openingRA || 0;
              flatYearlyMetrics[`RARelease_${year}`] = calc.yearlyMetrics[year]?.raRelease || 0;
              flatYearlyMetrics[`ClosingRA_${year}`] = calc.yearlyMetrics[year]?.closingRA || 0;
              
              flatYearlyMetrics[`OpeningCSM_${year}`] = calc.yearlyMetrics[year]?.openingCSM || 0;
              flatYearlyMetrics[`CSMVariableFees_${year}`] = calc.yearlyMetrics[year]?.csmVariableFees || 0;
              flatYearlyMetrics[`CSMRelease_${year}`] = calc.yearlyMetrics[year]?.csmRelease || 0;
              flatYearlyMetrics[`ClosingCSM_${year}`] = calc.yearlyMetrics[year]?.closingCSM || 0;

              flatYearlyMetrics[`OpeningLossComponent_${year}`] = calc.yearlyMetrics[year]?.openingLossComponent || 0;
              flatYearlyMetrics[`ClosingLossComponent_${year}`] = calc.yearlyMetrics[year]?.closingLossComponent || 0;
              flatYearlyMetrics[`IncreaseInLosses_${year}`] = calc.yearlyMetrics[year]?.increaseInLosses || 0;
              
          });
      }

          newData.push({
            SR_NO: srNo,
            PolicyTerm: calc.policyTerm,
            PPT: calc.ppt,
            TimeInMonths: calc.month,
            ValuationDate: calc.formattedValuationDate,
            Year: calc.valuationYear,
            PolicyYear: calc.policyYear,
            Age: calc.age,
            LoyaltyBonus: calc.loyaltyBonus,
            Scalar: calc.scalar,
            SurrenderCharge: calc.surrenderCharge,
            SurrenderChargeRate : calc.surrenderChargeRate,
            Commission: calc.commission,
            AllocationCharge: calc.allocationCharge,
            Death_Option: calc.death_option,
            SumAssured: calc.sumAssured,
            MonthlyInterestRate: calc.monthlyInterestRate,
            DeathRate: calc.deathRate,
            SurrenderRate: calc.surrenderRate,
            NoPBoP: calc.noPBoP,
            NoOfDeaths: calc.noOfDeaths,
            NoOfSurrs: calc.noOfSurrs,
            NoOfMats: calc.noOfMats,
            NoPEoP: calc.noPEoP,
            PremiumIncome: calc.premiumIncome,
            AllocationChargeAmount: calc.allocationChargeAmount,
            AdminFee: calc.adminFee,
            InitialCommission: calc.initialCommission,
            RenewalCommission: calc.renewalCommission,
            InitialExpense: calc.initialExpense,
            RenewalExpense: calc.renewalExpense,
            UnitFundBeforeDeduction: calc.unitFundBeforeDeduction,
            UnitFundAfterDeduction: calc.unitFundAfterDeduction,
            UnitFundAfterGrowth: calc.unitFundAfterGrowth,
            UnitFundInforce: calc.unitFundInforce,
            FundManagementChargeAmount: calc.fundManagementChargeAmount,
            UndecrementedFVBeforeDeduction: calc.undecrementedFVBeforeDeduction,
            UndecrementedFVAfterUnitDeductions: calc.undecrementedFVAfterUnitDeductions,
            UndecrementedFVAfterDeductionBB: calc.undecrementedFVAfterDeductionBB,
            LoyaltyBonusAmount: calc.loyaltyBonusAmount,
            LoyaltyBonusPerPolicy: calc.loyaltyBonusPerPolicy,
            UndecrementedFV: calc.undecrementedFV,
            UndecrementedGrossSumAtRisk: calc.undecrementedGrossSumAtRisk,
            DecrementedGrossSumAtRisk: calc.decrementedGrossSumAtRisk,
            COI: calc.coi,
            DeathUnitOutgo: calc.deathUnitOutgo,
            SurrenderChargesAmount: calc.surrenderChargesAmount,
            SurrenderClaimsNU : calc.nuSurrenderClaims,
            SurrUnitOutgo: calc.surrUnitOutgo,
            UnitMaturityOutgo: calc.unitMaturityOutgo,
            DeathBenefitPP: calc.deathBenefitPP,
            DeathOutgo: calc.deathOutgo,
            NUDeathClaims: calc.nuDeathClaims,
            NonUnitFundReserves: calc.nonUnitFundReserves,
            UndecrementedRISumAtRisk: calc.undecrementedRISumAtRisk,
            DecrementedRISumAtRisk: calc.decrementedRISumAtRisk,
            RIShareOfClaimsPaid: calc.riShareOfClaimsPaid,
            RIPremiums: calc.riPremiums,
            RIReserves: calc.riReserves,
            ChangeInUnitFund: calc.changeInUnitFund,
            ChangeInGrossNonUnitReserves: calc.changeInGrossNonUnitReserves,
            ChangeInRIReserves: calc.changeInRIReserves,
            InvestmentIncomeUF: calc.investmentIncomeUf,
            NLCfsSm: calc.nlCfsSm,
            NLCfsEm: calc.nlCfsEm,
            InvestmentIncomeNUF: calc.investmentIncomeNuf,
            GrossCoverageUnitsInforce: calc.grossCoverageUnitsInforce,
            ReinCoverageUnitsInforce: calc.reinCoverageUnitsInforce,
            NonUnitFundReservesIfrs: calc.nonUnitFundReservesIfrs,
            RIReservesIfrs: calc.riReservesIfrs,
            GrossBel: calc.grossBel,
            PVOfPremium: calc.pvOfPremium,
            PVOfTotOutgo: calc.pvOfTotOutgo,
            GrossRA: calc.grossRa,
            PVOfRIRecovery: calc.pvOfRiRecovery,
            ReinRA: calc.reinRa,
            OpeningGrossCSM: calc.openingGrossCsm,
            CSMVariableFee: calc.csmVariableFee,  
            CSMReleasePattern: calc.csmReleasePattern,
            CSMRelease: calc.csmRelease,
            ClosingGrossCSM: calc.closingGrossCsm,
            OpeningGrossRA: calc.openingGrossRa,
            RARelease: calc.raRelease,
            ClosingGrossRA: calc.closingGrossRa,
            OpeningRICSM: calc.openingRiCsm,
            RICSMReleasePattern: calc.riCsmReleasePattern,
            InterestEarnedOnRICSM: calc.interestEarnedOnRiCsm,
            RICSMRelease: calc.riCsmRelease, // this is different 
            ClosingRICSM: calc.closingRiCsm,
            OpeningRIRA: calc.openingRiRa,
            ReinRARelease: calc.reinRaRelease,
            ClosingReinRA: calc.closingReinRa,
            //new value added 
            InvestmentExpenses: calc.investmentExpenses,
        
            // new added values

          ...flatYearlyMetrics
          });
  });

  });

  const expensesData = {
      activeNop: allActiveNopArrays,
      maintenanceExpenses: allMaintenanceExpenses,
      noPolsIfsm: allNoPolsIfsm,
      vendorFixedFee: allVendorFixedFee,
      maintExpPerPolicy: allMaintExp,
      vffPerPolicy: allVFF,
    };
    setExtractionData(newData);
    
      if (onResultsChange) {
  onResultsChange({newData, expensesData});
  }    
  }, [
    formData.modelPointInputs, 
    formData.valuationDate, 
    formData.loyaltyBonus, 
    formData.surrenderCharge,
    formData.commission,
    formData.premiumAllocationCharge,
    formData.yieldCurves,
    formData.mortalityData,
    formData.mortalityRateMultiple,
    formData.lapseRate,
    formData.adminCharge,
    formData.fundManagementCharge,
    formData.coiCharges,
    formData.coiRiskChargeMultiple,
    formData.reinsuranceQuotaShare,
    formData.reinsuranceRates,
    formData.riRates,
    // Add these here 
    formData.businessProjections,
    formData.vendorCommissionAllocation,
    formData.vendorCommissionPolicy,
    formData.vendorCommissionFMC,
    formData.vendorCommissionSurrender,
    formData.flatAnnualFeeToVendor,
    formData.fundManagementExpense,
    formData.grossRiskAdjustment,
    targetYears,
    // ------------
    onResultsChange  // <-- ADD THIS TO DEPENDENCIES TOO
  ]);


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
              <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Surrender Charge</th>

               <th className="py-3 px-4 text-left font-semibold text-gray-700 border">Surrender Charge RATE </th>

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
<td className="py-2 px-4 border">{row.SurrenderCharge !== undefined ? row.SurrenderCharge.toFixed(2) : '0.00'}</td>
<td className="py-2 px-4 border">{row.SurrenderChargeRate !== undefined ? row.SurrenderChargeRate.toFixed(2) : '0.00'}</td>

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
                
                 {/* --- DYNAMIC YEARLY DATA CELLS --- */}
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