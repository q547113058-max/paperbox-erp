import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadsService {
  private readonly uploadDir = join(process.cwd(), 'uploads');

  constructor() {
    // 确保上传目录存在
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  getFilePath(filename: string): string {
    return join(this.uploadDir, filename);
  }

  fileExists(filename: string): boolean {
    return existsSync(this.getFilePath(filename));
  }
}
