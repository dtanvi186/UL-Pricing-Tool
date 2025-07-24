// tableUtils.js - Utility functions for table CSV imports and exports

/**
 * Parse a CSV file and update the Commission data
 * @param {File} file - The uploaded CSV file
 * @returns {Promise<Object>} - The parsed commission data
 */
export const parseCommissionCSV = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvData = event.target.result;
        const lines = csvData.split('\n');
        const commissionData = {};
        
        // Skip header row and process data rows
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',');
          const policyYear = parseInt(values[0], 10);
          
          if (isNaN(policyYear) || policyYear < 1 || policyYear > 20) continue;
          
          commissionData[policyYear] = {
            1: parseFloat(values[1] || 0).toFixed(2),
            3: parseFloat(values[2] || 0).toFixed(2),
            5: parseFloat(values[3] || 0).toFixed(2),
            10: parseFloat(values[4] || 0).toFixed(2)
          };
        }
        
        resolve(commissionData);
      } catch (error) {
        reject(new Error('Failed to parse CSV file. Please ensure it follows the correct format.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read the CSV file.'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Parse a CSV file and update the Premium Allocation Charge data
 * @param {File} file - The uploaded CSV file
 * @returns {Promise<Object>} - The parsed premium allocation charge data
 */
export const parsePremiumAllocationCSV = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvData = event.target.result;
        const lines = csvData.split('\n');
        const premiumData = {};
        
        // Skip header row and process data rows
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',');
          const policyYear = parseInt(values[0], 10);
          
          if (isNaN(policyYear) || policyYear < 1 || policyYear > 20) continue;
          
          premiumData[policyYear] = {
            1: parseFloat(values[1] || 0).toFixed(2),
            3: parseFloat(values[2] || 0).toFixed(2),
            5: parseFloat(values[3] || 0).toFixed(2),
            10: parseFloat(values[4] || 0).toFixed(2)
          };
        }
        
        resolve(premiumData);
      } catch (error) {
        reject(new Error('Failed to parse CSV file. Please ensure it follows the correct format.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read the CSV file.'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Parse a CSV file and update the Lapse Rate and Surrender Charge data
 * @param {File} file - The uploaded CSV file
 * @returns {Promise<Object>} - The parsed lapse rate and surrender charge data
 */
export const parseLapseRateCSV = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvData = event.target.result;
        const lines = csvData.split('\n');
        const lapseRateData = {};
        const surrenderChargeData = {};
        
        // Skip header row and process data rows
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',');
          const policyYear = parseInt(values[0], 10);
          
          if (isNaN(policyYear) || policyYear < 1 || policyYear > 20) continue;
          
          lapseRateData[policyYear] = parseFloat(values[1] || 0).toFixed(2);
          surrenderChargeData[policyYear] = parseFloat(values[2] || 0).toFixed(2);
        }
        
        resolve({ lapseRateData, surrenderChargeData });
      } catch (error) {
        reject(new Error('Failed to parse CSV file. Please ensure it follows the correct format.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read the CSV file.'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Parse a CSV or TXT file and update the Mortality Rate data
 * @param {File} file - The uploaded CSV/TXT file
 * @returns {Promise<Object>} - The parsed mortality rate data
 */
export const parseMortalityCSV = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvData = event.target.result;
        // Determine if file is tab-delimited or comma-delimited
        const delimiter = csvData.includes('\t') ? '\t' : ',';
        const lines = csvData.split('\n');
        const mortalityData = {};
        
        // Skip header row and process data rows
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(delimiter);
          if (values.length < 3) continue; // Skip invalid lines
          
          const age = parseInt(values[0], 10);
          const sex = parseInt(values[1], 10); // Parse as integer (0 or 1)
          const mortalityRate = parseFloat(values[2] || 0);
          
          if (isNaN(age) || age < 0 || age > 120) continue;
          if (isNaN(sex) || (sex !== 0 && sex !== 1)) continue; // Only allow 0 or 1
          
          // Initialize age if not exists
          if (!mortalityData[age]) {
            mortalityData[age] = {};
          }
          
          // Store mortality rate directly under age and sex
          mortalityData[age][sex] = mortalityRate;
        }
        
        resolve(mortalityData);
      } catch (error) {
        reject(new Error('Failed to parse file. Please ensure it follows the correct format.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read the file.'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Parse a CSV file and update the RI Rates data
 * @param {File} file - The uploaded CSV file
 * @returns {Promise<Object>} - The parsed RI rates data
 */
export const parseRIRatesCSV = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvData = event.target.result;
        // Determine if file is tab-delimited or comma-delimited
        const delimiter = csvData.includes('\t') ? '\t' : ',';
        const lines = csvData.split('\n');
        const riRatesData = {};
        
        // Skip header row and process data rows
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(delimiter);
          if (values.length < 4) continue; // Skip invalid lines
          
          const age = parseInt(values[0], 10);
          const sex = parseInt(values[1], 10);
          const smokerStatus = parseInt(values[2], 10);
          const riRate = parseFloat(values[3] || 0);
          
          if (isNaN(age) || age < 0 || age > 120) continue;
          if (isNaN(sex) || (sex !== 0 && sex !== 1)) continue;
          if (isNaN(smokerStatus) || (smokerStatus !== 0 && smokerStatus !== 1)) continue;
          
          // Initialize age if not exists
          if (!riRatesData[age]) {
            riRatesData[age] = {};
          }
          
          // Initialize sex if not exists
          if (!riRatesData[age][sex]) {
            riRatesData[age][sex] = {};
          }
          
          // Store RI rate directly under age, sex, and smoker status
          riRatesData[age][sex][smokerStatus] = riRate;
        }
        
        resolve(riRatesData);
      } catch (error) {
        reject(new Error('Failed to parse RI rates file. Please ensure it follows the correct format.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read the RI rates file.'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Parse a CSV file and update the Yield Curves data
 * @param {File} file - The uploaded CSV file
 * @returns {Promise<Object>} - The parsed yield curves data
 */
export const parseYieldCurvesCSV = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvData = event.target.result;
        // Determine if file is tab-delimited or comma-delimited
        const delimiter = csvData.includes('\t') ? '\t' : ',';
        const lines = csvData.split('\n');
        const yieldCurvesData = {};
        
        // Skip header row and process data rows
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(delimiter);
          if (values.length < 2) continue; // Skip invalid lines
          
          const timePeriod = parseInt(values[0], 10); // This should be Time_Period
          const yc = parseFloat(values[1] || 0); // This should be YC
          
          if (isNaN(timePeriod) || timePeriod < 0) continue;
          
          // Store the yield curve value for the time period
          yieldCurvesData[timePeriod] = yc;
        }
        
        console.log('Parsed yield curves data:', yieldCurvesData); // Debug log
        resolve(yieldCurvesData);
      } catch (error) {
        reject(new Error('Failed to parse yield curves file. Please ensure it follows the correct format.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read the yield curves file.'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Parse a CSV file and update the COI Charges data
 * @param {File} file - The uploaded CSV file
 * @returns {Promise<Object>} - The parsed COI charges data
 */
export const parseCOIChargesCSV = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvData = event.target.result;
        // Determine if file is tab-delimited or comma-delimited
        const delimiter = csvData.includes('\t') ? '\t' : ',';
        const lines = csvData.split('\n');
        const coiChargesData = {};
        
        // Skip header row and process data rows
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(delimiter);
          if (values.length < 4) continue; // Skip invalid lines
          
          const age = parseInt(values[0], 10);
          const sex = values[1].trim();
          const smokerStatus = values[2].trim();
          const coiCharge = parseFloat(values[3] || 0);
          
          if (isNaN(age) || age < 0 || age > 120) continue;
          
          // Initialize age if not exists
          if (!coiChargesData[age]) {
            coiChargesData[age] = {};
          }
          
          // Initialize sex if not exists
          if (!coiChargesData[age][sex]) {
            coiChargesData[age][sex] = {};
          }
          
          // Initialize smoker status if not exists
          if (!coiChargesData[age][sex][smokerStatus]) {
            coiChargesData[age][sex][smokerStatus] = {};
          }
          
          // Set same COI charge for all product codes
          coiChargesData[age][sex][smokerStatus]['SP'] = coiCharge;
          coiChargesData[age][sex][smokerStatus]['VAR2'] = coiCharge;
          coiChargesData[age][sex][smokerStatus]['VAR3'] = coiCharge;
        }
        
        resolve(coiChargesData);
      } catch (error) {
        reject(new Error('Failed to parse COI charges file. Please ensure it follows the correct format.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read the COI charges file.'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Parse the pasted table content and convert it to mortality data object
 * @param {string} pastedContent - The pasted table content
 * @returns {Object} - The parsed mortality data
 */
export const parsePastedMortalityTable = (pastedContent) => {
  try {
    const lines = pastedContent.split('\n');
    const mortalityData = {};
    
    // Skip header row and process data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Support both tab and comma delimiters
      const delimiter = line.includes('\t') ? '\t' : ',';
      const values = line.split(delimiter);
      if (values.length < 3) continue; // Skip invalid lines
      
      const age = parseInt(values[0], 10);
      const sex = parseInt(values[1], 10); // Parse as integer (0 or 1)
      const mortalityRate = parseFloat(values[2] || 0);
      
      if (isNaN(age) || age < 0 || age > 120) continue;
      if (isNaN(sex) || (sex !== 0 && sex !== 1)) continue; // Only allow 0 or 1
      
      // Initialize age if not exists
      if (!mortalityData[age]) {
        mortalityData[age] = {};
      }
      
      // Store mortality rate directly under age and sex
      mortalityData[age][sex] = mortalityRate;
    }
    
    return mortalityData;
  } catch (error) {
    throw new Error('Failed to parse pasted content. Please ensure it follows the correct format.');
  }
};

/**
 * Generate a CSV template for Commission data
 * @returns {string} - CSV content as a string
 */
export const generateCommissionTemplate = () => {
  // Create header row
  let csvContent = 'Policy Year,1,3,5,10\n';
  
  // Default values as per the provided table
  for (let year = 1; year <= 20; year++) {
    let row = `${year},`;
    
    // For 1-year term
    row += year === 1 ? '3.00,' : '0.00,';
    
    // For 3, 5, and 10-year terms
    if (year === 1) {
      row += '10.00,10.00,10.00';
    } else if (year === 2) {
      row += '3.00,3.00,3.00';
    } else {
      row += '0.00,0.00,0.00';
    }
    
    csvContent += row + '\n';
  }
  
  return csvContent;
};

/**
 * Generate a CSV template for Premium Allocation Charge data
 * @returns {string} - CSV content as a string
 */
export const generatePremiumAllocationTemplate = () => {
  // Create header row
  let csvContent = 'Policy Year,1,3,5,10\n';
  
  // Default values as per the provided table
  for (let year = 1; year <= 20; year++) {
    let row = `${year},`;
    
    // For 1-year term
    row += year === 1 ? '94.50,' : '0.00,';
    
    // For 3-year term
    if (year === 1) {
      row += '95.01,';
    } else if (year === 2) {
      row += '97.01,';
    } else if (year === 3) {
      row += '99.01,';
    } else {
      row += '100.00,';
    }
    
    // For 5-year term
    if (year === 1) {
      row += '90.01,';
    } else if (year === 2) {
      row += '95.01,';
    } else if (year === 3) {
      row += '97.01,';
    } else if (year === 4 || year === 5) {
      row += '99.01,';
    } else {
      row += '100.00,';
    }
    
    // For 10-year term
    if (year === 1) {
      row += '85.01';
    } else if (year === 2) {
      row += '90.01';
    } else if (year === 3) {
      row += '95.01';
    } else if (year >= 4 && year <= 10) {
      row += '97.01';
    } else {
      row += '100.00';
    }
    
    csvContent += row + '\n';
  }
  
  return csvContent;
};

/**
 * Generate a CSV template for Lapse Rate and Surrender Charge data
 * @returns {string} - CSV content as a string
 */
export const generateLapseRateTemplate = () => {
  // Create header row
  let csvContent = 'Policy Year,Lapse Rate,Surrender Charge\n';
  
  // Default values as per the provided table
  for (let year = 1; year <= 20; year++) {
    let row = `${year},`;
    
    // Lapse Rate
    if (year === 1) {
      row += '25.00,';
    } else if (year === 2 || year === 3) {
      row += '15.00,';
    } else if (year === 4 || year === 5) {
      row += '10.00,';
    } else {
      row += '5.00,';
    }
    
    // Surrender Charge
    row += '0.00';
    
    csvContent += row + '\n';
  }
  
  return csvContent;
};

/**
 * Generate a CSV template for Mortality Rate data
 * @returns {string} - CSV content as a string
 */
export const generateMortalityTemplate = () => {
  // Create header row matching the actual CSV structure
  let csvContent = 'Current Age,Sex 0=Male/1=Female,Mortality_Rate\n';
  
  // Default values for each age and gender
  for (let age = 0; age <= 120; age++) {
    // Set age-based default values
    let maleRate, femaleRate;
    
    if (age < 30) {
      maleRate = '0.00045800';
      femaleRate = '0.00017900';
    } else if (age < 60) {
      maleRate = '0.00100000';
      femaleRate = '0.00050000';
    } else if (age < 90) {
      maleRate = '0.05000000';
      femaleRate = '0.03000000';
    } else {
      maleRate = '0.20000000';
      femaleRate = '0.15000000';
    }
    
    // Male row (sex = 0)
    csvContent += `${age},0,${maleRate}\n`;
    
    // Female row (sex = 1)
    csvContent += `${age},1,${femaleRate}\n`;
  }
  
  return csvContent;
};

/**
 * Generate a CSV template for RI Rates data
 * @returns {string} - CSV content as a string
 */
export const generateRIRatesTemplate = () => {
  // Create header row matching the actual CSV structure
  let csvContent = 'Current Age,Sex 0=Male/1=Female,Smoker Status 0=Non-Smoker/1=Smoker,RI_Rate\n';
  
  // Default values for each age, gender, and smoker status
  for (let age = 0; age <= 120; age++) {
    for (let sex = 0; sex <= 1; sex++) {
      for (let smoker = 0; smoker <= 1; smoker++) {
        let rate;
        
        // Set age and smoker status based default values
        if (age < 30) {
          rate = smoker === 0 ? '0.00040000' : '0.00060000';
        } else if (age < 60) {
          rate = smoker === 0 ? '0.00080000' : '0.00120000';
        } else if (age < 90) {
          rate = smoker === 0 ? '0.04000000' : '0.06000000';
        } else {
          rate = smoker === 0 ? '0.18000000' : '0.22000000';
        }
        
        csvContent += `${age},${sex},${smoker},${rate}\n`;
      }
    }
  }
  
  return csvContent;
};


/**
 * Generate a CSV template for COI Charges data
 * @returns {string} - CSV content as a string
 */
export const generateCOIChargesTemplate = () => {
  // Create header row with updated structure
  let csvContent = 'Current Age,Sex 0=Male/1=Female,Smoker Status 0=Non-Smoker/1=Smoker,COI\n';
  
  // Default values for each age, gender, and smoker status
  for (let age = 0; age <= 120; age++) {
    for (let sex = 0; sex <= 1; sex++) {
      for (let smoker = 0; smoker <= 1; smoker++) {
        let coiCharge;
        
        // Set age and smoker status based default values
        if (age < 30) {
          coiCharge = smoker === 0 ? '0.00050000' : '0.00070000';
        } else if (age < 60) {
          coiCharge = smoker === 0 ? '0.00110000' : '0.00150000';
        } else if (age < 90) {
          coiCharge = smoker === 0 ? '0.05500000' : '0.07500000';
        } else {
          coiCharge = smoker === 0 ? '0.22000000' : '0.26000000';
        }
        
        csvContent += `${age},${sex},${smoker},${coiCharge}\n`;
      }
    }
  }
  
  return csvContent;
};

/**
 * Generate a CSV template for Yield Curves data
 * @returns {string} - CSV content as a string
 */
export const generateYieldCurvesTemplate = () => {
  // Create header row matching the actual CSV structure
  let csvContent = 'Time_Period,YC\n';
  
  // Default values for each time period (months)
  // Generate values from 0 to 250+ to cover typical policy terms
  for (let timePeriod = 0; timePeriod <= 250; timePeriod++) {
    // Simple yield curve model: starts at 0.004 and increases gradually
    const yield_value = (0.004 + (timePeriod * 0.000001)).toFixed(6);
    csvContent += `${timePeriod},${yield_value}\n`;
  }
  
  return csvContent;
};

/**
 * Download a string as a CSV file
 * @param {string} content - The CSV content to download
 * @param {string} fileName - The name of the file to download
 */
export const downloadCSV = (content, fileName) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Create and download a Commission template CSV file
 */
export const downloadCommissionTemplateFile = () => {
  const csvContent = generateCommissionTemplate();
  downloadCSV(csvContent, 'commission_template.csv');
};

/**
 * Create and download a Premium Allocation Charge template CSV file
 */
export const downloadPremiumAllocationTemplateFile = () => {
  const csvContent = generatePremiumAllocationTemplate();
  downloadCSV(csvContent, 'premium_allocation_template.csv');
};

/**
 * Create and download a Lapse Rate and Surrender Charge template CSV file
 */
export const downloadLapseRateTemplateFile = () => {
  const csvContent = generateLapseRateTemplate();
  downloadCSV(csvContent, 'lapse_rate_template.csv');
};

/**
 * Create and download a Mortality Rate template CSV file
 */
export const downloadMortalityTemplateFile = () => {
  const csvContent = generateMortalityTemplate();
  downloadCSV(csvContent, 'mortality_rate_template.csv');
};

/**
 * Create and download a RI Rates template CSV file
 */
export const downloadRIRatesTemplateFile = () => {
  const csvContent = generateRIRatesTemplate();
  downloadCSV(csvContent, 'ri_rates_template.csv');
};

/**
 * Create and download a COI Charges template CSV file
 */
export const downloadCOIChargesTemplateFile = () => {
  const csvContent = generateCOIChargesTemplate();
  downloadCSV(csvContent, 'coi_charges_template.csv');
};

/**
 * Create and download a Yield Curves template CSV file
 */
export const downloadYieldCurvesTemplateFile = () => {
  const csvContent = generateYieldCurvesTemplate();
  downloadCSV(csvContent, 'yield_curves_template.csv');
};