import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from './entities/application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application.dto';
import { JobsService } from '../jobs/jobs.service';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private applicationsRepository: Repository<Application>,
    private jobsService: JobsService,
  ) {}

  async create(
    jobId: string,
    candidateId: string,
    createApplicationDto: CreateApplicationDto,
  ): Promise<Application> {
    await this.jobsService.findOne(jobId);

    const candidateApplicationCount = await this.applicationsRepository.count({
      where: { candidateId },
    });

    if (candidateApplicationCount > 0) {
      throw new ForbiddenException('Only new candidates can apply for jobs');
    }

    const existingApplication = await this.applicationsRepository.findOne({
      where: { jobId, candidateId },
    });

    if (existingApplication) {
      throw new BadRequestException('You have already applied for this job');
    }

    const application = this.applicationsRepository.create({
      jobId,
      candidateId,
      ...createApplicationDto,
    });

    return this.applicationsRepository.save(application);
  }

  async findByCandidate(candidateId: string): Promise<Application[]> {
    return this.applicationsRepository.find({
      where: { candidateId },
      relations: ['job', 'job.employer'],
    });
  }

  async findByJob(jobId: string): Promise<Application[]> {
    return this.applicationsRepository.find({
      where: { jobId },
      relations: ['candidate'],
    });
  }

  async findOne(id: string): Promise<Application> {
    const application = await this.applicationsRepository.findOne({
      where: { id },
      relations: ['job', 'candidate'],
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    return application;
  }

  async updateStatus(
    id: string,
    updateApplicationStatusDto: UpdateApplicationStatusDto,
    userId: string,
  ): Promise<Application> {
    const application = await this.findOne(id);
    const job = await this.jobsService.findOne(application.jobId);

    if (job.employerId !== userId) {
      throw new ForbiddenException(
        'Only the job employer can update application status',
      );
    }

    application.status = updateApplicationStatusDto.status;
    return this.applicationsRepository.save(application);
  }
}
