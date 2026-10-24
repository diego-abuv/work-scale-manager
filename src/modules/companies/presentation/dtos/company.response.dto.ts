import { Company } from '../../domain/company.entity.js';

export class CompanyResponseDto {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
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
