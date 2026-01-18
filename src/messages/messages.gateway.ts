import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(
    private messagesService: MessagesService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        socket.disconnect();
        return;
      }

      const payload = await this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const userId = payload.id;
      socket.data.userId = userId;
      this.userSockets.set(userId, socket.id);

      socket.emit('connected', { message: 'Connected to messaging server' });
      this.server.emit('user_online', { userId });
    } catch (error) {
      socket.disconnect();
    }
  }

  async handleDisconnect(socket: Socket) {
    const userId = socket.data.userId;
    if (userId) {
      this.userSockets.delete(userId);
      this.server.emit('user_offline', { userId });
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: CreateMessageDto,
  ) {
    try {
      const senderId = socket.data.userId;
      const message = await this.messagesService.create(data, senderId);

      const recipientSocketId = this.userSockets.get(data.recipientId);

      if (recipientSocketId) {
        this.server.to(recipientSocketId).emit('message_received', {
          id: message.id,
          senderId: message.senderId,
          content: message.content,
          status: message.status,
          applicationId: message.applicationId,
          createdAt: message.createdAt,
        });
      }

      socket.emit('message_sent', {
        id: message.id,
        recipientId: message.recipientId,
        content: message.content,
        createdAt: message.createdAt,
      });

      const conversationRoom = this.getConversationRoom(
        senderId,
        data.recipientId,
      );
      this.server.to(conversationRoom).emit('new_message', {
        id: message.id,
        senderId: message.senderId,
        recipientId: message.recipientId,
        content: message.content,
        status: message.status,
        createdAt: message.createdAt,
      });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { otherUserId: string },
  ) {
    try {
      const userId = socket.data.userId;
      const conversationRoom = this.getConversationRoom(
        userId,
        data.otherUserId,
      );
      socket.join(conversationRoom);

      socket.emit('joined_conversation', { conversationRoom });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { otherUserId: string },
  ) {
    try {
      const userId = socket.data.userId;
      const conversationRoom = this.getConversationRoom(
        userId,
        data.otherUserId,
      );
      socket.leave(conversationRoom);

      socket.emit('left_conversation', { conversationRoom });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { otherUserId: string; isTyping: boolean },
  ) {
    try {
      const userId = socket.data.userId;
      const conversationRoom = this.getConversationRoom(
        userId,
        data.otherUserId,
      );

      this.server.to(conversationRoom).emit('user_typing', {
        userId,
        isTyping: data.isTyping,
      });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    try {
      const userId = socket.data.userId;
      const message = await this.messagesService.markAsRead(
        data.messageId,
        userId,
      );

      const senderSocketId = this.userSockets.get(message.senderId);
      if (senderSocketId) {
        this.server.to(senderSocketId).emit('message_read', {
          messageId: message.id,
        });
      }

      socket.emit('message_marked_read', { messageId: message.id });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('get_online_status')
  async handleGetOnlineStatus(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { userIds: string[] },
  ) {
    try {
      const onlineUsers = data.userIds.filter((userId) =>
        this.userSockets.has(userId),
      );

      socket.emit('online_status', { onlineUsers });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  private getConversationRoom(userId1: string, userId2: string): string {
    const sorted = [userId1, userId2].sort();
    return `conversation_${sorted[0]}_${sorted[1]}`;
  }
}
