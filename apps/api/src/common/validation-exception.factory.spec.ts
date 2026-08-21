import type { ValidationError } from 'class-validator';
import { validationExceptionFactory } from './validation-exception.factory';

// Regression coverage for a real, previously-live bug (2026-08-21 message-
// quality audit): NestJS's default ValidationPipe sends `message` as an
// array of raw constraint strings. At least 9 places in the web app do
// `toast.error(err.response.data.message || fallback)`, and react-hot-toast
// stringifies an array with no separator — two failed constraints rendered
// as one run-on sentence ("...10 charactersemail must be..."), confirmed
// live on the collector-creation form. This factory joins them into one
// readable, capitalized, period-punctuated string instead.
function error(constraints: Record<string, string>, children: ValidationError[] = []): ValidationError {
  return { property: 'field', constraints, children } as ValidationError;
}

describe('validationExceptionFactory', () => {
  it('formats a single constraint as one capitalized, punctuated sentence', () => {
    const exc = validationExceptionFactory([error({ minLength: 'phone must be longer than or equal to 10 characters' })]);
    expect(exc.getResponse()).toMatchObject({
      message: 'Phone must be longer than or equal to 10 characters.',
    });
  });

  it('joins multiple failed constraints with a space, each as its own sentence — not concatenated', () => {
    const exc = validationExceptionFactory([
      error({ minLength: 'phone must be longer than or equal to 10 characters' }),
      error({ isEmail: 'email must be an email' }),
    ]);
    const { message } = exc.getResponse() as { message: string };
    expect(message).toBe('Phone must be longer than or equal to 10 characters. Email must be an email.');
    // The literal bug this replaces: no run-on with zero separator.
    expect(message).not.toMatch(/characters[a-z]/i);
  });

  it('recurses into nested validation errors (e.g. a nested DTO)', () => {
    const exc = validationExceptionFactory([
      error({}, [error({ isString: 'name must be a string' })]),
    ]);
    expect((exc.getResponse() as { message: string }).message).toBe('Name must be a string.');
  });

  it('falls back to a generic message when there are no constraint messages at all', () => {
    const exc = validationExceptionFactory([]);
    expect((exc.getResponse() as { message: string }).message).toBe('Invalid request — please check your input.');
  });
});
