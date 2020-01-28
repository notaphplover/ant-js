import * as _ from 'lodash';
import { AntMultipleResultPrimaryQueryManager } from '../../persistence/query/ant-multiple-result-primary-query-manager';
import { Entity } from '../../model/entity';
import { Model } from '../../model/model';
import { RedisMiddleware } from '../../persistence/primary/redis-middleware';
import { SchedulerModelManager } from '../../persistence/scheduler/scheduler-model-manager';
import { SecondaryEntityManagerMock } from '../../testapi/api/secondary/secondary-entity-manager-mock';
import { iterableFilter } from '../util/iterable-filter';

export type NamedEntity = { id: number; name: string } & Entity;

export class NamesStartingByLetter extends AntMultipleResultPrimaryQueryManager<NamedEntity> {
  /**
   * Query prefix.
   */
  protected _prefix: string;

  /**
   * Creates a new NamesStartingByLetter.
   * @param manager Primary entity manager.
   * @param redis Redis connection.
   * @param reverseHashKey Reverse hash key.
   * @param prefix Query prefix.
   */
  public constructor(
    model: Model<NamedEntity>,
    manager: SchedulerModelManager<NamedEntity>,
    secondaryModelManagerMock: SecondaryEntityManagerMock<NamedEntity>,
    redis: RedisMiddleware,
    reverseHashKey: string,
    prefix: string,
  ) {
    /**
     * Creates a query key for the parameters provided.
     * @param params query parameters.
     * @returns Key generated.
     */
    const key = (params: any): string => {
      if (params.name && (params.name as string).length) {
        return this._prefix + (params.name as string)[0];
      } else {
        throw new Error('Invalid params');
      }
    };
    super(
      model,
      manager,
      (params: any) =>
        Promise.resolve(
          _.map(
            iterableFilter(secondaryModelManagerMock.store.values(), (entity) =>
              entity.name.startsWith(params.name[0]),
            ),
            (entity) => entity.id,
          ),
        ),
      redis,
      reverseHashKey,
      key,
    );
    this._prefix = prefix;
  }
}
