import { Model } from '../../model/Model';
import { ITest } from '../ITest';

export class ModelTest implements ITest {
  public performTests(): void {
    describe('ModelTest', () => {
      this._itMustBeInitializable();
      this._itMustStoreInitialValues();
    });
  }

  private _itMustBeInitializable(): void {
    it('mustBeInitializable', () => {
      expect(() => {
        // tslint:disable-next-line:no-unused-expression
        new Model('id');
      }).not.toThrowError();
    });
  }

  private _itMustStoreInitialValues(): void {
    it ('mustStoreInitialValues', () => {
      const id = 'idField';
      const customModel = new Model(id);
      expect(customModel.id).toBe(id);
    });
  }
}
