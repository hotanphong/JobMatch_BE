import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  Query,
  Put,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { JobStatus } from '../common/enums/job-status.enum';
import { ApiResponse } from '../common/responses/api.response';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@Controller('jobs')
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Roles(UserRole.EMPLOYER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  async create(
    @Body() createJobDto: CreateJobDto,
    @CurrentUser('id') employerId: string,
  ) {
    const job = await this.jobsService.create(createJobDto, employerId);
    return new ApiResponse(HttpStatus.CREATED, 'Job created successfully', job);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYER)
  @Get('my-posts')
  async findByEmployer(@CurrentUser('id') employerId: string) {
    const jobs = await this.jobsService.findByEmployer(employerId);
    return { jobs, statusCode: 200, message: 'Success' };
  }
  @Get()
  async findAll(@Query('status') status?: JobStatus) {
    const jobs = await this.jobsService.findAll(status);
    return { jobs, statusCode: 200, message: 'Success' };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYER)
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const job = await this.jobsService.findOne(id, userId);
    return new ApiResponse(HttpStatus.OK, 'Job retrieved successfully', job);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYER)
  async update(
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
    @CurrentUser('id') userId: string,
  ) {
    const job = await this.jobsService.update(id, updateJobDto, userId);
    return new ApiResponse(HttpStatus.OK, 'Job updated successfully', job);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYER)
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.jobsService.delete(id, userId);
    return new ApiResponse(HttpStatus.OK, 'Job archived successfully');
  }
}
