import { ParseFilePipe, FileTypeValidator, MaxFileSizeValidator, BadRequestException } from '@nestjs/common';

/**
 * Neither of the two file-upload endpoints (organization logo, Interactive
 * Pavti idol/darshan photo) validated the uploaded file at all — any
 * content-type went straight to R2 storage under a hardcoded `.png` name,
 * with the URL then handed back as if it were a real, valid image.
 * Confirmed live: uploading a plain .txt file "succeeded" and returned a
 * working-looking `logoUrl` (2026-08-21 flow audit). That URL would later
 * render as a broken image on every receipt and report using it — and more
 * generally, accepting literally any file type onto a public bucket serving
 * traffic under this app's domain isn't something to do without a reason.
 *
 * `undefinedFileError`: the default ParseFilePipe throws a raw multer-style
 * message ("File is required") when the field is missing entirely — kept
 * consistent in tone with this app's other validation messages instead.
 */
// Every upload storing this file previously hardcoded a `.png` extension
// regardless of the real content — a genuine JPEG got stored (and served)
// as "logo.png". Pairs with imageUploadPipe's fileType allowlist, so this
// is only ever called on an already-confirmed image/(jpeg|png|webp|gif).
const EXTENSIONS_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export function extensionFor(mimetype: string): string {
  return EXTENSIONS_BY_MIME[mimetype] ?? 'jpg';
}

export function imageUploadPipe(maxSizeMb = 5): ParseFilePipe {
  return new ParseFilePipe({
    validators: [
      new MaxFileSizeValidator({
        maxSize: maxSizeMb * 1024 * 1024,
        message: `Image must be ${maxSizeMb}MB or smaller.`,
      }),
      new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ }),
    ],
    exceptionFactory: (error) => {
      // FileTypeValidator has no custom-message option in NestJS 10 (unlike
      // MaxFileSizeValidator above) — its generated text always contains
      // "expected type", which is what we match on here rather than the
      // exact string, so a wording tweak in a future Nest version doesn't
      // silently fall through to the raw technical message.
      const isFileTypeFailure = typeof error === 'string' && error.includes('expected type');
      return new BadRequestException(
        isFileTypeFailure
          ? 'Please upload a JPEG, PNG, WebP, or GIF image.'
          : error || 'Please choose a file to upload.',
      );
    },
  });
}
