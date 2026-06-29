import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { ColorPrint } from '../entities/color_prints';

@Injectable()
export class ColorPrintsService extends CrudService<ColorPrint> {
  constructor(
    @InjectRepository(ColorPrint)
    repo: Repository<ColorPrint>,
  ) {
    super(repo);
  }
}
