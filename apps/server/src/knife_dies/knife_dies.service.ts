import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { KnifeDie } from '../entities/knife_dies';

@Injectable()
export class KnifeDiesService extends CrudService<KnifeDie> {
  constructor(
    @InjectRepository(KnifeDie)
    repo: Repository<KnifeDie>,
  ) {
    super(repo);
  }
}
