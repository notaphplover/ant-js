import { AntModel } from '../../../../model/ant-model';
import { SecondaryEntityManagerMock } from '../../../api/secondary/secondary-entity-manager-mock';
import { Test } from '../../../api/test';

export class SecondaryEntityManagerMockTest implements Test {
  /**
   * Performs all the tests
   */
  public performTests(): void {
    describe(SecondaryEntityManagerMockTest.name, () => {
      this._itMustBeInitializable();
      this._itMustGetAnElementById();
      this._itMustGetElementsByIds();
      this._itMustGetElementsByIdsOrderedAscNumber();
      this._itMustGetElementsByIdsOrderedAscNonNumber();
      this._itMustGetElementsByIdsOrderedAscZeroEntities();
      this._itMustGetTheModel();
      this._itMustGettheStore();
      this._itMustNotGetAnElementById();
      this._itMustNotGetElementsByIdsOrderedAscNonNumberNonString();
    });
  }

  private _itMustBeInitializable(): void {
    it(this._itMustBeInitializable.name, async (done) => {
      expect(() => {
        new SecondaryEntityManagerMock(new AntModel('id', { prefix: '' }));
        new SecondaryEntityManagerMock(new AntModel('id', { prefix: '' }), new Array());
      }).not.toThrowError();
      done();
    });
  }

  private _itMustGetElementsByIds(): void {
    it(this._itMustGetElementsByIds.name, async (done) => {
      const model = new AntModel('id', { prefix: '' });
      const el0 = { id: 0 };
      const el1 = { id: 1 };
      const store = [el0, el1];
      const manager = new SecondaryEntityManagerMock(model, store);
      const elementsFound = await manager.getByIds([el0.id, el1.id]);
      expect(elementsFound).toContain(el0);
      expect(elementsFound).toContain(el1);
      done();
    });
  }

  private _itMustGetElementsByIdsOrderedAscNumber(): void {
    it(this._itMustGetElementsByIdsOrderedAscNumber.name, async (done) => {
      const model = new AntModel('id', { prefix: '' });
      const el0 = { id: 0 };
      const el1 = { id: 1 };
      const store = [el1, el0];
      const manager = new SecondaryEntityManagerMock(model, store);
      const elementsFound = await manager.getByIdsOrderedAsc([el1.id, el0.id]);
      expect(elementsFound).toEqual([el0, el1]);
      done();
    });
  }

  private _itMustGetElementsByIdsOrderedAscNonNumber(): void {
    it(this._itMustGetElementsByIdsOrderedAscNonNumber.name, async (done) => {
      const model = new AntModel('id', { prefix: '' });
      const el0 = { id: 'a' };
      const el1 = { id: 'b' };
      const store = [el1, el0];
      const manager = new SecondaryEntityManagerMock(model, store);
      const elementsFound = await manager.getByIdsOrderedAsc([el1.id, el0.id]);
      expect(elementsFound).toEqual([el0, el1]);
      done();
    });
  }

  private _itMustGetElementsByIdsOrderedAscZeroEntities(): void {
    it(this._itMustGetElementsByIdsOrderedAscZeroEntities.name, async (done) => {
      const model = new AntModel('id', { prefix: '' });
      const el0 = { id: 0 };
      const el1 = { id: 1 };
      const store = [el1, el0];
      const manager = new SecondaryEntityManagerMock(model, store);
      const elementsFound = await manager.getByIdsOrderedAsc(new Array());
      expect(elementsFound).toEqual(new Array());
      done();
    });
  }

  private _itMustGetAnElementById(): void {
    it(this._itMustGetAnElementById.name, async (done) => {
      const model = new AntModel('id', { prefix: '' });
      const el0 = { id: 0 };
      const el1 = { id: 1 };
      const store = [el0, el1];
      const manager = new SecondaryEntityManagerMock(model, store);
      expect(await manager.getById(el0.id)).toBe(el0);
      expect(await manager.getById(el1.id)).toBe(el1);
      done();
    });
  }

  private _itMustGetTheModel(): void {
    it(this._itMustGetTheModel.name, async (done) => {
      const model = new AntModel('id', { prefix: '' });
      const manager = new SecondaryEntityManagerMock(model);
      expect(manager.model).toBe(model);
      done();
    });
  }

  private _itMustGettheStore(): void {
    it(this._itMustGettheStore.name, async (done) => {
      const model = new AntModel('id', { prefix: '' });
      const store = [{ id: 0 }];
      const manager = new SecondaryEntityManagerMock(model, store);
      expect(manager.store).toBe(store);
      done();
    });
  }

  private _itMustNotGetAnElementById(): void {
    it(this._itMustNotGetAnElementById.name, async (done) => {
      const model = new AntModel('id', { prefix: '' });
      const el0 = { id: 0 };
      const store = new Array();
      const manager = new SecondaryEntityManagerMock(model, store);
      expect(await manager.getById(el0.id)).toBeNull();
      done();
    });
  }

  private _itMustNotGetElementsByIdsOrderedAscNonNumberNonString(): void {
    it(this._itMustNotGetElementsByIdsOrderedAscNonNumberNonString.name, async (done) => {
      const model = new AntModel('id', { prefix: '' });
      const el0 = { id: { index: 0 } };
      const el1 = { id: { index: 1 } };
      const store = [el1, el0];
      const manager = new SecondaryEntityManagerMock(model, store);
      expectAsync(manager.getByIdsOrderedAsc([el1.id as any, el0.id as any])).toBeRejected();
      done();
    });
  }
}
