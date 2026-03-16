export function cleanDisplayText(text) {
  return String(text ?? '')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/<@[^>]+>/g, '')
    .replace(/<\/>/g, '')
    .replace(/<([^@/][^>]*)>/g, '$1')
    .replace(/\r\n/g, '\n')
    .trim();
}
