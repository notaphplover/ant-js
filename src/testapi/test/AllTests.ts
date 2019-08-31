import { ITest } from '../api/ITest';
import { ModelManagerGeneratorTest } from './api/generator/ModelManagerGeneratorTest';

export class AllTest implements ITest {

  public performTests(): void {
    new ModelManagerGeneratorTest().performTests();
  }
}
