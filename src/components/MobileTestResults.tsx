
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Clock } from "lucide-react";

interface TestResult {
  testCaseIndex: number;
  input: any;
  expected: any;
  actual: any;
  passed: boolean;
  error?: string;
  executionTime?: number;
}

interface MobileTestResultsProps {
  testResults: TestResult[];
  testCases: any[];
}

export const MobileTestResults = ({ testResults, testCases }: MobileTestResultsProps) => {
  const [expandedTests, setExpandedTests] = useState<Set<number>>(new Set());
  
  const toggleTest = (index: number) => {
    const newExpanded = new Set(expandedTests);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedTests(newExpanded);
  };

  const hasResults = testResults.length > 0;
  const passedCount = testResults.filter(r => r.passed).length;
  const totalCount = testResults.length;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Test Results</span>
          {hasResults && (
            <Badge variant={passedCount === totalCount ? "default" : "destructive"}>
              {passedCount}/{totalCount} Passed
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {hasResults ? (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-muted rounded-lg text-center">
              <div>
                <div className="text-sm font-medium text-green-600">{passedCount}</div>
                <div className="text-xs text-muted-foreground">Passed</div>
              </div>
              <div>
                <div className="text-sm font-medium text-red-600">{totalCount - passedCount}</div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
              <div>
                <div className="text-sm font-medium">{totalCount}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>

            {/* Individual Test Results */}
            {testResults.map((result, index) => (
              <Card key={index} className={`border ${
                result.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}>
                <Collapsible
                  open={expandedTests.has(index)}
                  onOpenChange={() => toggleTest(index)}
                >
                  <CollapsibleTrigger className="w-full p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {result.passed ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm font-medium">
                          Test {result.testCaseIndex + 1}
                        </span>
                        {result.executionTime && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {result.executionTime}ms
                          </Badge>
                        )}
                      </div>
                      {expandedTests.has(index) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="px-3 pb-3">
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="font-medium text-gray-600 mb-1">Input:</div>
                        <div className="bg-white p-2 rounded border font-mono overflow-x-auto">
                          {JSON.stringify(result.input)}
                        </div>
                      </div>
                      
                      <div>
                        <div className="font-medium text-gray-600 mb-1">Expected:</div>
                        <div className="bg-white p-2 rounded border font-mono overflow-x-auto">
                          {JSON.stringify(result.expected)}
                        </div>
                      </div>
                      
                      <div>
                        <div className="font-medium text-gray-600 mb-1">Your Output:</div>
                        <div className={`p-2 rounded border font-mono overflow-x-auto ${
                          result.passed ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'
                        }`}>
                          {result.error 
                            ? `Error: ${result.error}`
                            : JSON.stringify(result.actual)
                          }
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </>
        ) : (
          /* Test Cases Preview */
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-800 font-medium text-sm">Test Cases Preview</p>
              <p className="text-blue-600 text-xs">Write your code and run tests to see results</p>
            </div>
            
            {testCases.map((testCase, index) => (
              <Card key={index} className="border-gray-200">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Test Case {index + 1}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-medium text-gray-600">Input: </span>
                      <div className="bg-gray-100 p-2 rounded font-mono overflow-x-auto mt-1">
                        {JSON.stringify(testCase.input)}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Expected: </span>
                      <div className="bg-gray-100 p-2 rounded font-mono overflow-x-auto mt-1">
                        {JSON.stringify(testCase.expected)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
