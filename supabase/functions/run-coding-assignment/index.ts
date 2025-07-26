import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TestCase {
  input: any;
  expected: any;
}

interface TestResult {
  testCaseIndex: number;
  input: any;
  expected: any;
  actual: any;
  passed: boolean;
  error?: string;
  executionTime?: number;
}

async function executePythonCodeSecurely(code: string, testInput: any): Promise<{ result: any; error?: string; executionTime: number }> {
  const startTime = Date.now();
  
  try {
    // Check for common typos first
    if (code.includes('inpu(') && !code.includes('input(')) {
      return {
        result: null,
        error: 'Syntax Error: Did you mean "input(" instead of "inpu("?',
        executionTime: Date.now() - startTime
      };
    }
    
    if (code.includes('prin(') && !code.includes('print(')) {
      return {
        result: null,
        error: 'Syntax Error: Did you mean "print(" instead of "prin("?',
        executionTime: Date.now() - startTime
      };
    }
    
    // Prepare the Python code with input handling
    let executionCode = '';
    
    // Handle multiple inputs properly
    let inputs: string[] = [];
    if (typeof testInput === 'string') {
      // If it's a string with newlines, split it into multiple inputs
      if (testInput.includes('\n')) {
        inputs = testInput.split('\n');
      } else {
        inputs = [testInput];
      }
    } else if (Array.isArray(testInput)) {
      inputs = testInput.map(input => String(input));
    } else {
      inputs = [String(testInput)];
    }
    
    // Count how many input() calls the code has
    const inputCallMatches = code.match(/input\s*\(\s*\)/g);
    const inputCallCount = inputCallMatches ? inputCallMatches.length : 0;
    
    console.log(`Code has ${inputCallCount} input() calls, test has ${inputs.length} inputs`);
    
    if (inputCallCount > 0) {
      // Handle multiple input() calls
      if (inputCallCount === inputs.length) {
        // Perfect match - replace each input() call with corresponding input
        let modifiedCode = code;
        for (let i = 0; i < inputCallCount; i++) {
          const inputValue = inputs[i] || '';
          // Replace the i-th input() call
          modifiedCode = modifiedCode.replace(/input\s*\(\s*\)/, `"${inputValue}"`);
        }
        executionCode = modifiedCode;
      } else if (inputs.length === 1 && inputCallCount > 1) {
        // Single input but multiple input() calls - split the input
        const singleInput = inputs[0];
        const splitInputs = singleInput.split('\n');
        
        let modifiedCode = code;
        for (let i = 0; i < inputCallCount; i++) {
          const inputValue = splitInputs[i] || '';
          modifiedCode = modifiedCode.replace(/input\s*\(\s*\)/, `"${inputValue}"`);
        }
        executionCode = modifiedCode;
      } else {
        // Mismatch - use the first input for all calls
        let modifiedCode = code;
        const inputValue = inputs[0] || '';
        modifiedCode = modifiedCode.replace(/input\s*\(\s*\)/g, `"${inputValue}"`);
        executionCode = modifiedCode;
      }
    } else {
      // No input() calls - check if the code contains a function definition
      const hasFunction = /def\s+(solve|main)\s*\(/i.test(code);
      
      if (hasFunction) {
        // Function-based code - execute function with input
        const functionMatch = code.match(/def\s+(solve|main)\s*\(/i);
        const functionName = functionMatch ? functionMatch[1] : 'solve';
        
        // Join inputs with newlines for function input
        const functionInput = inputs.join('\n');
        executionCode = `${code}\n\n# Execute function with test input\nresult = ${functionName}("${functionInput}")\nprint(result)`;
      } else {
        // Script-based code - make input available as variable
        const scriptInput = inputs.join('\n');
        executionCode = `# Test input\ninput_value = "${scriptInput}"\n\n${code}`;
      }
    }

    // Use Judge0 API for secure Python execution
    const judge0Response = await fetch('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': Deno.env.get('JUDGE0_API_KEY') || 'demo-key',
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      },
      body: JSON.stringify({
        language_id: 71, // Python 3
        source_code: executionCode,
        stdin: inputs.join('\n')
      })
    });

    if (!judge0Response.ok) {
      throw new Error(`Judge0 API error: ${judge0Response.status}`);
    }

    const judge0Result = await judge0Response.json();
    const executionTime = Date.now() - startTime;

    // Check for compilation or runtime errors
    if (judge0Result.status.id === 6) { // Compilation Error
      return {
        result: null,
        error: judge0Result.compile_output || 'Compilation error',
        executionTime
      };
    }
    
    if (judge0Result.status.id === 5) { // Time Limit Exceeded
      return {
        result: null,
        error: 'Time limit exceeded',
        executionTime
      };
    }

    if (judge0Result.status.id === 4) { // Wrong Answer (Runtime Error)
      return {
        result: null,
        error: judge0Result.stderr || 'Runtime error',
        executionTime
      };
    }

    // Success case
    if (judge0Result.status.id === 3) { // Accepted
      let output = judge0Result.stdout || '';
      
      // Remove trailing newline that print() automatically adds
      if (output.endsWith('\n')) {
        output = output.slice(0, -1);
      }
      
      return {
        result: output,
        executionTime
      };
    }

    // Unknown status
    return {
      result: null,
      error: `Execution failed with status: ${judge0Result.status.description}`,
      executionTime
    };

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('Python execution error:', error);
    
    return {
      result: null,
      error: error.message || 'Python execution failed',
      executionTime
    };
  }
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userCode, assignmentId } = await req.json();

    if (!userCode || !assignmentId) {
      return new Response(
        JSON.stringify({ error: 'Missing userCode or assignmentId' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Executing code for assignment: ${assignmentId}`);

    // Fetch the coding assignment from the database
    const { data: assignment, error: fetchError } = await supabase
      .from('coding_assignments')
      .select('test_cases, test_inputs, test_outputs')
      .eq('id', assignmentId)
      .single();

    if (fetchError || !assignment) {
      console.error('Error fetching assignment:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Assignment not found' }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse test cases - support both old and new formats
    let testCases: TestCase[] = [];
    try {
      // Check if new format exists (test_inputs and test_outputs)
      if (assignment.test_inputs && assignment.test_outputs && 
          Array.isArray(assignment.test_inputs) && Array.isArray(assignment.test_outputs) &&
          assignment.test_inputs.length > 0) {
        // New format: separate inputs and outputs arrays
        const inputs = assignment.test_inputs;
        const outputs = assignment.test_outputs;
        
        if (inputs.length !== outputs.length) {
          throw new Error('Mismatch between test inputs and outputs count');
        }
        
        testCases = inputs.map((input: any, index: number) => ({
          input: input,
          expected: outputs[index]
        }));
      } else if (assignment.test_cases) {
        // Old format: array of objects with input and expected
        if (typeof assignment.test_cases === 'string') {
          testCases = JSON.parse(assignment.test_cases);
        } else {
          testCases = assignment.test_cases as TestCase[];
        }
      } else {
        throw new Error('No test cases found');
      }
    } catch (parseError) {
      console.error('Error parsing test cases:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid test cases format: ' + parseError.message }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!Array.isArray(testCases) || testCases.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No test cases found' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Running ${testCases.length} test cases`);

    // Execute user code against each test case
    const results: TestResult[] = [];
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`Executing test case ${i + 1}/${testCases.length}`);
      
      const { result: actual, error, executionTime } = await executePythonCodeSecurely(userCode, testCase.input);
      
      console.log(`Test case ${i + 1}: Expected: ${JSON.stringify(testCase.expected)}, Actual: ${JSON.stringify(actual)}`);
      
      // Trim both actual and expected outputs to remove whitespace differences
      const trimmedActual = actual ? actual.toString().trim() : '';
      const trimmedExpected = testCase.expected ? testCase.expected.toString().trim() : '';
      
      console.log(`After trim - Expected: "${trimmedExpected}", Actual: "${trimmedActual}"`);
      
      const testResult: TestResult = {
        testCaseIndex: i,
        input: testCase.input,
        expected: testCase.expected,
        actual: actual,
        passed: !error && trimmedActual === trimmedExpected,
        executionTime
      };

      if (error) {
        testResult.error = error;
        testResult.passed = false;
      }

      results.push(testResult);
    }

    const passedCount = results.filter(r => r.passed).length;
    console.log(`Execution complete: ${passedCount}/${results.length} tests passed`);

    return new Response(
      JSON.stringify({ 
        results,
        summary: {
          total: results.length,
          passed: passedCount,
          failed: results.length - passedCount
        }
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in run-coding-assignment function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
