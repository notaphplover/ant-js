import { ITest } from '../testapi/api/ITest';
import { RedisAwaiter } from '../testapi/api/RedisAwaiter';
import { AntTest } from './ant-test';
import { AntManagerTest } from './api/ant-manager-test';
import { AntModelManagerTest } from './api/ant-model-manager-test';
import { AntQueryManagerTest } from './api/query/ant-query-manager-test';
import { ModelTest } from './model/model-test';
import { ModelManagerTest } from './primary/model-manager-test';
import { PrimaryEntityManagerTest } from './primary/primary-entity-manager-test';
import { MultipleResultQueryManagerTest } from './primary/query/multiple-result-query-manager-test';
import { SingleResultQueryManagerTest } from './primary/query/single-result-query-manager-test';
import { RedisWrapper } from './primary/RedisWrapper';
import { RedisCachedScriptTest } from './primary/script/redis-cached-script-test';
import { UpdateEntitiesCachedScriptSetTest } from './primary/script/update-entities-cached-script-set-test';

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
    new UpdateEntitiesCachedScriptSetTest(beforeAllPromise).performTests();
    new RedisCachedScriptTest(beforeAllPromise).performTests();
    new SingleResultQueryManagerTest(beforeAllPromise).performTests();
  }
}
