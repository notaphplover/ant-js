import { IModel } from '../../../../model/IModel';
import { ITest } from '../../../api/ITest';
import { SecondaryEntityManagerMock } from '../../../api/secondary/SecondaryEntityManagerMock';

export class SecondaryEntityManagerMockTest implements ITest {

  /**
   * Performs all the tests
   */
  public performTests(): void {
    describe(SecondaryEntityManagerMockTest.name, () => {
      this._itMustBeInitializable();
    });
  }

  private _itMustBeInitializable(): void {
    it(this._itMustBeInitializable.name, async (done) => {
      expect(() => {
        // tslint:disable-next-line:no-unused-expression
        new SecondaryEntityManagerMock({
          id: 'id',
          keyGen: { prefix: '' },
        });
        // tslint:disable-next-line:no-unused-expression
        new SecondaryEntityManagerMock(
          {
            id: 'id',
            keyGen: { prefix: '' },
          },
          new Array(),
        );
      }).not.toThrowError();
      done();
    });
  }
}
