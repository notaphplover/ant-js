import { Entity } from '../../model/entity';
import { AntPrimaryEntityManager } from '../../persistence/primary/ant-primary-entity-manager';
import { SecondaryEntityManager } from '../../persistence/secondary/secondary-entity-manager';

export class PrimaryEntityManagerForTest<
  TEntity extends Entity,
  TSecondaryManager extends SecondaryEntityManager<TEntity>
> extends AntPrimaryEntityManager<TEntity, TSecondaryManager> {
  public getKey(id: number | string): string {
    return this._getKey(id);
  }
}
