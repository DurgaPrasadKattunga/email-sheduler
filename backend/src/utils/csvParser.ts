/**
 * Robust email address parser for raw text, CSV strings, or uploaded file buffers.
 * Supports comma, newline, tab, semicolon delimiters, and quoted strings.
 */
export const parseEmailsFromCsv = (content: string): string[] => {
  if (!content || typeof content !== 'string') {
    return [];
  }

  // Regex matching valid email addresses according to standard format
  const emailRegex = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+/g;
  
  const matches = content.match(emailRegex) || [];
  
  // Normalize emails to lowercase, trim whitespace, and filter distinct values
  const uniqueEmails = Array.from(
    new Set(
      matches
        .map((email) => email.toLowerCase().trim())
        .filter((email) => email.length > 5 && email.includes('.'))
    )
  );

  return uniqueEmails;
};

export interface ParsedCsvRecipient {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

/**
 * Parse structured CSV rows with headers (e.g. name, email, company)
 */
export const parseStructuredCsv = (csvText: string): ParsedCsvRecipient[] => {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const headerLine = lines[0];
  const headers = headerLine.split(/[,;\t]/).map((h) => h.replace(/["']/g, '').trim().toLowerCase());
  
  const emailColIdx = headers.findIndex((h) => h === 'email' || h === 'email address' || h === 'recipient');
  const nameColIdx = headers.findIndex((h) => h === 'name' || h === 'full name' || h === 'first name');

  const results: ParsedCsvRecipient[] = [];

  // If no identifiable header, fallback to regex extraction
  if (emailColIdx === -1) {
    const rawEmails = parseEmailsFromCsv(csvText);
    return rawEmails.map((email) => ({ email }));
  }

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(/[,;\t]/).map((cell) => cell.replace(/["']/g, '').trim());
    const email = row[emailColIdx]?.toLowerCase();
    
    if (email && email.includes('@')) {
      const name = nameColIdx !== -1 ? row[nameColIdx] : undefined;
      results.push({ email, name });
    }
  }

  // Deduplicate by email
  const seen = new Set<string>();
  return results.filter((item) => {
    if (seen.has(item.email)) return false;
    seen.add(item.email);
    return true;
  });
};
