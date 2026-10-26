import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CompanyService } from '../application/company.service.js';
import { CompanyResponseDto } from './dtos/company.response.dto.js';
import { CreateCompanyRequestDto } from './dtos/create-company.request.dto.js';
import { UpdateCompanyRequestDto } from './dtos/update-company.request.dto.js';
import { mapCompanyError } from './company-error.mapper.js';
// import { LoggerService } from '../../../shared/logger/logger.service.js';
import { LogInterceptor } from '../../../shared/logger/logger.interceptor.js';

@UseInterceptors(LogInterceptor)
@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly service: CompanyService,
    // private readonly logger: LoggerService,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Body() dto: CreateCompanyRequestDto,
  ): Promise<CompanyResponseDto> {
    try {
      const company = await this.service.create({
        name: dto.name,
        slug: dto.slug,
      });
      return CompanyResponseDto.from(company);
    } catch (error) {
      mapCompanyError(error);
    }
  }

  @Get()
  async findAll(): Promise<CompanyResponseDto[]> {
    const companies = await this.service.findAll();
    return companies.map((company) => CompanyResponseDto.from(company));
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string): Promise<CompanyResponseDto> {
    const company = await this.service.findBySlug(slug);
    if (!company) throw new NotFoundException();
    return CompanyResponseDto.from(company);
  }

  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CompanyResponseDto> {
    const company = await this.service.findById(id);
    if (!company) throw new NotFoundException();
    return CompanyResponseDto.from(company);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyRequestDto,
  ): Promise<CompanyResponseDto> {
    try {
      const company = await this.service.update(id, {
        name: dto.name,
        slug: dto.slug,
      });
      return CompanyResponseDto.from(company);
    } catch (error) {
      mapCompanyError(error);
    }
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    try {
      await this.service.delete(id);
    } catch (error) {
      mapCompanyError(error);
    }
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async replace(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCompanyRequestDto,
  ): Promise<CompanyResponseDto> {
    try {
      const company = await this.service.update(id, {
        name: dto.name,
        slug: dto.slug,
      });
      return CompanyResponseDto.from(company);
    } catch (error) {
      mapCompanyError(error);
    }
  }
}
