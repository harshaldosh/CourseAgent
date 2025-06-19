import { supabase } from '../lib/supabase';

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  completed_at?: string;
  progress: Record<string, boolean>;
}

class EnrollmentService {
  async enrollInCourse(courseId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('enrollments')
      .insert({
        user_id: user.id,
        course_id: courseId
      });

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Already enrolled in this course');
      }
      throw new Error('Failed to enroll in course');
    }
  }

  async getUserEnrollments(): Promise<string[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching enrollments:', error);
      return [];
    }

    return data.map(enrollment => enrollment.course_id);
  }

  async updateProgress(courseId: string, videoId: string, completed: boolean): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get current progress
    const { data: enrollment, error: fetchError } = await supabase
      .from('enrollments')
      .select('progress')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();

    if (fetchError) {
      throw new Error('Enrollment not found');
    }

    const currentProgress = enrollment.progress || {};
    const updatedProgress = {
      ...currentProgress,
      [videoId]: completed
    };

    const { error } = await supabase
      .from('enrollments')
      .update({ progress: updatedProgress })
      .eq('user_id', user.id)
      .eq('course_id', courseId);

    if (error) {
      throw new Error('Failed to update progress');
    }
  }

  async getProgress(courseId: string): Promise<Record<string, boolean>> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {};
    }

    const { data, error } = await supabase
      .from('enrollments')
      .select('progress')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();

    if (error) {
      return {};
    }

    return data.progress || {};
  }

  async isEnrolled(courseId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    const { data, error } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();

    return !error && !!data;
  }
}

export const enrollmentService = new EnrollmentService();