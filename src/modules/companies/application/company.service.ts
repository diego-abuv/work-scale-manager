import { Injectable, Inject } from '@nestjs/common';
import { Company } from '../domain/company.entity.js';
import { COMPANY_REPOSITORY, type ICompanyRepository } from '../domain/company.repository.port.js';
import { CompanyNotFoundError } from '../domain/errors/company.errors.js';
import { CreateCompanyDto } from './dtos/create-company.dto.js';
import { UpdateCompanyDto } from './dtos/update-company.dto.js';

@Injectable()
export class CompanyService {
  constructor(
    @Inject(COMPANY_REPOSITORY) private readonly repo: ICompanyRepository,
  ) {}

  async create(dto: CreateCompanyDto): Promise<Company> {
    const company = new Company(dto.name, dto.slug);
    return this.repo.create(company);
  }

  async findAll(): Promise<Company[]> {
    return this.repo.findAll();
  }

  async findById(id: string): Promise<Company | null> {
    return this.repo.findById(id);
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.repo.findById(id);
    if (!company) throw new CompanyNotFoundError();
    company.update({ name: dto.name, slug: dto.slug });
    return this.repo.update(company);
  }

  async delete(id: string): Promise<void> {
    const company = await this.repo.findById(id);
    if (!company) throw new CompanyNotFoundError();
    await this.repo.delete(id);
  }

  async findBySlug(slug: string): Promise<Company | null> {
    return this.repo.findBySlug(slug);
  }
}
