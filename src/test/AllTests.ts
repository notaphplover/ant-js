import { ITest } from './ITest';
import { ModelTest } from './model/ModelTest';

export class AllTest implements ITest {
  public performTests(): void {
    new ModelTest().performTests();
  }
}
