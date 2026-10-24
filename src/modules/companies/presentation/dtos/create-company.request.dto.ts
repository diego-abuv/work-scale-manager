import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateCompanyRequestDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  name: string;

  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  slug: string;
}
