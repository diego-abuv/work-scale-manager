import { Company } from './company.entity.js';

export const COMPANY_REPOSITORY = Symbol('COMPANY_REPOSITORY');

export interface ICompanyRepository {
  create(company: Company): Promise<Company>;
  findAll(): Promise<Company[]>;
  findById(id: string): Promise<Company | null>;
  findBySlug(slug: string): Promise<Company | null>;
  update(company: Company): Promise<Company>;
  delete(id: string): Promise<void>;
}
