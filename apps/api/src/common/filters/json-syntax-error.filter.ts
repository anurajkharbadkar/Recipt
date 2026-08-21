import type { Request, Response, NextFunction } from 'express';

/**
 * Express's own JSON body-parser middleware runs on every request before
 * any Nest code — guards, pipes, controllers, even a route's own try/catch
 * around req.rawBody (like the Cashfree webhook's). A malformed body
 * throws right there, and a Nest `@Catch()` ExceptionFilter never actually
 * sees it (confirmed: registering one for SyntaxError via
 * app.useGlobalFilters had no effect) — Express routes a middleware-level
 * throw to the next 4-arg error-handling middleware in the stack instead,
 * which is what this is. Without it, the raw V8 parser SyntaxError text
 * reached the client verbatim: "Expected property name or '}' in JSON at
 * position 1 (line 1 column 2)" — confirmed live (2026-08-21 flow audit)
 * against the webhook endpoint. Not sensitive data, but exactly the kind
 * of internal-implementation-detail message nothing external should see.
 *
 * Must be registered via `app.use(...)` *after* NestFactory.create() (so
 * it sits after Nest's own body-parser in the middleware stack) — see
 * main.ts.
 */
export function jsonSyntaxErrorHandler(err: unknown, _req: Request, res: Response, next: NextFunction) {
  const isBodyParseFailure =
    err instanceof SyntaxError &&
    ((err as unknown as { type?: string }).type === 'entity.parse.failed' ||
      (err as unknown as { status?: number }).status === 400);
  if (!isBodyParseFailure) {
    next(err);
    return;
  }
  res.status(400).json({ message: 'Malformed JSON in request body.', error: 'Bad Request', statusCode: 400 });
}
