import * as AntJs from '../ant';
import { AntManager } from '../api/ant-manager';
import { CacheMode } from '../persistence/primary/options/cache-mode';
import { Test } from '../testapi/api/test';

export class AntTest implements Test {
  public performTests(): void {
    describe('AntTest', () => {
      this._itMustExportTypes();
    });
  }

  private _itMustExportTypes(): void {
    it('mustExportTypes', () => {
      expect(AntJs.AntManager).toBe(AntManager);
      expect(AntJs.CacheMode).toBe(CacheMode);
    });
  }
}
