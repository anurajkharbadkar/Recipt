import {
  IsString, IsEmail, IsOptional, IsPhoneNumber, MinLength, IsNumberString, Length
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}

export class LoginDto {
  @ApiProperty({ example: '9876543210' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'SecurePassword@123' })
  @IsString()
  password: string;
}

export class SendOtpDto {
  @ApiProperty({ example: '9876543210' })
  @IsString()
  @MinLength(10)
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '9876543210' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsNumberString()
  @Length(6, 6)
  otp: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}
