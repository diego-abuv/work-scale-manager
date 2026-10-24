export class CompanyNotFoundError extends Error {
  constructor() {
    super('Company not found');
    this.name = 'CompanyNotFoundError';
  }
}

export class CompanySlugTakenError extends Error {
  constructor() {
    super('Slug already in use');
    this.name = 'CompanySlugTakenError';
  }
}
