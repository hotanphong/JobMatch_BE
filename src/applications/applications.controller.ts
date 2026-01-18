import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { ApiResponse } from '../common/responses/api.response';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsApplicationsController {
  constructor(private applicationsService: ApplicationsService) {}

  @Post(':jobId/applications')
  @Roles(UserRole.CANDIDATE)
  @UseGuards(RolesGuard)
  async create(
    @Param('jobId') jobId: string,
    @Body() createApplicationDto: CreateApplicationDto,
    @CurrentUser('id') candidateId: string,
  ) {
    const application = await this.applicationsService.create(
      jobId,
      candidateId,
      createApplicationDto,
    );
    return new ApiResponse(
      HttpStatus.CREATED,
      'Application submitted successfully',
      application,
    );
  }

  @Get(':jobId/applications')
  @Roles(UserRole.EMPLOYER)
  @UseGuards(RolesGuard)
  async getJobApplications(@Param('jobId') jobId: string) {
    const applications = await this.applicationsService.findByJob(jobId);
    return new ApiResponse(
      HttpStatus.OK,
      'Applications retrieved successfully',
      applications,
    );
  }

  @Patch(':jobId/applications/:applicationId/status')
  @Roles(UserRole.EMPLOYER)
  @UseGuards(RolesGuard)
  async updateApplicationStatus(
    @Param('applicationId') applicationId: string,
    @Body() updateApplicationStatusDto: UpdateApplicationStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    const application = await this.applicationsService.updateStatus(
      applicationId,
      updateApplicationStatusDto,
      userId,
    );
    return new ApiResponse(
      HttpStatus.OK,
      'Application status updated successfully',
      application,
    );
  }
}

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private applicationsService: ApplicationsService) {}

  @Get('me')
  @Roles(UserRole.CANDIDATE)
  @UseGuards(RolesGuard)
  async getMyApplications(@CurrentUser('id') candidateId: string) {
    const applications =
      await this.applicationsService.findByCandidate(candidateId);
    return new ApiResponse(
      HttpStatus.OK,
      'My applications retrieved successfully',
      applications,
    );
  }
}
