import { ITest } from './ITest';
import { ModelTest } from './model/ModelTest';
import { MultipleResultQueryManagerTest } from './primary/MultipleResultQueryManagerTest';
import { PrimaryEntityManagerTest } from './primary/PrimaryEntityManagerTest';
import { RedisWrapper } from './primary/RedisWrapper';
import { SingleResultQueryManagerTest } from './primary/SingleResultQueryManagerTest';

export class AllTest implements ITest {
  public performTests(): void {
    const beforeAllPromise: Promise<any> = new RedisWrapper().redis.flushall();

    new ModelTest().performTests();
    new MultipleResultQueryManagerTest(beforeAllPromise).performTests();
    new PrimaryEntityManagerTest(beforeAllPromise).performTests();
    new SingleResultQueryManagerTest(beforeAllPromise).performTests();
  }
}
