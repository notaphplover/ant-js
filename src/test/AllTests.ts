import { AntTest } from './AntTest';
import { AntManagerTest } from './api/AntManagerTest';
import { AntModelManagerTest } from './api/AntModelManagerTest';
import { AntQueryManagerTest } from './api/query/AntQueryManagerTest';
import { ITest } from './ITest';
import { ModelTest } from './model/ModelTest';
import { ModelManagerTest } from './primary/ModelManagerTest';
import { PrimaryEntityManagerTest } from './primary/PrimaryEntityManagerTest';
import { MultipleResultQueryManagerTest } from './primary/query/MultipleResultQueryManagerTest';
import { SingleResultQueryManagerTest } from './primary/query/SingleResultQueryManagerTest';
import { RedisWrapper } from './primary/RedisWrapper';
import { RedisCachedScriptTest } from './primary/script/RedisCachedScriptTest';

export class AllTest implements ITest {
  public performTests(): void {
    const redisWrapper = new RedisWrapper();
    const redis = redisWrapper.redis;
    const beforeAllPromise: Promise<any> = redis
      .flushall()
      .then(
        () => redis.script(['flush']),
      );

    new AntManagerTest(beforeAllPromise).performTests();
    new AntModelManagerTest(beforeAllPromise).performTests();
    new AntQueryManagerTest(beforeAllPromise).performTests();
    new AntTest().performTests();
    new ModelManagerTest(beforeAllPromise).performTests();
    new ModelTest().performTests();
    new MultipleResultQueryManagerTest(beforeAllPromise).performTests();
    new PrimaryEntityManagerTest(beforeAllPromise).performTests();
    new RedisCachedScriptTest(beforeAllPromise).performTests();
    new SingleResultQueryManagerTest(beforeAllPromise).performTests();
  }
}
