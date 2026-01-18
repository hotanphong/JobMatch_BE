import {
  Controller,
  Get,
  Patch,
  Body,
  HttpStatus,
  UseGuards,
  Put,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiResponse } from '../common/responses/api.response';

@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('my-profile')
  async getProfile(@CurrentUser() user: User) {
    return new ApiResponse(
      HttpStatus.OK,
      'Profile retrieved successfully',
      user,
    );
  }

  @Get()
  async getAllUsers() {
    const users = await this.usersService.findAll();
    return new ApiResponse(
      HttpStatus.OK,
      'Users retrieved successfully',
      users,
    );
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updatedUser = await this.usersService.updateProfile(
      userId,
      updateUserDto,
    );
    return new ApiResponse(
      HttpStatus.OK,
      'Profile updated successfully',
      updatedUser,
    );
  }
}
