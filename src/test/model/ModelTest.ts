import { ITest } from '../ITest';
import { MinimunModel } from './MinimunModel';

export class ModelTest implements ITest {
  public performTests(): void {
    describe('ModelTest', () => {
      this.itMustBeInitializable();
    });
  }

  private itMustBeInitializable(): void {
    it('mustBeInitializable', () => {
      expect(() => {
        // tslint:disable-next-line:no-unused-expression
        new MinimunModel();
      }).not.toThrowError();
    });
  }
}
