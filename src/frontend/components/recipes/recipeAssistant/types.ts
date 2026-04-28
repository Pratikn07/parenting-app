export type AssistantMode = 'ingredient' | 'progress';

export interface AssistantMessage {
  id: string;
  text: string;
  isUser: boolean;
  imageUrl?: string;
}
