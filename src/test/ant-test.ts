import * as AntJs from '../ant';
import { AntManager } from '../api/ant-manager';
import { Test } from '../testapi/api/test';

export class AntTest implements Test {
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
