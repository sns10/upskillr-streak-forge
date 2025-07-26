import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/AdminLayout";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Loader2, X } from "lucide-react";

interface Assignment {
  id: string;
  lesson_id: string;
  problem_statement: string;
  test_inputs: any[];
  test_outputs: any[];
  created_at: string;
  lessons?: { 
    title: string;
    courses?: { title: string };
  };
}

interface Lesson {
  id: string;
  title: string;
  lesson_type: string;
  courses?: { title: string };
}

interface TestCase {
  inputs: string[];  // Changed from single input to array of inputs
  output: string;
}

export const AdminAssignments = () => {
  const { user, isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState({
    lesson_id: "",
    problem_statement: "",
  });
  const [testCases, setTestCases] = useState<TestCase[]>([{ inputs: [""], output: "" }]);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      fetchAssignments();
      fetchLessons();
    }
  }, [loading, user, isAdmin]);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('coding_assignments')
        .select(`
          *,
          lessons(
            title,
            courses(title)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to ensure test_inputs and test_outputs are arrays
      const transformedData = data?.map(assignment => ({
        ...assignment,
        test_inputs: Array.isArray(assignment.test_inputs) ? assignment.test_inputs : [],
        test_outputs: Array.isArray(assignment.test_outputs) ? assignment.test_outputs : []
      })) || [];
      
      setAssignments(transformedData);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch assignments",
        variant: "destructive",
      });
    } finally {
      setLoadingAssignments(false);
    }
  };

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          lesson_type,
          courses(title)
        `)
        .eq('lesson_type', 'coding')
        .order('title');

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate test cases
      const validTestCases = testCases.filter(tc => 
        tc.inputs.some(input => input.trim()) && tc.output.trim()
      );
      if (validTestCases.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one test case with inputs and output",
          variant: "destructive",
        });
        return;
      }

      // Convert inputs to the format expected by the test runner
      // For multiple inputs, we'll join them with newlines
      const testInputs = validTestCases.map(tc => {
        const cleanInputs = tc.inputs.filter(input => input.trim());
        if (cleanInputs.length === 1) {
          // Single input - return as is
          try {
            return JSON.parse(cleanInputs[0]);
          } catch {
            return cleanInputs[0];
          }
        } else {
          // Multiple inputs - join with newlines
          const joinedInputs = cleanInputs.join('\n');
          try {
            return JSON.parse(joinedInputs);
          } catch {
            return joinedInputs;
          }
        }
      });

      const testOutputs = validTestCases.map(tc => {
        try {
          return JSON.parse(tc.output);
        } catch {
          return tc.output;
        }
      });

      const submissionData = {
        lesson_id: formData.lesson_id,
        problem_statement: formData.problem_statement,
        test_inputs: testInputs,
        test_outputs: testOutputs,
      };

      if (editingAssignment) {
        const { error } = await supabase
          .from('coding_assignments')
          .update(submissionData)
          .eq('id', editingAssignment.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Assignment updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('coding_assignments')
          .insert([submissionData]);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Assignment created successfully",
        });
      }
      
      setIsDialogOpen(false);
      setEditingAssignment(null);
      resetForm();
      fetchAssignments();
    } catch (error) {
      console.error('Error saving assignment:', error);
      toast({
        title: "Error",
        description: "Failed to save assignment",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      lesson_id: assignment.lesson_id,
      problem_statement: assignment.problem_statement,
    });
    
    // Convert test_inputs and test_outputs back to test cases format
    const convertedTestCases = assignment.test_inputs.map((input, index) => {
      let inputValue = input;
      if (typeof input === 'string' && input.includes('\n')) {
        // Split by newlines to get multiple inputs
        inputValue = input.split('\n');
      } else {
        // Single input
        inputValue = [typeof input === 'string' ? input : JSON.stringify(input)];
      }
      
      return {
        inputs: Array.isArray(inputValue) ? inputValue : [inputValue],
        output: typeof assignment.test_outputs[index] === 'string' 
          ? assignment.test_outputs[index] 
          : JSON.stringify(assignment.test_outputs[index])
      };
    });
    
    setTestCases(convertedTestCases.length > 0 ? convertedTestCases : [{ inputs: [""], output: "" }]);
    setIsDialogOpen(true);
  };

  const handleDelete = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    
    try {
      const { error } = await supabase
        .from('coding_assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Assignment deleted successfully",
      });
      fetchAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast({
        title: "Error",
        description: "Failed to delete assignment",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      lesson_id: "",
      problem_statement: "",
    });
    setTestCases([{ inputs: [""], output: "" }]);
    setEditingAssignment(null);
  };

  const addTestCase = () => {
    setTestCases([...testCases, { inputs: [""], output: "" }]);
  };

  const removeTestCase = (index: number) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((_, i) => i !== index));
    }
  };

  const updateTestCaseOutput = (index: number, value: string) => {
    const updated = [...testCases];
    updated[index].output = value;
    setTestCases(updated);
  };

  const addInputField = (testCaseIndex: number) => {
    const updated = [...testCases];
    updated[testCaseIndex].inputs.push("");
    setTestCases(updated);
  };

  const removeInputField = (testCaseIndex: number, inputIndex: number) => {
    const updated = [...testCases];
    if (updated[testCaseIndex].inputs.length > 1) {
      updated[testCaseIndex].inputs.splice(inputIndex, 1);
      setTestCases(updated);
    }
  };

  const updateInputField = (testCaseIndex: number, inputIndex: number, value: string) => {
    const updated = [...testCases];
    updated[testCaseIndex].inputs[inputIndex] = value;
    setTestCases(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Coding Assignments</h1>
            <p className="text-gray-600">Manage coding challenges and test cases</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAssignment ? "Edit Assignment" : "Create New Assignment"}
                </DialogTitle>
                <DialogDescription>
                  {editingAssignment ? "Update assignment details" : "Add a new coding challenge"}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="lesson_id">Lesson</Label>
                  <Select value={formData.lesson_id} onValueChange={(value) => setFormData({ ...formData, lesson_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a coding lesson" />
                    </SelectTrigger>
                    <SelectContent>
                      {lessons.map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id}>
                          {lesson.courses?.title} - {lesson.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="problem_statement">Problem Statement</Label>
                  <Textarea
                    id="problem_statement"
                    value={formData.problem_statement}
                    onChange={(e) => setFormData({ ...formData, problem_statement: e.target.value })}
                    rows={6}
                    required
                    placeholder="Describe the coding challenge...

Example:
Write a program that reads two words and prints the resultant word by joining the two words.

Input: The first line of input contains a string. The second line of input contains a string.
Output: The output should be a single line containing a string obtained by joining the two words.

Example: If the input words are 'Milk' and 'shake', the expected output is 'Milkshake'."
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Test Cases</Label>
                    <Button type="button" onClick={addTestCase} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Test Case
                    </Button>
                  </div>
                  
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <div className="font-medium mb-1">💡 Multiple Inputs Support:</div>
                      <div>• For single input: Use one input field</div>
                      <div>• For multiple inputs (like "milk" and "shake"): Add multiple input fields</div>
                      <div>• The system will automatically combine them with newlines for testing</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {testCases.map((testCase, testCaseIndex) => (
                      <div key={testCaseIndex} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Test Case {testCaseIndex + 1}</h4>
                          {testCases.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeTestCase(testCaseIndex)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          {/* Input Fields */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <Label>Inputs</Label>
                              <Button 
                                type="button" 
                                onClick={() => addInputField(testCaseIndex)} 
                                variant="outline" 
                                size="sm"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Input
                              </Button>
                            </div>
                            
                            <div className="space-y-2">
                              {testCase.inputs.map((input, inputIndex) => (
                                <div key={inputIndex} className="flex gap-2">
                                  <Textarea
                                    value={input}
                                    onChange={(e) => updateInputField(testCaseIndex, inputIndex, e.target.value)}
                                    rows={2}
                                    placeholder={`Input ${inputIndex + 1} (e.g., "hello" or [1, 2, 3])`}
                                    className="font-mono text-sm flex-1"
                                  />
                                  {testCase.inputs.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeInputField(testCaseIndex, inputIndex)}
                                      className="px-2"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Expected Output */}
                          <div>
                            <Label htmlFor={`output-${testCaseIndex}`}>Expected Output</Label>
                                                          <Textarea
                                id={`output-${testCaseIndex}`}
                                value={testCase.output}
                                onChange={(e) => updateTestCaseOutput(testCaseIndex, e.target.value)}
                                rows={3}
                                placeholder='Expected output (e.g., "HELLO" or 6)'
                                className="font-mono text-sm"
                              />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingAssignment ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Assignments</CardTitle>
            <CardDescription>Manage your coding challenges</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAssignments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lesson</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Problem Statement</TableHead>
                    <TableHead>Test Cases</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{assignment.lessons?.title}</TableCell>
                      <TableCell>{assignment.lessons?.courses?.title}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {assignment.problem_statement}
                      </TableCell>
                      <TableCell>{assignment.test_inputs.length} tests</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(assignment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(assignment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};
