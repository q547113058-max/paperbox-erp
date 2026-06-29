import { Controller, Post, UseInterceptors, UploadedFile, Get, Param, Res, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadsController {
  @Post()
  @Roles('boss', 'sales', 'warehouse')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/api/uploads/${file.filename}`,
    };
  }

  @Get(':filename')
  getFile(@Param('filename') filename: string, @Res() res: Response) {
    // Reject path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ message: '无效的文件名' });
    }
    const uploadsDir = join(process.cwd(), 'uploads');
    const filePath = join(uploadsDir, filename);
    // Verify resolved path is within uploads directory
    if (!filePath.startsWith(uploadsDir)) {
      return res.status(400).json({ message: '无效的文件路径' });
    }
    if (!existsSync(filePath)) {
      return res.status(404).json({ message: '文件不存在' });
    }
    res.sendFile(filePath);
  }
}
