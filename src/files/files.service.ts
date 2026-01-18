import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity } from './entities/file.entity';
import * as fs from 'fs-extra';
import * as path from 'path';
import type { Express } from 'express';

@Injectable()
export class FilesService {
  private readonly uploadDir = process.env.UPLOAD_DIR || './uploads';

  constructor(
    @InjectRepository(FileEntity)
    private filesRepository: Repository<FileEntity>,
  ) {
    fs.ensureDirSync(this.uploadDir);
  }

  async uploadFile(file: any, applicationId: string): Promise<FileEntity> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size must not exceed 5MB');
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(this.uploadDir, fileName);

    await fs.writeFile(filePath, file.buffer);

    const fileEntity = this.filesRepository.create({
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      filePath: fileName,
      applicationId,
    });

    return this.filesRepository.save(fileEntity);
  }

  async findByApplication(applicationId: string): Promise<FileEntity[]> {
    return this.filesRepository.find({
      where: { applicationId },
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    const file = await this.filesRepository.findOne({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }

    const filePath = path.join(this.uploadDir, file.filePath);
    await fs.remove(filePath);

    await this.filesRepository.delete(fileId);
  }
}
