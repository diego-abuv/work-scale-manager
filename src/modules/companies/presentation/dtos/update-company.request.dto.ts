import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateCompanyRequestDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  slug?: string;
}
