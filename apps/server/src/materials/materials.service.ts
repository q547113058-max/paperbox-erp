import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { Material } from '../entities/materials';

@Injectable()
export class MaterialsService extends CrudService<Material> {
  constructor(
    @InjectRepository(Material)
    repo: Repository<Material>,
  ) {
    super(repo);
  }
}
