export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/^#+\s/gm, '')
    .replace(/^-\s/gm, '• ');
}

export function buildIngredientPromptText(selected: string[]): string {
  if (selected.length === 0) return '';
  return `I don't have ${selected.join(', ')}`;
}
