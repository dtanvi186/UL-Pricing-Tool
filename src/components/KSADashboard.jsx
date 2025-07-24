// KSADashboard.jsx (Updated Parent Component)
import { useState, useEffect, useCallback } from 'react';
import InputTab from './InputTab';
import ModelPointInputs from './ModelPointInputs';
import ExtractionTab from './ExtractionTab'; // Import the new ExtractionTab 

/* import Year2025IFRS4 from './BaseIFRS4Tab'; // Add this line
import SubsequentIFRS4 from './SubsequentYearIFRS4Tab';
import Year2025IFRS17 from './BaseIFRS17Tab'; 
import SubsequentIFRS17 from './SubsequentYearIFRS17Tab';*/
import IFRS4Out from './IFRS4Out';
import Expenses from './ExpenseSummaryTab';
import IFRS17Out from './IFRS17Output';


import { 
  // Import only the functions we actually use
  parseLapseRateCSV,
  downloadLapseRateTemplateFile as downloadLapseRateTemplate,
  parseMortalityCSV,
  parseRIRatesCSV,
  parseYieldCurvesCSV,
  parseCOIChargesCSV,
  downloadMortalityTemplateFile,
  downloadRIRatesTemplateFile,
  downloadCOIChargesTemplateFile,
  downloadYieldCurvesTemplateFile
} from './tableUtils';

const LuxUnitLinkedPricingTool = () => {

  const [activeTab, setActiveTab] = useState('Input');

   // added this line to complete the flow of the extraction tab
  const [extractionResults, setExtractionResults] = useState([]);
  

  /*/Set the states for different year summaries for both 4 and 17 
  const [Year2025IFRS4Data, set2025IFRS4Data] = useState(null);
  const [Year2026IFRS4Data, set2026IFRS4Data] = useState(null);
  const [Year2027IFRS4Data, set2027IFRS4Data] = useState(null);
  const [Year2028IFRS4Data, set2028IFRS4Data] = useState(null);
  const [Year2029IFRS4Data, set2029IFRS4Data] = useState(null); */

  const [IFRS4OutData, setIFRS4OutData] = useState(null); 
  const [IFRS17OutData, setIFRS17OutData] = useState(null); 
  // states for the output tab

 /* const [Year2025IFRS17Data, set2025IFRS17Data] = useState(null);
  const [Year2026IFRS17Data, set2026IFRS17Data] = useState(null);
  const [Year2027IFRS17Data, set2027IFRS17Data] = useState(null);
  const [Year2028IFRS17Data, set2028IFRS17Data] = useState(null);
  const [Year2029IFRS17Data, set2029IFRS17Data] = useState(null);*/



  const initializeDefaultValues = () => {
    // Initialize commission data
    const defaultCommission = {};
    for (let year = 1; year <= 20; year++) {
      defaultCommission[year] = {
        1: year === 1 ? 3.00 : 0.00,
        3: year === 1 ? 10.00 : year === 2 ? 3.00 : 0.00,
        5: year === 1 ? 10.00 : year === 2 ? 3.00 : 0.00,
        10: year === 1 ? 10.00 : year === 2 ? 3.00 : 0.00
      };
    }
    
    // Initialize premium allocation charge data
    const defaultPremiumAllocation = {};
    for (let year = 1; year <= 20; year++) {
      defaultPremiumAllocation[year] = {
        1: year === 1 ? 94.50 : 0.00,
        3: year === 1 ? 95.01 : year === 2 ? 97.01 : year === 3 ? 99.01 : 100.00,
        5: year === 1 ? 90.01 : year === 2 ? 95.01 : year === 3 ? 97.01 : year === 4 || year === 5 ? 99.01 : 100.00,
        10: year === 1 ? 85.01 : year === 2 ? 90.01 : year === 3 ? 95.01 : year >= 4 && year <= 10 ? 97.01 : 100.00
      };
    }
    
    // Initialize lapse rate data
    const defaultLapseRate = {};
    for (let year = 1; year <= 20; year++) {
      if (year === 1) {
        defaultLapseRate[year] = 25.00;
      } else if (year === 2 || year === 3) {
        defaultLapseRate[year] = 15.00;
      } else if (year === 4 || year === 5) {
        defaultLapseRate[year] = 10.00;
      } else {
        defaultLapseRate[year] = 5.00;
      }
    }
    
    // Initialize surrender charge data
    const defaultSurrenderCharge = {};
    for (let year = 1; year <= 20; year++) {
      defaultSurrenderCharge[year] = {
        fixed : 0.00,
        percent: 0.00 
      };
    }

    // Return an object containing all the default tables
    return {
        commission: defaultCommission,
        premiumAllocationCharge: defaultPremiumAllocation,
        lapseRate: defaultLapseRate,
        surrenderCharge: defaultSurrenderCharge
    };
  };


  
  const getInitialFormData = () => {
    try {
      const savedData = localStorage.getItem('userFormData');
      if (savedData) {
        // If we have saved data, parse it and return it
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error("Could not load form data from localStorage", error);
    }

    // If no saved data, get the defaults from our utility function
    const defaultTables = initializeDefaultValues();

    // If no saved data, return the hardcoded default state
    return {
     // Main parameters (both visible and hidden)
    projectionPeriod: 20,
    modelPoints: 17,
    valuationDate: '2025-05-31',
    grossRiskAdjustment: 2.20,
    riRiskAdjustment: -1.00,
    riderChargeMultiple: 'NA',
    coiRiskChargeMultiple: 100.00,    // MODIFIED: Now visible as "Cost of Insurance (% of AMC00)"
    mortalityRateMultiple: 90.00,     // MODIFIED: Now calculated as 0.9 * coiRiskChargeMultiple
    adminCharge: 35.00,               // VISIBLE: Admin Charge (Per Policy)
    fundManagementCharge: 1.00,       // VISIBLE: Fund Management Charge (% of Fund Value)
    fundManagementExpense: 0.45,      // VISIBLE: Fund Management Expense (% of Fund Value)
    riskDiscountRate: 6,
    zakatTax: 2.5,
    currency: 'SAR',
    vendorCommissionPolicy: 5.00,     // VISIBLE: Vendor Commission (% of Policy Administration charges)
    vendorCommissionAllocation: 5.00, // VISIBLE: Vendor Commission (% of Allocation charges)
    vendorCommissionFMC: 0.00,
    vendorCommissionSurrender: 0.00,
    vendorCommissionAllocationLessCommission: 0.00,
    flatAnnualFeeToVendor: 0,         // VISIBLE: Flat Annual Fee to Vendor
    whtOnVendorPayments: 0.00,        // VISIBLE: WHT on Vendor payments
    model: 'Direct Model',
    reinsuranceQuotaShare: 70.00,     // NEW: Reinsurance Quota Share
    reinsuranceRates: 100.00,         // NEW: Reinsurance Rates (% of AMC00)
    
    // Loyalty bonus for specific years
    loyaltyBonus: {
      6: 0.00,
      11: 2.00,
      16: 0.00
    },
    
    // Sensitivity parameters
    sensitivity: {
      mortality: 0.00,
      vendorCommission: 0.00,
      acquisitionExpense: 0.00,
      maintenanceExpense: 0.00,
      outputUnit: 1000.00
    },
    
    /*/ Lapse rate by year
    lapseRate: {},
    
    // Surrender charge by year
    surrenderCharge: {},
    
    // Commission data (by year and term)
    commission: {},
    
    // Premium allocation charge data (by year and term)
    premiumAllocationCharge: {},*/

    ...defaultTables,
    
    // Business projections (both visible and hidden)
    businessProjections: {
      policyCount: {},       // VISIBLE: New Business Policy Count
      maintenanceExpense: {}, // VISIBLE: Maintenance Expense
      acquisitionExpense: {} // VISIBLE: Acquisition Expense
    },
    
    // Mortality data
    mortalityData: {},
    
    // Additional assumption data
    riRates: {},
    yieldCurves: {},
    coiCharges: {},
    
    // Model point inputs
    modelPointInputs: []
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);

  // ---------------------------------------------------------------------------o store the defaults to the browser data
  useEffect(() => {
    try {
      const serializedFormData = JSON.stringify(formData);
      localStorage.setItem('userFormData', serializedFormData);
    } catch (error) {
      console.error("Could not save form data to localStorage", error);
    }
  }, [formData]);
  //------------------------------------------------------------------------------------

  // Initialize all assumption data from external CSV files
  useEffect(() => {
    // Load all assumption data from CSV files
    const loadAssumptionData = async () => {
      try {
        // Load mortality data
        await loadCSVFile('./Tables/mortality_assumptions.csv', 'mortality');
        
        // Load RI rates data
        await loadCSVFile('./Tables/ri_rates.csv', 'ri');
        
        // Load yield curves data
        await loadCSVFile('./Tables/yield_curves.csv', 'yield');
        
        // Load COI charges data
        await loadCSVFile('./Tables/coi_charges.csv', 'coi');
        
        console.log('All assumption data loaded successfully');
      } catch (error) {
        console.error('Error loading assumption data:', error);
        alert('Failed to load one or more assumption files. Please check that all files exist in the Tables directory.');
      }
    };
    
    // Helper function to load a CSV file and process it based on type
    const loadCSVFile = async (filePath, fileType) => {
      try {
        // Use fetch to get the CSV file from the Tables subdirectory
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Failed to load ${fileType} data: ${response.status} ${response.statusText}`);
        }
        
        const csvText = await response.text();
        // Convert the CSV text to a file-like object for parsing
        const blob = new Blob([csvText], { type: 'text/csv' });
        const file = new File([blob], filePath.split('/').pop(), { type: 'text/csv' });
        
        // Process the file based on its type
        switch(fileType) {
          case 'mortality':
            const mortalityData = await parseMortalityCSV(file);
            setFormData(prev => ({ ...prev, mortalityData }));
            break;
          case 'ri':
            const riRates = await parseRIRatesCSV(file);
            setFormData(prev => ({ ...prev, riRates }));
            break;
          case 'yield':
            const yieldCurves = await parseYieldCurvesCSV(file);
            console.log('Loaded yield curves in dashboard:', yieldCurves); // Debug log
            setFormData(prev => ({ ...prev, yieldCurves }));
            break;
          case 'coi':
            const coiCharges = await parseCOIChargesCSV(file);
            setFormData(prev => ({ ...prev, coiCharges }));
            break;
          default:
            console.warn(`Unknown file type: ${fileType}`);
        }
        
        console.log(`${fileType} data loaded successfully`);
      } catch (error) {
        console.error(`Error loading ${fileType} data:`, error);
        throw error; // Re-throw to be caught by the parent function
      }
    };
    
    loadAssumptionData();
    
    // Initialize hidden tables with default values -- remove work done
    //initializeDefaultValues();
  }, []);
  
  // Function to initialize all the default values for hidden tables
  /*const initializeDefaultValues = () => {
    // Initialize commission data
    const defaultCommission = {};
    for (let year = 1; year <= 20; year++) {
      defaultCommission[year] = {
        1: year === 1 ? 3.00 : 0.00,
        3: year === 1 ? 10.00 : year === 2 ? 3.00 : 0.00,
        5: year === 1 ? 10.00 : year === 2 ? 3.00 : 0.00,
        10: year === 1 ? 10.00 : year === 2 ? 3.00 : 0.00
      };
    }
    
    // Initialize premium allocation charge data
    const defaultPremiumAllocation = {};
    for (let year = 1; year <= 20; year++) {
      defaultPremiumAllocation[year] = {
        1: year === 1 ? 94.50 : 0.00,
        3: year === 1 ? 95.01 : 
           year === 2 ? 97.01 : 
           year === 3 ? 99.01 : 100.00,
        5: year === 1 ? 90.01 : 
           year === 2 ? 95.01 : 
           year === 3 ? 97.01 : 
           year === 4 || year === 5 ? 99.01 : 100.00,
        10: year === 1 ? 85.01 : 
            year === 2 ? 90.01 : 
            year === 3 ? 95.01 : 
            year >= 4 && year <= 10 ? 97.01 : 100.00
      };
    }
    
    // Initialize lapse rate data
    const defaultLapseRate = {};
    for (let year = 1; year <= 20; year++) {
      if (year === 1) {
        defaultLapseRate[year] = 25.00;
      } else if (year === 2 || year === 3) {
        defaultLapseRate[year] = 15.00;
      } else if (year === 4 || year === 5) {
        defaultLapseRate[year] = 10.00;
      } else {
        defaultLapseRate[year] = 5.00;
      }
    }
    
    // Initialize surrender charge data
    const defaultSurrenderCharge = {};
    for (let year = 1; year <= 20; year++) {
      defaultSurrenderCharge[year] = 0.00;
    }
    
    setFormData(prev => ({
      ...prev,
      commission: defaultCommission,
      premiumAllocationCharge: defaultPremiumAllocation,
      lapseRate: defaultLapseRate,
      surrenderCharge: defaultSurrenderCharge
    }));
  };*/ 
  // KSADashboard.jsx

  // MODIFIED: This function now RETURNS the default objects instead of setting state
  


  // Handle changes to visible input parameters
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    // Only allow changes to visible parameters
    const visibleParameters = [
      'adminCharge', 
      'fundManagementCharge', 
      'fundManagementExpense',
      'vendorCommissionPolicy', 
      'vendorCommissionAllocation',
      'flatAnnualFeeToVendor',
      'whtOnVendorPayments',
      'coiRiskChargeMultiple',      // ADDED: New visible parameter
      'reinsuranceQuotaShare',      // ADDED: New visible parameter
      'reinsuranceRates',           // ADDED: New visible parameter
      'currency'                    // ADDED: New visible parameter
    ];
    
    if (!visibleParameters.includes(name)) {
      console.warn(`Attempt to change hidden parameter: ${name}`);
      return; // Don't allow changes to hidden parameters
    }
    
    // Parse values based on input type
    let parsedValue;
    if (type === 'number') {
      parsedValue = value === '' ? '' : Number(value);
    } else {
      parsedValue = value;
    }
    
    // Special handling for coiRiskChargeMultiple to recalculate mortalityRateMultiple
    if (name === 'coiRiskChargeMultiple') {
      setFormData(prevState => ({
        ...prevState,
        [name]: parsedValue,
        // Update mortalityRateMultiple as 0.9 * coiRiskChargeMultiple
        mortalityRateMultiple: parsedValue === '' ? '' : Number((0.9 * parsedValue).toFixed(2))
      }));
    } else {
      // Normal case for other parameters
      setFormData(prevState => ({
        ...prevState,
        [name]: parsedValue
      }));
    }
  };

  // Handle changes to loyalty bonus parameters
  const handleLoyaltyBonusChange = (year, value) => {
    setFormData({
      ...formData,
      loyaltyBonus: {
        ...formData.loyaltyBonus,
        [year]: value === '' ? '' : Number(value)
      }
    });
  };

  // Handle changes to sensitivity parameters
  const handleSensitivityChange = (field, value) => {
    setFormData(prevState => ({
      ...prevState,
      sensitivity: {
        ...prevState.sensitivity,
        [field]: value === '' ? '' : Number(value)
      }
    }));
  };

  // Handle changes to lapse rate fields
  const handleLapseRateChange = (year, value) => {
    setFormData(prevState => {
      // If changing year 5+, update all years 5-20
      if (year === 5) {
        const updatedLapseRate = {...prevState.lapseRate};
        
        // Update all years from 5 to 20 with the same value
        for (let y = 5; y <= 20; y++) {
          updatedLapseRate[y] = value === '' ? '' : Number(value);
        }
        
        return {
          ...prevState,
          lapseRate: updatedLapseRate
        };
      }
      
      // Normal single year update
      return {
        ...prevState,
        lapseRate: {
          ...prevState.lapseRate,
          [year]: value === '' ? '' : Number(value)
        }
      };
    });
  };

  // Handle changes to surrender charge fields
  // In KSADashboard.jsx

  // Handle changes to surrender charge fields
  const handleSurrenderChargeChange = (year, type, value) => {
    setFormData(prevState => {
      const parsedValue = value === '' ? '' : Number(value);

      // If changing year 5+, update all years 5-20
      if (year === 5) {
        const updatedSurrenderCharge = {...prevState.surrenderCharge};
        
        for (let y = 5; y <= 20; y++) {
          updatedSurrenderCharge[y] = {
            ...updatedSurrenderCharge[y],
            [type]: parsedValue
          };
        }
        
        return {
          ...prevState,
          surrenderCharge: updatedSurrenderCharge
        };
      }
      // Normal single year update
      const yearData = prevState.surrenderCharge[year] || { fixed: 0, percent: 0 };
      return {
        ...prevState,
        surrenderCharge: {
          ...prevState.surrenderCharge,
          [year]: {
            ...yearData,
            [type]: parsedValue

          }
        }
      };
    });
  };

  // Handle changes to premium allocation charge fields
  const handlePremiumAllocationChargeChange = (year, term, value) => {
    setFormData(prevState => {
      // Initialize the year object if it doesn't exist
      const yearData = prevState.premiumAllocationCharge[year] || {};
      
      return {
        ...prevState,
        premiumAllocationCharge: {
          ...prevState.premiumAllocationCharge,
          [year]: {
            ...yearData,
            [term]: value === '' ? '' : Number(value)
          }
        }
      };
    });
  };

  // Handle changes to commission fields
  const handleCommissionChange = (year, term, value) => {
    setFormData(prevState => {
      // Initialize the year object if it doesn't exist
      const yearData = prevState.commission[year] || {};
      
      return {
        ...prevState,
        commission: {
          ...prevState.commission,
          [year]: {
            ...yearData,
            [term]: value === '' ? '' : Number(value)
          }
        }
      };
    });
  };

  // Handle model point inputs change
  const handleModelPointChange = (updatedModelPoints) => {
    setFormData(prevState => ({
      ...prevState,
      modelPointInputs: updatedModelPoints
    }));
  };

  // Handle changes to business projection fields (visible)
  const handleBusinessProjectionChange = (field, year, value) => {
    // Only allow changes to visible parameters
    const visibleFields = ['policyCount', 'maintenanceExpense', 'acquisitionExpense'];
    
    if (!visibleFields.includes(field)) {
      console.warn(`Attempt to change hidden business projection field: ${field}`);
      return; // Don't allow changes to hidden fields
    }
    
    setFormData(prevState => {
      // Initialize the field object if it doesn't exist
      const fieldData = prevState.businessProjections[field] || {};
      
      return {
        ...prevState,
        businessProjections: {
          ...prevState.businessProjections,
          [field]: {
            ...fieldData,
            [year]: value === '' ? '' : Number(value)
          }
        }
      };
    });
  };

  // Handle mortality data related functions - now they're empty since we load from file
  const handleMortalityDataChange = () => {};
  const handleMortalityFileUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    try {
      const file = e.target.files[0];
      const mortalityData = await parseMortalityCSV(file);
      
      setFormData(prevState => ({
        ...prevState,
        mortalityData
      }));
      
      // Success message
      alert('Mortality data imported successfully!');
    } catch (error) {
      // Error message
      alert(error.message);
    }
    
    // Reset the file input
    e.target.value = null;
  };

  // Handle RI rates file upload
  const handleRIRatesFileUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    try {
      const file = e.target.files[0];
      const riRates = await parseRIRatesCSV(file);
      
      setFormData(prevState => ({
        ...prevState,
        riRates
      }));
      
      // Success message
      alert('RI rates data imported successfully!');
    } catch (error) {
      // Error message
      alert(error.message);
    }
    
    // Reset the file input
    e.target.value = null;
  };
  
  // Handle COI charges file upload
  const handleCOIChargesFileUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    try {
      const file = e.target.files[0];
      const coiCharges = await parseCOIChargesCSV(file);
      
      setFormData(prevState => ({
        ...prevState,
        coiCharges
      }));
      
      // Success message
      alert('COI charges data imported successfully!');
    } catch (error) {
      // Error message
      alert(error.message);
    }
    
    // Reset the file input
    e.target.value = null;
  };
  
  // Handle yield curves file upload
  const handleYieldCurvesFileUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    try {
      const file = e.target.files[0];
      const yieldCurves = await parseYieldCurvesCSV(file);
      
      setFormData(prevState => ({
        ...prevState,
        yieldCurves
      }));
      
      // Success message
      alert('Yield curves data imported successfully!');
    } catch (error) {
      // Error message
      alert(error.message);
    }
    
    // Reset the file input
    e.target.value = null;
  };

  // Handle lapse rate and surrender charge CSV file upload
  const handleLapseRateFileUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    try {
      const file = e.target.files[0];
      const { lapseRateData, surrenderChargeData } = await parseLapseRateCSV(file);
      
      setFormData(prevState => ({
        ...prevState,
        lapseRate: lapseRateData,
        surrenderCharge: surrenderChargeData
      }));
      
      // Success message
      alert('Lapse rate and surrender charge data imported successfully!');
    } catch (error) {
      // Error message
      alert(error.message);
    }
    
    // Reset the file input
    e.target.value = null;
  };

  // handle chnages in he extraction tab 
  const handleExtractionResultsChange = useCallback((results) => {
  setExtractionResults(results); 
   
  }, []);



const handleIFRS4Change = (data) => {
    setIFRS4OutData(data);
  };

const handleIFRS17Change = (data) => {
    setIFRS17OutData(data);
  };


  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-blue-700 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">Lux Unit-Linked Pricing Tool</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'Input'
              ? 'text-blue-700 border-b-2 border-blue-700'
              : 'text-gray-500 hover:text-blue-700'
          }`}
          onClick={() => setActiveTab('Input')}
        >
          Input Parameters
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'ModelPoints'
              ? 'text-blue-700 border-b-2 border-blue-700'
              : 'text-gray-500 hover:text-blue-700'
          }`}
          onClick={() => setActiveTab('ModelPoints')}
        >
          Model Point Inputs
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'Extraction'
              ? 'text-blue-700 border-b-2 border-blue-700'
              : 'text-gray-500 hover:text-blue-700'
          }`}
          onClick={() => setActiveTab('Extraction')}
        >
          Extraction
        </button>
         <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'Expenses'
              ? 'text-blue-700 border-b-2 border-blue-700'
              : 'text-gray-500 hover:text-blue-700'
          }`}
          onClick={() => setActiveTab('Expenses')}
        >
          Expenses {/*chnage the name later if needed */}
        </button>

         { /* ouput tab */ } 
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'IFRS4'
              ? 'text-blue-700 border-b-2 border-blue-700'
              : 'text-gray-500 hover:text-blue-700'
          }`}
          onClick={() => setActiveTab('IFRS4')}
        >
         IFRS 4 Output{/*chnage the name later if needed  */}
        </button> 

        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'IFRS17'
              ? 'text-blue-700 border-b-2 border-blue-700'
              : 'text-gray-500 hover:text-blue-700'
          }`}
          onClick={() => setActiveTab('IFRS17')}
        >
            IFRS 17 Output {/*chnage the name later if needed  */}
        </button> 
        

      


         {/* add tabs for more years here}




{/* Additional tabs can be added here */}
      </div>

      {/* Tab Content */}
      <div className="flex-grow p-6 overflow-auto">
        {activeTab === 'Input' && (
          <InputTab 
            formData={formData} 
            handleInputChange={handleInputChange} 
            handleLoyaltyBonusChange={handleLoyaltyBonusChange}
            handleSensitivityChange={handleSensitivityChange}
            handleLapseRateChange={handleLapseRateChange}
            handleSurrenderChargeChange={handleSurrenderChargeChange}
            handlePremiumAllocationChargeChange={handlePremiumAllocationChargeChange}
            handleCommissionChange={handleCommissionChange}
            handleLapseRateFileUpload={handleLapseRateFileUpload}
            handleBusinessProjectionChange={handleBusinessProjectionChange}
            handleMortalityFileUpload={handleMortalityFileUpload}
            handleRIRatesFileUpload={handleRIRatesFileUpload}
            handleCOIChargesFileUpload={handleCOIChargesFileUpload}
            handleYieldCurvesFileUpload={handleYieldCurvesFileUpload}
            downloadLapseRateTemplate={downloadLapseRateTemplate}
            downloadMortalityTemplate={downloadMortalityTemplateFile}
            downloadRIRatesTemplate={downloadRIRatesTemplateFile}
            downloadCOIChargesTemplate={downloadCOIChargesTemplateFile}
            downloadYieldCurvesTemplate={downloadYieldCurvesTemplateFile}
          />
        )}
        {activeTab === 'ModelPoints' && (
          <ModelPointInputs 
            formData={formData}
            handleModelPointChange={handleModelPointChange}
          />
        )}

        {activeTab === 'Extraction' && (
          <ExtractionTab 
            formData={formData}
             onResultsChange={handleExtractionResultsChange}
          />
        )}

        {/* Render Logic for additional years to be added here */}
        {activeTab === 'Expenses' && (
          <Expenses 
            formData={formData}
            extractionResults={extractionResults}
          />
        )}

        
        {activeTab === 'IFRS4' && (
          <IFRS4Out
            formData={formData}
            extractionResults={extractionResults}
            onDataCalculatedIFRS4Out={handleIFRS4Change}
          />
        )}
        {activeTab === 'IFRS17' && (
          <IFRS17Out
            formData={formData}
            extractionResults={extractionResults}
            IFRS4OutData = {IFRS4OutData}
            onDataCalculatedIFRS17Out={handleIFRS17Change}
          />
        )}
        


      </div>
    </div>
  );
};

export default LuxUnitLinkedPricingTool;