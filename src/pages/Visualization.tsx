
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceArea
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { 
  DataRow, 
  DataTable,
  loadTables 
} from '@/services/dataService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatNumber } from '@/lib/utils';

const MAX_CHART_ITEMS = 50; // Limit for better visualization performance

const Visualization: React.FC = () => {
  const { toast } = useToast();
  const [tables, setTables] = useState<DataTable[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [data, setData] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedXAxis, setSelectedXAxis] = useState<string>('');
  const [selectedYAxis, setSelectedYAxis] = useState<string>('');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isDataTruncated, setIsDataTruncated] = useState<boolean>(false);

  // Load tables from localStorage
  useEffect(() => {
    const loadedTables = loadTables();
    setTables(loadedTables);
    
    if (loadedTables.length > 0) {
      const defaultTable = loadedTables[0];
      setSelectedTableId(defaultTable.id);
      setData(defaultTable.data);
      setColumns(defaultTable.columns);
      
      // Try to set sensible default axes
      if (defaultTable.columns.length > 0) {
        // Try to find a text column for X axis
        const textColumn = defaultTable.columns.find(col => 
          defaultTable.data.some(row => typeof row[col] === 'string')
        ) || defaultTable.columns[0];
        
        // Try to find a numeric column for Y axis
        const numericColumn = defaultTable.columns.find(col => 
          defaultTable.data.some(row => typeof row[col] === 'number')
        ) || defaultTable.columns[defaultTable.columns.length > 1 ? 1 : 0];
        
        setSelectedXAxis(textColumn);
        setSelectedYAxis(numericColumn);
      }
    }
  }, []);

  const handleTableChange = (tableId: string) => {
    const selectedTable = tables.find(table => table.id === tableId);
    if (selectedTable) {
      setSelectedTableId(tableId);
      setData(selectedTable.data);
      setColumns(selectedTable.columns);
      
      // Reset axes if they don't exist in the new table
      if (!selectedTable.columns.includes(selectedXAxis)) {
        setSelectedXAxis(selectedTable.columns[0] || '');
      }
      
      if (!selectedTable.columns.includes(selectedYAxis)) {
        // Find a numeric column
        const numericColumn = selectedTable.columns.find(col => 
          selectedTable.data.some(row => typeof row[col] === 'number')
        ) || selectedTable.columns[0] || '';
        
        setSelectedYAxis(numericColumn);
      }
    }
  };

  // Format date values if detected
  const formatDateValue = (value: any): string => {
    if (typeof value !== 'string') return String(value);
    
    // Check if it's potentially a date string
    const dateRegex = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/;
    const match = value.match(dateRegex);
    
    if (match) {
      // Convert to a consistent dd/mm/yyyy format
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];
      return `${day}/${month}/${year}`;
    }
    
    return value;
  };

  const formatChartData = useCallback((rawData: DataRow[]) => {
    if (!selectedXAxis || !selectedYAxis || !rawData.length) return [];
    
    const filteredData = searchTerm 
      ? rawData.filter(row => 
          Object.values(row).some(val => 
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
      : rawData;
    
    let processedData = filteredData.map(row => ({
      name: formatDateValue(row[selectedXAxis]),
      value: typeof row[selectedYAxis] === 'number' 
        ? row[selectedYAxis] 
        : parseFloat(row[selectedYAxis] as string) || 0
    }));
    
    // If there are too many data points, we need to sample them
    setIsDataTruncated(processedData.length > MAX_CHART_ITEMS);
    
    if (processedData.length > MAX_CHART_ITEMS) {
      toast({
        title: "Large Dataset Detected",
        description: `Showing a sample of ${MAX_CHART_ITEMS} out of ${processedData.length} data points for better performance.`,
      });
      
      // Sort by value for better visualization of important data points
      processedData.sort((a, b) => b.value - a.value);
      
      // Take the top items to show trends in the most significant data
      processedData = processedData.slice(0, MAX_CHART_ITEMS);
    }
    
    return processedData;
  }, [selectedXAxis, selectedYAxis, searchTerm, toast]);

  const chartData = useMemo(() => formatChartData(data), [data, formatChartData]);

  return (
    <div className="container mx-auto py-24 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Data Visualization</h1>
        <p className="text-gray-400 mb-6">Create charts to visualize your data</p>
        
        {/* Table selection */}
        {tables.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Table
            </label>
            <Select value={selectedTableId} onValueChange={handleTableChange}>
              <SelectTrigger className="bg-gray-800 text-white border-gray-700 w-full md:w-64">
                <SelectValue placeholder="Select a table" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {tables.map(table => (
                  <SelectItem key={table.id} value={table.id}>
                    {table.name} ({table.data.length} rows)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Chart Type
            </label>
            <div className="flex gap-2">
              <Button
                variant={chartType === 'bar' ? 'default' : 'outline'}
                onClick={() => setChartType('bar')}
                className={chartType === 'bar' ? 'bg-gold-500 text-black' : 'text-white'}
              >
                Bar Chart
              </Button>
              <Button
                variant={chartType === 'line' ? 'default' : 'outline'}
                onClick={() => setChartType('line')}
                className={chartType === 'line' ? 'bg-gold-500 text-black' : 'text-white'}
              >
                Line Chart
              </Button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              X-Axis (Categories)
            </label>
            <select
              value={selectedXAxis}
              onChange={(e) => setSelectedXAxis(e.target.value)}
              className="w-full bg-gray-900 text-white border border-gray-700 rounded-md p-2"
            >
              {columns.map(column => (
                <option key={column} value={column}>{column}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Y-Axis (Values)
            </label>
            <select
              value={selectedYAxis}
              onChange={(e) => setSelectedYAxis(e.target.value)}
              className="w-full bg-gray-900 text-white border border-gray-700 rounded-md p-2"
            >
              {columns
                .filter(col => {
                  // Try to determine if this column contains numeric data
                  const hasNumericValues = data.some(row => 
                    typeof row[col] === 'number' || 
                    !isNaN(parseFloat(row[col] as string))
                  );
                  return hasNumericValues;
                })
                .map(column => (
                  <option key={column} value={column}>{column}</option>
                ))
              }
            </select>
          </div>
        </div>
        
        {/* Search filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Filter Data
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type to filter data..."
            className="w-full bg-gray-900 text-white border border-gray-700 rounded-md p-2"
          />
        </div>
      </div>
      
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">
            {selectedYAxis} by {selectedXAxis}
          </h2>
          {isDataTruncated && (
            <div className="text-xs text-amber-400">
              Showing {chartData.length} of {data.length} data points
            </div>
          )}
        </div>
        
        <div className="h-[400px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444444" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80} 
                    tick={{ fill: '#e5e5e5' }}
                    interval={0}
                    tickFormatter={(value) => {
                      // Truncate long labels
                      return value.length > 15 ? `${value.substring(0, 15)}...` : value;
                    }}
                  />
                  <YAxis 
                    tick={{ fill: '#e5e5e5' }} 
                    tickFormatter={(value) => formatNumber(value)}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#333', border: '1px solid #555', borderRadius: '4px' }} 
                    formatter={(value: any) => [formatNumber(value), selectedYAxis]}
                  />
                  <Legend wrapperStyle={{ color: '#e5e5e5' }} />
                  <Bar 
                    dataKey="value" 
                    fill="#f7b32b" 
                    name={selectedYAxis} 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444444" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80} 
                    tick={{ fill: '#e5e5e5' }}
                    interval={0}
                    tickFormatter={(value) => {
                      // Truncate long labels
                      return value.length > 15 ? `${value.substring(0, 15)}...` : value;
                    }}
                  />
                  <YAxis 
                    tick={{ fill: '#e5e5e5' }} 
                    tickFormatter={(value) => formatNumber(value)}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#333', border: '1px solid #555', borderRadius: '4px' }} 
                    formatter={(value: any) => [formatNumber(value), selectedYAxis]}
                  />
                  <Legend wrapperStyle={{ color: '#e5e5e5' }} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#f7b32b" 
                    name={selectedYAxis} 
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#f7b32b' }}
                    activeDot={{ r: 6, fill: '#ffffff' }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No data to display. Select different axes or upload data.
            </div>
          )}
        </div>
      </div>
      
      {/* Employee Numbers Chart - only show if relevant data exists */}
      {data.length > 0 && data.some(row => row["Employee Number"]) && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Employee Numbers Comparison
          </h2>
          
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={data
                  .filter(row => row["Employee Number"])
                  .slice()
                  .sort((a, b) => {
                    const valA = typeof a['Employee Number'] === 'number' ? a['Employee Number'] : 0;
                    const valB = typeof b['Employee Number'] === 'number' ? b['Employee Number'] : 0;
                    return (valB as number) - (valA as number);
                  })
                  .slice(0, 5)
                  .map(row => ({
                    name: row['Company Name'] || 'Unknown',
                    value: row['Employee Number']
                  }))
                }
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444444" />
                <XAxis dataKey="name" tick={{ fill: '#e5e5e5' }} />
                <YAxis tick={{ fill: '#e5e5e5' }} />
                <Tooltip contentStyle={{ backgroundColor: '#333', border: '1px solid #555', borderRadius: '4px' }} />
                <Legend wrapperStyle={{ color: '#e5e5e5' }} />
                <Bar dataKey="value" fill="#00bfff" name="Employee Number" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Visualization;
