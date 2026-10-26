import { describe, it, expect, vi } from 'vitest';
import { CompanyService } from './company.service.js';
import type { ICompanyRepository } from '../domain/company.repository.port.js';
import { Company } from '../domain/company.entity.js';

function createRepoMock(): ICompanyRepository {
  const create = vi.fn();
  const findById = vi.fn();
  const findBySlug = vi.fn();
  const findAll = vi.fn();
  const update = vi.fn();
  const deleteFn = vi.fn();

  return {
    create,
    findById,
    findBySlug,
    findAll,
    update,
    delete: deleteFn,
  };
}

describe('CompanyService', () => {
  it('should create and return a company', async () => {
    const mockRepo = createRepoMock();
    const { create } = mockRepo;
    const company = new Company('ACME', 'acme');
    company.id = 'uuid-1';
    vi.mocked(create).mockResolvedValue(company);

    const service = new CompanyService(mockRepo);
    const result = await service.create({ name: 'ACME', slug: 'acme' });

    expect(result?.slug).toBe('acme');
    expect(create).toHaveBeenCalled();
  });

  it('should find all companies', async () => {
    const mockRepo = createRepoMock();
    const { findAll } = mockRepo;
    const company = new Company('ACME', 'acme');
    company.id = 'uuid-1';
    vi.mocked(findAll).mockResolvedValue([company]);

    const service = new CompanyService(mockRepo);
    const result = await service.findAll();

    expect(result[0]?.slug).toBe('acme');
    expect(findAll).toHaveBeenCalled();
  });

  it('should find a company by slug', async () => {
    const mockRepo = createRepoMock();
    const { findBySlug } = mockRepo;
    const company = new Company('ACME', 'acme');
    company.id = 'uuid-1';
    vi.mocked(findBySlug).mockResolvedValue(company);

    const service = new CompanyService(mockRepo);
    const result = await service.findBySlug('acme');

    expect(result?.slug).toBe('acme');
    expect(findBySlug).toHaveBeenCalled();
  });

  it('should find a company by id', async () => {
    const mockRepo = createRepoMock();
    const { findById } = mockRepo;
    const company = new Company('ACME', 'acme');
    company.id = 'uuid-1';
    vi.mocked(findById).mockResolvedValue(company);

    const service = new CompanyService(mockRepo);
    const result = await service.findById('uuid-1');

    expect(result?.slug).toBe('acme');
    expect(findById).toHaveBeenCalled();
  });

  it('should update a company', async () => {
    const mockRepo = createRepoMock();
    const { findById, update } = mockRepo;
    const company = new Company('ACME', 'acme');
    company.id = 'uuid-1';
    vi.mocked(findById).mockResolvedValue(company);
    vi.mocked(update).mockResolvedValue(company);

    const service = new CompanyService(mockRepo);
    const result = await service.update('uuid-1', {
      name: 'ACME Updated',
      slug: 'acme-updated',
    });

    expect(result?.slug).toBe('acme-updated');
    expect(findById).toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
  });

  it('should delete a company', async () => {
    const mockRepo = createRepoMock();
    const { findById, delete: deleteCompany } = mockRepo;
    const company = new Company('ACME', 'acme');
    company.id = 'uuid-1';
    vi.mocked(findById).mockResolvedValue(company);
    vi.mocked(deleteCompany).mockResolvedValue();

    const service = new CompanyService(mockRepo);
    await service.delete('uuid-1');

    expect(deleteCompany).toHaveBeenCalled();
  });
});
