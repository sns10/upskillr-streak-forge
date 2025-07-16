import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionId, code, assignmentId, language } = await req.json();

    if (!submissionId || !code || !assignmentId || !language) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get test cases for the assignment
    const { data: testCases, error: testCasesError } = await supabase
      .from('test_cases')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('created_at');

    if (testCasesError) {
      console.error('Error fetching test cases:', testCasesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch test cases' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!testCases || testCases.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No test cases found for this assignment' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simulate running test cases (in a real implementation, you'd use a code execution service)
    const testResults = await runTestCases(code, testCases, language);
    
    const totalTests = testCases.length;
    const passedTests = testResults.filter(result => result.passed).length;
    const autoGrade = Math.round((passedTests / totalTests) * 100);

    // Update the submission with test results
    const { error: updateError } = await supabase
      .from('assignment_submissions')
      .update({
        test_results: testResults,
        passed_tests: passedTests,
        total_tests: totalTests,
        auto_grade: autoGrade
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Error updating submission:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update submission' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        testResults,
        passedTests,
        totalTests,
        autoGrade
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in run-code-tests function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Simulate code execution and testing
async function runTestCases(code: string, testCases: any[], language: string) {
  const results = [];

  for (const testCase of testCases) {
    try {
      // In a real implementation, you would:
      // 1. Execute the code in a sandboxed environment
      // 2. Pass the input_data to the code
      // 3. Capture the output
      // 4. Compare with expected_output
      
      // For this simulation, we'll do simple string matching
      const mockOutput = simulateCodeExecution(code, testCase.input_data, language);
      const passed = mockOutput.trim() === testCase.expected_output.trim();
      
      results.push({
        testCaseId: testCase.id,
        input: testCase.input_data,
        expectedOutput: testCase.expected_output,
        actualOutput: mockOutput,
        passed,
        points: passed ? testCase.points : 0,
        maxPoints: testCase.points,
        executionTime: Math.random() * 1000, // Mock execution time
        isHidden: testCase.is_hidden
      });
    } catch (error) {
      results.push({
        testCaseId: testCase.id,
        input: testCase.input_data,
        expectedOutput: testCase.expected_output,
        actualOutput: `Error: ${error.message}`,
        passed: false,
        points: 0,
        maxPoints: testCase.points,
        executionTime: 0,
        isHidden: testCase.is_hidden,
        error: error.message
      });
    }
  }

  return results;
}

// Mock code execution (replace with actual code execution service)
function simulateCodeExecution(code: string, input: string, language: string): string {
  // This is a simplified simulation
  // In a real implementation, you would use services like:
  // - Judge0 API
  // - HackerEarth API
  // - Custom Docker containers
  // - Cloud Functions with code execution capabilities
  
  try {
    // Simple pattern matching for demo purposes
    if (code.includes('print') && language === 'python') {
      // Extract what's being printed (very basic parsing)
      const printMatch = code.match(/print\(['"](.*?)['"]\)/);
      if (printMatch) {
        return printMatch[1];
      }
    }
    
    if (code.includes('console.log') && language === 'javascript') {
      const logMatch = code.match(/console\.log\(['"](.*?)['"]\)/);
      if (logMatch) {
        return logMatch[1];
      }
    }
    
    // For more complex cases, return a mock result
    if (input && input.trim()) {
      return `Output for input: ${input}`;
    }
    
    return "Mock output";
  } catch (error) {
    throw new Error(`Execution failed: ${error.message}`);
  }
}