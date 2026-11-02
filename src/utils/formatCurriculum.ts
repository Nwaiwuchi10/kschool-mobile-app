/**
 * Utility function to clean up and format subject and curriculum names for display.
 * Strips bracketed or parenthesized class names like "(Primary 1)" or "(JSS 1)" from
 * subject titles (e.g. "English Studies (Primary 1)" -> "English Studies").
 */
export function cleanCurriculumName(raw?: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/\s*\(\s*(?:Primary|JSS|SSS|SS|Basic)\s*\d+[^)]*\)/gi, '')
    .replace(/\s*\(\s*Class\s*\d+[^)]*\)/gi, '')
    .trim();
}

/**
 * Formats a composite breadcrumb string like "English Studies (Primary 1) > Nouns"
 * into "English Studies > Nouns".
 */
export function cleanBreadcrumb(raw?: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .split('>')
    .map((part) => cleanCurriculumName(part))
    .join(' > ');
}
