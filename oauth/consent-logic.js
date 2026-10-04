// Pure logic for the connector consent page (/oauth/consent). No DOM, no
// network: the page wires these into the UI and supabase-js calls.

// Hosts the OAuth server may redirect back to. Exact match only — no
// subdomains — so look-alike hosts can never receive an authorization code.
const ALLOWED_REDIRECT_HOSTS = ['chatgpt.com', 'claude.ai', 'claude.com'];
const DEV_REDIRECT_HOST = 'localhost';

// Strict, parser-neutral shape: scheme://, printable ASCII only. Rejects what
// the WHATWG URL parser would silently normalise (backslashes, tabs/newlines,
// surrounding whitespace, fullwidth/ideographic characters, "https:host").
const STRICT_URI = /^https?:\/\/[\x21-\x7e]+$/;

export function isAllowedRedirect(uri, { allowLocalhost = false } = {}) {
  if (typeof uri !== 'string' || !STRICT_URI.test(uri) || uri.includes('\\')) {
    return false;
  }
  let url;
  try {
    url = new URL(uri);
  } catch {
    return false;
  }
  if (url.username || url.password) return false;

  if (url.protocol === 'https:') {
    return url.port === '' && ALLOWED_REDIRECT_HOSTS.includes(url.hostname);
  }
  return (
    allowLocalhost &&
    url.protocol === 'http:' &&
    url.hostname === DEV_REDIRECT_HOST
  );
}

// The id only ever goes back to Supabase; still, accept a conservative shape.
export function parseAuthorizationId(search) {
  const id = new URLSearchParams(search).get('authorization_id');
  return id !== null && /^[A-Za-z0-9._~-]{1,200}$/.test(id) ? id : null;
}

// "Allow" stays disabled until both mandatory boxes are literally ticked.
export function canAllow({ healthConsent, ageConfirmed } = {}) {
  return healthConsent === true && ageConfirmed === true;
}

export async function hashConsentText(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
}

// Body for POST /connector-consent. Only built once canAllow() is true, so the
// two mandatory flags are always true here.
export async function buildConsentPayload({
  clientId,
  version,
  text,
  marketingOptIn = false,
}) {
  return {
    client_id: clientId,
    consent_text_version: version,
    consent_text_hash: await hashConsentText(text),
    health_data_consent: true,
    age_confirmed: true,
    marketing_opt_in: marketingOptIn === true,
  };
}
