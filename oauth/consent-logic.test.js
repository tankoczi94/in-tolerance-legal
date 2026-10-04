import { describe, expect, it } from 'vitest';
import {
  buildConsentPayload,
  canAllow,
  hashConsentText,
  isAllowedRedirect,
  parseAuthorizationId,
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
