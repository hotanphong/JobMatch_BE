import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageStatusDto } from './dto/update-message-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post()
  async create(
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser() user: any,
  ) {
    return this.messagesService.create(createMessageDto, user.id);
  }

  @Get('conversation/:otherUserId')
  async getConversation(
    @Param('otherUserId') otherUserId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
    @CurrentUser() user: any,
  ) {
    return this.messagesService.findConversation(
      user.id,
      otherUserId,
      Math.min(parseInt(limit as any) || 50, 100),
      Math.max(parseInt(offset as any) || 0, 0),
    );
  }

  @Get('received')
  async getReceivedMessages(
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
    @CurrentUser() user: any,
  ) {
    return this.messagesService.findByRecipient(
      user.id,
      Math.min(parseInt(limit as any) || 50, 100),
      Math.max(parseInt(offset as any) || 0, 0),
    );
  }

  @Get('sent')
  async getSentMessages(
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
    @CurrentUser() user: any,
  ) {
    return this.messagesService.findBySender(
      user.id,
      Math.min(parseInt(limit as any) || 50, 100),
      Math.max(parseInt(offset as any) || 0, 0),
    );
  }

  @Get('list')
  async getConversationList(@CurrentUser() user: any) {
    return this.messagesService.getConversationList(user.id);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.messagesService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateMessageStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.messagesService.updateStatus(id, updateStatusDto, user.id);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    return this.messagesService.delete(id, user.id);
  }
}
