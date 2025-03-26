
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Download, Table, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { saveTables, addTable } from '@/services/dataService';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';

const DataConverter: React.FC = () => {
  const { toast } = useToast();
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [convertedData, setConvertedData] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [targetFormat, setTargetFormat] = useState<string>("csv");
  const [fileInputRef] = useState(React.createRef<HTMLInputElement>());

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setSourceFile(file);
    setConvertedData(null);
    setConversionProgress(0);
    
    toast({
      title: "File Selected",
      description: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
    });
  };

  const getAcceptedFileTypes = (): string => {
    return ".xlsx,.xls";
  };

  const getFileIcon = () => {
    return <Table className="w-12 h-12 text-green-500" />;
  };
  
  const convertFile = async () => {
    if (!sourceFile) {
      toast({
        title: "Error",
        description: "Please select an Excel file to convert",
        variant: "destructive",
      });
      return;
    }

    setIsConverting(true);
    setConversionProgress(0);
    
    try {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setConversionProgress(progress);
        if (progress >= 90) {
          clearInterval(interval);
        }
      }, 150);
      
      const data = await readExcelFile(sourceFile);
      let result = "";
      
      if (targetFormat === "csv") {
        result = convertToCSV(data);
      } else if (targetFormat === "json") {
        result = JSON.stringify(data, null, 2);
      } else if (targetFormat === "txt") {
        result = convertToTXT(data);
      }
      
      clearInterval(interval);
      setConversionProgress(100);
      setConvertedData(result);
      
      toast({
        title: "Conversion Complete",
        description: `Successfully converted ${sourceFile.name} to ${targetFormat.toUpperCase()}`,
      });
    } catch (error) {
      console.error("Conversion error:", error);
      toast({
        title: "Conversion Failed",
        description: "An error occurred during conversion",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          const options = { 
            raw: false,
            dateNF: 'dd/mm/yyyy'
          };
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet, options);
          
          const processedData = jsonData.map(row => {
            const newRow: Record<string, any> = {};
            
            Object.entries(row).forEach(([key, value]) => {
              if (typeof value === 'string' && /[^\w\s.,]/.test(value)) {
                newRow[key] = value;
              } 
              else if (typeof value === 'string' && isDateString(value)) {
                newRow[key] = formatDateToUKFormat(value);
              }
              else {
                newRow[key] = value;
              }
            });
            
            return newRow;
          });
          
          resolve(processedData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  const isDateString = (value: string): boolean => {
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/,
      /^\d{1,2}\/\d{1,2}\/\d{4}$/,
      /^\d{1,2}-\d{1,2}-\d{4}$/,
      /^\d{1,2}\.\d{1,2}\.\d{4}$/
    ];
    
    return datePatterns.some(pattern => pattern.test(value));
  };

  const formatDateToUKFormat = (dateString: string): string => {
    // Fix the regex pattern - the dash needs to be escaped or placed at the end
    // Change from: /[\/\-\.]/ to: /[\/\.\-]/ or /[\/.\\-]/
    const dateParts = dateString.split(/[\/\.\-]/);
    
    if (dateParts.length === 3 && dateParts[0].length === 4) {
      const [year, month, day] = dateParts;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    
    if (dateParts.length === 3) {
      const day = dateParts[0].padStart(2, '0');
      const month = dateParts[1].padStart(2, '0');
      const year = dateParts[2];
      
      if (parseInt(day) > 31 || parseInt(month) > 12) {
        return `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`;
      }
      
      return `${day}/${month}/${year}`;
    }
    
    return dateString;
  };

  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          
          if (typeof value === 'string' && isDateString(value)) {
            return formatDateToUKFormat(value);
          }
          
          if (typeof value === 'string') {
            if (value.includes('"') || value.includes(',') || value.includes('\n') || /[^\w\s.]/.test(value)) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }
          
          return value;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  };

  const convertToTXT = (data: any[]): string => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const txtRows = [
      headers.join('\t'),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          
          if (typeof value === 'string' && isDateString(value)) {
            return formatDateToUKFormat(value);
          }
          
          return String(value);
        }).join('\t')
      )
    ];
    
    return txtRows.join('\n');
  };

  const handleDownloadConverted = () => {
    if (!convertedData) return;
    
    const blob = new Blob([convertedData], { type: getContentType(targetFormat) });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = sourceFile ? `${sourceFile.name.split('.')[0]}.${targetFormat}` : `converted.${targetFormat}`;
    link.click();
  };

  const getContentType = (format: string): string => {
    switch (format) {
      case 'csv':
        return 'text/csv';
      case 'json':
        return 'application/json';
      case 'txt':
      default:
        return 'text/plain';
    }
  };

  const handleSaveAsTable = () => {
    if (!convertedData || targetFormat !== 'csv') {
      toast({
        title: "Error",
        description: "Only CSV data can be saved as a table",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const lines = convertedData.split('\n');
      if (lines.length < 2) throw new Error("Not enough data");
      
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = parseCSVLine(lines[i]);
        if (values.length !== headers.length) continue;
        
        const row: Record<string, any> = { id: uuidv4() };
        headers.forEach((header, index) => {
          const value = values[index].trim();
          
          if (/[^\w\s.,]/.test(value) || isDateString(value)) {
            row[header] = value;
          } else {
            const numValue = Number(value);
            row[header] = !isNaN(numValue) && /^-?\d+(\.\d+)?$/.test(value) ? numValue : value;
          }
        });
        
        rows.push(row);
      }
      
      const tableName = sourceFile 
        ? `Converted ${sourceFile.name.split('.')[0]}`
        : `Converted Data ${new Date().toLocaleTimeString()}`;
      
      const newTable = {
        id: uuidv4(),
        name: tableName,
        data: rows,
        columns: headers
      };
      
      addTable(newTable);
      
      toast({
        title: "Success",
        description: `Saved as new table "${tableName}"`,
      });
    } catch (error) {
      console.error("Error saving as table:", error);
      toast({
        title: "Error",
        description: "Failed to save as table",
        variant: "destructive",
      });
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  };

  return (
    <div className="container mx-auto py-24 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Excel Converter</h1>
        <p className="text-gray-400 mb-6">Convert your Excel files to different formats</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Table className="w-5 h-5 text-green-500" />
              Excel File
            </CardTitle>
            <CardDescription>Select the Excel file you want to convert</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Target Format</label>
                <Select value={targetFormat} onValueChange={setTargetFormat}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="txt">Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div 
                className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-gold-500 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {sourceFile ? (
                  <div className="flex flex-col items-center gap-2">
                    {getFileIcon()}
                    <p className="text-white font-medium">{sourceFile.name}</p>
                    <p className="text-sm text-gray-400">
                      {(sourceFile.size / 1024).toFixed(2)} KB
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-gold-300 hover:text-gold-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSourceFile(null);
                        setConvertedData(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      Change File
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="h-12 w-12 text-gray-500" />
                    <p className="text-white">Click to select or drop your Excel file here</p>
                    <p className="text-sm text-gray-400">
                      Supports XLSX and XLS files
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept={getAcceptedFileTypes()}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={convertFile} 
              disabled={!sourceFile || isConverting}
              className="w-full bg-gold-500 text-black hover:bg-gold-600"
            >
              {isConverting ? (
                <>Converting...</>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Convert to {targetFormat.toUpperCase()}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-gold-500" />
              Converted File
            </CardTitle>
            <CardDescription>Preview and download your converted data</CardDescription>
          </CardHeader>
          <CardContent>
            {isConverting ? (
              <div className="flex flex-col gap-4 items-center justify-center py-12">
                <div className="w-full mb-4">
                  <Progress value={conversionProgress} className="h-2 bg-gray-800" />
                </div>
                <p className="text-white">Converting... {conversionProgress}%</p>
                <p className="text-sm text-gray-400">Please wait while we convert your file</p>
              </div>
            ) : convertedData ? (
              <div className="border border-gray-800 rounded-lg p-4 h-64 overflow-auto bg-gray-800">
                <pre className="text-sm text-white whitespace-pre-wrap">{convertedData}</pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-12 w-12 text-gray-500 mb-4" />
                <p className="text-white mb-2">Conversion Preview</p>
                <p className="text-sm text-gray-400">
                  Your converted file will appear here after conversion
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button 
              onClick={handleDownloadConverted} 
              disabled={!convertedData}
              className="w-full bg-white text-black hover:bg-gray-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Download {targetFormat.toUpperCase()}
            </Button>
            
            {targetFormat === 'csv' && (
              <Button 
                onClick={handleSaveAsTable} 
                disabled={!convertedData}
                className="w-full bg-gold-500 text-black hover:bg-gold-600"
              >
                <Table className="w-4 h-4 mr-2" />
                Save as Table
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-12 bg-gray-900 rounded-lg border border-gray-800 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Supported Conversion Formats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 flex items-start gap-3">
            <Table className="w-8 h-8 text-green-500" />
            <div>
              <h3 className="text-white font-medium">Excel to CSV</h3>
              <p className="text-sm text-gray-400">Convert Excel spreadsheets to CSV format with proper date handling.</p>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 flex items-start gap-3">
            <FileText className="w-8 h-8 text-blue-500" />
            <div>
              <h3 className="text-white font-medium">Excel to JSON</h3>
              <p className="text-sm text-gray-400">Convert Excel data to structured JSON format.</p>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 flex items-start gap-3">
            <FileText className="w-8 h-8 text-gold-500" />
            <div>
              <h3 className="text-white font-medium">Excel to TXT</h3>
              <p className="text-sm text-gray-400">Convert Excel data to tab-delimited text format.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataConverter;
