import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma-global/index.js';
import { PrismaService } from '../../../../infra/prisma/prisma.service.js';
import { Company } from '../../domain/company.entity.js';
import { ICompanyRepository } from '../../domain/company.repository.port.js';
import {
  CompanyNotFoundError,
  CompanySlugTakenError,
} from '../../domain/errors/company.errors.js';

type CompanyRecord = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
};

function toDomain(record: CompanyRecord): Company {
  const company = new Company(record.name, record.slug);
  company.id = record.id;
  company.createdAt = record.createdAt;
  company.updatedAt = record.updatedAt;
  return company;
}

@Injectable()
export class PrismaCompanyRepository implements ICompanyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(company: Company): Promise<Company> {
    try {
      const created = await this.prisma.company.create({
        data: { name: company.name, slug: company.slug },
      });

      return toDomain(created);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new CompanySlugTakenError();
      }
      throw error;
    }
  }

  async findAll(): Promise<Company[]> {
    const records = await this.prisma.company.findMany();
    return records.map(toDomain);
  }

  async findById(id: string): Promise<Company | null> {
    const found = await this.prisma.company.findUnique({ where: { id } });
    return found ? toDomain(found) : null;
  }

  async findBySlug(slug: string): Promise<Company | null> {
    const found = await this.prisma.company.findUnique({ where: { slug } });
    return found ? toDomain(found) : null;
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.company.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new CompanyNotFoundError();
      }
      throw error;
    }
  }

  async update(company: Company): Promise<Company> {
    try {
      const updated = await this.prisma.company.update({
        where: { id: company.id! },
        data: { name: company.name, slug: company.slug },
      });

      return toDomain(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new CompanySlugTakenError();
      }
      throw error;
    }
  }
}
