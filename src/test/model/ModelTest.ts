import { IKeyGenParams } from '../../model/IKeyGenParams';
import { Model } from '../../model/Model';
import { ITest } from '../../test-api/ITest';

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
        new Model('id', {prefix: 'prefix'});
      }).not.toThrowError();
    });
  }

  private _itMustStoreInitialValues(): void {
    it ('mustStoreInitialValues', () => {
      const id = 'idField';
      const keyGenParams: IKeyGenParams = {prefix: 'prefix'};
      const customModel = new Model(id, keyGenParams);
      expect(customModel.id).toBe(id);
      expect(customModel.keyGen).toEqual(keyGenParams);
    });
  }
}
