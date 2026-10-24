import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  CompanyNotFoundError,
  CompanySlugTakenError,
} from '../domain/errors/company.errors.js';

export function mapCompanyError(error: unknown): never {
  if (error instanceof CompanyNotFoundError) {
    throw new NotFoundException();
  }
  if (error instanceof CompanySlugTakenError) {
    throw new ConflictException('Slug already in use');
  }
  throw error;
}
