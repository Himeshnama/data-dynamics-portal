
import { v4 as uuidv4 } from 'uuid';

export interface DataRow {
  id: string;
  [key: string]: string | number;
}

export interface DataTable {
  id: string;
  name: string;
  data: DataRow[];
  columns: string[];
}

// Initialize default data for first-time users
const initializeDefaultData = (): DataTable[] => {
  const sampleData: DataRow[] = [
    { id: uuidv4(), "Code": 112, "Company Name": "Microsoft", "Employee Number": 221000, "Net Worth (in billion dollars)": 2135, "Global Position": 21 },
    { id: uuidv4(), "Code": 113, "Company Name": "Meta", "Employee Number": 58604, "Net Worth (in billion dollars)": 36, "Global Position": 27 },
    { id: uuidv4(), "Code": 114, "Company Name": "Amazon", "Employee Number": 1468000, "Net Worth (in billion dollars)": 1053.5, "Global Position": 4 },
    { id: uuidv4(), "Code": 115, "Company Name": "Google", "Employee Number": 150028, "Net Worth (in billion dollars)": 1420, "Global Position": 2 },
    { id: uuidv4(), "Code": 116, "Company Name": "Tesla", "Employee Number": 110000, "Net Worth (in billion dollars)": 710.78, "Global Position": 103 },
  ];
  
  const defaultColumns = Object.keys(sampleData[0]).filter(key => key !== 'id');
  
  return [{
    id: uuidv4(),
    name: "Tech Companies",
    data: sampleData,
    columns: defaultColumns
  }];
};

// Load data from localStorage or initialize if not exists
export const loadTables = (): DataTable[] => {
  try {
    const storedData = localStorage.getItem('appData');
    if (storedData) {
      return JSON.parse(storedData);
    }
    const defaultData = initializeDefaultData();
    saveTables(defaultData);
    return defaultData;
  } catch (error) {
    console.error("Error loading data:", error);
    return initializeDefaultData();
  }
};

// Save tables to localStorage
export const saveTables = (tables: DataTable[]): void => {
  try {
    localStorage.setItem('appData', JSON.stringify(tables));
  } catch (error) {
    console.error("Error saving data:", error);
  }
};

// Get a specific table by ID
export const getTableById = (tableId: string): DataTable | undefined => {
  const tables = loadTables();
  return tables.find(table => table.id === tableId);
};

// Update a specific table
export const updateTable = (updatedTable: DataTable): void => {
  const tables = loadTables();
  const index = tables.findIndex(table => table.id === updatedTable.id);
  
  if (index !== -1) {
    tables[index] = updatedTable;
    saveTables(tables);
  }
};

// Add a new table
export const addTable = (table: DataTable): void => {
  const tables = loadTables();
  tables.push(table);
  saveTables(tables);
};

// Delete a table
export const deleteTable = (tableId: string): void => {
  const tables = loadTables();
  const filteredTables = tables.filter(table => table.id !== tableId);
  saveTables(filteredTables);
};

// Get the most recently updated table (for visualization default)
export const getLatestTable = (): DataTable | undefined => {
  const tables = loadTables();
  return tables.length > 0 ? tables[0] : undefined;
};
