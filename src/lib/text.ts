/** Strip markdown and normalize dashes for clean UI display. */
export function toPlainText(input: string): string {
  let text = input;

  text = text.replace(/\r\n/g, "\n");

  // Fenced code: keep inner content
  text = text.replace(/```[\w]*\n?([\s\S]*?)```/g, "$1");

  // Horizontal rules on their own line only
  text = text.replace(/^\s*(-{3,}|\*{3,}|_{3,})\s*$/gm, "");

  // ATX headings
  text = text.replace(/^#{1,6}\s+/gm, "");

  // Images / links keep visible label
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Bold / italic wrappers (non-greedy, same-line preferred)
  text = text.replace(/\*\*\*([^*\n]+)\*\*\*/g, "$1");
  text = text.replace(/\*\*([^*\n]+)\*\*/g, "$1");
  text = text.replace(/__([^_\n]+)__/g, "$1");
  text = text.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "$1");
  text = text.replace(/(?<!_)_([^_\n]+)_(?!_)/g, "$1");
  text = text.replace(/~~([^~\n]+)~~/g, "$1");
  text = text.replace(/`([^`\n]+)`/g, "$1");

  // Blockquotes
  text = text.replace(/^>\s?/gm, "");

  // List markers at line start only
  text = text.replace(/^\s*[-*+]\s+/gm, "• ");
  text = text.replace(/^\s*(\d+)[.)]\s+/gm, "$1. ");

  // Em / en dashes
  text = text.replace(/\u2014|\u2013/g, " - ");

  // Only remove leftover markdown emphasis markers, not all asterisks mid-content after lists
  text = text.replace(/(?<!\w)\*{1,3}(?!\w)/g, "");

  // Collapse excess blank lines, keep paragraph structure
  text = text.replace(/[ \t]+\n/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

export function withoutEmDashes(input: string): string {
  return input.replace(/\u2014|\u2013/g, " - ");
}
