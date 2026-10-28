import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateCompanyRequestDto {
  @ApiProperty({ example: 'ACME Empresarial', required: false })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @ApiProperty({ example: 'acme', required: false })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  slug?: string;
}
