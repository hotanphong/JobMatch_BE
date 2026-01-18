import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageStatusDto } from './dto/update-message-status.dto';
import { MessageStatus } from '../common/enums/message-status.enum';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {}

  async create(
    createMessageDto: CreateMessageDto,
    senderId: string,
  ): Promise<Message> {
    const { recipientId, content } = createMessageDto;

    if (senderId === recipientId) {
      throw new BadRequestException('Cannot send message to yourself');
    }

    const message = this.messagesRepository.create({
      senderId,
      recipientId,
      content,
      status: MessageStatus.UNREAD,
    });

    return this.messagesRepository.save(message);
  }

  async findOne(id: string): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: { id },
      relations: ['sender', 'recipient', 'application'],
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    return message;
  }

  async findConversation(
    userId: string,
    otherUserId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ data: Message[]; total: number; hasMore: boolean }> {
    const [messages, total] = await this.messagesRepository.findAndCount({
      where: [
        { senderId: userId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: userId },
      ],
      relations: ['sender', 'recipient', 'application'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      data: messages.reverse(), // Reverse to show chronological order
      total,
      hasMore: offset + limit < total,
    };
  }

  async findByRecipient(
    recipientId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ data: Message[]; total: number; hasMore: boolean }> {
    const [messages, total] = await this.messagesRepository.findAndCount({
      where: { recipientId },
      relations: ['sender', 'recipient', 'application'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      data: messages,
      total,
      hasMore: offset + limit < total,
    };
  }

  async findBySender(
    senderId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ data: Message[]; total: number; hasMore: boolean }> {
    const [messages, total] = await this.messagesRepository.findAndCount({
      where: { senderId },
      relations: ['sender', 'recipient', 'application'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      data: messages,
      total,
      hasMore: offset + limit < total,
    };
  }

  async markAsRead(messageId: string, userId: string): Promise<Message> {
    const message = await this.findOne(messageId);

    if (message.recipientId !== userId) {
      throw new ForbiddenException('Only recipient can mark message as read');
    }

    message.status = MessageStatus.READ;
    return this.messagesRepository.save(message);
  }

  async updateStatus(
    messageId: string,
    updateStatusDto: UpdateMessageStatusDto,
    userId: string,
  ): Promise<Message> {
    const message = await this.findOne(messageId);

    if (message.recipientId !== userId) {
      throw new ForbiddenException('Only recipient can update message status');
    }

    message.status = updateStatusDto.status;
    return this.messagesRepository.save(message);
  }

  async delete(messageId: string, userId: string): Promise<void> {
    const message = await this.findOne(messageId);

    if (message.senderId !== userId && message.recipientId !== userId) {
      throw new ForbiddenException(
        'Only sender or recipient can delete message',
      );
    }

    await this.messagesRepository.softDelete(messageId);
  }

  async getConversationList(userId: string): Promise<
    Array<{
      otherUserId: string;
      otherUserName: string;
      lastMessage: string;
      lastMessageTime: Date;
      unreadCount: number;
    }>
  > {
    const conversations = await this.messagesRepository.query(
      `
            SELECT 
              CASE WHEN m."senderId" = $1 THEN m."recipientId" ELSE m."senderId" END as "otherUserId",
              COALESCE(CONCAT(u."firstName", ' ', u."lastName"), u.email, 'Unknown') as "otherUserName",
              MAX(m."createdAt") as "lastMessageTime",
              COUNT(CASE WHEN m.status = $2 AND m."recipientId" = $1 THEN 1 END) as "unreadCount",
              (ARRAY_AGG(m."content" ORDER BY m."createdAt" DESC))[1] as "lastMessage"
            FROM messages m
            LEFT JOIN users u ON u.id = CASE WHEN m."senderId" = $1 THEN m."recipientId" ELSE m."senderId" END
            WHERE (m."senderId" = $1 OR m."recipientId" = $1)
            AND m."deletedAt" IS NULL
            GROUP BY CASE WHEN m."senderId" = $1 THEN m."recipientId" ELSE m."senderId" END, u."firstName", u."lastName", u.email
            ORDER BY "lastMessageTime" DESC
            `,
      [userId, MessageStatus.UNREAD],
    );

    return conversations.map((conv) => ({
      otherUserId: conv.otherUserId,
      otherUserName: conv.otherUserName || 'Unknown',
      lastMessage: conv.lastMessage || '',
      lastMessageTime: conv.lastMessageTime,
      unreadCount: parseInt(conv.unreadCount) || 0,
    }));
  }

  getUserIdFromUser(user: any): string {
    return user?.id || user;
  }
}
