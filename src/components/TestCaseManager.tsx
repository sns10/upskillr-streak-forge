import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TestCase {
  id?: string;
  input_data: string;
  expected_output: string;
  is_hidden: boolean;
  points: number;
  description?: string;
}

interface TestCaseManagerProps {
  testCases: TestCase[];
  onTestCasesChange: (testCases: TestCase[]) => void;
}

const TestCaseManager = ({ testCases, onTestCasesChange }: TestCaseManagerProps) => {
  const { toast } = useToast();

  const addTestCase = () => {
    const newTestCase: TestCase = {
      input_data: '',
      expected_output: '',
      is_hidden: false,
      points: 1,
      description: ''
    };
    onTestCasesChange([...testCases, newTestCase]);
  };

  const updateTestCase = (index: number, field: keyof TestCase, value: any) => {
    const updated = [...testCases];
    updated[index] = { ...updated[index], [field]: value };
    onTestCasesChange(updated);
  };

  const removeTestCase = (index: number) => {
    onTestCasesChange(testCases.filter((_, i) => i !== index));
  };

  const validateTestCases = () => {
    if (testCases.length === 0) {
      toast({
        title: "No Test Cases",
        description: "Please add at least one test case for coding assignments.",
        variant: "destructive",
      });
      return false;
    }

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      if (!testCase.input_data.trim() || !testCase.expected_output.trim()) {
        toast({
          title: "Incomplete Test Case",
          description: `Test case ${i + 1} is missing input or expected output.`,
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Test Cases
          <Button onClick={addTestCase} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Test Case
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {testCases.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No test cases added yet. Click "Add Test Case" to get started.
          </p>
        ) : (
          testCases.map((testCase, index) => (
            <Card key={index} className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold">Test Case {index + 1}</h4>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={testCase.is_hidden}
                        onCheckedChange={(checked) => 
                          updateTestCase(index, 'is_hidden', checked as boolean)
                        }
                      />
                      <Label className="text-sm flex items-center space-x-1">
                        {testCase.is_hidden ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                        <span>{testCase.is_hidden ? 'Hidden' : 'Visible'}</span>
                      </Label>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeTestCase(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor={`description-${index}`}>Description (Optional)</Label>
                  <Input
                    id={`description-${index}`}
                    value={testCase.description || ''}
                    onChange={(e) => updateTestCase(index, 'description', e.target.value)}
                    placeholder="Brief description of this test case"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`input-${index}`}>Input Data</Label>
                    <Textarea
                      id={`input-${index}`}
                      value={testCase.input_data}
                      onChange={(e) => updateTestCase(index, 'input_data', e.target.value)}
                      placeholder="Enter input data"
                      rows={3}
                      className="font-mono text-sm"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`output-${index}`}>Expected Output</Label>
                    <Textarea
                      id={`output-${index}`}
                      value={testCase.expected_output}
                      onChange={(e) => updateTestCase(index, 'expected_output', e.target.value)}
                      placeholder="Enter expected output"
                      rows={3}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="w-24">
                  <Label htmlFor={`points-${index}`}>Points</Label>
                  <Input
                    id={`points-${index}`}
                    type="number"
                    min="1"
                    max="100"
                    value={testCase.points}
                    onChange={(e) => updateTestCase(index, 'points', parseInt(e.target.value) || 1)}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
        
        {testCases.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              Total Points: {testCases.reduce((sum, tc) => sum + tc.points, 0)} | 
              Visible Tests: {testCases.filter(tc => !tc.is_hidden).length} | 
              Hidden Tests: {testCases.filter(tc => tc.is_hidden).length}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestCaseManager;