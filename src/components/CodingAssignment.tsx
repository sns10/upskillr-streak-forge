import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Code, Play, CheckCircle, XCircle, Zap, AlertCircle, Loader2, Sun, Moon, History, FileText, RotateCcw, Users, BarChart3, TrendingUp, Clock, Target, Lightbulb, Download, Upload, MessageSquare, Settings, Share2, BookOpen, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

// Monaco Editor with dynamic import
const MonacoEditor = ({ value, onChange, onMount, theme, options }: any) => {
  const [Editor, setEditor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadMonaco = async () => {
      try {
        const { default: MonacoEditor } = await import("@monaco-editor/react");
        setEditor(() => MonacoEditor);
        setLoading(false);
      } catch (err) {
        console.log("Monaco Editor failed to load, using fallback");
        setError(true);
        setLoading(false);
      }
    };

    loadMonaco();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-sm text-gray-600">Loading Enhanced Editor...</p>
        </div>
      </div>
    );
  }

  if (error || !Editor) {
    return (
      <div className="h-full p-4">
        <div className="text-sm text-gray-600 mb-2 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Enhanced Editor Unavailable (Using Fallback)
        </div>
        <Textarea
          placeholder="# Write your Python code here...
# Example:
def solve(input_data):
    # Your solution here
    return result"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="h-full font-mono text-sm resize-none border-2 border-blue-200 focus:border-blue-400"
          style={{ minHeight: '400px' }}
        />
      </div>
    );
  }

  return (
    <Editor
      height="100%"
      defaultLanguage="python"
      value={value}
      onChange={onChange}
      onMount={onMount}
      theme={theme}
      options={options}
    />
  );
};

interface CodingAssignmentProps {
  assignment: any;
  lesson: any;
  onComplete: () => void;
  profile: any;
}

interface ExecutionHistory {
  id: string;
  code: string;
  timestamp: Date;
  results: any[];
  passed: boolean;
  executionTime?: number;
  memoryUsage?: number;
}

interface PerformanceMetrics {
  averageExecutionTime: number;
  bestExecutionTime: number;
  totalSubmissions: number;
  successRate: number;
  improvementTrend: 'improving' | 'declining' | 'stable';
}



interface CodeComment {
  id: string;
  line: number;
  message: string;
  timestamp: Date;
  author: string;
}

// Available editor themes
const EDITOR_THEMES = [
  { name: 'Light', value: 'light' },
  { name: 'Dark', value: 'vs-dark' },
  { name: 'High Contrast', value: 'hc-black' },
  { name: 'GitHub Light', value: 'github-light' },
  { name: 'GitHub Dark', value: 'github-dark' },
  { name: 'Monokai', value: 'monokai' },
  { name: 'Solarized Dark', value: 'solarized-dark' },
  { name: 'Solarized Light', value: 'solarized-light' }
];

// Code templates for common patterns
const CODE_TEMPLATES = {
  python: {
    basic: `def solve(input_data):
    # Your solution here
    return result`,
    
    array: `def solve(arr):
    # Handle array input
    result = []
    for item in arr:
        # Process each item
        pass
    return result`,
    
    string: `def solve(s):
    # Handle string input
    # Convert to list if needed
    chars = list(s)
    # Your logic here
    return ''.join(chars)`,
    
    math: `def solve(n):
    # Mathematical operations
    if n <= 1:
        return n
    
    # Your mathematical logic here
    return result`,
    
    recursion: `def solve(n):
    # Base case
    if n <= 1:
        return n
    
    # Recursive case
    return solve(n - 1) + solve(n - 2)`,
  }
};



export const CodingAssignment = ({ assignment, lesson, onComplete, profile }: CodingAssignmentProps) => {
  console.log("🚀 ENHANCED CodingAssignment component loaded!", { assignment, lesson });
  
  const [code, setCode] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [executionHistory, setExecutionHistory] = useState<ExecutionHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [activeCollaborators, setActiveCollaborators] = useState<string[]>([]);
  const [codeComments, setCodeComments] = useState<CodeComment[]>([]);
  const [selectedTheme, setSelectedTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const editorRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load execution history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem(`execution-history-${assignment.id}`);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setExecutionHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (error) {
        console.error("Error loading execution history:", error);
      }
    }

    // Load saved settings
    const savedTheme = localStorage.getItem('editor-theme');
    const savedFontSize = localStorage.getItem('editor-font-size');
    if (savedTheme) setSelectedTheme(savedTheme);
    if (savedFontSize) setFontSize(parseInt(savedFontSize));
  }, [assignment.id]);



  // Calculate performance metrics
  useEffect(() => {
    if (executionHistory.length > 0) {
      const totalSubmissions = executionHistory.length;
      const successfulSubmissions = executionHistory.filter(h => h.passed).length;
      const successRate = (successfulSubmissions / totalSubmissions) * 100;
      
      const executionTimes = executionHistory
        .filter(h => h.executionTime)
        .map(h => h.executionTime!);
      
      const averageExecutionTime = executionTimes.length > 0 
        ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length 
        : 0;
      
      const bestExecutionTime = executionTimes.length > 0 
        ? Math.min(...executionTimes) 
        : 0;
      
      // Determine improvement trend
      let improvementTrend: 'improving' | 'declining' | 'stable' = 'stable';
      if (executionHistory.length >= 3) {
        const recent = executionHistory.slice(0, 3);
        const older = executionHistory.slice(3, 6);
        const recentAvg = recent.filter(h => h.passed).length / recent.length;
        const olderAvg = older.filter(h => h.passed).length / older.length;
        
        if (recentAvg > olderAvg + 0.1) improvementTrend = 'improving';
        else if (recentAvg < olderAvg - 0.1) improvementTrend = 'declining';
      }
      
      setPerformanceMetrics({
        averageExecutionTime,
        bestExecutionTime,
        totalSubmissions,
        successRate,
        improvementTrend
      });
    }
  }, [executionHistory]);

  // Simulate real-time collaboration
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate other students working on the same assignment
      const mockCollaborators = ['Alice', 'Bob', 'Charlie', 'Diana'];
      const activeCount = Math.floor(Math.random() * 4);
      setActiveCollaborators(mockCollaborators.slice(0, activeCount));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Save execution history to localStorage
  const saveExecutionHistory = (history: ExecutionHistory[]) => {
    localStorage.setItem(`execution-history-${assignment.id}`, JSON.stringify(history));
  };

  // Save settings to localStorage
  const saveSettings = (theme: string, size: number) => {
    localStorage.setItem('editor-theme', theme);
    localStorage.setItem('editor-font-size', size.toString());
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        if (event.shiftKey) {
          submitSolution();
        } else {
          runTests();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [code, testResults]); // Dependencies for the functions

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    editor.focus();
  };

  const handleEditorChange = (value: string | undefined) => {
    setCode(value || "");
  };

  const formatCode = () => {
    if (editorRef.current) {
      try {
        editorRef.current.getAction('editor.action.formatDocument').run();
      } catch (error) {
        toast({
          title: "Format Unavailable",
          description: "Code formatting is not available in fallback mode",
        });
      }
    }
  };

  const insertTemplate = (template: string) => {
    if (editorRef.current) {
      try {
        const selection = editorRef.current.getSelection();
        editorRef.current.executeEdits('template-insert', [{
          range: selection,
          text: template
        }]);
        setShowTemplates(false);
        editorRef.current.focus();
      } catch (error) {
        // Fallback for basic textarea
        setCode(template);
        setShowTemplates(false);
      }
    } else {
      // Fallback for basic textarea
      setCode(template);
      setShowTemplates(false);
    }
  };

  const loadFromHistory = (historyItem: ExecutionHistory) => {
    setCode(historyItem.code);
    setTestResults(historyItem.results);
    setShowHistory(false);
    toast({
      title: "Code Loaded",
      description: `Loaded code from ${historyItem.timestamp.toLocaleString()}`,
    });
  };

  // Export functionality
  const exportCode = (format: 'json' | 'txt' | 'py') => {
    const data = {
      code,
      assignment: assignment.title,
      timestamp: new Date().toISOString(),
      results: testResults,
      performance: performanceMetrics
    };

    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        filename = `solution-${assignment.id}.json`;
        mimeType = 'application/json';
        break;
      case 'txt':
        content = `Assignment: ${assignment.title}\nTimestamp: ${new Date().toLocaleString()}\n\nCode:\n${code}\n\nResults: ${testResults.filter(r => r.passed).length}/${testResults.length} passed`;
        filename = `solution-${assignment.id}.txt`;
        mimeType = 'text/plain';
        break;
      case 'py':
        content = code;
        filename = `solution-${assignment.id}.py`;
        mimeType = 'text/plain';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Code Exported",
      description: `Solution exported as ${format.toUpperCase()}`,
    });
  };

  // Import functionality
  const importCode = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      if (file.name.endsWith('.json')) {
        try {
          const data = JSON.parse(content);
          setCode(data.code || content);
          toast({
            title: "Code Imported",
            description: "JSON file imported successfully",
          });
        } catch (error) {
          toast({
            title: "Import Error",
            description: "Invalid JSON file",
            variant: "destructive",
          });
        }
      } else {
        setCode(content);
        toast({
          title: "Code Imported",
          description: "File imported successfully",
        });
      }
    };
    reader.readAsText(file);
  };

  // Add comment functionality
  const addComment = () => {
    const message = prompt('Add a comment:');
    
    if (message) {
      const comment: CodeComment = {
        id: Date.now().toString(),
        line: 1, // Fallback line number
        message,
        timestamp: new Date(),
        author: profile.name || 'You'
      };
      
      setCodeComments([...codeComments, comment]);
      toast({
        title: "Comment Added",
        description: `Comment added successfully`,
      });
    }
  };

  // Share functionality
  const shareCode = async () => {
    try {
      const shareData = {
        title: `Solution for ${assignment.title}`,
        text: `Check out my solution for ${assignment.title}`,
        url: window.location.href
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied",
          description: "Assignment link copied to clipboard",
        });
      }
    } catch (error) {
      toast({
        title: "Share Error",
        description: "Failed to share",
        variant: "destructive",
      });
    }
  };

  const runTests = async () => {
    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Please write some code before running tests",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    setTestResults([]);
    setError(null);
    
    try {
      console.log("Calling run-coding-assignment function...");
      
      const startTime = performance.now();
      
      const { data, error } = await supabase.functions.invoke('run-coding-assignment', {
        body: {
          userCode: code,
          assignmentId: assignment.id
        }
      });

      const endTime = performance.now();
      const executionTime = Math.round(endTime - startTime);

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to execute code");
      }

      if (data.error) {
        throw new Error(data.error);
      }

      console.log("Test execution results:", data);
      
      const transformedResults = data.results.map((result: any) => ({
        id: result.testCaseIndex,
        input: result.input,
        expected: result.expected,
        actual: result.actual,
        passed: result.passed,
        error: result.error,
        executionTime: result.executionTime
      }));

      setTestResults(transformedResults);

      const { passed, total } = data.summary;
      
      // Save to execution history with performance metrics
      const historyItem: ExecutionHistory = {
        id: Date.now().toString(),
        code,
        timestamp: new Date(),
        results: transformedResults,
        passed: passed === total,
        executionTime,
        memoryUsage: Math.random() * 100 // Simulated memory usage
      };
      
      const newHistory = [historyItem, ...executionHistory.slice(0, 9)]; // Keep last 10
      setExecutionHistory(newHistory);
      saveExecutionHistory(newHistory);

      toast({
        title: `Tests Complete`,
        description: `${passed}/${total} tests passed in ${executionTime}ms`,
        variant: passed === total ? "default" : "destructive",
      });

    } catch (error: any) {
      console.error("Error running tests:", error);
      setError(error.message || "Failed to run tests");
      toast({
        title: "Error",
        description: error.message || "Failed to run tests",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const submitSolution = async () => {
    setIsSubmitting(true);
    try {
      const allTestsPassed = testResults.every(result => result.passed);
      
      const { error } = await supabase
        .from("submissions")
        .insert({
          student_id: profile.id,
          assignment_id: assignment.id,
          submitted_code: code,
          is_correct: allTestsPassed
        });

      if (error) throw error;
      
      if (allTestsPassed) {
        toast({
          title: "Solution Accepted! ✅",
          description: "All test cases passed. Great work!",
        });
        onComplete();
      } else {
        toast({
          title: "Solution Submitted",
          description: "Some test cases failed. Keep trying!",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error submitting solution:", error);
      toast({
        title: "Error",
        description: "Failed to submit solution",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const allTestsPassed = testResults.length > 0 && testResults.every(result => result.passed);

  return (
    <div className="h-[calc(100vh-120px)]">
      {/* Visual indicator that enhanced component is loaded */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-2 text-center text-sm font-medium mb-2 rounded">
        🚀 Enhanced Coding Assignment Platform v2.0 - Resizable Panels, Advanced Editor
      </div>
      
      <PanelGroup direction="horizontal" className="h-full">
        {/* Left Panel - Problem Statement */}
        <Panel defaultSize={40} minSize={30}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                {lesson.title}
              </CardTitle>
              <CardDescription>Coding Assignment</CardDescription>
            </CardHeader>
            <CardContent className="h-full overflow-y-auto">
              <div className="prose max-w-none">
                <h4 className="text-lg font-semibold mb-4">Problem Statement</h4>
                <div 
                  className="text-gray-700 whitespace-pre-wrap leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: assignment.problem_statement }}
                />
              </div>
              
              <div className="mt-6 flex gap-2">
                <Badge variant="secondary">
                  <Zap className="h-3 w-3 mr-1" />
                  {lesson.xp_reward} XP
                </Badge>
                <Badge variant="secondary">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-1" />
                  {lesson.bits_reward} Bits
                </Badge>
              </div>

              {/* Collaboration Indicator */}
              {activeCollaborators.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {activeCollaborators.length} student{activeCollaborators.length > 1 ? 's' : ''} working on this
                    </span>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {activeCollaborators.join(', ')}
                  </div>
                </div>
              )}



              {/* Code Comments */}
              {codeComments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <MessageSquare className="h-4 w-4" />
                    Comments ({codeComments.length})
                  </div>
                  {codeComments.map((comment) => (
                    <div key={comment.id} className="p-2 bg-gray-50 rounded text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">Line {comment.line}</span>
                        <span className="text-gray-500">{comment.timestamp.toLocaleTimeString()}</span>
                      </div>
                      <p className="text-gray-700">{comment.message}</p>
                      <span className="text-gray-500 text-xs">- {comment.author}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors" />

        {/* Right Panel - Code Editor and Results */}
        <Panel defaultSize={60} minSize={40}>
          <div className="h-full flex flex-col space-y-4">
            {/* Code Editor Card */}
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Your Solution</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="h-8 px-2"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Templates
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowHistory(!showHistory)}
                      className="h-8 px-2"
                    >
                      <History className="h-4 w-4 mr-1" />
                      History
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAnalytics(!showAnalytics)}
                      className="h-8 px-2"
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Analytics
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className="h-8 px-2"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 px-2"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Import
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addComment}
                      className="h-8 px-2"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Comment
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={shareCode}
                      className="h-8 px-2"
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={formatCode}
                      className="h-8 px-2"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Format
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSettings(!showSettings)}
                      className="h-8 px-2"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Settings
                    </Button>
                  </div>
                </div>
                
                {/* Hidden file input for import */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".py,.txt,.json"
                  onChange={importCode}
                  className="hidden"
                />
                
                {/* Templates Dropdown */}
                {showTemplates && (
                  <div className="absolute top-16 right-0 z-50 bg-white border rounded-lg shadow-lg p-2 min-w-48">
                    <div className="text-sm font-medium mb-2">Code Templates</div>
                    {Object.entries(CODE_TEMPLATES.python).map(([name, template]) => (
                      <button
                        key={name}
                        onClick={() => insertTemplate(template)}
                        className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                      >
                        {name.charAt(0).toUpperCase() + name.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* History Dropdown */}
                {showHistory && (
                  <div className="absolute top-16 right-0 z-50 bg-white border rounded-lg shadow-lg p-2 min-w-64 max-h-64 overflow-y-auto">
                    <div className="text-sm font-medium mb-2">Execution History</div>
                    {executionHistory.length === 0 ? (
                      <div className="text-sm text-gray-500 px-2 py-1">No history yet</div>
                    ) : (
                      executionHistory.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => loadFromHistory(item)}
                          className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                        >
                          <div className="flex items-center justify-between">
                            <span>{item.timestamp.toLocaleTimeString()}</span>
                            <Badge variant={item.passed ? "default" : "secondary"} className="text-xs">
                              {item.passed ? "Passed" : "Failed"}
                            </Badge>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* Analytics Dropdown */}
                {showAnalytics && performanceMetrics && (
                  <div className="absolute top-16 right-0 z-50 bg-white border rounded-lg shadow-lg p-4 min-w-80">
                    <div className="text-sm font-medium mb-3">Performance Analytics</div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Success Rate</span>
                        <Badge variant={performanceMetrics.successRate > 70 ? "default" : "secondary"}>
                          {performanceMetrics.successRate.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Submissions</span>
                        <span className="text-sm font-medium">{performanceMetrics.totalSubmissions}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Avg Execution Time</span>
                        <span className="text-sm font-medium">{performanceMetrics.averageExecutionTime.toFixed(0)}ms</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Best Time</span>
                        <span className="text-sm font-medium">{performanceMetrics.bestExecutionTime.toFixed(0)}ms</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Trend</span>
                        <div className="flex items-center gap-1">
                          <TrendingUp className={`h-3 w-3 ${
                            performanceMetrics.improvementTrend === 'improving' ? 'text-green-600' :
                            performanceMetrics.improvementTrend === 'declining' ? 'text-red-600' : 'text-gray-600'
                          }`} />
                          <span className="text-xs capitalize">{performanceMetrics.improvementTrend}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Export Menu */}
                {showExportMenu && (
                  <div className="absolute top-16 right-0 z-50 bg-white border rounded-lg shadow-lg p-2 min-w-48">
                    <div className="text-sm font-medium mb-2">Export Options</div>
                    <button
                      onClick={() => exportCode('py')}
                      className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Python File (.py)
                    </button>
                    <button
                      onClick={() => exportCode('json')}
                      className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                    >
                      JSON with Metadata
                    </button>
                    <button
                      onClick={() => exportCode('txt')}
                      className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Text Report (.txt)
                    </button>
                  </div>
                )}

                {/* Settings Menu */}
                {showSettings && (
                  <div className="absolute top-16 right-0 z-50 bg-white border rounded-lg shadow-lg p-4 min-w-64">
                    <div className="text-sm font-medium mb-3">Editor Settings</div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700">Theme</label>
                        <select
                          value={selectedTheme}
                          onChange={(e) => {
                            setSelectedTheme(e.target.value);
                            saveSettings(e.target.value, fontSize);
                          }}
                          className="w-full mt-1 text-sm border rounded px-2 py-1"
                        >
                          {EDITOR_THEMES.map((theme) => (
                            <option key={theme.value} value={theme.value}>
                              {theme.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">Font Size</label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="range"
                            min="10"
                            max="20"
                            value={fontSize}
                            onChange={(e) => {
                              const newSize = parseInt(e.target.value);
                              setFontSize(newSize);
                              saveSettings(selectedTheme, newSize);
                            }}
                            className="flex-1"
                          />
                          <span className="text-xs w-8">{fontSize}px</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="h-full p-0">
                <div className="h-full">
                  <MonacoEditor
                    value={code}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    theme={selectedTheme}
                    options={{
                      minimap: { enabled: false },
                      fontSize: fontSize,
                      lineNumbers: "on",
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      wordWrap: "on",
                      suggestOnTriggerCharacters: true,
                      quickSuggestions: true,
                      tabSize: 4,
                      insertSpaces: true,
                      detectIndentation: false,
                      trimAutoWhitespace: true,
                      largeFileOptimizations: false,
                      scrollbar: {
                        vertical: "visible",
                        horizontal: "visible",
                        useShadows: false,
                        verticalScrollbarSize: 10,
                        horizontalScrollbarSize: 10,
                      },
                    }}
                  />
                </div>
                
                <div className="p-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button
                        onClick={runTests}
                        disabled={isRunning || !code.trim()}
                        variant="outline"
                      >
                        {isRunning ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Running Tests...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Run Tests
                          </>
                        )}
                      </Button>
                      
                      {testResults.length > 0 && (
                        <Button
                          onClick={submitSolution}
                          disabled={isSubmitting}
                          className={allTestsPassed ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Solution"
                          )}
                        </Button>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      <div>Ctrl+S: Run Tests</div>
                      <div>Ctrl+Shift+S: Submit</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Error:</span>
                    <span>{error}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Test Results Card */}
            {testResults.length > 0 && (
              <Card className="flex-1 min-h-0">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Test Results
                    <div className="text-sm font-normal">
                      {testResults.filter(r => r.passed).length}/{testResults.length} passed
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-full overflow-y-auto">
                  <div className="space-y-3">
                    {testResults.map((result) => (
                      <div
                        key={result.id}
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
                          <span className="font-medium">
                            Test Case {result.id + 1}
                          </span>
                          {result.executionTime && (
                            <span className="text-xs text-gray-500">
                              ({result.executionTime}ms)
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="font-medium">Input:</span>{" "}
                            <code className="bg-gray-100 px-1 rounded text-xs">
                              {JSON.stringify(result.input)}
                            </code>
                          </div>
                          <div>
                            <span className="font-medium">Expected:</span>{" "}
                            <code className="bg-gray-100 px-1 rounded text-xs">
                              {JSON.stringify(result.expected)}
                            </code>
                          </div>
                          <div>
                            <span className="font-medium">Actual:</span>{" "}
                            <code className={`px-1 rounded text-xs ${
                              result.passed ? "bg-green-100" : "bg-red-100"
                            }`}>
                              {result.error ? `Error: ${result.error}` : JSON.stringify(result.actual)}
                            </code>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
};
