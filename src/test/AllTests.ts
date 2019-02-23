import { ITest } from './ITest';
import { ModelTest } from './model/ModelTest';
import { PrimaryModelManagerTest } from './primary/PrimaryModelManagerTest';

export class AllTest implements ITest {
  public performTests(): void {
    new ModelTest().performTests();
    new PrimaryModelManagerTest().performTests();
  }
}
