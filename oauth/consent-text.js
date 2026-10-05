// Consent wording shown on /oauth/consent. The SHA-256 of CONSENT_TEXT is
// stored with every consent record, so ANY wording change must bump
// CONSENT_VERSION. Wording is pending counsel review (see
// docs/compliance/ai-connector-compliance.md in the app repo).
export const CONSENT_VERSION = '2026-10-05';

export const HEALTH_CONSENT_LABEL =
  'I explicitly consent to in-tolerance sharing my health data — my food diary, ' +
  'symptom logs, sleep notes and detected food-reaction patterns, including the ' +
  'food-allergen introduction data of my children recorded in my account — with this AI ' +
  'assistant at my request. The assistant provider receives it as an independent ' +
  'controller under its own privacy policy. I can withdraw this at any time under ' +
  '"Connected apps" in the in-tolerance app; in-tolerance cannot delete what the ' +
  'assistant provider has already received or stored in chats.';

export const AGE_LABEL = 'I confirm that I am 18 years or older.';

export const MARKETING_LABEL =
  'Optional: send me occasional product news by email.';

export const CONSENT_TEXT = `${HEALTH_CONSENT_LABEL}\n${AGE_LABEL}`;
