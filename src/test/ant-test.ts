import * as AntJs from '../ant';
import { AntManager } from '../api/ant-manager';
import { ITest } from '../testapi/api/ITest';

export class AntTest implements ITest {
  public performTests() {
    describe('AntTest', () => {
      this._itMustExportTypes();
    });
  }

  private _itMustExportTypes(): void {
    it('mustExportTypes', () => {
      expect(AntJs.AntManager).toBe(AntManager);
    });
  }
}
