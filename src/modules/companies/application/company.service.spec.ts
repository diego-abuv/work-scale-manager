import { describe, it, expect, vi } from 'vitest';
import { CompanyService } from './company.service.js';
import type { ICompanyRepository } from '../domain/company.repository.port.js';
import { Company } from '../domain/company.entity.js';

function createRepoMock(): Partial<ICompanyRepository> {
  return { create: vi.fn(), findById: vi.fn(), findBySlug: vi.fn() };
}

describe('CompanyService', () => {
  it('should create and return a company', async () => {
    const mockRepo = createRepoMock() as ICompanyRepository;
    const company = new Company('ACME', 'acme');
    company.id = 'uuid-1';
    vi.mocked(mockRepo.create!).mockResolvedValue(company);

    const service = new CompanyService(mockRepo);
    const result = await service.create({ name: 'ACME', slug: 'acme' });

    expect(result.slug).toBe('acme');
    expect(mockRepo.create).toHaveBeenCalled();
  });
});
