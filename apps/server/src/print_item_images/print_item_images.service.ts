import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { PrintItemImage } from '../entities/print_item_images';

@Injectable()
export class PrintItemImageService extends CrudService<PrintItemImage> {
  constructor(
    @InjectRepository(PrintItemImage)
    repo: Repository<PrintItemImage>,
  ) {
    super(repo);
  }
}
