import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { ApplyJobDto } from './dto/apply-job.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { ListJobDto } from './dto/list-job.dto';

@Injectable()
export class RecruitmentService {
  constructor(private prisma: PrismaService) {}

  private async getEmployeeFromUser(userId: string) {
    const user = await this.prisma.tr_users.findUnique({
      where: { id: userId },
      include: { tr_employees: true },
    });
    if (!user || !user.tr_employees) {
      throw new NotFoundException('Employee not found');
    }
    return user.tr_employees;
  }

  private generateSlug(title: string): string {
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
      '-' +
      Date.now()
    );
  }

  async createJob(userId: string, dto: CreateJobDto) {
    const user = await this.prisma.tr_users.findUnique({
      where: { id: userId },
      include: { tr_employees: true, ms_roles: true },
    });

    if (!user || !user.tr_employees) {
      throw new NotFoundException('Employee not found');
    }

    const roleName = user.ms_roles?.name || 'karyawan';
    if (!['admin', 'hrd', 'manager_hrga', 'super_admin'].includes(roleName)) {
      throw new ForbiddenException('Only HR/Admin can create job postings');
    }

    const slug = dto.public_slug || this.generateSlug(dto.title);

    // Check slug uniqueness
    const existing = await this.prisma.ms_job_postings.findUnique({
      where: { public_slug: slug },
    });
    if (existing) {
      throw new BadRequestException('Public slug already exists');
    }

    const job = await this.prisma.ms_job_postings.create({
      data: {
        company_id: user.tr_employees.department_id
          ? (
              await this.prisma.ms_departments.findUnique({
                where: {
                  id: dto.department_id || user.tr_employees.department_id!,
                },
              })
            )?.company_id || user.company_id
          : user.company_id,
        title: dto.title,
        department_id: dto.department_id,
        position_id: dto.position_id,
        location_id: dto.location_id,
        description: dto.description,
        requirements: dto.requirements,
        employment_type: dto.employment_type,
        public_slug: slug,
        status: 'active',
        opened_at: dto.opened_at ? new Date(dto.opened_at) : new Date(),
        closed_at: dto.closed_at ? new Date(dto.closed_at) : null,
        created_by: userId,
      },
    });

    return job;
  }

  async listJobs(query: ListJobDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.ms_job_postings.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          ms_departments: { select: { id: true, name: true } },
          ms_positions: { select: { id: true, name: true } },
          ms_locations: { select: { id: true, name: true } },
        },
      }),
      this.prisma.ms_job_postings.count({ where }),
    ]);

    return { data, meta: { page, limit, total } };
  }

  async getJobBySlug(slug: string) {
    const job = await this.prisma.ms_job_postings.findUnique({
      where: { public_slug: slug },
      include: {
        ms_departments: { select: { id: true, name: true } },
        ms_positions: { select: { id: true, name: true } },
        ms_locations: { select: { id: true, name: true } },
      },
    });

    if (!job) {
      throw new NotFoundException('Job posting not found');
    }

    return job;
  }

  async applyJob(dto: ApplyJobDto) {
    const job = await this.prisma.ms_job_postings.findUnique({
      where: { id: dto.job_posting_id },
    });

    if (!job) {
      throw new NotFoundException('Job posting not found');
    }

    if (job.status !== 'active') {
      throw new BadRequestException('This job posting is no longer active');
    }

    const application = await this.prisma.tr_job_applications.create({
      data: {
        job_posting_id: dto.job_posting_id,
        full_name: dto.full_name,
        email: dto.email,
        phone: dto.phone,
        resume_url: dto.resume_url,
        cover_letter: dto.cover_letter,
        status: 'new',
      },
    });

    return application;
  }

  async listApplications(userId: string, query: any) {
    const user = await this.prisma.tr_users.findUnique({
      where: { id: userId },
      include: { tr_employees: true, ms_roles: true },
    });

    if (!user || !user.tr_employees) {
      throw new NotFoundException('Employee not found');
    }

    const roleName = user.ms_roles?.name || 'karyawan';
    if (!['admin', 'hrd', 'manager_hrga', 'super_admin'].includes(roleName)) {
      throw new ForbiddenException('Only HR/Admin can view applications');
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.job_posting_id) {
      where.job_posting_id = query.job_posting_id;
    }

    const [data, total] = await Promise.all([
      this.prisma.tr_job_applications.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          ms_job_postings: {
            select: { id: true, title: true, public_slug: true },
          },
        },
      }),
      this.prisma.tr_job_applications.count({ where }),
    ]);

    return { data, meta: { page, limit, total } };
  }

  async updateApplicationStatus(
    userId: string,
    applicationId: string,
    dto: UpdateApplicationStatusDto,
  ) {
    const user = await this.prisma.tr_users.findUnique({
      where: { id: userId },
      include: { ms_roles: true },
    });

    const roleName = user?.ms_roles?.name || 'karyawan';
    if (!['admin', 'hrd', 'manager_hrga', 'super_admin'].includes(roleName)) {
      throw new ForbiddenException(
        'Only HR/Admin can update application status',
      );
    }

    const application = await this.prisma.tr_job_applications.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const updated = await this.prisma.tr_job_applications.update({
      where: { id: applicationId },
      data: {
        status: dto.status,
        notes: dto.notes || application.notes,
      },
    });

    return updated;
  }
}
