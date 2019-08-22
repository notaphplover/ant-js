import { ITest } from '../api/ITest';
import { RedisMiddlewareMockTest } from './api/primary/RedisMiddlewareMockTest';

export class AllTest implements ITest {

  public performTests(): void {
    new RedisMiddlewareMockTest().performTests();
  }
}
