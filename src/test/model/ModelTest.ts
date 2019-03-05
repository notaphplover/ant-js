import { IEntityKeyGenerationData } from '../../model/IEntityKeyGenerationData';
import { ITest } from '../ITest';
import { MinimunModel } from './MinimunModel';

export class ModelTest implements ITest {
  public performTests(): void {
    describe('ModelTest', () => {
      this.itMustBeInitializable();
      this.itMustStoreInitialValues();
    });
  }

  private itMustBeInitializable(): void {
    it('mustBeInitializable', () => {
      expect(() => {
        // tslint:disable-next-line:no-unused-expression
        new MinimunModel('id', ['id', 'field'], {});
      }).not.toThrowError();
    });
  }

  private itMustStoreInitialValues(): void {
    it ('mustStoreInitialValues', () => {
      const id = 'idField';
      const properties = ['idField', 'customField'];
      const entityKeyGenerationData: IEntityKeyGenerationData = {
        prefix: 'p',
        suffix: 's',
      };
      const customModel = new MinimunModel(id, properties, entityKeyGenerationData);
      expect(customModel.id).toBe(id);
      expect(customModel.properties).toEqual(properties);
    });
  }
}