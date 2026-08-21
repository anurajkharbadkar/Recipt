import { extensionFor } from './pipes/image-upload.pipe';

// Regression coverage for a real, previously-live bug (2026-08-21 flow
// audit): the logo/idol-image upload endpoints hardcoded a `.png`
// extension regardless of the file's real type — a genuine JPEG upload got
// stored (and served) as "logo.png". extensionFor derives the real
// extension from the (now-validated, guaranteed-image) mimetype instead.
describe('extensionFor', () => {
  it('maps each supported image mimetype to its real extension', () => {
    expect(extensionFor('image/jpeg')).toBe('jpg');
    expect(extensionFor('image/png')).toBe('png');
    expect(extensionFor('image/webp')).toBe('webp');
    expect(extensionFor('image/gif')).toBe('gif');
  });

  it('falls back to jpg for an unrecognized mimetype rather than throwing', () => {
    // Unreachable in practice — imageUploadPipe's FileTypeValidator already
    // rejects anything outside the four types above before this runs — but
    // a safe, non-throwing fallback is cheap insurance against a future
    // caller using this helper without that guard.
    expect(extensionFor('application/octet-stream')).toBe('jpg');
  });
});
