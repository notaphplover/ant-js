import * as IORedis from 'ioredis';
import { IEntity } from '../../../model/IEntity';
import { IPrimaryEntityManager } from '../../../persistence/primary/IPrimaryEntityManager';
import { MultipleResultQueryManager } from '../../../persistence/primary/query/MultipleResultQueryManager';
import { SecondaryEntityManagerMock } from '../../secondary/SecondaryEntityManagerMock';

export type NamedEntity = {id: number, name: string } & IEntity;

export class NamesStartingByLetter extends MultipleResultQueryManager<NamedEntity> {
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
    primaryEntityManager: IPrimaryEntityManager<NamedEntity>,
    secondaryModelManagerMock: SecondaryEntityManagerMock<NamedEntity>,
    redis: IORedis.Redis,
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
        new Promise((resolve) => resolve(
          secondaryModelManagerMock.store
            .filter(
              (entity) => entity.name.startsWith(params.name[0]),
            ).map((entity) => entity.id),
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
