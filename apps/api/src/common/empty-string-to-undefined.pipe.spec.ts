import { EmptyStringToUndefinedPipe } from './pipes/empty-string-to-undefined.pipe';

// Regression coverage for a real, previously-live bug (2026-08-21 message-
// quality audit): class-validator's @IsOptional() only skips validation for
// null/undefined, not ''. Every DTO field pairing @IsOptional() with a
// stricter validator (@IsEmail(), @MinLength(), @IsEnum()...) rejected a
// blank optional field the user correctly left empty — e.g. leaving the
// collector form's optional email/password blank produced "email must be
// an email" and "password must be longer than or equal to 6 characters"
// simultaneously, confirmed live. This pipe normalizes '' to undefined
// before validation runs, closing that for every DTO at once.
describe('EmptyStringToUndefinedPipe', () => {
  const pipe = new EmptyStringToUndefinedPipe();
  const bodyMeta = { type: 'body' as const, metatype: undefined, data: undefined };
  const paramMeta = { type: 'param' as const, metatype: undefined, data: undefined };

  it('converts an empty string to undefined', () => {
    expect(pipe.transform('', bodyMeta)).toBeUndefined();
  });

  it('converts empty-string fields inside a body object, leaving others untouched', () => {
    const result = pipe.transform(
      { name: 'Test', email: '', password: '', phone: '9000000000' },
      bodyMeta,
    );
    expect(result).toEqual({ name: 'Test', email: undefined, password: undefined, phone: '9000000000' });
  });

  it('recurses into nested objects and arrays', () => {
    const result = pipe.transform(
      { splits: [{ vendorId: 'v1', note: '' }], meta: { label: '' } },
      bodyMeta,
    );
    expect(result).toEqual({ splits: [{ vendorId: 'v1', note: undefined }], meta: { label: undefined } });
  });

  it('leaves non-empty values, numbers, and booleans untouched', () => {
    const result = pipe.transform({ amount: 0, active: false, name: 'x' }, bodyMeta);
    expect(result).toEqual({ amount: 0, active: false, name: 'x' });
  });

  it('only applies to body and query — leaves route params untouched', () => {
    // A route param is never a user-facing "optional field left blank";
    // an empty string there is already meaningless as a resource id, and
    // touching it isn't this pipe's concern.
    expect(pipe.transform('', paramMeta)).toBe('');
  });
});
