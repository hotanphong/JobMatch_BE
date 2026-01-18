import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './entities/job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobStatus } from '../common/enums/job-status.enum';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private jobsRepository: Repository<Job>,
  ) {}

  async create(createJobDto: CreateJobDto, employerId: string): Promise<Job> {
    const job = this.jobsRepository.create({
      ...createJobDto,
      employerId,
      status: createJobDto.status || JobStatus.DRAFT,
    });

    return this.jobsRepository.save(job);
  }

  async findAll(status?: JobStatus): Promise<Job[]> {
    const job = await this.jobsRepository.find({
      where: status ? { status } : {},
      relations: ['employer'],
    });
    return job;
  }

  async findOne(id: string, userId?: string): Promise<Job> {
    const job = await this.jobsRepository.findOne({
      where: { id },
      relations: ['employer'],
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    if (userId && job.employerId !== userId) {
      throw new ForbiddenException('You can only view your own jobs');
    }

    return job;
  }

  async update(
    id: string,
    updateJobDto: UpdateJobDto,
    userId: string,
  ): Promise<Job> {
    const job = await this.findOne(id);

    if (job.employerId !== userId) {
      throw new ForbiddenException('You can only update your own jobs');
    }

    Object.assign(job, updateJobDto);
    return this.jobsRepository.save(job);
  }

  async delete(id: string, userId: string): Promise<void> {
    const job = await this.findOne(id);

    if (job.employerId !== userId) {
      throw new ForbiddenException('You can only delete your own jobs');
    }

    await this.jobsRepository.softDelete(id);
  }

  async findByEmployer(employerId: string): Promise<Job[]> {
    return this.jobsRepository.find({
      where: { employerId },
      relations: ['applications', 'applications.candidate'],
    });
  }
}
