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
        new Model('id', ['id', 'field']);
      }).not.toThrowError();
    });
  }

  private _itMustStoreInitialValues(): void {
    it ('mustStoreInitialValues', () => {
      const id = 'idField';
      const properties = ['idField', 'customField'];
      const customModel = new Model(id, properties);
      expect(customModel.id).toBe(id);
      expect(customModel.properties).toEqual(properties);
    });
  }
}
