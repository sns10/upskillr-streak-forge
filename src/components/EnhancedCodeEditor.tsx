import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Code, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  Download,
  Upload,
  RotateCcw,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EnhancedCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  placeholder?: string;
  readOnly?: boolean;
  onRun?: () => void;
  onReset?: () => void;
  className?: string;
}

const SUPPORTED_LANGUAGES = [
  { value: 'python', label: 'Python', extension: '.py' },
  { value: 'javascript', label: 'JavaScript', extension: '.js' },
  { value: 'java', label: 'Java', extension: '.java' },
  { value: 'cpp', label: 'C++', extension: '.cpp' },
  { value: 'csharp', label: 'C#', extension: '.cs' },
  { value: 'php', label: 'PHP', extension: '.php' },
  { value: 'ruby', label: 'Ruby', extension: '.rb' },
  { value: 'go', label: 'Go', extension: '.go' },
  { value: 'rust', label: 'Rust', extension: '.rs' },
  { value: 'swift', label: 'Swift', extension: '.swift' }
];

const PYTHON_TEMPLATES = {
  basic: `def solve(input_data):
    # Your solution here
    return input_data`,
  
  with_input: `def solve(input_data):
    # Parse input if needed
    # input_data could be a string, number, or list
    result = input_data
    return result`,
  
  list_processing: `def solve(input_data):
    # Process list input
    if isinstance(input_data, list):
        # Handle list processing
        pass
    return input_data`,
  
  string_processing: `def solve(input_data):
    # Process string input
    if isinstance(input_data, str):
        # Handle string processing
        pass
    return input_data`
};

const JAVASCRIPT_TEMPLATES = {
  basic: `function solve(inputData) {
    // Your solution here
    return inputData;
}`,
  
  with_input: `function solve(inputData) {
    // Parse input if needed
    let result = inputData;
    return result;
}`,
  
  array_processing: `function solve(inputData) {
    // Process array input
    if (Array.isArray(inputData)) {
        // Handle array processing
    }
    return inputData;
}`,
  
  string_processing: `function solve(inputData) {
    // Process string input
    if (typeof inputData === 'string') {
        // Handle string processing
    }
    return inputData;
}`
};

export const EnhancedCodeEditor = ({
  value,
  onChange,
  language = 'python',
  placeholder = 'Write your code here...',
  readOnly = false,
  onRun,
  onReset,
  className = ''
}: EnhancedCodeEditorProps) => {
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [syntaxErrors, setSyntaxErrors] = useState<string[]>([]);
  const [autoComplete, setAutoComplete] = useState(true);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  // Basic syntax validation
  useEffect(() => {
    if (selectedLanguage === 'python') {
      validatePythonSyntax(value);
    } else if (selectedLanguage === 'javascript') {
      validateJavaScriptSyntax(value);
    }
  }, [value, selectedLanguage]);

  const validatePythonSyntax = (code: string) => {
    const errors: string[] = [];
    
    // Only check for the most critical typos
    if (code.includes('inpu(') && !code.includes('input(')) {
      errors.push(`Did you mean 'input(' instead of 'inpu('?`);
    }
    
    if (code.includes('prin(') && !code.includes('print(')) {
      errors.push(`Did you mean 'print(' instead of 'prin('?`);
    }
    
    setSyntaxErrors(errors);
  };

  const validateJavaScriptSyntax = (code: string) => {
    const errors: string[] = [];
    
    // Check for basic JavaScript syntax issues
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      // Check for unmatched parentheses
      const openParens = (line.match(/\(/g) || []).length;
      const closeParens = (line.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        errors.push(`Line ${index + 1}: Unmatched parentheses`);
      }
      
      // Check for unmatched brackets
      const openBrackets = (line.match(/\[/g) || []).length;
      const closeBrackets = (line.match(/\]/g) || []).length;
      if (openBrackets !== closeBrackets) {
        errors.push(`Line ${index + 1}: Unmatched brackets`);
      }
      
      // Check for unmatched braces
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        errors.push(`Line ${index + 1}: Unmatched braces`);
      }
    });
    
    setSyntaxErrors(errors);
  };

  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    setSyntaxErrors([]);
    
    // Auto-format code based on new language
    if (newLanguage === 'python' && value.includes('function')) {
      // Convert JavaScript to Python
      const pythonCode = value
        .replace(/function\s+(\w+)\s*\(/g, 'def $1(')
        .replace(/console\.log/g, 'print')
        .replace(/let\s+/g, '')
        .replace(/const\s+/g, '')
        .replace(/var\s+/g, '')
        .replace(/;\s*$/gm, '')
        .replace(/\{\s*$/gm, ':')
        .replace(/^\s*\}\s*$/gm, '');
      onChange(pythonCode);
    } else if (newLanguage === 'javascript' && value.includes('def ')) {
      // Convert Python to JavaScript
      const jsCode = value
        .replace(/def\s+(\w+)\s*\(/g, 'function $1(')
        .replace(/print\s*\(/g, 'console.log(')
        .replace(/:\s*$/gm, ' {')
        .replace(/^\s*$/gm, '}');
      onChange(jsCode);
    }
  };

  const insertTemplate = (templateType: string) => {
    const templates = selectedLanguage === 'python' ? PYTHON_TEMPLATES : JAVASCRIPT_TEMPLATES;
    const template = templates[templateType as keyof typeof templates];
    if (template) {
      onChange(template);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + '    ' + value.substring(end);
      onChange(newValue);
      
      // Set cursor position after tab
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
    
    // Auto-complete brackets
    if (autoComplete) {
      if (e.key === '(') {
        e.preventDefault();
        const start = e.currentTarget.selectionStart;
        const newValue = value.substring(0, start) + '()' + value.substring(start);
        onChange(newValue);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1;
          }
        }, 0);
      } else if (e.key === '[') {
        e.preventDefault();
        const start = e.currentTarget.selectionStart;
        const newValue = value.substring(0, start) + '[]' + value.substring(start);
        onChange(newValue);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1;
          }
        }, 0);
      } else if (e.key === '{') {
        e.preventDefault();
        const start = e.currentTarget.selectionStart;
        const newValue = value.substring(0, start) + '{}' + value.substring(start);
        onChange(newValue);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1;
          }
        }, 0);
      }
    }
  };

  const downloadCode = () => {
    const language = SUPPORTED_LANGUAGES.find(l => l.value === selectedLanguage);
    const extension = language?.extension || '.txt';
    const filename = `code${extension}`;
    
    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Code Downloaded",
      description: `Your code has been saved as ${filename}`,
    });
  };

  const uploadCode = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.py,.js,.java,.cpp,.cs,.php,.rb,.go,.rs,.swift,.txt';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          onChange(content);
          toast({
            title: "Code Uploaded",
            description: `Successfully loaded ${file.name}`,
          });
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const getLineNumbers = () => {
    const lines = value.split('\n');
    return lines.map((_, index) => index + 1).join('\n');
  };

  // Removed syntax highlighting to fix visual duplication issues
  const getHighlightedCode = () => {
    return value;
  };

  return (
    <Card className={`${className} ${isFullscreen ? 'fixed inset-0 z-50 m-4' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Enhanced Code Editor
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map(lang => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Action Buttons */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLineNumbers(!showLineNumbers)}
              title="Toggle line numbers"
            >
              {showLineNumbers ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => insertTemplate('basic')}
            disabled={readOnly}
          >
            Basic Template
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => insertTemplate('with_input')}
            disabled={readOnly}
          >
            Input Template
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={uploadCode}
            disabled={readOnly}
          >
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCode}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          
          {onReset && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              disabled={readOnly}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
          
          {onRun && (
            <Button
              onClick={onRun}
              disabled={readOnly || syntaxErrors.length > 0}
              className="ml-auto"
            >
              <Play className="h-4 w-4 mr-1" />
              Run Code
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Syntax Errors */}
        {syntaxErrors.length > 0 && (
          <div className="bg-red-50 border-b border-red-200 p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-800">Syntax Errors & Suggestions</span>
            </div>
            <div className="space-y-1">
              {syntaxErrors.map((error, index) => (
                <div key={index} className="text-sm text-red-700 flex items-start gap-2">
                  <span>•</span>
                  <span>{error}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
              <div className="text-xs text-blue-800">
                <strong>💡 Tip:</strong> Common Python functions: <code className="bg-blue-100 px-1 rounded">input()</code>, <code className="bg-blue-100 px-1 rounded">print()</code>, <code className="bg-blue-100 px-1 rounded">len()</code>, <code className="bg-blue-100 px-1 rounded">str()</code>, <code className="bg-blue-100 px-1 rounded">int()</code>
              </div>
            </div>
          </div>
        )}
        
        {/* Code Editor */}
        <div className="relative">
          {showLineNumbers && (
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-50 border-r border-gray-200 text-xs text-gray-500 font-mono p-2 select-none overflow-hidden">
              <pre className="whitespace-pre-wrap">{getLineNumbers()}</pre>
            </div>
          )}
          
          <div className={`${showLineNumbers ? 'pl-12' : ''} relative`}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              readOnly={readOnly}
              className={`w-full min-h-[400px] p-4 font-mono text-sm border-0 outline-none resize-none ${
                theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
              }`}
              style={{ fontSize: `${fontSize}px` }}
            />
          </div>
        </div>
        
        {/* Status Bar */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 text-xs text-gray-600 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Language: {SUPPORTED_LANGUAGES.find(l => l.value === selectedLanguage)?.label}</span>
            <span>Lines: {value.split('\n').length}</span>
            <span>Characters: {value.length}</span>
            {syntaxErrors.length > 0 && (
              <span className="text-red-600">Errors: {syntaxErrors.length}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span>Font: {fontSize}px</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFontSize(Math.max(10, fontSize - 1))}
              className="h-6 w-6 p-0"
            >
              -
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFontSize(Math.min(24, fontSize + 1))}
              className="h-6 w-6 p-0"
            >
              +
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 