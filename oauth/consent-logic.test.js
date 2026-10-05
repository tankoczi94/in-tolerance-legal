import { describe, expect, it } from 'vitest';
import {
  buildConsentPayload,
  canAllow,
  hashConsentText,
  buildOAuthRedirectTo,
  isAllowedRedirect,
  stripAuthParams,
  parseAuthorizationId,
  evaluatePkceCallback,
} from './consent-logic.js';

describe('parseAuthorizationId', () => {
  it('reads authorization_id from the query string', () => {
    expect(parseAuthorizationId('?authorization_id=abc-123_XYZ')).toBe(
      'abc-123_XYZ',
    );
  });

  it.each(['', '?', '?authorization_id=', '?other=1', '?authorization_id=a b',
    '?authorization_id=<script>', `?authorization_id=${'a'.repeat(201)}`])(
    'returns null for %s',
    (search) => {
      expect(parseAuthorizationId(search)).toBeNull();
    },
  );
});

describe('isAllowedRedirect', () => {
  it.each([
    'https://chatgpt.com/connector/oauth/abc123',
    'https://chatgpt.com/connector_platform_oauth_redirect',
    'https://claude.ai/api/mcp/auth_callback',
    'https://claude.com/api/mcp/auth_callback',
  ])('allows %s', (uri) => {
    expect(isAllowedRedirect(uri)).toBe(true);
  });

  it.each([
    'https://evil.com/cb',
    'https://chatgpt.com.evil.com/cb',
    'https://evilchatgpt.com/cb',
    'https://sub.chatgpt.com/cb',
    'https://chatgpt.com@evil.com/cb',
    'https://user:pw@chatgpt.com/cb',
    'http://chatgpt.com/cb',
    'https://chatgpt.com\\@evil.com/',
    'https:chatgpt.com',
    'https:/chatgpt.com',
    'https:\\\\chatgpt.com/',
    'https://chat\tgpt.com',
    'https://chatgpt.com\n/x',
    ' https://chatgpt.com/ ',
    'https://ｃhatgpt.com',
    'https://chatgpt。com',
    'https://chatgpt.com:444/cb',
    'https://chatgpt.com.',
    '//chatgpt.com/cb',
    'data:text/html,hi',
    'https://localhost/cb',
    'javascript:alert(1)',
    'chatgpt.com/cb',
    '',
    undefined,
    null,
    42,
  ])('rejects %s', (uri) => {
    expect(isAllowedRedirect(uri)).toBe(false);
  });

  it('rejects localhost by default', () => {
    expect(isAllowedRedirect('http://localhost:3000/cb')).toBe(false);
  });

  it('allows http localhost only when allowLocalhost is set', () => {
    expect(
      isAllowedRedirect('http://localhost:3000/cb', { allowLocalhost: true }),
    ).toBe(true);
    expect(
      isAllowedRedirect('http://localhost.evil.com/cb', { allowLocalhost: true }),
    ).toBe(false);
    expect(
      isAllowedRedirect('http://localhost@evil.com/cb', { allowLocalhost: true }),
    ).toBe(false);
  });
});

describe('canAllow', () => {
  it('requires both Art. 9 consent and 18+ confirmation', () => {
    expect(canAllow({ healthConsent: true, ageConfirmed: true })).toBe(true);
    expect(canAllow({ healthConsent: true, ageConfirmed: false })).toBe(false);
    expect(canAllow({ healthConsent: false, ageConfirmed: true })).toBe(false);
    expect(canAllow({})).toBe(false);
  });

  it('is not enabled by marketing opt-in alone', () => {
    expect(canAllow({ marketingOptIn: true })).toBe(false);
  });

  it('only accepts literal true', () => {
    expect(canAllow({ healthConsent: 'yes', ageConfirmed: 1 })).toBe(false);
  });
});

describe('hashConsentText', () => {
  it('returns the lowercase SHA-256 hex digest', async () => {
    expect(await hashConsentText('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});

describe('buildConsentPayload', () => {
  it('matches the POST /connector-consent contract', async () => {
    const payload = await buildConsentPayload({
      clientId: 'client-1',
      version: '2026-10-04',
      text: 'abc',
      marketingOptIn: true,
    });
    expect(payload).toEqual({
      client_id: 'client-1',
      consent_text_version: '2026-10-04',
      consent_text_hash:
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      health_data_consent: true,
      age_confirmed: true,
      marketing_opt_in: true,
    });
  });

  it('defaults marketing opt-in to false', async () => {
    const payload = await buildConsentPayload({
      clientId: 'c',
      version: 'v',
      text: 't',
    });
    expect(payload.marketing_opt_in).toBe(false);
  });
});

describe('buildOAuthRedirectTo', () => {
  it('keeps only the path and authorization_id', () => {
    expect(
      buildOAuthRedirectTo(
        'https://in-tolerance.app/oauth/consent?authorization_id=abc&error=x#access_token=t',
      ),
    ).toBe('https://in-tolerance.app/oauth/consent?authorization_id=abc');
  });
});

describe('stripAuthParams', () => {
  it('removes hash and auth query params but keeps authorization_id', () => {
    expect(
      stripAuthParams(
        'https://in-tolerance.app/oauth/consent?authorization_id=abc&code=1&error=e&error_code=c&error_description=d#access_token=t',
      ),
    ).toBe('/oauth/consent?authorization_id=abc');
  });

  it('is a no-op for a clean url', () => {
    expect(
      stripAuthParams('https://in-tolerance.app/oauth/consent?authorization_id=abc'),
    ).toBe('/oauth/consent?authorization_id=abc');
  });
});

describe('buildOAuthRedirectTo without authorization_id', () => {
  it('returns the bare consent URL', () => {
    expect(
      buildOAuthRedirectTo('https://in-tolerance.app/oauth/consent?x=1#h'),
    ).toBe('https://in-tolerance.app/oauth/consent');
  });
});

describe('evaluatePkceCallback', () => {
  const run = (search, extra = {}) =>
    evaluatePkceCallback({ search, hash: '', handled: false, ...extra });

  it('does nothing for a clean url', () => {
    expect(run('?authorization_id=x')).toEqual({ strip: false, action: 'none' });
  });

  it('exchanges the code and strips the url', () => {
    expect(run('?authorization_id=x&code=abc')).toEqual({
      strip: true,
      action: 'exchange',
      code: 'abc',
    });
  });

  it.each([
    '?authorization_id=x&error=access_denied',
    '?authorization_id=x&error_description=nope',
    '?authorization_id=x&error_code=bad&code=abc',
  ])('reports an error for %s and never exchanges', (search) => {
    expect(run(search)).toEqual({ strip: true, action: 'error' });
  });

  it('reports an error found in the hash', () => {
    expect(run('?authorization_id=x', { hash: '#error=access_denied' })).toEqual({
      strip: true,
      action: 'error',
    });
  });

  it('strips but does not exchange without authorization_id', () => {
    expect(run('?code=abc')).toEqual({ strip: true, action: 'error' });
  });

  it('strips but does not exchange a second time', () => {
    expect(run('?authorization_id=x&code=abc', { handled: true })).toEqual({
      strip: true,
      action: 'none',
    });
  });

  it('ignores implicit-flow tokens in the hash', () => {
    expect(run('?authorization_id=x', { hash: '#access_token=a&refresh_token=r' }))
      .toEqual({ strip: false, action: 'none' });
  });

  it.each(['?authorization_id=x&code=', `?authorization_id=x&code=${'a'.repeat(513)}`])(
    'rejects malformed code %s',
    (search) => {
      expect(run(search)).toEqual({ strip: true, action: 'error' });
    },
  );
});
