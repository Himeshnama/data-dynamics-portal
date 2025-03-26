
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DataTable, loadTables, saveTables, DataRow } from '@/services/dataService';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Search, Database, Code, RefreshCw, List, PlusCircle, Trash, Edit, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';
import VoiceAssistant from '@/components/VoiceAssistant';

const QueryData: React.FC = () => {
  const { toast } = useToast();
  const [tables, setTables] = useState<DataTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<DataTable | null>(null);
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [textQuery, setTextQuery] = useState<string>('');
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [resultColumns, setResultColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('sql');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [limitValue, setLimitValue] = useState<string>('10');
  const [orderByColumn, setOrderByColumn] = useState<string>('');
  const [orderDirection, setOrderDirection] = useState<string>('ASC');
  const [whereColumn, setWhereColumn] = useState<string>('');
  const [whereOperator, setWhereOperator] = useState<string>('=');
  const [whereValue, setWhereValue] = useState<string>('');
  const [queryType, setQueryType] = useState<string>('SELECT');
  const [newColumnName, setNewColumnName] = useState<string>('');
  const [setValues, setSetValues] = useState<{column: string, value: string}[]>([]);
  const [newTableName, setNewTableName] = useState<string>('');
  const [columnToDelete, setColumnToDelete] = useState<string>('');
  
  // Voice assistant integration
  const { transcript, isListening, startListening, stopListening, resetTranscript, hasRecognitionSupport } = useSpeechRecognition();

  useEffect(() => {
    if (transcript && !isListening) {
      if (activeTab === 'sql') {
        setSqlQuery(transcript);
      } else {
        setTextQuery(transcript);
      }
      resetTranscript();
    }
  }, [transcript, isListening, activeTab, resetTranscript]);

  useEffect(() => {
    const availableTables = loadTables();
    setTables(availableTables);
    if (availableTables.length > 0) {
      setSelectedTable(availableTables[0]);
      setSqlQuery(`SELECT * FROM "${availableTables[0].name}" LIMIT 10`);
    }
  }, []);

  useEffect(() => {
    if (selectedTable) {
      setSelectedColumns(selectedTable.columns);
      setOrderByColumn('');
      setWhereColumn('');
      setNewTableName(selectedTable.name);
    }
  }, [selectedTable]);

  const addSetValue = () => {
    setSetValues([...setValues, {column: '', value: ''}]);
  };

  const updateSetValue = (index: number, field: 'column' | 'value', value: string) => {
    const newSetValues = [...setValues];
    newSetValues[index][field] = value;
    setSetValues(newSetValues);
  };

  const removeSetValue = (index: number) => {
    setSetValues(setValues.filter((_, i) => i !== index));
  };

  const generateSqlQuery = () => {
    if (!selectedTable) return;

    let query = '';
    
    switch (queryType) {
      case 'SELECT':
        query = 'SELECT ';
        
        if (selectedColumns.length === 0 || selectedColumns.length === selectedTable.columns.length) {
          query += '* ';
        } else {
          query += selectedColumns.map(col => `"${col}"`).join(', ') + ' ';
        }
        
        query += `FROM "${selectedTable.name}" `;
        
        if (whereColumn && whereOperator && whereValue) {
          const formattedValue = isNaN(Number(whereValue)) ? `"${whereValue}"` : whereValue;
          query += `WHERE "${whereColumn}" ${whereOperator} ${formattedValue} `;
        }
        
        if (orderByColumn) {
          query += `ORDER BY "${orderByColumn}" ${orderDirection} `;
        }
        
        if (limitValue && !isNaN(Number(limitValue))) {
          query += `LIMIT ${limitValue}`;
        }
        break;
        
      case 'UPDATE':
        query = `UPDATE "${selectedTable.name}" SET `;
        
        if (setValues.length > 0) {
          const setStatements = setValues.map(item => {
            const formattedValue = isNaN(Number(item.value)) ? `"${item.value}"` : item.value;
            return `"${item.column}" = ${formattedValue}`;
          });
          query += setStatements.join(', ') + ' ';
        } else {
          return; // Can't generate an UPDATE without SET values
        }
        
        if (whereColumn && whereOperator && whereValue) {
          const formattedValue = isNaN(Number(whereValue)) ? `"${whereValue}"` : whereValue;
          query += `WHERE "${whereColumn}" ${whereOperator} ${formattedValue}`;
        }
        break;
        
      case 'DELETE':
        query = `DELETE FROM "${selectedTable.name}" `;
        
        if (whereColumn && whereOperator && whereValue) {
          const formattedValue = isNaN(Number(whereValue)) ? `"${whereValue}"` : whereValue;
          query += `WHERE "${whereColumn}" ${whereOperator} ${formattedValue}`;
        }
        break;
        
      case 'INSERT':
        query = `INSERT INTO "${selectedTable.name}" `;
        
        if (selectedColumns.length > 0) {
          query += `(${selectedColumns.map(col => `"${col}"`).join(', ')}) `;
          
          const valuesList = selectedColumns.map(col => {
            const setValue = setValues.find(sv => sv.column === col);
            if (setValue) {
              return isNaN(Number(setValue.value)) ? `"${setValue.value}"` : setValue.value;
            }
            return '""'; // Empty string as default
          });
          
          query += `VALUES (${valuesList.join(', ')})`;
        } else {
          return; // Can't generate an INSERT without columns
        }
        break;
        
      case 'ALTER_RENAME':
        if (newTableName) {
          query = `ALTER TABLE "${selectedTable.name}" RENAME TO "${newTableName}"`;
        }
        break;
        
      case 'ALTER_ADD':
        if (newColumnName) {
          query = `ALTER TABLE "${selectedTable.name}" ADD COLUMN "${newColumnName}"`;
        }
        break;
        
      case 'ALTER_DROP':
        if (columnToDelete) {
          query = `ALTER TABLE "${selectedTable.name}" DROP COLUMN "${columnToDelete}"`;
        }
        break;
    }
    
    if (query) {
      setSqlQuery(query);
    }
  };

  const executeAlterQuery = (query: string, table: DataTable): boolean => {
    const alterMatch = query.match(/ALTER\s+TABLE\s+["']?([^"']+)["']?\s+(.+)/i);
    if (!alterMatch) return false;
    
    const tableName = alterMatch[1].replace(/['"]/g, '').trim();
    const alterAction = alterMatch[2].trim();
    
    if (tableName !== table.name) {
      toast({
        title: "Error",
        description: `Table "${tableName}" not found`,
        variant: "destructive"
      });
      return true;
    }
    
    const renameMatch = alterAction.match(/RENAME\s+TO\s+["']?([^"']+)["']?/i);
    if (renameMatch) {
      const newName = renameMatch[1].replace(/['"]/g, '').trim();
      
      const updatedTable = { ...table, name: newName };
      const updatedTables = tables.map(t => t.id === table.id ? updatedTable : t);
      
      setTables(updatedTables);
      setSelectedTable(updatedTable);
      saveTables(updatedTables);
      
      toast({
        title: "Table renamed",
        description: `Table "${tableName}" renamed to "${newName}"`,
      });
      return true;
    }
    
    const addColumnMatch = alterAction.match(/ADD\s+COLUMN\s+["']?([^"']+)["']?/i);
    if (addColumnMatch) {
      const columnName = addColumnMatch[1].replace(/['"]/g, '').trim();
      
      if (table.columns.includes(columnName)) {
        toast({
          title: "Error",
          description: `Column "${columnName}" already exists`,
          variant: "destructive"
        });
        return true;
      }
      
      const updatedColumns = [...table.columns, columnName];
      const updatedData = table.data.map(row => ({ ...row, [columnName]: "" }));
      
      const updatedTable = { ...table, columns: updatedColumns, data: updatedData };
      const updatedTables = tables.map(t => t.id === table.id ? updatedTable : t);
      
      setTables(updatedTables);
      setSelectedTable(updatedTable);
      saveTables(updatedTables);
      
      toast({
        title: "Column added",
        description: `Column "${columnName}" added to table "${tableName}"`,
      });
      return true;
    }
    
    const dropColumnMatch = alterAction.match(/DROP\s+COLUMN\s+["']?([^"']+)["']?/i);
    if (dropColumnMatch) {
      const columnName = dropColumnMatch[1].replace(/['"]/g, '').trim();
      
      if (!table.columns.includes(columnName)) {
        toast({
          title: "Error",
          description: `Column "${columnName}" does not exist`,
          variant: "destructive"
        });
        return true;
      }
      
      const updatedColumns = table.columns.filter(col => col !== columnName);
      const updatedData = table.data.map(row => {
        const newRow = { ...row };
        delete newRow[columnName];
        return newRow;
      });
      
      const updatedTable = { ...table, columns: updatedColumns, data: updatedData };
      const updatedTables = tables.map(t => t.id === table.id ? updatedTable : t);
      
      setTables(updatedTables);
      setSelectedTable(updatedTable);
      saveTables(updatedTables);
      
      toast({
        title: "Column dropped",
        description: `Column "${columnName}" removed from table "${tableName}"`,
      });
      return true;
    }
    
    toast({
      title: "Unsupported ALTER operation",
      description: "Only RENAME TO, ADD COLUMN and DROP COLUMN are supported",
      variant: "destructive"
    });
    return true;
  };

  const executeUpdateQuery = (query: string, table: DataTable): boolean => {
    const updateMatch = query.match(/UPDATE\s+["']?([^"']+)["']?\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i);
    if (!updateMatch) return false;
    
    const tableName = updateMatch[1].replace(/['"]/g, '').trim();
    const setClause = updateMatch[2].trim();
    const whereClause = updateMatch[3] ? updateMatch[3].trim() : null;
    
    if (tableName !== table.name) {
      toast({
        title: "Error",
        description: `Table "${tableName}" not found`,
        variant: "destructive"
      });
      return true;
    }
    
    const setItems: Record<string, any> = {};
    const setPattern = /["']?([^"'=]+)["']?\s*=\s*(?:["']([^"']+)["']|([^,]+))/g;
    let setMatch;
    
    while ((setMatch = setPattern.exec(setClause)) !== null) {
      const column = setMatch[1].replace(/['"]/g, '').trim();
      let value = setMatch[2] !== undefined ? setMatch[2] : setMatch[3].trim();
      
      if (!isNaN(Number(value)) && value !== '') {
        value = Number(value);
      }
      
      setItems[column] = value;
    }
    
    let updatedData = [...table.data];
    let updatedCount = 0;
    
    if (whereClause) {
      const wherePattern = /["']?([^"'=]+)["']?\s*(=|>|<|>=|<=|LIKE|!=)\s*(?:["']([^"']+)["']|([^,\s]+))/i;
      const whereMatch = whereClause.match(wherePattern);
      
      if (whereMatch) {
        const column = whereMatch[1].replace(/['"]/g, '').trim();
        const operator = whereMatch[2].trim().toUpperCase();
        let value = whereMatch[3] !== undefined ? whereMatch[3] : whereMatch[4].trim();
        
        if (!isNaN(Number(value)) && value !== '') {
          value = Number(value);
        }
        
        updatedData = updatedData.map(row => {
          const rowValue = row[column];
          let matches = false;
          
          switch (operator) {
            case '=':
              matches = rowValue == value;
              break;
            case '>':
              matches = rowValue > value;
              break;
            case '<':
              matches = rowValue < value;
              break;
            case '>=':
              matches = rowValue >= value;
              break;
            case '<=':
              matches = rowValue <= value;
              break;
            case '!=':
              matches = rowValue != value;
              break;
            case 'LIKE':
              matches = String(rowValue).includes(String(value).replace(/%/g, ''));
              break;
          }
          
          if (matches) {
            updatedCount++;
            return { ...row, ...setItems };
          }
          return row;
        });
      }
    } else {
      updatedCount = updatedData.length;
      updatedData = updatedData.map(row => ({ ...row, ...setItems }));
    }
    
    const updatedTable = { ...table, data: updatedData };
    const updatedTables = tables.map(t => t.id === table.id ? updatedTable : t);
    
    setTables(updatedTables);
    setSelectedTable(updatedTable);
    saveTables(updatedTables);
    
    toast({
      title: "Update successful",
      description: `Updated ${updatedCount} row(s) in table "${tableName}"`,
    });
    return true;
  };

  const executeDeleteQuery = (query: string, table: DataTable): boolean => {
    const deleteMatch = query.match(/DELETE\s+FROM\s+["']?([^"']+)["']?(?:\s+WHERE\s+(.+))?$/i);
    if (!deleteMatch) return false;
    
    const tableName = deleteMatch[1].replace(/['"]/g, '').trim();
    const whereClause = deleteMatch[2] ? deleteMatch[2].trim() : null;
    
    if (tableName !== table.name) {
      toast({
        title: "Error",
        description: `Table "${tableName}" not found`,
        variant: "destructive"
      });
      return true;
    }
    
    let updatedData = [...table.data];
    let deletedCount = 0;
    
    if (whereClause) {
      const wherePattern = /["']?([^"'=]+)["']?\s*(=|>|<|>=|<=|LIKE|!=)\s*(?:["']([^"']+)["']|([^,\s]+))/i;
      const whereMatch = whereClause.match(wherePattern);
      
      if (whereMatch) {
        const column = whereMatch[1].replace(/['"]/g, '').trim();
        const operator = whereMatch[2].trim().toUpperCase();
        let value = whereMatch[3] !== undefined ? whereMatch[3] : whereMatch[4].trim();
        
        if (!isNaN(Number(value)) && value !== '') {
          value = Number(value);
        }
        
        const beforeCount = updatedData.length;
        updatedData = updatedData.filter(row => {
          const rowValue = row[column];
          let matches = false;
          
          switch (operator) {
            case '=':
              matches = rowValue == value;
              break;
            case '>':
              matches = rowValue > value;
              break;
            case '<':
              matches = rowValue < value;
              break;
            case '>=':
              matches = rowValue >= value;
              break;
            case '<=':
              matches = rowValue <= value;
              break;
            case '!=':
              matches = rowValue != value;
              break;
            case 'LIKE':
              matches = String(rowValue).includes(String(value).replace(/%/g, ''));
              break;
          }
          
          if (matches) {
            deletedCount++;
            return false;
          }
          return true;
        });
        
        deletedCount = beforeCount - updatedData.length;
      }
    } else {
      deletedCount = updatedData.length;
      updatedData = [];
    }
    
    const updatedTable = { ...table, data: updatedData };
    const updatedTables = tables.map(t => t.id === table.id ? updatedTable : t);
    
    setTables(updatedTables);
    setSelectedTable(updatedTable);
    saveTables(updatedTables);
    
    toast({
      title: "Delete successful",
      description: `Deleted ${deletedCount} row(s) from table "${tableName}"`,
    });
    return true;
  };

  const executeInsertQuery = (query: string, table: DataTable): boolean => {
    const insertMatch = query.match(/INSERT\s+INTO\s+["']?([^"']+)["']?\s*(?:\((.+?)\))?\s*VALUES\s*\((.+?)\)/i);
    if (!insertMatch) return false;
    
    const tableName = insertMatch[1].replace(/['"]/g, '').trim();
    const columnsString = insertMatch[2] ? insertMatch[2].trim() : null;
    const valuesString = insertMatch[3].trim();
    
    if (tableName !== table.name) {
      toast({
        title: "Error",
        description: `Table "${tableName}" not found`,
        variant: "destructive"
      });
      return true;
    }
    
    let columns = table.columns;
    if (columnsString) {
      columns = columnsString.split(',').map(col => col.replace(/['"]/g, '').trim());
      
      for (const col of columns) {
        if (!table.columns.includes(col)) {
          toast({
            title: "Error",
            description: `Column "${col}" does not exist in table "${tableName}"`,
            variant: "destructive"
          });
          return true;
        }
      }
    }
    
    const valuePattern = /["']([^"']+)["']|([^,]+)/g;
    const values: string[] = [];
    let valueMatch;
    
    while ((valueMatch = valuePattern.exec(valuesString)) !== null) {
      let value = valueMatch[1] !== undefined ? valueMatch[1] : valueMatch[2].trim();
      values.push(String(value));
    }
    
    if (columns.length !== values.length) {
      toast({
        title: "Error",
        description: "The number of columns doesn't match the number of values",
        variant: "destructive"
      });
      return true;
    }
    
    const newRow: DataRow = { id: crypto.randomUUID() };
    
    columns.forEach((col, index) => {
      let value = values[index];
      if (!isNaN(Number(value)) && value !== '') {
        newRow[col] = Number(value);
      } else {
        newRow[col] = value;
      }
    });
    
    const updatedData = [...table.data, newRow];
    const updatedTable = { ...table, data: updatedData };
    const updatedTables = tables.map(t => t.id === table.id ? updatedTable : t);
    
    setTables(updatedTables);
    setSelectedTable(updatedTable);
    saveTables(updatedTables);
    
    toast({
      title: "Insert successful",
      description: `Added new row to table "${tableName}"`,
    });
    return true;
  };

  const parseSqlQuery = (query: string, table: DataTable) => {
    setIsLoading(true);
    
    try {
      const normalizedQuery = query.trim();
      
      if (
        executeAlterQuery(normalizedQuery, table) ||
        executeUpdateQuery(normalizedQuery, table) ||
        executeDeleteQuery(normalizedQuery, table) ||
        executeInsertQuery(normalizedQuery, table)
      ) {
        setResultColumns([]);
        setQueryResults([]);
        setIsLoading(false);
        return;
      }
      
      if (!normalizedQuery.toLowerCase().includes('select')) {
        throw new Error('Unsupported query type. Supported types: SELECT, UPDATE, DELETE, INSERT, ALTER');
      }

      let filteredData = [...table.data];
      let resultCols = [...table.columns];
      
      if (normalizedQuery.toLowerCase().includes('select *')) {
        resultCols = table.columns;
      } else {
        const selectMatch = normalizedQuery.match(/select\s+(.+?)\s+from/i);
        if (selectMatch && selectMatch[1]) {
          const selectedCols = selectMatch[1].split(',').map(col => 
            col.trim().replace(/['"]/g, '').replace(/^\s*"(.*)"\s*$/, '$1')
          );
          
          const validColumns = selectedCols.filter(col => 
            table.columns.includes(col) || col === '*'
          );
          
          if (validColumns.length === 0) {
            throw new Error(`No valid columns found in query. Available columns: ${table.columns.join(', ')}`);
          }
          
          if (!validColumns.includes('*')) {
            resultCols = validColumns;
          }
        }
      }
      
      if (normalizedQuery.toLowerCase().includes('where')) {
        const whereClauseMatch = normalizedQuery.match(/where\s+(.+?)(\s+order|\s+limit|\s*$)/i);
        if (whereClauseMatch && whereClauseMatch[1]) {
          const whereCondition = whereClauseMatch[1].trim();
          
          const conditionParts = whereCondition.match(/["']?([a-z0-9_\s]+)["']?\s*(=|>|<|>=|<=|like|contains)\s*['"]?(.*?)['"]?(\s+|$)/i);
          
          if (conditionParts) {
            const [_, field, operator, value] = conditionParts;
            const cleanField = field.trim().replace(/['"]/g, '');
            let cleanValue = value.trim().replace(/['"]/g, '');
            
            if (!isNaN(Number(cleanValue))) {
              cleanValue = Number(cleanValue);
            }
            
            filteredData = filteredData.filter(row => {
              const fieldValue = row[cleanField];
              
              switch(operator.toLowerCase()) {
                case '=':
                  return String(fieldValue) === String(cleanValue);
                case '>':
                  return Number(fieldValue) > Number(cleanValue);
                case '<':
                  return Number(fieldValue) < Number(cleanValue);
                case '>=':
                  return Number(fieldValue) >= Number(cleanValue);
                case '<=':
                  return Number(fieldValue) <= Number(cleanValue);
                case 'like':
                case 'contains':
                  return String(fieldValue).toLowerCase().includes(String(cleanValue).toLowerCase());
                default:
                  return true;
              }
            });
          }
        }
      }
      
      if (normalizedQuery.toLowerCase().includes('order by')) {
        const orderMatch = normalizedQuery.match(/order by\s+["']?([a-z0-9_\s]+)["']?\s*(desc|asc)?/i);
        if (orderMatch) {
          const orderField = orderMatch[1].trim().replace(/['"]/g, '');
          const isDesc = orderMatch[2] && orderMatch[2].toLowerCase() === 'desc';
          
          filteredData.sort((a, b) => {
            let aVal = a[orderField];
            let bVal = b[orderField];
            
            if (typeof aVal === 'string' && typeof bVal === 'string') {
              return isDesc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
            }
            
            aVal = Number(aVal);
            bVal = Number(bVal);
            
            return isDesc ? bVal - aVal : aVal - bVal;
          });
        }
      }
      
      if (normalizedQuery.toLowerCase().includes('limit')) {
        const limitMatch = normalizedQuery.match(/limit\s+(\d+)/i);
        if (limitMatch && limitMatch[1]) {
          const limit = parseInt(limitMatch[1], 10);
          filteredData = filteredData.slice(0, limit);
        }
      }
      
      const projectedData = filteredData.map(row => {
        const projectedRow: any = {};
        resultCols.forEach(col => {
          if (row.hasOwnProperty(col)) {
            projectedRow[col] = row[col];
          }
        });
        return projectedRow;
      });

      setResultColumns(resultCols);
      setQueryResults(projectedData);
      
      toast({
        title: "Query executed successfully",
        description: `Found ${projectedData.length} results`,
      });
    } catch (error: any) {
      console.error("SQL parsing error:", error);
      toast({
        title: "Query error",
        description: error.message || "Failed to execute query",
        variant: "destructive"
      });
      setQueryResults([]);
      setResultColumns([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextQuery = (query: string, table: DataTable) => {
    setIsLoading(true);
    
    try {
      const normalizedQuery = query.toLowerCase();
      let filteredData = [...table.data];
      
      if (normalizedQuery.includes('show') || normalizedQuery.includes('get') || normalizedQuery.includes('find')) {
        const columnFilters: string[] = [];
        table.columns.forEach(col => {
          const lowerCol = col.toLowerCase();
          if (normalizedQuery.includes(lowerCol)) {
            columnFilters.push(col);
          }
        });
        
        const hasGreaterThan = normalizedQuery.includes('greater than') || normalizedQuery.includes('more than') || normalizedQuery.includes('>');
        const hasLessThan = normalizedQuery.includes('less than') || normalizedQuery.includes('smaller than') || normalizedQuery.includes('<');
        const hasEqual = normalizedQuery.includes('equal to') || normalizedQuery.includes('equals') || normalizedQuery.includes('=');
        
        const numberMatches = normalizedQuery.match(/\d+/g);
        const numbers = numberMatches ? numberMatches.map(n => parseInt(n, 10)) : [];
        
        if (columnFilters.length > 0 && numbers.length > 0) {
          filteredData = filteredData.filter(row => {
            return columnFilters.some(col => {
              const value = row[col];
              
              if (typeof value === 'number' || !isNaN(Number(value))) {
                const numValue = Number(value);
                if (hasGreaterThan) return numValue > numbers[0];
                if (hasLessThan) return numValue < numbers[0];
                if (hasEqual) return numValue === numbers[0];
                return numbers.includes(numValue);
              }
              
              if (typeof value === 'string') {
                return value.toLowerCase().includes(numbers[0].toString());
              }
              
              return false;
            });
          });
        }
        
        if (normalizedQuery.includes('sort by') || normalizedQuery.includes('order by')) {
          const sortCol = columnFilters[0] || table.columns[0];
          const isDescending = normalizedQuery.includes('descending') || normalizedQuery.includes('high to low') || normalizedQuery.includes('desc');
          
          filteredData.sort((a, b) => {
            const aVal = a[sortCol];
            const bVal = b[sortCol];
            
            if (typeof aVal === 'number' && typeof bVal === 'number') {
              return isDescending ? bVal - aVal : aVal - bVal;
            }
            
            const aStr = String(aVal).toLowerCase();
            const bStr = String(bVal).toLowerCase();
            return isDescending 
              ? bStr.localeCompare(aStr) 
              : aStr.localeCompare(bStr);
          });
        }
        
        if (normalizedQuery.includes('limit') && numbers.length > 0) {
          filteredData = filteredData.slice(0, numbers[0]);
        } else if (normalizedQuery.includes('top') && numbers.length > 0) {
          filteredData = filteredData.slice(0, numbers[0]);
        } else {
          filteredData = filteredData.slice(0, 10);
        }
      }
      
      setResultColumns(table.columns);
      setQueryResults(filteredData);
      
      toast({
        title: "Query executed",
        description: `Found ${filteredData.length} results based on your natural language query`,
      });
    } catch (error: any) {
      console.error("Text query error:", error);
      toast({
        title: "Query error",
        description: error.message || "Failed to execute natural language query",
        variant: "destructive"
      });
      setQueryResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteQuery = () => {
    if (!selectedTable) {
      toast({
        title: "Error",
        description: "Please select a table first",
        variant: "destructive"
      });
      return;
    }
    
    if (activeTab === 'sql') {
      if (!sqlQuery.trim()) {
        toast({
          title: "Error",
          description: "Please enter a SQL query",
          variant: "destructive"
        });
        return;
      }
      parseSqlQuery(sqlQuery, selectedTable);
    } else {
      if (!textQuery.trim()) {
        toast({
          title: "Error",
          description: "Please enter a natural language query",
          variant: "destructive"
        });
        return;
      }
      handleTextQuery(textQuery, selectedTable);
    }
  };

  return (
    <div className="container mx-auto py-24 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Data Query</h1>
        <p className="text-gray-400 mb-6">Query your data using SQL or natural language</p>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Table
          </label>
          <select
            value={selectedTable?.id || ''}
            onChange={(e) => {
              const tableId = e.target.value;
              const table = tables.find(t => t.id === tableId);
              if (table) {
                setSelectedTable(table);
                setSqlQuery(`SELECT * FROM "${table.name}" LIMIT 10`);
                setQueryType('SELECT');
                setSetValues([]);
              }
            }}
            className="w-full md:w-64 bg-gray-900 text-white border border-gray-700 rounded-md p-2"
          >
            {tables.map(table => (
              <option key={table.id} value={table.id}>
                {table.name} ({table.data.length} rows)
              </option>
            ))}
          </select>
        </div>
        
        <Tabs defaultValue="sql" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="mb-4 bg-gray-800 border border-gray-700">
            <TabsTrigger value="sql" className="data-[state=active]:bg-gold-500 data-[state=active]:text-black">
              <Code className="w-4 h-4 mr-2" />
              SQL Query
            </TabsTrigger>
            <TabsTrigger value="text" className="data-[state=active]:bg-gold-500 data-[state=active]:text-black">
              <Search className="w-4 h-4 mr-2" />
              Natural Language
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="sql" className="mt-0">
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <h3 className="text-lg font-medium text-white">SQL Query</h3>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <PlusCircle className="w-4 h-4" />
                      Query Builder
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 text-white border border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Build SQL Query</DialogTitle>
                    </DialogHeader>
                    
                    {selectedTable && (
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <Label className="text-white">Query Type</Label>
                              <select
                                value={queryType}
                                onChange={(e) => setQueryType(e.target.value)}
                                className="w-full bg-gray-800 text-white border border-gray-700 rounded-md p-2"
                              >
                                <option value="SELECT">SELECT</option>
                                <option value="UPDATE">UPDATE</option>
                                <option value="DELETE">DELETE</option>
                                <option value="INSERT">INSERT</option>
                                <option value="ALTER_RENAME">ALTER (RENAME TABLE)</option>
                                <option value="ALTER_ADD">ALTER (ADD COLUMN)</option>
                                <option value="ALTER_DROP">ALTER (DROP COLUMN)</option>
                              </select>
                            </div>
                          </div>
                          
                          {/* Query-specific fields */}
                          {queryType === 'SELECT' && (
                            <>
                              <Label htmlFor="columns" className="text-white">Select Columns</Label>
                              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-800 rounded-md">
                                {selectedTable.columns.map(column => (
                                  <div key={column} className="flex items-center space-x-2">
                                    <Checkbox 
                                      id={`column-${column}`} 
                                      checked={selectedColumns.includes(column)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedColumns(prev => [...prev, column]);
                                        } else {
                                          setSelectedColumns(prev => prev.filter(col => col !== column));
                                        }
                                      }}
                                      className="border-gray-600"
                                    />
                                    <label
                                      htmlFor={`column-${column}`}
                                      className="text-sm text-gray-300 cursor-pointer"
                                    >
                                      {column}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="space-y-2">
                                  <Label htmlFor="limit" className="text-white">Limit Results</Label>
                                  <Input
                                    id="limit"
                                    value={limitValue}
                                    onChange={(e) => setLimitValue(e.target.value)}
                                    className="bg-gray-800 border-gray-700 text-white"
                                    placeholder="10"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="orderby" className="text-white">Order By</Label>
                                  <div className="flex space-x-2">
                                    <select
                                      id="orderby"
                                      value={orderByColumn}
                                      onChange={(e) => setOrderByColumn(e.target.value)}
                                      className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-md p-2"
                                    >
                                      <option value="">None</option>
                                      {selectedTable.columns.map(column => (
                                        <option key={column} value={column}>{column}</option>
                                      ))}
                                    </select>
                                    <select
                                      value={orderDirection}
                                      onChange={(e) => setOrderDirection(e.target.value)}
                                      className="bg-gray-800 text-white border border-gray-700 rounded-md p-2 w-24"
                                      disabled={!orderByColumn}
                                    >
                                      <option value="ASC">ASC</option>
                                      <option value="DESC">DESC</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                          
                          {(queryType === 'SELECT' || queryType === 'UPDATE' || queryType === 'DELETE') && (
                            <div className="space-y-2 mt-4">
                              <Label className="text-white">Where Condition</Label>
                              <div className="flex space-x-2">
                                <select
                                  value={whereColumn}
                                  onChange={(e) => setWhereColumn(e.target.value)}
                                  className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-md p-2"
                                >
                                  <option value="">Select Column</option>
                                  {selectedTable.columns.map(column => (
                                    <option key={column} value={column}>{column}</option>
                                  ))}
                                </select>
                                <select
                                  value={whereOperator}
                                  onChange={(e) => setWhereOperator(e.target.value)}
                                  className="bg-gray-800 text-white border border-gray-700 rounded-md p-2 w-24"
                                  disabled={!whereColumn}
                                >
                                  <option value="=">Equal</option>
                                  <option value=">">Greater</option>
                                  <option value="<">Less</option>
                                  <option value=">=">Gte</option>
                                  <option value="<=">Lte</option>
                                  <option value="!=">Not Eq</option>
                                  <option value="LIKE">Like</option>
                                </select>
                                <Input
                                  value={whereValue}
                                  onChange={(e) => setWhereValue(e.target.value)}
                                  className="flex-1 bg-gray-800 border-gray-700 text-white"
                                  placeholder="Value"
                                  disabled={!whereColumn}
                                />
                              </div>
                            </div>
                          )}
                          
                          {(queryType === 'UPDATE' || queryType === 'INSERT') && (
                            <div className="space-y-2 mt-4">
                              <div className="flex justify-between items-center">
                                <Label className="text-white">
                                  {queryType === 'UPDATE' ? 'Set Values' : 'Values for Columns'}
                                </Label>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={addSetValue}
                                  className="h-8 px-2"
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Add Value
                                </Button>
                              </div>
                              
                              {setValues.length === 0 && (
                                <div className="text-gray-400 text-sm p-2">
                                  No values set yet. Click "Add Value" to start.
                                </div>
                              )}
                              
                              {setValues.map((item, index) => (
                                <div key={index} className="flex space-x-2 items-center">
                                  <select
                                    value={item.column}
                                    onChange={(e) => updateSetValue(index, 'column', e.target.value)}
                                    className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-md p-2"
                                  >
                                    <option value="">Select Column</option>
                                    {selectedTable.columns.map(column => (
                                      <option 
                                        key={column} 
                                        value={column}
                                        disabled={queryType === 'INSERT' && selectedColumns.includes(column) && !setValues.find(sv => sv.column === column)}
                                      >
                                        {column}
                                      </option>
                                    ))}
                                  </select>
                                  <Input
                                    value={item.value}
                                    onChange={(e) => updateSetValue(index, 'value', e.target.value)}
                                    className="flex-1 bg-gray-800 border-gray-700 text-white"
                                    placeholder="Value"
                                  />
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    onClick={() => removeSetValue(index)}
                                    className="h-10 w-10 p-0 bg-gray-800"
                                  >
                                    <Trash className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              ))}
                              
                              {queryType === 'INSERT' && (
                                <div className="text-gray-400 text-sm">
                                  <Checkbox 
                                    id="select-all-columns" 
                                    checked={selectedColumns.length === selectedTable.columns.length}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedColumns(selectedTable.columns);
                                      } else {
                                        setSelectedColumns([]);
                                      }
                                    }}
                                  />
                                  <label htmlFor="select-all-columns" className="ml-2">
                                    Include all columns in INSERT
                                  </label>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {queryType === 'ALTER_RENAME' && (
                            <div className="space-y-2 mt-4">
                              <Label htmlFor="newTableName" className="text-white">New Table Name</Label>
                              <Input
                                id="newTableName"
                                value={newTableName}
                                onChange={(e) => setNewTableName(e.target.value)}
                                className="bg-gray-800 border-gray-700 text-white"
                                placeholder="Enter new table name"
                              />
                            </div>
                          )}
                          
                          {queryType === 'ALTER_ADD' && (
                            <div className="space-y-2 mt-4">
                              <Label htmlFor="newColumnName" className="text-white">New Column Name</Label>
                              <Input
                                id="newColumnName"
                                value={newColumnName}
                                onChange={(e) => setNewColumnName(e.target.value)}
                                className="bg-gray-800 border-gray-700 text-white"
                                placeholder="Enter new column name"
                              />
                            </div>
                          )}
                          
                          {queryType === 'ALTER_DROP' && (
                            <div className="space-y-2 mt-4">
                              <Label htmlFor="columnToDelete" className="text-white">Column to Drop</Label>
                              <select
                                id="columnToDelete"
                                value={columnToDelete}
                                onChange={(e) => setColumnToDelete(e.target.value)}
                                className="w-full bg-gray-800 text-white border border-gray-700 rounded-md p-2"
                              >
                                <option value="">Select Column</option>
                                {selectedTable.columns.map(column => (
                                  <option key={column} value={column}>{column}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-end space-x-2 mt-4">
                          <Button
                            variant="outline"
                            onClick={generateSqlQuery}
                            className="bg-gray-800 hover:bg-gray-700"
                          >
                            Generate Query
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
              
              <Textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                placeholder="SELECT * FROM table WHERE condition"
                className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
              />
              
              {hasRecognitionSupport && (
                <VoiceAssistant
                  onTranscript={(text) => setSqlQuery(text)}
                  isListening={isListening && activeTab === 'sql'}
                  startListening={startListening}
                  stopListening={stopListening}
                />
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="text" className="mt-0">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-white mb-2">Natural Language Query</h3>
              <Textarea
                value={textQuery}
                onChange={(e) => setTextQuery(e.target.value)}
                placeholder="Show me all products with price greater than 100, sorted by name"
                className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
              />
              
              {hasRecognitionSupport && (
                <VoiceAssistant
                  onTranscript={(text) => setTextQuery(text)}
                  isListening={isListening && activeTab === 'text'}
                  startListening={startListening}
                  stopListening={stopListening}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex gap-2 mb-6">
          <Button 
            onClick={handleExecuteQuery}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            Execute Query
          </Button>
        </div>
        
        {queryResults.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-medium text-white mb-2">
              Results ({queryResults.length})
            </h3>
            <div className="bg-gray-800 border border-gray-700 rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {resultColumns.map(column => (
                      <TableHead key={column} className="text-gray-400">
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queryResults.map((row, index) => (
                    <TableRow key={index}>
                      {resultColumns.map(column => (
                        <TableCell key={column} className="text-white">
                          {row[column] !== undefined ? String(row[column]) : ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryData;
