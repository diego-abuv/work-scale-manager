import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateCompanyRequestDto {
  @ApiProperty({ example: 'ACME Empresarial' })
  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ example: 'acme' })
  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  slug: string;
}
