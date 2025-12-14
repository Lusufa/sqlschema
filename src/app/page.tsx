'use client';

import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateSqlQuery } from '@/ai/flows/generate-sql-query-from-natural-language';
import { generateMockData } from '@/ai/flows/generate-mock-data-from-sql-query';
import { Database, Code, Clipboard, AlertTriangle, Loader2, Upload, FileText, Trash2, History } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sidebar, SidebarContent, SidebarTrigger, SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


interface UploadedFile {
  name: string;
  content: string;
}

export default function Home() {
  const [schema, setSchema] = useState('');
  const [question, setQuestion] = useState('');
  const [generatedQuery, setGeneratedQuery] = useState('');
  const [mockData, setMockData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('manual');
  const fileInputRef = useRef<HTMLInputElement>(null);


  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedFiles = localStorage.getItem('sqlgenius_schema_history');
      if (storedFiles) {
        setUploadedFiles(JSON.parse(storedFiles));
      }
    } catch (error) {
      console.error("Failed to parse schema history from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('sqlgenius_schema_history', JSON.stringify(uploadedFiles));
    } catch (error) {
      console.error("Failed to save schema history to localStorage", error);
    }
  }, [uploadedFiles]);


  const handleGenerateQuery = async () => {
    if (!schema || !question) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please provide both a database schema and a question.',
      });
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedQuery('');
    setMockData(null);

    try {
      const sqlResult = await generateSqlQuery({
        schemaDefinition: schema,
        naturalLanguageQuestion: question,
      });
      setGeneratedQuery(sqlResult.sqlQuery);

      const mockDataResult = await generateMockData({
        schemaDefinition: schema,
        sqlQuery: sqlResult.sqlQuery,
      });

      try {
        const parsedData = JSON.parse(mockDataResult.mockData);
        setMockData(parsedData);
      } catch (jsonError) {
        setError('Failed to parse mock data. The generated data was not valid JSON.');
      }
      
    } catch (e: any) {
      setError('Failed to generate SQL query or mock data. Please try again.');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: e.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedQuery) {
      navigator.clipboard.writeText(generatedQuery);
      toast({ title: 'Copied to clipboard!' });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const newFile = { name: file.name, content };

        setUploadedFiles(prevFiles => {
          const existingFileIndex = prevFiles.findIndex(f => f.name === newFile.name);
          if (existingFileIndex > -1) {
            const updatedFiles = [...prevFiles];
            updatedFiles[existingFileIndex] = newFile;
            return updatedFiles;
          }
          return [...prevFiles, newFile];
        });
        
        setSchema(content);
        setActiveFile(newFile.name);
        setActiveTab('manual');
        toast({ title: 'File loaded successfully!', description: `${file.name} is ready.` });
      };
      reader.onerror = () => {
        toast({
          variant: 'destructive',
          title: 'Error reading file',
          description: 'There was an issue uploading your file.',
        });
      };
      reader.readAsText(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const selectFile = (file: UploadedFile) => {
    setSchema(file.content);
    setActiveFile(file.name);
    setActiveTab('manual');
  };
  
  const removeFile = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedFiles(files => files.filter(f => f.name !== fileName));
    if (activeFile === fileName) {
      setSchema('');
      setActiveFile(null);
    }
    toast({ title: 'File removed', description: `${fileName} has been removed.` });
  };
  
  const renderTable = () => {
    if (!mockData || mockData.length === 0) return null;
    const headers = Object.keys(mockData[0]);
    return (
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map(header => <TableHead key={header}>{header}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockData.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {headers.map(header => <TableCell key={`${rowIndex}-${header}`}>{String(row[header])}</TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar>
        <SidebarContent className="p-0 flex flex-col">
          <div className="p-4 border-b border-sidebar-border">
              <h2 className="font-headline text-lg font-semibold flex items-center gap-2"><History className="text-primary"/> Schema History</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {uploadedFiles.length > 0 ? (
                <SidebarGroup className="pt-2">
                    <SidebarMenu>
                        {uploadedFiles.map((file) => (
                            <SidebarMenuItem key={file.name}>
                                <SidebarMenuButton onClick={() => selectFile(file)} isActive={activeFile === file.name} className="justify-between pr-8">
                                    <div className="flex items-center gap-2">
                                      <FileText className="text-primary"/>
                                      <span className="truncate">{file.name}</span>
                                    </div>
                                </SidebarMenuButton>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                                    onClick={(e) => removeFile(file.name, e)}
                                >
                                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive"/>
                                    <span className="sr-only">Remove file</span>
                                </Button>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            ) : (
              <div className="text-center text-muted-foreground p-8 flex flex-col items-center justify-center h-full">
                <History className="h-10 w-10 mb-4 text-primary" />
                <p className="text-sm">No history yet.</p>
                <p className="text-xs mt-1">Imported schemas will appear here for quick access.</p>
              </div>
            )}
          </div>
        </SidebarContent>
      </Sidebar>
      
      <main className="flex-1 flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full">
        <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="md:hidden">
                <SidebarTrigger />
              </div>
              <Database className="h-8 w-8 text-primary" />
              <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground">SQL Genius</h1>
            </div>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="flex flex-col gap-6">
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle className="font-headline text-xl">
                    1. Provide Database Schema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="manual">Schema</TabsTrigger>
                      <TabsTrigger value="upload" onClick={handleUploadClick}>Import File</TabsTrigger>
                    </TabsList>
                    <TabsContent value="manual">
                      <Textarea
                        placeholder="CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255));"
                        className="h-40 font-code text-sm mt-4"
                        value={schema}
                        onChange={(e) => {
                          setSchema(e.target.value);
                          setActiveFile(null);
                        }}
                      />
                    </TabsContent>
                  </Tabs>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".sql,.txt"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-xl">
                    2. Write Your Query in Plain English
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    id="query-input"
                    placeholder="Show me all users with a gmail address"
                    className="h-28"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                  <Button onClick={handleGenerateQuery} disabled={isLoading} size="lg" className="w-full mt-4">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Run'
                    )}
                  </Button>
                </CardContent>
              </Card>
          </div>
          
          <Card className="h-full min-h-[400px]">
            <CardHeader>
              <CardTitle className="font-headline text-xl">
                3. Generated Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {mockData && !isLoading && (
                <div className="space-y-4">
                   <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2 text-sm font-headline">
                          <Code />
                          View Generated SQL
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                         <div className="relative bg-muted/50 rounded-md p-4">
                          <Button variant="ghost" size="icon" onClick={copyToClipboard} className="absolute top-2 right-2 h-7 w-7">
                            <Clipboard className="h-4 w-4" />
                            <span className="sr-only">Copy SQL to clipboard</span>
                          </Button>
                          <pre className="font-code text-sm whitespace-pre-wrap">
                            <code>{generatedQuery}</code>
                          </pre>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  {renderTable()}
                </div>
              )}
              {!isLoading && !error && !mockData && (
                  <div className="text-center text-muted-foreground py-10 h-full flex flex-col justify-center items-center">
                      <p>Your generated query and results will appear here.</p>
                  </div>
              )}
            </CardContent>
          </Card>
        </div>
        <footer className="text-center mt-8 py-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Built by प्यार से{' '}
            <a href="https://utkarsh-portfolio-01.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Utkarsh
            </a>{' '}
            &{' '}
            <a href="https://rtportfolio-eta.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              RT
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
