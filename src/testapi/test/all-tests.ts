import { RedisWrapper } from '../../test/primary/redis-wrapper';
import { RedisAwaiter } from '../api/RedisAwaiter';
import { Test } from '../api/test';
import { ModelManagerGeneratorTest } from './api/generator/model-manager-generator-test';
import { SecondaryEntityManagerMockTest } from './api/secondary/secondary-entity-manager-mock-test';

export class AllTest implements Test {
  public performTests(): void {
    const redisWrapper = new RedisWrapper();
    const redis = redisWrapper.redis;
    const beforeAllPromise = new RedisAwaiter(redis).flushDataAndScripts();
    new ModelManagerGeneratorTest(beforeAllPromise).performTests();
    new SecondaryEntityManagerMockTest().performTests();
  }
}
