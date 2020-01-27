import { AntPrimaryEntityManager } from '../../persistence/primary/ant-primary-entity-manager';
import { Entity } from '../../model/entity';

export class PrimaryEntityManagerForTest<TEntity extends Entity> extends AntPrimaryEntityManager<TEntity> {
  public getKey(id: number | string): string {
    return this._getKey(id);
  }
}
