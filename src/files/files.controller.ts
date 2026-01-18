import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Query,
  UseGuards,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { ApiResponse } from '../common/responses/api.response';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse as ApiSwaggerResponse,
} from '@nestjs/swagger';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post('upload')
  @Roles(UserRole.CANDIDATE)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Upload file' })
  @ApiSwaggerResponse({
    status: 201,
    description: 'File uploaded successfully',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async uploadFile(
    @UploadedFile() file: any,
    @Query('applicationId') applicationId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (!applicationId) {
      throw new BadRequestException('applicationId is required');
    }

    const uploadedFile = await this.filesService.uploadFile(
      file,
      applicationId,
    );

    return new ApiResponse(
      HttpStatus.CREATED,
      'File uploaded successfully',
      uploadedFile,
    );
  }
}
