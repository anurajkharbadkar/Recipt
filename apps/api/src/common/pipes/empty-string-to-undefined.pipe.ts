import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';

/**
 * Runs before the global ValidationPipe (see main.ts's pipe order) and
 * converts every empty-string value in the incoming body/query/params to
 * `undefined`, recursively.
 *
 * The bug this closes: class-validator's `@IsOptional()` only skips
 * validation for `null`/`undefined` — NOT `''`. Every optional field that
 * pairs `@IsOptional()` with a more restrictive validator (`@IsEmail()`,
 * `@MinLength()`, `@IsEnum()`, `@Matches()`) rejects a blank optional
 * field a user correctly left empty, with a message like "email must be
 * an email" — confusing on a field they never touched. Confirmed live:
 * leaving the collector form's optional email/password blank produced
 * exactly that on both fields simultaneously (2026-08-21 message-quality
 * audit). This affects every DTO that ever adds this combination, not
 * just the two caught live, so it's fixed once here instead of patched
 * field-by-field (and re-broken the next time someone adds a DTO).
 *
 * Only touches plain objects/arrays/strings — leaves Buffers and other
 * non-plain values (e.g. multer file uploads) untouched.
 */
@Injectable()
export class EmptyStringToUndefinedPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body' && metadata.type !== 'query') return value;
    return this.strip(value);
  }

  private strip(value: unknown): unknown {
    if (value === '') return undefined;
    if (Array.isArray(value)) return value.map((v) => this.strip(v));
    if (value && typeof value === 'object' && value.constructor === Object) {
      const result: Record<string, unknown> = {};
      for (const [key, v] of Object.entries(value)) {
        result[key] = this.strip(v);
      }
      return result;
    }
    return value;
  }
}
