import { AntQueryManager } from './ant-query-manager';
import { ApiSingleResultQueryManager } from './api-single-result-query-manager';
import { Entity } from '../../model/entity';

export class AntSingleResultQueryManager<TEntity extends Entity> extends AntQueryManager<TEntity, TEntity>
  implements ApiSingleResultQueryManager<TEntity> {}
