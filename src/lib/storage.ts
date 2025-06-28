import { supabase } from './supabase';

export class StorageService {
  private static instance: StorageService;
  
  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async uploadFile(file: File, bucket: string, path: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        upsert: true
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  }

  async uploadCourseImage(file: File, courseId: string): Promise<string> {
    return this.uploadFile(file, 'course-images', `courses/${courseId}`);
  }

  async uploadCourseMaterial(file: File, courseId: string): Promise<string> {
    return this.uploadFile(file, 'course-materials', `courses/${courseId}`);
  }

  async uploadVideo(file: File, courseId: string, chapterId: string): Promise<string> {
    return this.uploadFile(file, 'course-videos', `courses/${courseId}/chapters/${chapterId}`);
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
}

export const storageService = StorageService.getInstance();