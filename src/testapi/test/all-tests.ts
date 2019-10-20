import { RedisWrapper } from '../../test/primary/RedisWrapper';
import { ITest } from '../api/ITest';
import { RedisAwaiter } from '../api/RedisAwaiter';
import { ModelManagerGeneratorTest } from './api/generator/ModelManagerGeneratorTest';
import { SecondaryEntityManagerMockTest } from './api/secondary/SecondaryEntityManagerMockTest';

export class AllTest implements ITest {
  public performTests(): void {
    const redisWrapper = new RedisWrapper();
    const redis = redisWrapper.redis;
    const beforeAllPromise = new RedisAwaiter(redis).flushDataAndScripts();
    new ModelManagerGeneratorTest(beforeAllPromise).performTests();
    new SecondaryEntityManagerMockTest().performTests();
  }
}
