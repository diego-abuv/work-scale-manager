import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../../domain/company.entity.js';

export class CompanyResponseDto {
  @ApiProperty({ example: 'c03843c5-1913-429f-9c46-574ecf64737f' })
  id: string;

  @ApiProperty({ example: 'ACME Empresarial' })
  name: string;

  @ApiProperty({ example: 'acme' })
  slug: string;

  @ApiProperty({ example: '2025-10-25T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-10-26T12:00:00.000Z' })
  updatedAt: Date;

  static from(company: Company): CompanyResponseDto {
    const response = new CompanyResponseDto();
    response.id = company.id!;
    response.name = company.name;
    response.slug = company.slug;
    response.createdAt = company.createdAt!;
    response.updatedAt = company.updatedAt!;
    return response;
  }
}
