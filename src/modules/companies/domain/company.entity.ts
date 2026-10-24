export class Company {
  id?: string;
  name: string;
  slug: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(name: string, slug: string) {
    this.name = name;
    this.slug = slug;
  }

  update(changes: { name?: string; slug?: string }): void {
    if (changes.name !== undefined) this.name = changes.name;
    if (changes.slug !== undefined) this.slug = changes.slug;
  }
}
