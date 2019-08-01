import * as AntJs from '../ant';
import { AntManager } from '../api/AntManager';
import { ITest } from '../test-api/ITest';

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
