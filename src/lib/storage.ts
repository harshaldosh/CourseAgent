import { supabase } from './supabase';

// Storage bucket names
const STORAGE_BUCKETS = {
  COURSE_IMAGES: 'course-images',
  COURSE_MATERIALS: 'course-materials', 
  COURSE_VIDEOS: 'course-videos'
} as const;

export class StorageService {
  private static instance: StorageService;
  
  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Check if storage buckets exist and create them if needed
  private async ensureBucketExists(bucketName: string): Promise<void> {
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.warn('Could not list buckets:', listError.message);
        return;
      }

      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          allowedMimeTypes: ['image/*', 'video/*', 'application/*', 'text/*'],
          fileSizeLimit: 1024 * 1024 * 500 // 500MB
        });
        
        if (createError) {
          console.warn(`Could not create bucket ${bucketName}:`, createError.message);
        }
      }
    } catch (error) {
      console.warn('Error checking/creating bucket:', error);
    }
  }

  async uploadFile(file: File, bucket: string, path: string): Promise<string> {
    try {
      // Ensure bucket exists
      await this.ensureBucketExists(bucket);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${path}/${Date.now()}.${fileExt}`;

      console.log(`Uploading file to bucket: ${bucket}, path: ${fileName}`);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          upsert: true
        });

      if (error) {
        console.error('Upload error:', error);
        
        // If storage upload fails, provide a fallback
        if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
          throw new Error(`Network error: Unable to connect to storage service. Please check your internet connection and try again.`);
        }
        
        if (error.message.includes('bucket') && error.message.includes('not found')) {
          throw new Error(`Storage bucket "${bucket}" not found. Please contact support.`);
        }
        
        if (error.message.includes('policy')) {
          throw new Error(`Permission denied: Unable to upload to storage. Please contact support.`);
        }
        
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      console.log(`File uploaded successfully: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      console.error('Storage service error:', error);
      
      // Re-throw with more user-friendly message
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('An unexpected error occurred while uploading the file. Please try again.');
    }
  }

  async uploadCourseImage(file: File, courseId: string): Promise<string> {
    return this.uploadFile(file, STORAGE_BUCKETS.COURSE_IMAGES, `courses/${courseId}`);
  }

  async uploadCourseMaterial(file: File, courseId: string): Promise<string> {
    return this.uploadFile(file, STORAGE_BUCKETS.COURSE_MATERIALS, `courses/${courseId}`);
  }

  async uploadVideo(file: File, courseId: string, chapterId: string): Promise<string> {
    return this.uploadFile(file, STORAGE_BUCKETS.COURSE_VIDEOS, `courses/${courseId}/chapters/${chapterId}`);
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        console.error('Delete error:', error);
        throw new Error(`Failed to delete file: ${error.message}`);
      }
    } catch (error) {
      console.error('Storage delete error:', error);
      throw new Error('Failed to delete file. Please try again.');
    }
  }

  // Test storage connection
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Storage connection test failed:', error);
        return false;
      }
      
      console.log('Storage connection successful. Available buckets:', data?.map(b => b.name));
      return true;
    } catch (error) {
      console.error('Storage connection test error:', error);
      return false;
    }
  }
}

export const storageService = StorageService.getInstance();