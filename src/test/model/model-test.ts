import { AntModel } from '../../model/ant-model';
import { KeyGenParams } from '../../model/key-gen-params';
import { Test } from '../../testapi/api/test';

export class ModelTest implements Test {
  public performTests(): void {
    describe('ModelTest', () => {
      this._itMustBeInitializable();
      this._itMustStoreInitialValues();
    });
  }

  private _itMustBeInitializable(): void {
    it('mustBeInitializable', () => {
      expect(() => {
        new AntModel('id', { prefix: 'prefix' });
      }).not.toThrowError();
    });
  }

  private _itMustStoreInitialValues(): void {
    it('mustStoreInitialValues', () => {
      const id = 'idField';
      const keyGenParams: KeyGenParams = { prefix: 'prefix' };
      const customModel = new AntModel(id, keyGenParams);
      expect(customModel.id).toBe(id);
      expect(customModel.keyGen).toEqual(keyGenParams);
    });
  }
}
