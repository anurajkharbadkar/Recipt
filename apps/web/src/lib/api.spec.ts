import { isAuthRecoveryExemptUrl, getErrorMessage } from './api';

// Regression coverage for a real, previously-live bug (2026-08-21 message-
// quality audit): the axios response interceptor treated *every* 401 as
// "session expired" and force-navigated to /login — including the login
// endpoint's own 401 for a wrong password. Since the login page's own catch
// block never got a chance to run before that navigation tore the page
// down, every failed login silently reloaded the login page with zero
// feedback. The fix exempts the login/register endpoints from that
// recovery flow; this locks in exactly which URLs must stay exempt.
describe('isAuthRecoveryExemptUrl', () => {
  it('exempts the login endpoint', () => {
    expect(isAuthRecoveryExemptUrl('/auth/login')).toBe(true);
  });

  it('exempts the register endpoint', () => {
    expect(isAuthRecoveryExemptUrl('/auth/register')).toBe(true);
  });

  it('exempts a full baseURL-prefixed login URL', () => {
    expect(isAuthRecoveryExemptUrl('https://api.epavtibook.com/api/v1/auth/login')).toBe(true);
  });

  it('does not exempt an ordinary authenticated endpoint', () => {
    expect(isAuthRecoveryExemptUrl('/receipts')).toBe(false);
    expect(isAuthRecoveryExemptUrl('/auth/me')).toBe(false);
  });

  it('does not exempt an undefined url', () => {
    expect(isAuthRecoveryExemptUrl(undefined)).toBe(false);
  });
});

// Regression coverage for a real, previously-live bug (2026-08-22, found via
// a live register attempt during a Railway edge rate-limit incident): the
// `err?.response?.data?.message || fallback` pattern this replaced treated
// every non-response failure as the caller's generic fallback text — always
// phrased like "check your details" — even when the request never reached
// the server at all. A blocked/failed CORS preflight (same shape the
// browser reports for being offline) and a platform-level 429 both hit that
// fallback and told a citizen their *input* was wrong when it never was.
describe('getErrorMessage', () => {
  it('prefers the backend\'s own message when a response was received', () => {
    const err = { response: { status: 400, data: { message: 'Phone number already registered' } } };
    expect(getErrorMessage(err, 'fallback')).toBe('Phone number already registered');
  });

  it('gives a rate-limit-specific message for a 429, not the generic fallback', () => {
    const err = { response: { status: 429, data: {} } };
    expect(getErrorMessage(err, 'Registration failed. Please check your details.'))
      .toBe('Too many attempts — please wait a moment and try again.');
  });

  it('gives a server-error message for a 5xx, not the generic fallback', () => {
    const err = { response: { status: 503, data: {} } };
    expect(getErrorMessage(err, 'fallback')).toBe('Something went wrong on our end. Please try again in a moment.');
  });

  it('does not blame the user\'s input when no response reached the browser at all', () => {
    // No `response` key — exactly the shape of a failed CORS preflight or
    // being offline (axios/the browser can't tell those apart either).
    const err = { message: 'Network Error' };
    expect(getErrorMessage(err, 'Registration failed. Please check your details.'))
      .toBe("Couldn't reach the server. Please check your connection and try again in a moment.");
  });

  it('falls back to the caller\'s message only for a real response with no message field', () => {
    const err = { response: { status: 422, data: {} } };
    expect(getErrorMessage(err, 'Registration failed. Please check your details.')).toBe('Registration failed. Please check your details.');
  });
});
