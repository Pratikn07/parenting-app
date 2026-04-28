export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
  isError?: boolean;
  imageUrl?: string;
  isSystem?: boolean;
}

export const WELCOME_MESSAGE =
  "Hi there! I'm Bloom, your parenting companion. I remember details about your little ones and our past conversations. You can also share photos for me to analyze - just tap the 📎 button. What's on your mind today?";
