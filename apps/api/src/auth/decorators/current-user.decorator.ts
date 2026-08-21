import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@pavti/shared';

/**
 * The exact shape JwtStrategy.validate() attaches to req.user — every
 * `@CurrentUser()` (no field name) extraction resolves to this. A decorator
 * factory can't propagate a different type per call based on the string
 * argument (`@CurrentUser('orgId')`), so single-field extractions still need
 * their own explicit parameter type at the call site (`orgId: string`,
 * `role: UserRole`, ...) — this type only covers the whole-object case,
 * replacing what used to be a bare `any` at nearly every controller method.
 */
export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  orgId: string;
  organization: { subscriptionExpiry: Date | null };
}

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
