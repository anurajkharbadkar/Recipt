import {
  Controller, Post, Patch, Delete, Body, Get, UseGuards, HttpCode, HttpStatus
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterDto, LoginDto, RefreshTokenDto, UpdateProfileDto, ChangePasswordDto, DeleteAccountDto,
  RequestPasswordResetDto, ResetPasswordDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new organization and admin user' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with phone + password' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update the current user's own name/email (the account page)" })
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(userId, dto);
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Change the current user's own password (requires the current one)" })
  changeMyPassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete the current user's own account (requires password; refused for ORG_ADMIN — see AuthService.deleteMyAccount)" })
  deleteMe(@CurrentUser('id') userId: string, @Body() dto: DeleteAccountDto) {
    return this.authService.deleteMyAccount(userId, dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  // Tight — this triggers a real WhatsApp send per call, and is public
  // (no auth, since the whole point is recovering access without being
  // logged in), making it a natural target for spamming someone's phone.
  @Throttle({ short: { limit: 1, ttl: 5000 }, long: { limit: 3, ttl: 3600000 } })
  @ApiOperation({ summary: 'Request a password-reset OTP over WhatsApp' })
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 3, ttl: 1000 }, long: { limit: 10, ttl: 3600000 } })
  @ApiOperation({ summary: 'Complete a password reset with the OTP from /auth/forgot-password' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
