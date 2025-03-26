
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Edit, Save, X, Search, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { 
  DataRow, 
  DataTable,
  loadTables,
  saveTables,
  updateTable,
  addTable,
  deleteTable
} from '@/services/dataService';

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const [data, setData] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, any>>({});
  const [newColumnName, setNewColumnName] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [fileInputRef] = useState(React.createRef<HTMLInputElement>());

  // State for multiple tables
  const [tables, setTables] = useState<DataTable[]>([]);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [newTableName, setNewTableName] = useState('');
  const [isAddingTable, setIsAddingTable] = useState(false);

  // Load data on component mount
  useEffect(() => {
    const loadedTables = loadTables();
    setTables(loadedTables);
    
    if (loadedTables.length > 0) {
      const defaultTable = loadedTables[0];
      setActiveTableId(defaultTable.id);
      setData(defaultTable.data);
      setColumns(defaultTable.columns);
    }
  }, []);

  // Update localStorage whenever tables change
  useEffect(() => {
    if (tables.length > 0) {
      saveTables(tables);
    }
  }, [tables]);

  // Sync active table data when it changes
  useEffect(() => {
    if (activeTableId) {
      const updatedTables = tables.map(table => 
        table.id === activeTableId ? { ...table, data, columns } : table
      );
      setTables(updatedTables);
      saveTables(updatedTables);
    }
  }, [data, columns, activeTableId]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        const lines = csvContent.split('\n');
        
        if (lines.length === 0) {
          toast({
            title: "Error",
            description: "CSV file is empty",
            variant: "destructive",
          });
          return;
        }
        
        // Parse headers (columns)
        const headers = lines[0].split(',').map(header => header.trim());
        const newColumns = headers.filter(header => header !== 'id');
        
        // Parse data rows
        const newData: DataRow[] = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',');
          if (values.length !== headers.length) continue;
          
          const row: DataRow = { id: uuidv4() };
          headers.forEach((header, index) => {
            const value = values[index].trim();
            const numValue = Number(value);
            row[header] = isNaN(numValue) ? value : numValue;
          });
          
          newData.push(row);
        }
        
        const tableName = file.name.replace(/\.[^/.]+$/, ""); // Remove file extension
        const newTableId = uuidv4();
        const newTable: DataTable = {
          id: newTableId,
          name: tableName,
          data: newData,
          columns: newColumns
        };
        
        // Add new table
        const updatedTables = [...tables, newTable];
        setTables(updatedTables);
        saveTables(updatedTables);
        
        // Set as active table
        setActiveTableId(newTableId);
        setData(newData);
        setColumns(newColumns);
        
        toast({
          title: "Success",
          description: "CSV file imported successfully as new table",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to parse CSV file",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsText(file);
  };

  const handleAddRow = () => {
    const newRow: DataRow = { id: uuidv4() };
    columns.forEach(col => {
      newRow[col] = '';
    });
    
    const updatedData = [...data, newRow];
    setData(updatedData);
  };

  const handleDeleteRow = (id: string) => {
    const updatedData = data.filter(row => row.id !== id);
    setData(updatedData);
    
    toast({
      title: "Success",
      description: "Row deleted successfully",
    });
  };

  const handleEditRow = (row: DataRow) => {
    setEditingRowId(row.id);
    setEditingValues({ ...row });
  };

  const handleSaveEdit = () => {
    if (!editingRowId) return;
    
    const updatedData = data.map(row => 
      row.id === editingRowId ? { ...row, ...editingValues } : row
    );
    setData(updatedData);
    
    setEditingRowId(null);
    setEditingValues({});
    
    toast({
      title: "Success",
      description: "Row updated successfully",
    });
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditingValues({});
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) {
      toast({
        title: "Error",
        description: "Column name cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    if (columns.includes(newColumnName)) {
      toast({
        title: "Error",
        description: "Column already exists",
        variant: "destructive",
      });
      return;
    }
    
    const updatedColumns = [...columns, newColumnName];
    setColumns(updatedColumns);
    
    // Add empty value for this column to all existing rows
    const updatedData = data.map(row => ({
      ...row,
      [newColumnName]: ''
    }));
    setData(updatedData);
    
    setNewColumnName('');
    setIsAddingColumn(false);
    
    toast({
      title: "Success",
      description: "Column added successfully",
    });
  };

  const handleDeleteColumn = (column: string) => {
    const updatedColumns = columns.filter(col => col !== column);
    setColumns(updatedColumns);
    
    // Remove this column from all data rows
    const updatedData = data.map(row => {
      const { [column]: _, ...rest } = row;
      return rest as DataRow;
    });
    setData(updatedData);
    
    toast({
      title: "Success",
      description: "Column deleted successfully",
    });
  };

  const handleDownloadCSV = () => {
    if (data.length === 0 || columns.length === 0) {
      toast({
        title: "Error",
        description: "No data to download",
        variant: "destructive",
      });
      return;
    }
    
    // Create CSV content
    const csvContent = [
      columns.join(','),
      ...data.map(row => columns.map(col => row[col]).join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'data_export.csv';
    link.click();
  };
  
  // Table management functions
  const handleAddTable = () => {
    if (!newTableName.trim()) {
      toast({
        title: "Error",
        description: "Table name cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    const newTableId = uuidv4();
    const newTable: DataTable = {
      id: newTableId,
      name: newTableName,
      data: [],
      columns: []
    };
    
    // Create new empty table
    const updatedTables = [...tables, newTable];
    setTables(updatedTables);
    saveTables(updatedTables);
    
    // Set as active table
    setActiveTableId(newTableId);
    setData([]);
    setColumns([]);
    
    setNewTableName('');
    setIsAddingTable(false);
    
    toast({
      title: "Success",
      description: `Table "${newTableName}" created successfully`,
    });
  };
  
  const handleDeleteTable = (tableId: string) => {
    const tableToDelete = tables.find(table => table.id === tableId);
    const updatedTables = tables.filter(table => table.id !== tableId);
    
    setTables(updatedTables);
    saveTables(updatedTables);
    
    // Update active table if needed
    if (activeTableId === tableId) {
      if (updatedTables.length > 0) {
        const nextTable = updatedTables[0];
        setActiveTableId(nextTable.id);
        setData(nextTable.data);
        setColumns(nextTable.columns);
      } else {
        // No more tables
        setActiveTableId(null);
        setData([]);
        setColumns([]);
      }
    }
    
    toast({
      title: "Success",
      description: `Table "${tableToDelete?.name}" deleted successfully`,
    });
  };
  
  const handleSelectTable = (tableId: string) => {
    // Save current data to current table before switching
    if (activeTableId) {
      const updatedTables = tables.map(table => 
        table.id === activeTableId ? { ...table, data, columns } : table
      );
      setTables(updatedTables);
      saveTables(updatedTables);
    }
    
    // Switch to selected table
    const selectedTable = tables.find(table => table.id === tableId);
    if (selectedTable) {
      setActiveTableId(tableId);
      setData(selectedTable.data);
      setColumns(selectedTable.columns);
      
      toast({
        title: "Table Switched",
        description: `Switched to table "${selectedTable.name}"`,
      });
    }
  };

  const filteredData = data.filter(row => 
    Object.values(row).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="container mx-auto py-24 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Data Management</h1>
        <p className="text-gray-400 mb-6">Upload, view, and edit your CSV data</p>
        
        {/* Table Management */}
        <div className="mb-6 bg-gray-900 p-4 rounded-lg border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-3">Tables</h2>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {tables.map(table => (
              <Button
                key={table.id}
                onClick={() => handleSelectTable(table.id)}
                variant={activeTableId === table.id ? "default" : "outline"}
                className={
                  activeTableId === table.id 
                    ? "bg-gold-500 text-black hover:bg-gold-600" 
                    : "text-white hover:text-gold-300"
                }
              >
                {table.name} ({table.data.length} rows)
              </Button>
            ))}
            
            <Button
              onClick={() => setIsAddingTable(true)}
              variant="outline"
              className="text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Table
            </Button>
          </div>
          
          {isAddingTable && (
            <div className="flex gap-2 items-center mb-2">
              <Input
                placeholder="Enter table name"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                className="max-w-xs bg-gray-800 text-white border-gray-700"
              />
              <Button onClick={handleAddTable} className="bg-gold-500 text-black hover:bg-gold-600">
                Create
              </Button>
              <Button variant="ghost" onClick={() => setIsAddingTable(false)} className="text-white">
                Cancel
              </Button>
            </div>
          )}
          
          {activeTableId && (
            <div className="flex justify-between items-center">
              <p className="text-gray-300">
                {activeTableId && `Current table: ${tables.find(t => t.id === activeTableId)?.name}`}
              </p>
              {tables.length > 1 && (
                <Button
                  variant="ghost"
                  onClick={() => handleDeleteTable(activeTableId)}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Table
                </Button>
              )}
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <Button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-gold-500 text-black hover:bg-gold-600"
          >
            Upload CSV
          </Button>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <Button 
            onClick={handleAddRow}
            disabled={columns.length === 0}
            className="bg-white text-black hover:bg-gray-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Row
          </Button>
          
          <Button
            onClick={() => setIsAddingColumn(true)}
            className="bg-white text-black hover:bg-gray-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Column
          </Button>
          
          <Button
            onClick={handleDownloadCSV}
            disabled={data.length === 0 || columns.length === 0}
            className="bg-gold-500 text-black hover:bg-gold-600 ml-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </Button>
        </div>
        
        {isAddingColumn && (
          <div className="mb-6 flex gap-2 items-center bg-gray-900 p-4 rounded-md">
            <Input
              placeholder="Enter column name"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              className="max-w-xs bg-gray-800 text-white border-gray-700"
            />
            <Button onClick={handleAddColumn} className="bg-gold-500 text-black hover:bg-gold-600">
              Add
            </Button>
            <Button variant="ghost" onClick={() => setIsAddingColumn(false)} className="text-white">
              Cancel
            </Button>
          </div>
        )}
        
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-900 text-white border-gray-700"
          />
        </div>
      </div>
      
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-black">
              <TableRow>
                {columns.map(column => (
                  <TableHead key={column} className="text-gold-300">
                    <div className="flex items-center justify-between">
                      {column}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteColumn(column)}
                        className="h-6 w-6 text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-gold-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map(row => (
                  <TableRow key={row.id}>
                    {columns.map(column => (
                      <TableCell key={`${row.id}-${column}`} className="text-white">
                        {editingRowId === row.id ? (
                          <Input
                            value={editingValues[column] || ''}
                            onChange={(e) => setEditingValues({
                              ...editingValues,
                              [column]: e.target.value
                            })}
                            className="bg-gray-800 text-white border-gray-700"
                          />
                        ) : (
                          row[column]
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      {editingRowId === row.id ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            className="bg-gold-500 text-black hover:bg-gold-600"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="text-white"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditRow(row)}
                            className="text-gold-300 hover:text-gold-500"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteRow(row.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="text-center text-gray-400 py-8">
                    {data.length === 0 
                      ? "No data available. Upload a CSV file or add rows manually." 
                      : "No matching data found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
