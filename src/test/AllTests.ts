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

export class AllTest implements ITest {
  public performTests(): void {
    const beforeAllPromise: Promise<any> = new RedisWrapper().redis.flushall();

    new AntManagerTest(beforeAllPromise).performTests();
    new AntModelManagerTest(beforeAllPromise).performTests();
    new AntQueryManagerTest(beforeAllPromise).performTests();
    new AntTest().performTests();
    new ModelManagerTest(beforeAllPromise).performTests();
    new ModelTest().performTests();
    new MultipleResultQueryManagerTest(beforeAllPromise).performTests();
    new PrimaryEntityManagerTest(beforeAllPromise).performTests();
    new SingleResultQueryManagerTest(beforeAllPromise).performTests();
  }
}
