import { Entity } from '../../../model/entity';
import { PrimaryEntityManager } from '../../../persistence/primary/primary-entity-manager';
import { AntMultipleResultPrimaryQueryManager } from '../../../persistence/primary/query/ant-multiple-result-primary-query-manager';
import { RedisMiddleware } from '../../../persistence/primary/redis-middleware';
import { SecondaryEntityManagerMock } from '../../../testapi/api/secondary/SecondaryEntityManagerMock';

export type NamedEntity = { id: number; name: string } & Entity;

export class NamesStartingByLetter extends AntMultipleResultPrimaryQueryManager<NamedEntity> {
  /**
   * Query prefix.
   */
  protected _prefix: string;

  /**
   * Creates a new NamesStartingByLetter.
   * @param primaryEntityManager Primary entity manager.
   * @param redis Redis connection.
   * @param reverseHashKey Reverse hash key.
   * @param prefix Query prefix.
   */
  public constructor(
    primaryEntityManager: PrimaryEntityManager<NamedEntity>,
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
      (params: any) =>
        new Promise((resolve) =>
          resolve(
            secondaryModelManagerMock.store
              .filter((entity) => entity.name.startsWith(params.name[0]))
              .map((entity) => entity.id),
          ),
        ),
      primaryEntityManager,
      redis,
      reverseHashKey,
      key,
    );
    this._prefix = prefix;
  }
}
