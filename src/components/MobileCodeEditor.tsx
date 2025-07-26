
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { 
  Smartphone, 
  Code, 
  Play, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  Maximize,
  Minimize,
  Keyboard,
  Eye,
  EyeOff,
  Zap,
  Settings,
  Download,
  Share2
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface MobileCodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  onRunTests: () => void;
  onSubmit: () => void;
  language: string;
  isRunning: boolean;
  testResults: any[];
  problemStatement: string;
}

export const MobileCodeEditor: React.FC<MobileCodeEditorProps> = ({
  code,
  onCodeChange,
  onRunTests,
  onSubmit,
  language,
  isRunning,
  testResults,
  problemStatement
}) => {
  const [activeTab, setActiveTab] = useState('editor');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showProblem, setShowProblem] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [snippets, setSnippets] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Common code snippets for mobile
  useEffect(() => {
    const commonSnippets = [
      'input()',
      'print()',
      'if __name__ == "__main__":',
      'def main():',
      'try:\n    \nexcept:',
      'for i in range():',
      'while True:',
      'import ',
      'from  import ',
      'def ():\n    pass'
    ];
    setSnippets(commonSnippets);
  }, []);

  const insertSnippet = (snippet: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newCode = code.substring(0, start) + snippet + code.substring(end);
      onCodeChange(newCode);
      
      // Focus back to textarea
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(start + snippet.length, start + snippet.length);
        }
      }, 100);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 10));
  };

  const shareCode = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Code',
          text: code,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(code);
        toast({
          title: "Code Copied",
          description: "Code has been copied to clipboard",
        });
      }
    } catch (error) {
      console.error('Error sharing code:', error);
    }
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${language === 'python' ? 'py' : 'js'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetCode = () => {
    onCodeChange('');
    toast({
      title: "Code Reset",
      description: "Code editor has been cleared",
    });
  };

  return (
    <div className={`w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <Card className={`w-full ${isFullscreen ? 'h-full' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="h-5 w-5" />
              Mobile Code Editor
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {language.toUpperCase()}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="p-2"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger value="editor" className="text-sm">Editor</TabsTrigger>
              <TabsTrigger value="problem" className="text-sm">Problem</TabsTrigger>
              <TabsTrigger value="results" className="text-sm">Results</TabsTrigger>
            </TabsList>

            {/* Code Editor Tab */}
            <TabsContent value="editor" className="space-y-4 p-4">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={decreaseFontSize}
                    className="p-2"
                  >
                    A-
                  </Button>
                  <span className="text-sm font-medium w-8 text-center">{fontSize}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={increaseFontSize}
                    className="p-2"
                  >
                    A+
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowKeyboard(!showKeyboard)}
                    className="p-2"
                  >
                    <Keyboard className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetCode}
                    className="p-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Code Snippets */}
              {showKeyboard && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-2">Quick Snippets:</p>
                  <div className="flex flex-wrap gap-2">
                    {snippets.map((snippet, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => insertSnippet(snippet)}
                        className="text-xs h-8"
                      >
                        {snippet.length > 15 ? snippet.substring(0, 15) + '...' : snippet}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Code Editor */}
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => onCodeChange(e.target.value)}
                  placeholder="Write your code here..."
                  className={`w-full min-h-[300px] font-mono resize-none border-2 focus:border-blue-500 transition-colors ${
                    isFullscreen ? 'min-h-[500px]' : ''
                  }`}
                  style={{ fontSize: `${fontSize}px` }}
                  onFocus={() => setShowKeyboard(true)}
                />
                
                {/* Line Numbers */}
                <div className="absolute left-2 top-2 text-gray-400 text-xs font-mono pointer-events-none">
                  {code.split('\n').map((_, index) => (
                    <div key={index} style={{ fontSize: `${fontSize}px` }}>
                      {index + 1}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={onRunTests}
                  disabled={isRunning || !code.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isRunning ? "Running..." : "Run Tests"}
                </Button>
                
                <Button
                  onClick={onSubmit}
                  disabled={!code.trim() || testResults.length === 0 || !testResults.every(r => r.passed)}
                  variant="outline"
                  className="flex-1 border-green-600 text-green-600 hover:bg-green-50 h-12"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit
                </Button>
              </div>

              {/* Additional Actions */}
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shareCode}
                  className="flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadCode}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </TabsContent>

            {/* Problem Statement Tab */}
            <TabsContent value="problem" className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Problem Statement</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowProblem(!showProblem)}
                  >
                    {showProblem ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                
                {showProblem && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm leading-relaxed">{problemStatement}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Test Results Tab */}
            <TabsContent value="results" className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Test Results</h3>
                  {testResults.length > 0 && (
                    <Badge variant="outline">
                      {testResults.filter(r => r.passed).length}/{testResults.length} passed
                    </Badge>
                  )}
                </div>
                
                {testResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Run tests to see results</p>
                  </div>
                ) : (
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {testResults.map((result, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            result.passed
                              ? "bg-green-50 border-green-200"
                              : "bg-red-50 border-red-200"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {result.passed ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="font-medium text-sm">
                              Test Case {index + 1}
                            </span>
                          </div>
                          
                          <div className="text-xs space-y-1">
                            <div>
                              <span className="font-medium">Input:</span>{" "}
                              <code className="bg-gray-100 px-1 rounded">
                                {JSON.stringify(result.input)}
                              </code>
                            </div>
                            <div>
                              <span className="font-medium">Expected:</span>{" "}
                              <code className="bg-gray-100 px-1 rounded">
                                {JSON.stringify(result.expected)}
                              </code>
                            </div>
                            <div>
                              <span className="font-medium">Actual:</span>{" "}
                              <code className={`px-1 rounded ${
                                result.passed ? "bg-green-100" : "bg-red-100"
                              }`}>
                                {result.error ? `Error: ${result.error}` : JSON.stringify(result.actual)}
                              </code>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
