import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TestCaseManager from './TestCaseManager';

interface TestCase {
  id?: string;
  input_data: string;
  expected_output: string;
  is_hidden: boolean;
  points: number;
  description?: string;
}

interface CreateCodingAssignmentData {
  lesson_id: string;
  title: string;
  description: string;
  instructions: string;
  assignment_type: 'coding';
  programming_language: string;
  starter_code?: string;
  template_code?: string;
  due_date?: string;
  xp_reward: number;
  test_cases: TestCase[];
}

interface CodingAssignmentCreatorProps {
  lessonId: string;
  onSave: (assignmentData: CreateCodingAssignmentData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const CodingAssignmentCreator = ({ lessonId, onSave, onCancel, isLoading }: CodingAssignmentCreatorProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [programmingLanguage, setProgrammingLanguage] = useState('python');
  const [starterCode, setStarterCode] = useState('');
  const [templateCode, setTemplateCode] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [xpReward, setXpReward] = useState(150);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const { toast } = useToast();

  const supportedLanguages = [
    { value: 'python', label: 'Python' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' }
  ];

  const getDefaultStarterCode = (language: string) => {
    switch (language) {
      case 'python':
        return '# Write your solution here\ndef solve():\n    pass\n\n# Test your solution\nif __name__ == "__main__":\n    print(solve())';
      case 'javascript':
        return '// Write your solution here\nfunction solve() {\n    // Your code here\n}\n\n// Test your solution\nconsole.log(solve());';
      case 'java':
        return 'public class Solution {\n    public static void solve() {\n        // Your code here\n    }\n    \n    public static void main(String[] args) {\n        System.out.println(solve());\n    }\n}';
      case 'cpp':
        return '#include <iostream>\nusing namespace std;\n\nint solve() {\n    // Your code here\n    return 0;\n}\n\nint main() {\n    cout << solve() << endl;\n    return 0;\n}';
      case 'c':
        return '#include <stdio.h>\n\nint solve() {\n    // Your code here\n    return 0;\n}\n\nint main() {\n    printf("%d\\n", solve());\n    return 0;\n}';
      default:
        return '';
    }
  };

  const handleLanguageChange = (language: string) => {
    setProgrammingLanguage(language);
    if (!starterCode) {
      setStarterCode(getDefaultStarterCode(language));
    }
  };

  const validateAssignment = () => {
    if (!title.trim()) {
      throw new Error('Assignment title is required');
    }
    if (!instructions.trim()) {
      throw new Error('Assignment instructions are required');
    }
    if (!programmingLanguage) {
      throw new Error('Programming language is required');
    }
    if (testCases.length === 0) {
      throw new Error('At least one test case is required');
    }
    if (xpReward < 0) {
      throw new Error('XP reward must be a positive number');
    }

    // Validate test cases
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      if (!testCase.input_data.trim() || !testCase.expected_output.trim()) {
        throw new Error(`Test case ${i + 1} is missing input or expected output`);
      }
    }
  };

  const handleSave = () => {
    try {
      validateAssignment();
      
      const assignmentData: CreateCodingAssignmentData = {
        lesson_id: lessonId,
        title,
        description,
        instructions,
        assignment_type: 'coding',
        programming_language: programmingLanguage,
        starter_code: starterCode || undefined,
        template_code: templateCode || undefined,
        xp_reward: xpReward,
        test_cases: testCases,
        ...(dueDate && { due_date: new Date(dueDate).toISOString() })
      };

      onSave(assignmentData);
    } catch (error) {
      toast({
        title: "Validation Error",
        description: error instanceof Error ? error.message : "Please check your assignment details",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Coding Assignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="assignment-title">Assignment Title *</Label>
            <Input
              id="assignment-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter coding assignment title"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="assignment-description">Description</Label>
            <Textarea
              id="assignment-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the coding assignment"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="assignment-instructions">Problem Statement *</Label>
            <Textarea
              id="assignment-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Detailed problem statement with input/output format, constraints, and examples"
              rows={8}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="programming-language">Programming Language *</Label>
              <Select value={programmingLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select programming language" />
                </SelectTrigger>
                <SelectContent>
                  {supportedLanguages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="xp-reward">XP Reward</Label>
              <Input
                id="xp-reward"
                type="number"
                value={xpReward}
                onChange={(e) => setXpReward(parseInt(e.target.value) || 0)}
                min="0"
                max="1000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="due-date">Due Date (Optional)</Label>
            <Input
              id="due-date"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Code Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="starter-code">Starter Code (Optional)</Label>
            <Textarea
              id="starter-code"
              value={starterCode}
              onChange={(e) => setStarterCode(e.target.value)}
              placeholder="Initial code that students will start with"
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          <div>
            <Label htmlFor="template-code">Solution Template (Optional)</Label>
            <Textarea
              id="template-code"
              value={templateCode}
              onChange={(e) => setTemplateCode(e.target.value)}
              placeholder="Template or example solution for reference"
              rows={6}
              className="font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <TestCaseManager 
        testCases={testCases} 
        onTestCasesChange={setTestCases} 
      />

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Creating...' : 'Create Coding Assignment'}
        </Button>
      </div>
    </div>
  );
};

export default CodingAssignmentCreator;