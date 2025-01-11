export function generatePrompt(basePrompt: string, code: string): string {
  return basePrompt.replace("{code}", code);
}
