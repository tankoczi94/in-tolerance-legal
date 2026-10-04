import {
  buildConsentPayload,
  canAllow,
  isAllowedRedirect,
  parseAuthorizationId,
} from './consent-logic.js';
import {
  AGE_LABEL,
  CONSENT_TEXT,
  CONSENT_VERSION,
  HEALTH_CONSENT_LABEL,
  MARKETING_LABEL,
} from './consent-text.js';

// Public values (anon/publishable key is designed to be shipped to clients).
const SUPABASE_URL = 'https://ctcwccqvkhxskppqtchb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0q374Sr_F5MQ5MfmQj40vg_CQkFIxQx';
const API_URL = 'https://in-tolerance-production.up.railway.app';

const allowLocalhost = location.hostname === 'localhost';
const $ = (id) => document.getElementById(id);

// In-memory session only: sign-in is always fresh for this flow.
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const authorizationId = parseAuthorizationId(location.search);
let clientId = null;
let signUpMode = false;

function show(view) {
  for (const id of ['auth-view', 'consent-view']) $(id).hidden = id !== view;
  $('status').hidden = true;
  if (view) $(view).querySelector('h2').focus();
}

function showError(message) {
  $('error').textContent = message;
  $('error').hidden = false;
}

function clearError() {
  $('error').hidden = true;
}

function fatal(message) {
  show(null);
  showError(message);
}

// Only ever navigate to a URL that passes the same allowlist as the
// pre-consent check; never to whatever the server returned verbatim.
function goToClient(redirectUrl) {
  if (!isAllowedRedirect(redirectUrl, { allowLocalhost })) {
    fatal('This request was blocked: unexpected return address.');
    return;
  }
  location.assign(redirectUrl);
}

async function loadAuthorization() {
  $('status').hidden = false;
  $('status').textContent = 'Loading…';
  const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(
    authorizationId,
  );
  if (error || !data) {
    fatal('This authorization request is invalid or has expired. Please start again from the assistant.');
    return;
  }
  if ('redirect_url' in data) {
    goToClient(data.redirect_url);
    return;
  }
  if (!isAllowedRedirect(data.redirect_uri, { allowLocalhost })) {
    await supabase.auth.oauth.denyAuthorization(authorizationId, {
      skipBrowserRedirect: true,
    });
    fatal('This app is not on the list of supported assistants, so the request was denied.');
    return;
  }

  clientId = data.client.id;
  $('client-name').textContent = data.client.name;
  $('redirect-host').textContent = new URL(data.redirect_uri).host;
  show('consent-view');
}

function updateAllowState() {
  $('allow').disabled = !canAllow({
    healthConsent: $('health-consent').checked,
    ageConfirmed: $('age-confirmed').checked,
  });
}

async function onAuthSubmit(event) {
  event.preventDefault();
  clearError();
  $('auth-submit').disabled = true;
  try {
    await submitAuth();
  } finally {
    $('auth-submit').disabled = false;
  }
}

async function submitAuth() {
  const email = $('email').value.trim();
  const password = $('password').value;
  if (!email || password.length < 8) {
    showError('Enter your email and a password of at least 8 characters.');
    return;
  }

  if (signUpMode) {
    if (!$('tos').checked || !$('signup-age').checked) {
      showError('Please accept the Terms and Privacy Policy and confirm you are 18 or older.');
      return;
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return showError(error.message);
    if (!data.session) {
      fatal('Check your email to confirm your account, then start the connection again from the assistant.');
      return;
    }
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return showError('Sign-in failed. Check your email and password.');
  }
  await loadAuthorization();
}

function toggleAuthMode() {
  signUpMode = !signUpMode;
  $('signup-only').hidden = !signUpMode;
  $('auth-submit').textContent = signUpMode ? 'Create account' : 'Sign in';
  $('auth-toggle').textContent = signUpMode
    ? 'I already have an account'
    : 'Create an account instead';
  $('password').autocomplete = signUpMode ? 'new-password' : 'current-password';
  clearError();
}

async function recordConsent() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('no session');
  const payload = await buildConsentPayload({
    clientId,
    version: CONSENT_VERSION,
    text: CONSENT_TEXT,
    marketingOptIn: $('marketing').checked,
  });
  const res = await fetch(`${API_URL}/connector-consent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`consent ${res.status}`);
}

async function onAllow(event) {
  event.preventDefault();
  clearError();
  if (
    !canAllow({
      healthConsent: $('health-consent').checked,
      ageConfirmed: $('age-confirmed').checked,
    })
  ) {
    return;
  }
  $('allow').disabled = true;
  $('deny').disabled = true;
  try {
    // Record first: no consent record, no authorization.
    await recordConsent();
  } catch {
    showError('We could not save your consent. Nothing was shared — please try again.');
    updateAllowState();
    $('deny').disabled = false;
    return;
  }
  const { data, error } = await supabase.auth.oauth.approveAuthorization(
    authorizationId,
    { skipBrowserRedirect: true },
  );
  if (error || !data) {
    showError('Authorization failed. Please try again.');
    updateAllowState();
    $('deny').disabled = false;
    return;
  }
  goToClient(data.redirect_url);
}

async function onDeny() {
  $('deny').disabled = true;
  $('allow').disabled = true;
  const { data } = await supabase.auth.oauth.denyAuthorization(
    authorizationId,
    { skipBrowserRedirect: true },
  );
  if (data?.redirect_url) {
    goToClient(data.redirect_url);
  } else {
    fatal('We could not complete the denial. Nothing was shared; you can close this page.');
  }
}

function init() {
  if (!authorizationId) {
    fatal('Missing or invalid authorization request. Please start again from the assistant.');
    return;
  }
  $('health-label').textContent = HEALTH_CONSENT_LABEL;
  $('age-label').textContent = AGE_LABEL;
  $('marketing-label').textContent = MARKETING_LABEL;

  $('auth-form').addEventListener('submit', onAuthSubmit);
  $('auth-toggle').addEventListener('click', toggleAuthMode);
  $('consent-form').addEventListener('submit', onAllow);
  $('deny').addEventListener('click', onDeny);
  $('health-consent').addEventListener('change', updateAllowState);
  $('age-confirmed').addEventListener('change', updateAllowState);

  show('auth-view');
}

init();
