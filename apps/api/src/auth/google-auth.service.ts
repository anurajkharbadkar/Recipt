import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

export interface VerifiedGoogleUser {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  emailVerified: boolean;
}

@Injectable()
export class GoogleAuthService {
  private oauth2Client: OAuth2Client;
  private readonly logger = new Logger(GoogleAuthService.name);

  constructor(private configService: ConfigService) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    this.oauth2Client = new OAuth2Client(clientId);
  }

  async verifyIdToken(idToken: string): Promise<VerifiedGoogleUser> {
    try {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken,
        audience: clientId ? [clientId] : undefined,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new UnauthorizedException('Invalid Google token payload');
      }

      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        avatarUrl: payload.picture,
        emailVerified: !!payload.email_verified,
      };
    } catch (err: any) {
      this.logger.error(`Google ID token verification failed: ${err?.message || err}`);
      throw new UnauthorizedException('Invalid Google ID Token');
    }
  }
}
