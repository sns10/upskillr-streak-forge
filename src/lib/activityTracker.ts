import { supabase } from "@/integrations/supabase/client";

export interface ActivityData {
  lesson_id?: string;
  lesson_title?: string;
  quiz_id?: string;
  quiz_title?: string;
  assignment_id?: string;
  assignment_title?: string;
  course_id?: string;
  course_title?: string;
  [key: string]: any;
}

export class ActivityTracker {
  private static async trackActivity(
    activityType: 'lesson_view' | 'quiz_attempt' | 'assignment_submit' | 'login',
    data: ActivityData = {}
  ) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Call the database function to track activity
      await supabase.rpc('track_user_activity', {
        user_uuid: user.id,
        activity_type_param: activityType,
        activity_data_param: data
      });
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }

  static async trackLessonView(lessonId: string, lessonTitle: string, courseId?: string) {
    await this.trackActivity('lesson_view', {
      lesson_id: lessonId,
      lesson_title: lessonTitle,
      course_id: courseId,
      viewed_at: new Date().toISOString()
    });
  }

  static async trackQuizAttempt(quizId: string, quizTitle: string, score: number) {
    await this.trackActivity('quiz_attempt', {
      quiz_id: quizId,
      quiz_title: quizTitle,
      score,
      attempted_at: new Date().toISOString()
    });
  }

  static async trackAssignmentSubmit(assignmentId: string, assignmentTitle: string, isCorrect: boolean) {
    await this.trackActivity('assignment_submit', {
      assignment_id: assignmentId,
      assignment_title: assignmentTitle,
      is_correct: isCorrect,
      submitted_at: new Date().toISOString()
    });
  }

  static async trackLogin() {
    await this.trackActivity('login', {
      login_at: new Date().toISOString()
    });
  }
}