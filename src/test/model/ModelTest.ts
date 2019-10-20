import { AntModel } from '../../model/ant-model';
import { IKeyGenParams } from '../../model/IKeyGenParams';
import { ITest } from '../../testapi/api/ITest';

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
        new AntModel('id', { prefix: 'prefix' });
      }).not.toThrowError();
    });
  }

  private _itMustStoreInitialValues(): void {
    it('mustStoreInitialValues', () => {
      const id = 'idField';
      const keyGenParams: IKeyGenParams = { prefix: 'prefix' };
      const customModel = new AntModel(id, keyGenParams);
      expect(customModel.id).toBe(id);
      expect(customModel.keyGen).toEqual(keyGenParams);
    });
  }
}
