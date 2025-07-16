import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Play, Clock, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

interface TestCase {
  id: string;
  input_data: string;
  expected_output: string;
  is_hidden: boolean;
  points: number;
  description?: string;
}

interface CodingAssignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  assignment_type: 'coding';
  programming_language: string;
  starter_code?: string;
  template_code?: string;
  due_date?: string;
  xp_reward: number;
  test_cases?: TestCase[];
}

interface CodingSubmission {
  id: string;
  text_submission?: string;
  submitted_at: string;
  grade?: number;
  feedback?: string;
  status: string;
  test_results?: any;
  passed_tests?: number;
  total_tests?: number;
  auto_grade?: number;
}

interface CodingAssignmentPlayerProps {
  assignment: CodingAssignment;
  submission?: CodingSubmission | null;
  testCases: TestCase[];
  onSubmit: (code: string) => void;
  isSubmitting: boolean;
}

const CodingAssignmentPlayer = ({ 
  assignment, 
  submission, 
  testCases,
  onSubmit, 
  isSubmitting 
}: CodingAssignmentPlayerProps) => {
  const [code, setCode] = useState(submission?.text_submission || assignment.starter_code || '');
  const [isDeadlineExceeded, setIsDeadlineExceeded] = useState(false);
  const { toast } = useToast();

  // Check deadline
  useEffect(() => {
    if (assignment.due_date) {
      const deadline = new Date(assignment.due_date);
      const now = new Date();
      setIsDeadlineExceeded(now > deadline);
    }
  }, [assignment.due_date]);

  // Get language extension for CodeMirror
  const getLanguageExtension = () => {
    switch (assignment.programming_language) {
      case 'python':
        return python();
      case 'javascript':
        return javascript();
      default:
        return python();
    }
  };

  const handleSubmit = () => {
    if (!code.trim()) {
      toast({
        title: "No Code",
        description: "Please write some code before submitting.",
        variant: "destructive",
      });
      return;
    }

    onSubmit(code);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-500';
      case 'graded': return 'bg-green-500';
      case 'returned': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const visibleTestCases = testCases.filter(tc => !tc.is_hidden);

  return (
    <div className="space-y-6">
      {/* Assignment Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <span>{assignment.title}</span>
              <Badge variant="secondary">
                {assignment.programming_language.toUpperCase()}
              </Badge>
            </CardTitle>
            {assignment.due_date && (
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4" />
                <span className={isDeadlineExceeded ? 'text-red-500 font-semibold' : ''}>
                  Due: {formatDateTime(assignment.due_date)}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {assignment.description && (
            <p className="text-muted-foreground mb-4">{assignment.description}</p>
          )}
          <div className="prose max-w-none">
            <h4 className="font-semibold mb-2">Problem Statement:</h4>
            <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
              {assignment.instructions}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Cases (Visible ones only) */}
      {visibleTestCases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              Sample Test Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {visibleTestCases.map((testCase, index) => (
                <div key={testCase.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">
                    Test Case {index + 1}
                    {testCase.description && ` - ${testCase.description}`}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Input:</Label>
                      <pre className="bg-muted p-2 rounded text-sm font-mono mt-1">
                        {testCase.input_data}
                      </pre>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Expected Output:</Label>
                      <pre className="bg-muted p-2 rounded text-sm font-mono mt-1">
                        {testCase.expected_output}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submission Status */}
      {submission && (
        <Card>
          <CardHeader>
            <CardTitle>Submission Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(submission.status)}>
                  {submission.status.toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Submitted: {formatDateTime(submission.submitted_at)}
                </span>
              </div>
              {submission.total_tests && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm">
                    Tests: {submission.passed_tests}/{submission.total_tests}
                  </span>
                  {submission.passed_tests === submission.total_tests ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              )}
            </div>

            {submission.auto_grade !== undefined && (
              <div className="mb-4">
                <p className="text-sm">
                  <strong>Auto Grade:</strong> {submission.auto_grade}%
                </p>
              </div>
            )}

            {submission.grade !== undefined && (
              <div className="mb-4">
                <p className="text-sm">
                  <strong>Final Grade:</strong> {submission.grade}/100
                </p>
              </div>
            )}

            {submission.feedback && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Feedback:</p>
                <p className="text-sm">{submission.feedback}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Code Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Code Editor</CardTitle>
        </CardHeader>
        <CardContent>
          {isDeadlineExceeded && !submission ? (
            <div className="text-center py-8">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-500 mb-2">Deadline Exceeded</h3>
              <p className="text-muted-foreground">
                The submission deadline has passed. You can no longer submit this assignment.
              </p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <CodeMirror
                  value={code}
                  onChange={setCode}
                  extensions={[getLanguageExtension()]}
                  theme={oneDark}
                  editable={!submission || submission.status === 'returned'}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    dropCursor: false,
                    allowMultipleSelections: false,
                  }}
                />
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-muted-foreground">
                  {assignment.programming_language.charAt(0).toUpperCase() + 
                   assignment.programming_language.slice(1)} Code Editor
                </p>
                
                {(!submission || submission.status === 'returned') && (
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting || !code.trim()}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Submitting...' : 'Submit Solution'}
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CodingAssignmentPlayer;