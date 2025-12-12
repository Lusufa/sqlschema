'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateSqlQuery } from '@/ai/flows/generate-sql-query-from-natural-language';
import { generateMockData } from '@/ai/flows/generate-mock-data-from-sql-query';
import { Database, BrainCircuit, Code, Clipboard, AlertTriangle, Loader2, Upload, FileText, Trash2, Table as TableIcon, History } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sidebar, SidebarContent, SidebarInset, SidebarTrigger, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


interface UploadedFile {
  name: string;
  content: string;
}

export default function Home() {
  const [schema, setSchema] = useState('CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255));');
  const [question, setQuestion] = useState(`Show me all users with a gmail address`);
  const [generatedQuery, setGeneratedQuery] = useState('');
  const [mockData, setMockData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const { toast } = useToast();

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
    <>
      <Sidebar>
        <SidebarContent className="p-0 flex flex-col">
          <div className="p-4">
              <h2 className="font-headline text-lg font-semibold flex items-center gap-2"><History /> Schema History</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {uploadedFiles.length > 0 ? (
                <SidebarGroup className="pt-0">
                    <SidebarMenu>
                        {uploadedFiles.map((file) => (
                            <SidebarMenuItem key={file.name}>
                                <SidebarMenuButton onClick={() => selectFile(file)} isActive={activeFile === file.name} className="justify-between pr-8">
                                    <div className="flex items-center gap-2">
                                      <FileText/>
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
                <History className="h-10 w-10 mb-4" />
                <p className="text-sm">No history yet. Imported schemas will appear here for quick access.</p>
              </div>
            )}
          </div>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <main className="min-h-screen">
        <div className="container mx-auto p-4 md:p-8">
          <header className="mb-12">
            <div className="md:hidden mb-4">
              <SidebarTrigger />
            </div>
            <div className="flex items-center gap-2">
                <Database className="h-8 w-8 text-primary" />
                <h1 className="font-headline text-3xl font-bold tracking-tight">QueryGenius</h1>
            </div>
          </header>

          <div className="max-w-4xl mx-auto flex flex-col gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-xl">
                  1. Provide Database Schema
                </CardTitle>
                <CardDescription>
                  Write your schema manually or import a file. This gives the AI context about your database structure.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                    <Button variant="outline" className="bg-white">Write Schema</Button>
                    <Button variant="outline" onClick={handleUploadClick}>
                        <Upload className="mr-2 h-4 w-4" />
                        Import File
                    </Button>
                </div>
                <Textarea
                  placeholder="CREATE TABLE users (id INT, name VARCHAR(255), ...);"
                  className="h-40 font-code text-sm bg-gray-50"
                  value={schema}
                  onChange={(e) => {
                    setSchema(e.target.value);
                    setActiveFile(null);
                  }}
                />
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
                <CardDescription>
                  Describe what you want to achieve, and our AI will translate it into a SQL query.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <label htmlFor="query-input" className="font-medium text-sm mb-2 block">Your Query</label>
                <Textarea
                  id="query-input"
                  placeholder="e.g., 'Show me all users with a gmail address'"
                  className="h-28 bg-gray-50"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </CardContent>
            </Card>

            <div className="text-left">
              <Button onClick={handleGenerateQuery} disabled={isLoading} size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Query'
                )}
              </Button>
            </div>
            
            <Card className="min-h-[300px] w-full">
              <CardHeader>
                <CardTitle className="font-headline text-xl">
                  3. Generated Result
                </CardTitle>
                 <CardDescription>
                  Here's the generated SQL query. You can execute it to see a preview of the results.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading && (
                  <div className="space-y-3 p-4">
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                    <div className="h-4 bg-muted rounded w-full animate-pulse" />
                    <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
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
                    {renderTable()}
                     <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger>
                          <div className="flex items-center gap-2 text-sm font-headline">
                            <Code />
                            View Generated SQL
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <div className="relative bg-muted rounded-md p-4">
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
                  </div>
                )}
                {!isLoading && !error && !mockData && (
                    <div className="text-center text-muted-foreground py-10">
                        <p>Your generated query and results will appear here.</p>
                    </div>
                )}
              </CardContent>
            </Card>
          </div>

          <footer className="text-center mt-12 py-4 border-t">
            <p className="text-sm text-muted-foreground">
              Built with Next.js, Genkit, and shadcn/ui.
            </p>
          </footer>
        </div>
      </main>
      </SidebarInset>
    </>
  );
}
