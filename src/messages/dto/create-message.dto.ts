import { IsUUID, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @IsUUID()
  recipientId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsUUID()
  applicationId?: string;
}
