import { ITest } from '../api/ITest';
import { ModelManagerGeneratorTest } from './api/generator/ModelManagerGeneratorTest';
import { SecondaryEntityManagerMockTest } from './api/secondary/SecondaryEntityManagerMockTest';

export class AllTest implements ITest {

  public performTests(): void {
    new ModelManagerGeneratorTest().performTests();
    new SecondaryEntityManagerMockTest().performTests();
  }
}
