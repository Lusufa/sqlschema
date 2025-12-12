'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateSqlQuery } from '@/ai/flows/generate-sql-query-from-natural-language';
import { Database, BrainCircuit, Code, Clipboard, AlertTriangle, Loader2, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

export default function Home() {
  const [schema, setSchema] = useState('');
  const [question, setQuestion] = useState('');
  const [generatedQuery, setGeneratedQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

    try {
      const result = await generateSqlQuery({
        schemaDefinition: schema,
        naturalLanguageQuestion: question,
      });
      setGeneratedQuery(result.sqlQuery);
    } catch (e: any) {
      setError('Failed to generate SQL query. Please try again.');
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
        setSchema(content);
        toast({ title: 'File loaded successfully!' });
      };
      reader.onerror = () => {
        toast({
          variant: 'destructive',
          title: 'Error reading file',
          description: 'There was an issue uploading your file.',
        });
      };
      reader.readAsText(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <Sidebar>
        <SidebarContent className="p-4">
          <div className="flex flex-col gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                  <Database />
                  Database Schema
                </CardTitle>
                <CardDescription>
                  Paste your SQL `CREATE TABLE` statements or upload a file.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Textarea
                  placeholder="CREATE TABLE users (id INT, name VARCHAR(255), ...);"
                  className="h-48 font-code text-sm"
                  value={schema}
                  onChange={(e) => setSchema(e.target.value)}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".sql,.txt"
                />
                <Button variant="outline" onClick={handleUploadClick}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload File
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                  <BrainCircuit />
                  Your Question
                </CardTitle>
                <CardDescription>
                  Ask a question in plain English based on your schema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="How many users are there?"
                  className="h-24"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </CardContent>
            </Card>

            <Button onClick={handleGenerateQuery} disabled={isLoading} size="lg" className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate SQL'
              )}
            </Button>
          </div>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <main className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto p-4 md:p-8">
          <header className="text-center mb-12">
            <div className="md:hidden mb-4">
              <SidebarTrigger />
            </div>
            <h1 className="font-headline text-5xl font-bold tracking-tight">SQL Genius</h1>
            <p className="text-muted-foreground mt-4 text-lg max-w-2xl mx-auto">
              Transform your natural language questions into SQL queries with the power of AI.
            </p>
          </header>

          <div className="flex flex-col gap-8">
            <Card className="min-h-[300px] w-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between font-headline">
                  <div className="flex items-center gap-2">
                    <Code />
                    Generated SQL
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="hidden md:block">
                      <SidebarTrigger />
                    </div>
                    <Button variant="ghost" size="icon" onClick={copyToClipboard} disabled={!generatedQuery || isLoading}>
                      <Clipboard className="h-4 w-4" />
                      <span className="sr-only">Copy SQL to clipboard</span>
                    </Button>
                  </div>
                </CardTitle>
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
                {generatedQuery && !isLoading && (
                  <div className="bg-muted rounded-md p-4">
                    <pre className="font-code text-sm whitespace-pre-wrap">
                      <code>{generatedQuery}</code>
                    </pre>
                  </div>
                )}
                {!isLoading && !error && !generatedQuery && (
                    <div className="text-center text-muted-foreground py-10">
                        <p>Your generated SQL query will appear here.</p>
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
