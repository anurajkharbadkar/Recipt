import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

/**
 * NestJS's default ValidationPipe behavior sends `message` as an ARRAY of
 * every failed constraint's raw text (e.g.
 * `["phone must be longer than or equal to 10 characters", "email must be
 * an email"]`). At least 9 places in the web app do
 * `toast.error(err.response.data.message || fallback)` — react-hot-toast
 * stringifies an array by joining with no separator at all, so two
 * messages land as one run-on sentence with no space between them
 * ("...10 charactersemail must be..."). Confirmed live in the collector-
 * creation form (2026-08-21 message-quality audit).
 *
 * This factory flattens every constraint (including nested DTOs, via
 * ValidationError.children) into one readable, period-joined string, so
 * every existing frontend call site — most of which assume `message` is
 * already display-ready text — renders it correctly with no changes on
 * their end.
 */
function collectMessages(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  for (const error of errors) {
    if (error.constraints) messages.push(...Object.values(error.constraints));
    if (error.children?.length) messages.push(...collectMessages(error.children));
  }
  return messages;
}

export function validationExceptionFactory(errors: ValidationError[]): BadRequestException {
  const messages = collectMessages(errors);
  // Capitalize + ensure each fragment reads as its own sentence before
  // joining — matches the tone of this API's other hand-written exception
  // messages (see AuthService.login) more closely than the raw
  // lowercase-first, no-period class-validator default.
  const formatted = messages
    .map((m) => (m.charAt(0).toUpperCase() + m.slice(1)).replace(/[.!?]?$/, '.'))
    .join(' ');
  return new BadRequestException(formatted || 'Invalid request — please check your input.');
}
