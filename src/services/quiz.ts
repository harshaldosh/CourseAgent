import { supabase } from '../lib/supabase';
import { llmConfigService } from './llm-config';
import type { Quiz, QuizAttempt, QuizFormData, QuizQuestion } from '../types/quiz';

class QuizService {
  async generateQuizFromPDF(pdfFile: File, topic: string, totalQuestions: number): Promise<QuizQuestion[]> {
    // Upload PDF to storage first
    const fileName = `quiz-pdfs/${Date.now()}-${pdfFile.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('course-materials')
      .upload(fileName, pdfFile);

    if (uploadError) {
      throw new Error('Failed to upload PDF');
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('course-materials')
      .getPublicUrl(uploadData.path);

    // Get current LLM configuration
    const llmConfig = llmConfigService.getCurrentConfig();

    // Call edge function to generate quiz
    const { data, error } = await supabase.functions.invoke('generate-quiz', {
      body: {
        pdfUrl: publicUrl,
        topic,
        totalQuestions,
        llmConfig
      }
    });

    if (error) {
      throw new Error('Failed to generate quiz from PDF');
    }

    return data.questions;
  }

  async generateQuizFromTopic(topic: string, totalQuestions: number): Promise<QuizQuestion[]> {
    // Get current LLM configuration
    const llmConfig = llmConfigService.getCurrentConfig();

    const { data, error } = await supabase.functions.invoke('generate-quiz', {
      body: {
        topic,
        totalQuestions,
        llmConfig
      }
    });

    if (error) {
      throw new Error('Failed to generate quiz from topic');
    }

    return data.questions;
  }

  async createQuiz(quizData: QuizFormData, questions: QuizQuestion[]): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    let pdfUrl = '';
    if (quizData.pdfFile) {
      const fileName = `quiz-pdfs/${Date.now()}-${quizData.pdfFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(fileName, quizData.pdfFile);

      if (uploadError) {
        throw new Error('Failed to upload PDF');
      }

      const { data: { publicUrl } } = supabase.storage
        .from('course-materials')
        .getPublicUrl(uploadData.path);
      
      pdfUrl = publicUrl;
    }

    const { data, error } = await supabase
      .from('quizzes')
      .insert({
        title: quizData.title,
        description: quizData.description,
        topic: quizData.topic,
        pdf_url: pdfUrl || null,
        total_questions: quizData.totalQuestions,
        total_marks: quizData.totalMarks,
        questions: questions,
        evaluation_prompts: quizData.evaluationPrompts,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create quiz');
    }

    return data.id;
  }

  async getAllQuizzes(): Promise<Quiz[]> {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch quizzes');
    }

    return data.map(this.transformQuizData);
  }

  async getQuizById(id: string): Promise<Quiz | null> {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error('Failed to fetch quiz');
    }

    return this.transformQuizData(data);
  }

  async updateQuiz(id: string, updates: Partial<Quiz>): Promise<void> {
    const { error } = await supabase
      .from('quizzes')
      .update({
        title: updates.title,
        description: updates.description,
        topic: updates.topic,
        total_questions: updates.totalQuestions,
        total_marks: updates.totalMarks,
        questions: updates.questions,
        evaluation_prompts: updates.evaluationPrompts,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error('Failed to update quiz');
    }
  }

  async deleteQuiz(id: string): Promise<void> {
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error('Failed to delete quiz');
    }
  }

  async startQuizAttempt(quizId: string): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user already has an attempt
    const { data: existingAttempt } = await supabase
      .from('quiz_attempts')
      .select('id')
      .eq('quiz_id', quizId)
      .eq('user_id', user.id)
      .single();

    if (existingAttempt) {
      return existingAttempt.id;
    }

    // Get quiz details for total marks
    const quiz = await this.getQuizById(quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        user_id: user.id,
        total_marks: quiz.totalMarks
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to start quiz attempt');
    }

    return data.id;
  }

  async saveAnswer(attemptId: string, questionId: string, answer: any): Promise<void> {
    const { data: attempt, error: fetchError } = await supabase
      .from('quiz_attempts')
      .select('answers')
      .eq('id', attemptId)
      .single();

    if (fetchError) {
      throw new Error('Quiz attempt not found');
    }

    const updatedAnswers = {
      ...attempt.answers,
      [questionId]: answer
    };

    const { error } = await supabase
      .from('quiz_attempts')
      .update({ answers: updatedAnswers })
      .eq('id', attemptId);

    if (error) {
      throw new Error('Failed to save answer');
    }
  }

  async submitQuiz(attemptId: string): Promise<void> {
    const { data: attempt, error: fetchError } = await supabase
      .from('quiz_attempts')
      .select('*, quizzes(*)')
      .eq('id', attemptId)
      .single();

    if (fetchError) {
      throw new Error('Quiz attempt not found');
    }

    // Get current LLM configuration
    const llmConfig = llmConfigService.getCurrentConfig();

    // Call edge function for LLM evaluation
    const { data: evaluation, error: evalError } = await supabase.functions.invoke('evaluate-quiz', {
      body: {
        quiz: attempt.quizzes,
        answers: attempt.answers,
        llmConfig
      }
    });

    if (evalError) {
      throw new Error('Failed to evaluate quiz');
    }

    const { error } = await supabase
      .from('quiz_attempts')
      .update({
        score: evaluation.score,
        evaluation_result: evaluation,
        completed_at: new Date().toISOString()
      })
      .eq('id', attemptId);

    if (error) {
      throw new Error('Failed to submit quiz');
    }
  }

  async getQuizAttempt(attemptId: string): Promise<QuizAttempt | null> {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('id', attemptId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error('Failed to fetch quiz attempt');
    }

    return this.transformQuizAttemptData(data);
  }

  async getUserQuizAttempts(): Promise<QuizAttempt[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch quiz attempts');
    }

    return data.map(this.transformQuizAttemptData);
  }

  private transformQuizData(data: any): Quiz {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      topic: data.topic,
      pdfUrl: data.pdf_url,
      totalQuestions: data.total_questions,
      totalMarks: data.total_marks,
      questions: data.questions || [],
      evaluationPrompts: data.evaluation_prompts || [],
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private transformQuizAttemptData(data: any): QuizAttempt {
    return {
      id: data.id,
      quizId: data.quiz_id,
      userId: data.user_id,
      answers: data.answers || {},
      score: data.score,
      totalMarks: data.total_marks,
      evaluationResult: data.evaluation_result,
      startedAt: data.started_at,
      completedAt: data.completed_at
    };
  }
}

export const quizService = new QuizService();