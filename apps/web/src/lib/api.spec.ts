import { isAuthRecoveryExemptUrl } from './api';

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
