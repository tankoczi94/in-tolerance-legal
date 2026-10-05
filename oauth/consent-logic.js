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

const AUTH_QUERY_PARAMS = ['code', 'error', 'error_code', 'error_description'];

// Where the provider sends the user back: same consent URL, same
// authorization_id, nothing else.
export function buildOAuthRedirectTo(href) {
  const url = new URL(href);
  const id = url.searchParams.get('authorization_id');
  url.search = '';
  url.hash = '';
  if (id !== null) url.searchParams.set('authorization_id', id);
  return url.toString();
}

// Path + query safe for history.replaceState, without auth params/tokens.
export function stripAuthParams(href) {
  const url = new URL(href);
  for (const key of AUTH_QUERY_PARAMS) url.searchParams.delete(key);
  return url.pathname + url.search;
}

const PKCE_CODE = /^[!-~]{1,512}$/;
const ERROR_PARAMS = ['error', 'error_code', 'error_description'];

// Decide what to do with the URL after the PKCE return trip from the provider.
// strip: remove auth params from the address bar (do this before any await).
// action: 'none' | 'error' | 'exchange' (with `code`). `handled` guards a
// second run so the one-time code is never exchanged twice.
export function evaluatePkceCallback({ search, hash = '', handled = false }) {
  const query = new URLSearchParams(search);
  const fragment = new URLSearchParams(hash.replace(/^#/, ''));
  const hasError = ERROR_PARAMS.some((k) => query.has(k) || fragment.has(k));
  const code = query.get('code');
  if (!hasError && code === null) return { strip: false, action: 'none' };

  if (hasError) return { strip: true, action: 'error' };
  if (handled) return { strip: true, action: 'none' };
  if (parseAuthorizationId(search) === null || !PKCE_CODE.test(code)) {
    return { strip: true, action: 'error' };
  }
  return { strip: true, action: 'exchange', code };
}
