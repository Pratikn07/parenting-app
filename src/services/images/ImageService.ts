import { supabase } from '../../lib/supabase';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

const BUCKET_NAME = 'chat-images';
const MAX_IMAGE_SIZE = 1024; // Max dimension in pixels
const JPEG_QUALITY = 0.8;

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface ImageInfo {
  uri: string;
  width: number;
  height: number;
  base64?: string;
}

/**
 * Service for handling image uploads and processing
 */
export class ImageService {
  /**
   * Compress and resize an image for upload
   */
  async compressImage(uri: string): Promise<ImageInfo> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: MAX_IMAGE_SIZE,
              height: MAX_IMAGE_SIZE,
            },
          },
        ],
        {
          compress: JPEG_QUALITY,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      return {
        uri: result.uri,
        width: result.width,
        height: result.height,
        base64: result.base64,
      };
    } catch (error) {
      console.error('Error compressing image:', error);
      throw new Error('Failed to compress image');
    }
  }

  /**
   * Upload an image to Supabase Storage
   */
  async uploadImage(
    userId: string,
    imageUri: string,
    sessionId?: string
  ): Promise<UploadResult> {
    try {
      // Compress image first
      const compressedImage = await this.compressImage(imageUri);
      
      if (!compressedImage.base64) {
        throw new Error('Failed to get base64 data');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = sessionId 
        ? `${userId}/${sessionId}/${timestamp}.jpg`
        : `${userId}/${timestamp}.jpg`;

      // Convert base64 to ArrayBuffer
      const arrayBuffer = decode(compressedImage.base64);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filename, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      // Get signed URL (valid for 1 hour)
      const { data: urlData, error: urlError } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(data.path, 3600);

      if (urlError) {
        console.error('URL generation error:', urlError);
        return {
          success: false,
          error: 'Failed to generate image URL',
        };
      }

      return {
        success: true,
        url: urlData.signedUrl,
      };
    } catch (error) {
      console.error('Image upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Get a signed URL for an existing image
   */
  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(path, expiresIn);

      if (error) {
        console.error('Error getting signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error in getSignedUrl:', error);
      return null;
    }
  }

  /**
   * Delete an image from storage
   */
  async deleteImage(path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([path]);

      if (error) {
        console.error('Error deleting image:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteImage:', error);
      return false;
    }
  }

  /**
   * Convert image URI to base64 (for sending to vision API)
   */
  async getBase64FromUri(uri: string): Promise<string | null> {
    try {
      // If it's already a data URI, extract the base64 part
      if (uri.startsWith('data:')) {
        return uri.split(',')[1];
      }

      // Read file and convert to base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return base64;
    } catch (error) {
      console.error('Error converting to base64:', error);
      return null;
    }
  }
}

// Export singleton instance
export const imageService = new ImageService();

