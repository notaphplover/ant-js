import { ITest } from '../testapi/api/ITest';
import { RedisAwaiter } from '../testapi/api/RedisAwaiter';
import { AntTest } from './AntTest';
import { AntManagerTest } from './api/AntManagerTest';
import { AntModelManagerTest } from './api/AntModelManagerTest';
import { AntQueryManagerTest } from './api/query/AntQueryManagerTest';
import { ModelTest } from './model/ModelTest';
import { ModelManagerTest } from './primary/ModelManagerTest';
import { PrimaryEntityManagerTest } from './primary/PrimaryEntityManagerTest';
import { MultipleResultQueryManagerTest } from './primary/query/MultipleResultQueryManagerTest';
import { SingleResultQueryManagerTest } from './primary/query/SingleResultQueryManagerTest';
import { RedisWrapper } from './primary/RedisWrapper';
import { RedisCachedScriptSetByCacheModeTest } from './primary/script/RedisCachedScriptSetByCacheModeTest';
import { RedisCachedScriptTest } from './primary/script/RedisCachedScriptTest';

export class AllTest implements ITest {
  public performTests(): void {
    const redisWrapper = new RedisWrapper();
    const redis = redisWrapper.redis;
    const beforeAllPromise = new RedisAwaiter(redis).flushDataAndScripts();

    new AntManagerTest(beforeAllPromise).performTests();
    new AntModelManagerTest(beforeAllPromise).performTests();
    new AntQueryManagerTest(beforeAllPromise).performTests();
    new AntTest().performTests();
    new ModelManagerTest(beforeAllPromise).performTests();
    new ModelTest().performTests();
    new MultipleResultQueryManagerTest(beforeAllPromise).performTests();
    new PrimaryEntityManagerTest(beforeAllPromise).performTests();
    new RedisCachedScriptSetByCacheModeTest(beforeAllPromise).performTests();
    new RedisCachedScriptTest(beforeAllPromise).performTests();
    new SingleResultQueryManagerTest(beforeAllPromise).performTests();
  }
}
