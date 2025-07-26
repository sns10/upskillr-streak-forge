import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GradeRequest {
  quizId: string
  answers: Array<{
    questionId: string
    selectedAnswerId: string
  }>
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Grade quiz answers function called')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('User authenticated:', user.id)

    const { quizId, answers }: GradeRequest = await req.json()
    
    if (!quizId || !answers || !Array.isArray(answers)) {
      console.error('Invalid request data')
      return new Response(
        JSON.stringify({ error: 'Invalid request data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Grading quiz:', quizId, 'with', answers.length, 'answers')

    // Find or create quiz attempt
    let { data: existingAttempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', user.id)
      .eq('quiz_id', quizId)
      .eq('status', 'In Progress')
      .maybeSingle()

    if (attemptError) {
      console.error('Error finding quiz attempt:', attemptError)
      throw attemptError
    }

    let quizAttemptId: string

    if (!existingAttempt) {
      console.log('Creating new quiz attempt')
      // Create new attempt
      const { data: newAttempt, error: createError } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: quizId,
          score: 0,
          total_questions: 0,
          correct_answers: 0,
          status: 'In Progress',
          attempt_number: 1
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating quiz attempt:', createError)
        throw createError
      }
      
      quizAttemptId = newAttempt.id
    } else {
      quizAttemptId = existingAttempt.id
      console.log('Using existing quiz attempt:', quizAttemptId)
    }

    // Get correct answers for the submitted questions
    const questionIds = answers.map(a => a.questionId)
    const { data: correctAnswers, error: answersError } = await supabase
      .from('answers')
      .select('id, question_id, is_correct')
      .in('question_id', questionIds)
      .eq('is_correct', true)

    if (answersError) {
      console.error('Error fetching correct answers:', answersError)
      throw answersError
    }

    console.log('Found correct answers:', correctAnswers)

    // Grade each answer and prepare user answers
    const userAnswers = []
    const results = []

    for (const answer of answers) {
      const correctAnswer = correctAnswers?.find(ca => ca.question_id === answer.questionId)
      const isCorrect = correctAnswer?.id === answer.selectedAnswerId

      console.log(`Question ${answer.questionId}: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`)

      // Check if user answer already exists
      const { data: existingUserAnswer } = await supabase
        .from('user_answers')
        .select('id')
        .eq('quiz_attempt_id', quizAttemptId)
        .eq('question_id', answer.questionId)
        .maybeSingle()

      if (existingUserAnswer) {
        // Update existing answer
        await supabase
          .from('user_answers')
          .update({
            selected_answer_id: answer.selectedAnswerId,
            is_correct: isCorrect
          })
          .eq('id', existingUserAnswer.id)
      } else {
        // Create new user answer
        userAnswers.push({
          quiz_attempt_id: quizAttemptId,
          question_id: answer.questionId,
          selected_answer_id: answer.selectedAnswerId,
          is_correct: isCorrect
        })
      }

      results.push({
        questionId: answer.questionId,
        isCorrect,
        selectedAnswerId: answer.selectedAnswerId,
        correctAnswerId: correctAnswer?.id
      })
    }

    // Insert new user answers if any
    if (userAnswers.length > 0) {
      const { error: insertError } = await supabase
        .from('user_answers')
        .insert(userAnswers)

      if (insertError) {
        console.error('Error inserting user answers:', insertError)
        throw insertError
      }
    }

    // Get all questions for this quiz to check mastery
    const { data: allQuestions, error: questionsError } = await supabase
      .from('questions')
      .select('id')
      .eq('quiz_id', quizId)

    if (questionsError) {
      console.error('Error fetching all questions:', questionsError)
      throw questionsError
    }

    // Get all correct user answers for this attempt
    const { data: allCorrectAnswers, error: correctAnswersError } = await supabase
      .from('user_answers')
      .select('question_id')
      .eq('quiz_attempt_id', quizAttemptId)
      .eq('is_correct', true)

    if (correctAnswersError) {
      console.error('Error fetching correct user answers:', correctAnswersError)
      throw correctAnswersError
    }

    const totalQuestions = allQuestions?.length || 0
    const correctCount = allCorrectAnswers?.length || 0
    const isMastered = correctCount === totalQuestions && totalQuestions > 0

    console.log(`Progress: ${correctCount}/${totalQuestions} correct, Mastered: ${isMastered}`)

    // Check if this is the first time achieving mastery
    const wasAlreadyMastered = existingAttempt?.status === 'Mastered'
    const isFirstTimeMastery = isMastered && !wasAlreadyMastered

    console.log(`First time mastery: ${isFirstTimeMastery}`)

    // Update quiz attempt
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
    const status = isMastered ? 'Mastered' : 'In Progress'

    const { error: updateError } = await supabase
      .from('quiz_attempts')
      .update({
        score,
        total_questions: totalQuestions,
        correct_answers: correctCount,
        status,
        completed_at: isMastered ? new Date().toISOString() : existingAttempt?.completed_at
      })
      .eq('id', quizAttemptId)

    if (updateError) {
      console.error('Error updating quiz attempt:', updateError)
      throw updateError
    }

    let rewardsAwarded = null

    // Award rewards for first-time mastery
    if (isFirstTimeMastery) {
      console.log('Awarding rewards for first-time mastery')
      
      // Get lesson rewards
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('xp_reward, bits_reward')
        .eq('id', (await supabase.from('quizzes').select('lesson_id').eq('id', quizId).single()).data?.lesson_id)
        .single()

      if (lessonError) {
        console.error('Error fetching lesson rewards:', lessonError)
        throw lessonError
      }

      // Get user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('xp, bits, streak, last_activity_date')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching user profile:', profileError)
        throw profileError
      }

      // Calculate streak
      const today = new Date().toISOString().split('T')[0]
      const lastActivity = userProfile.last_activity_date
      let newStreak = 1

      if (lastActivity) {
        const lastDate = new Date(lastActivity)
        const todayDate = new Date(today)
        const diffTime = todayDate.getTime() - lastDate.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 1) {
          // Consecutive day
          newStreak = (userProfile.streak || 0) + 1
        } else if (diffDays === 0) {
          // Same day
          newStreak = userProfile.streak || 1
        } else {
          // Streak broken
          newStreak = 1
        }
      }

      // Update user profile with rewards
      const { error: updateProfileError } = await supabase
        .from('user_profiles')
        .update({
          xp: (userProfile.xp || 0) + lessonData.xp_reward,
          bits: (userProfile.bits || 0) + lessonData.bits_reward,
          streak: newStreak,
          last_activity_date: today
        })
        .eq('id', user.id)

      if (updateProfileError) {
        console.error('Error updating user profile:', updateProfileError)
        throw updateProfileError
      }

      rewardsAwarded = {
        xp: lessonData.xp_reward,
        bits: lessonData.bits_reward,
        streak: newStreak
      }

      console.log('Rewards awarded:', rewardsAwarded)
    }

    console.log('Quiz grading completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        results,
        isMastered,
        isFirstTimeMastery,
        score,
        correctCount,
        totalQuestions,
        quizAttemptId,
        rewardsAwarded
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in grade-quiz-answers function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})