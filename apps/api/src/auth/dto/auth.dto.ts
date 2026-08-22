import {
  IsString, IsEmail, IsOptional, IsPhoneNumber, MinLength, IsEnum, IsIn
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionPlan } from '@pavti/shared';

// Every SubscriptionPlan is selectable at signup — FREE is the self-serve
// trial (see packages/shared PRICING_PLANS / MAX_RECEIPTS_BY_PLAN).
const SELECTABLE_PLANS = Object.values(SubscriptionPlan);

export class RegisterDto {
  @ApiProperty({ example: 'Shree Ganesh Mandal' })
  @IsString()
  organizationName: string;

  @ApiPropertyOptional({ example: 'श्री गणेश मंडळ' })
  @IsOptional()
  @IsString()
  organizationNameMarathi?: string;

  @ApiPropertyOptional({ example: 'श्री गणेश मंडल' })
  @IsOptional()
  @IsString()
  organizationNameHindi?: string;

  @ApiProperty({ example: 'Rajesh Kumar' })
  @IsString()
  adminName: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @MinLength(10)
  phone: string;

  @ApiPropertyOptional({ example: 'admin@mandal.org' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'SecurePassword@123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '123, MG Road, Pune' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Pune' })
  @IsString()
  city: string;

  @ApiPropertyOptional({ example: 'Maharashtra' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ enum: SELECTABLE_PLANS, example: SubscriptionPlan.BASIC })
  @IsIn(SELECTABLE_PLANS)
  subscriptionPlan: SubscriptionPlan;
}

export class LoginDto {
  // Disambiguates which org's User row to check when the login is a
  // COLLECTOR/TREASURER — their phone is only unique *within* an org (see
  // Organization.mandalCode's schema comment). Optional because the
  // ORG_ADMIN doesn't need it: their phone always equals their org's own
  // (globally-unique) Organization.phone, set at registration and never
  // editable since — see AuthService.login for the resolution this splits
  // into. Shown to every ORG_ADMIN in Settings to share with staff.
  @ApiPropertyOptional({ example: 'SGMP26', description: "The organization's Mandal Code — required for Collector/Treasurer login, not for the Mandal Admin (see Settings)" })
  @IsOptional()
  @IsString()
  @MinLength(4)
  mandalCode?: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'SecurePassword@123' })
  @IsString()
  password: string;
}


export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

// Self-service profile edit (the account page) — deliberately narrower than
// CollectorsService's UpdateCollectorDto (no role/isActive/areaId; those are
// an admin managing *someone else's* account, not this). Phone isn't here
// either: it's the login identifier and (for the ORG_ADMIN) must stay equal
// to Organization.phone per AuthService.findOrgAdminByPhone's whole reason
// for existing — changing it needs its own, more careful flow, not a plain
// field edit.
export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Rajesh Kumar' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'admin@mandal.org' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldSecurePassword@123' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'NewSecurePassword@456' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
