import { supabase } from '../lib/supabase';
import type { Course } from '../types/course';

class SupabaseDatabaseService {
  async getAllCourses(): Promise<Course[]> {
    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        *,
        chapters (
          *,
          videos (*),
          agents (*),
          documents (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching courses:', error);
      throw new Error('Failed to fetch courses');
    }

    return courses.map(this.transformCourseData);
  }

  async getCourseById(id: string): Promise<Course | null> {
    // Add cache-busting timestamp to ensure fresh data
    // const timestamp = Date.now();
    
    const { data: course, error } = await supabase
      .from('courses')
      .select(`
        *,
        chapters (
          *,
          videos (*),
          agents (*),
          documents (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Course not found
      }
      console.error('Error fetching course:', error);
      throw new Error('Failed to fetch course');
    }

    return this.transformCourseData(course);
  }

  async addCourse(courseData: Omit<Course, 'id' | 'createdAt'>): Promise<string> {
    // Start a transaction by inserting course first
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        title: courseData.title,
        image: courseData.image,
        description: courseData.description,
        agent_course_description: courseData.agentCourseDescription,
        agent_id: courseData.agentId || null,
        sponsored: courseData.sponsored,
        fees: courseData.fees,
        course_material_url: courseData.courseMaterialUrl || null,
        category: courseData.category
      })
      .select()
      .single();

    if (courseError) {
      console.error('Error creating course:', courseError);
      throw new Error('Failed to create course');
    }

    // Insert chapters, videos, agents, and documents
    for (let chapterIndex = 0; chapterIndex < courseData.chapters.length; chapterIndex++) {
      const chapterData = courseData.chapters[chapterIndex];
      
      const { data: chapter, error: chapterError } = await supabase
        .from('chapters')
        .insert({
          course_id: course.id,
          title: chapterData.title,
          description: chapterData.description || null,
          order_index: chapterIndex
        })
        .select()
        .single();

      if (chapterError) {
        console.error('Error creating chapter:', chapterError);
        throw new Error('Failed to create chapter');
      }

      // Insert videos for this chapter
      if (chapterData.videos.length > 0) {
        const videosToInsert = chapterData.videos.map((video, videoIndex) => ({
          chapter_id: chapter.id,
          title: video.title,
          url: video.url,
          duration: video.duration || '',
          description: video.description || null,
          order_index: videoIndex
        }));

        const { error: videosError } = await supabase
          .from('videos')
          .insert(videosToInsert);

        if (videosError) {
          console.error('Error creating videos:', videosError);
          throw new Error('Failed to create videos');
        }
      }

      // Insert documents for this chapter
      if (chapterData.documents && chapterData.documents.length > 0) {
        const documentsToInsert = chapterData.documents.map((document, docIndex) => ({
          chapter_id: chapter.id,
          title: document.title,
          url: document.url,
          description: document.description || null,
          is_special: document.isSpecial,
          order_index: docIndex
        }));

        const { error: documentsError } = await supabase
          .from('documents')
          .insert(documentsToInsert);

        if (documentsError) {
          console.error('Error creating documents:', documentsError);
          throw new Error('Failed to create documents');
        }
      }

      // Insert agents for this chapter
      if (chapterData.agents.length > 0) {
        const agentsToInsert = chapterData.agents.map((agent, agentIndex) => ({
          chapter_id: chapter.id,
          title: agent.title,
          replica_id: agent.replicaId,
          conversational_context: agent.conversationalContext,
          description: agent.description || null,
          order_index: agentIndex
        }));

        const { error: agentsError } = await supabase
          .from('agents')
          .insert(agentsToInsert);

        if (agentsError) {
          console.error('Error creating agents:', agentsError);
          throw new Error('Failed to create agents');
        }
      }
    }

    // Clear any cached course data
    this.clearCourseCache();

    return course.id;
  }

  async updateCourse(id: string, courseData: Partial<Omit<Course, 'id' | 'createdAt'>>): Promise<void> {
    // Update course basic information
    const { error: courseError } = await supabase
      .from('courses')
      .update({
        title: courseData.title,
        image: courseData.image,
        description: courseData.description,
        agent_course_description: courseData.agentCourseDescription,
        agent_id: courseData.agentId || null,
        sponsored: courseData.sponsored,
        fees: courseData.fees,
        course_material_url: courseData.courseMaterialUrl || null,
        updated_at: new Date().toISOString(),
        category: courseData.category
      })
      .eq('id', id);

    if (courseError) {
      console.error('Error updating course:', courseError);
      throw new Error('Failed to update course');
    }

    // If chapters are provided, update them
    if (courseData.chapters) {
      // Delete existing chapters (cascade will handle videos, agents, and documents)
      const { error: deleteError } = await supabase
        .from('chapters')
        .delete()
        .eq('course_id', id);

      if (deleteError) {
        console.error('Error deleting existing chapters:', deleteError);
        throw new Error('Failed to update course chapters');
      }

      // Insert new chapters, videos, agents, and documents
      for (let chapterIndex = 0; chapterIndex < courseData.chapters.length; chapterIndex++) {
        const chapterData = courseData.chapters[chapterIndex];
        
        const { data: chapter, error: chapterError } = await supabase
          .from('chapters')
          .insert({
            course_id: id,
            title: chapterData.title,
            description: chapterData.description || null,
            order_index: chapterIndex
          })
          .select()
          .single();

        if (chapterError) {
          console.error('Error creating chapter:', chapterError);
          throw new Error('Failed to create chapter');
        }

        // Insert videos for this chapter
        if (chapterData.videos.length > 0) {
          const videosToInsert = chapterData.videos.map((video, videoIndex) => ({
            chapter_id: chapter.id,
            title: video.title,
            url: video.url,
            duration: video.duration || '',
            description: video.description || null,
            order_index: videoIndex
          }));

          const { error: videosError } = await supabase
            .from('videos')
            .insert(videosToInsert);

          if (videosError) {
            console.error('Error creating videos:', videosError);
            throw new Error('Failed to create videos');
          }
        }

        // Insert documents for this chapter
        if (chapterData.documents && chapterData.documents.length > 0) {
          const documentsToInsert = chapterData.documents.map((document, docIndex) => ({
            chapter_id: chapter.id,
            title: document.title,
            url: document.url,
            description: document.description || null,
            is_special: document.isSpecial,
            order_index: docIndex
          }));

          const { error: documentsError } = await supabase
            .from('documents')
            .insert(documentsToInsert);

          if (documentsError) {
            console.error('Error creating documents:', documentsError);
            throw new Error('Failed to create documents');
          }
        }

        // Insert agents for this chapter
        if (chapterData.agents.length > 0) {
          const agentsToInsert = chapterData.agents.map((agent, agentIndex) => ({
            chapter_id: chapter.id,
            title: agent.title,
            replica_id: agent.replicaId,
            conversational_context: agent.conversationalContext,
            description: agent.description || null,
            order_index: agentIndex
          }));

          const { error: agentsError } = await supabase
            .from('agents')
            .insert(agentsToInsert);

          if (agentsError) {
            console.error('Error creating agents:', agentsError);
            throw new Error('Failed to create agents');
          }
        }
      }
    }

    // Clear any cached course data
    this.clearCourseCache();
  }

  async deleteCourse(id: string): Promise<void> {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting course:', error);
      throw new Error('Failed to delete course');
    }

    // Clear any cached course data
    this.clearCourseCache();
  }

  private clearCourseCache(): void {
    // Clear any browser cache related to courses
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('course') || name.includes('api')) {
            caches.delete(name);
          }
        });
      });
    }

    // Clear any localStorage cache
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('course') || key.includes('supabase')) {
        localStorage.removeItem(key);
      }
    });
  }

  private transformCourseData(courseData: any): Course {
    // Sort chapters by order_index
    const sortedChapters = (courseData.chapters || [])
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((chapter: any) => ({
        id: chapter.id,
        title: chapter.title,
        description: chapter.description || '',
        videos: (chapter.videos || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((video: any) => ({
            id: video.id,
            title: video.title,
            url: video.url,
            duration: video.duration || '',
            description: video.description || '',
            type: 'video' as const
          })),
        documents: (chapter.documents || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((document: any) => ({
            id: document.id,
            title: document.title,
            url: document.url,
            description: document.description || '',
            isSpecial: document.is_special || false,
            type: 'document' as const
          })),
        agents: (chapter.agents || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((agent: any) => ({
            id: agent.id,
            title: agent.title,
            replicaId: agent.replica_id,
            conversationalContext: agent.conversational_context,
            description: agent.description || '',
            type: 'agent' as const
          }))
      }));

    return {
      id: courseData.id,
      title: courseData.title,
      image: courseData.image,
      description: courseData.description,
      agentCourseDescription: courseData.agent_course_description || '',
      agentId: courseData.agent_id || '',
      category: courseData.category || 'Technology',
      sponsored: courseData.sponsored || false,
      fees: courseData.fees,
      courseMaterialUrl: courseData.course_material_url || '',
      chapters: sortedChapters,
      createdAt: courseData.created_at
    };
  }
}

export const supabaseDatabaseService = new SupabaseDatabaseService();