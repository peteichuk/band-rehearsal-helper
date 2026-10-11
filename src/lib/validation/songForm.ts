const REQUIRED_FIELDS = ['Name', 'Text', 'Tonality'];
const URL_FIELDS = ['YouTube', 'Chordify', 'Holychords'];

// Requires an http(s) scheme and a domain-looking host (at least one dot),
// e.g. "https://youtube.com/watch?v=..." — rejects things like "http://a".
const URL_PATTERN = /^https?:\/\/[^\s/$.?#][^\s]*\.[^\s]*$/i;

function isValidUrl(value: string): boolean {
  if (!URL_PATTERN.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Returns a map of header -> error message for any field that fails validation. */
export function validateSongForm(values: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of REQUIRED_FIELDS) {
    if (field in values) {
      const value = values[field];
      if (typeof value !== 'string' || value.trim() === '') {
        errors[field] = 'Required';
      }
    }
  }

  for (const field of URL_FIELDS) {
    if (field in values) {
      const value = values[field];
      if (typeof value === 'string' && value.trim() !== '' && !isValidUrl(value.trim())) {
        errors[field] = 'Must be a valid http(s) URL';
      }
    }
  }

  return errors;
}
