import { ITest } from './ITest';
import { ModelTest } from './model/ModelTest';
import { MultipleResultQueryManagerTest } from './primary/MultipleResultQueryManagerTest';
import { PrimaryModelManagerTest } from './primary/PrimaryModelManagerTest';
import { RedisWrapper } from './primary/RedisWrapper';
import { SingleResultQueryManagerTest } from './primary/SingleResultQueryManagerTest';

export class AllTest implements ITest {
  public performTests(): void {
    const beforeAllPromise: Promise<any> = new RedisWrapper().redis.flushall();

    new ModelTest().performTests();
    new MultipleResultQueryManagerTest(beforeAllPromise).performTests();
    new PrimaryModelManagerTest(beforeAllPromise).performTests();
    new SingleResultQueryManagerTest(beforeAllPromise).performTests();
  }
}
