import { AllTest } from './AllTests';

const injectJasmineMocks = () => {
  (global as any).describe = (description: string, specDefinitions: () => void): void => {
    specDefinitions();
  };

  const expectProxyHandler: ProxyHandler<object> = {
    apply: (): any => expectProxy,
    get: () => expectProxy,
    has: () => true,
  };
  const expectProxy = new Proxy(() => { return; }, expectProxyHandler);
  (global as any).expect = (target: any) => {
    return expectProxy;
  };

  (global as any).it = (expectation: string, assertion?: (done: DoneFn) => void, timeout?: number): void => {
    if (assertion) {
      // tslint:disable-next-line:no-empty
      const done: () => void = () => {};
      (done as any).fail = done;
      assertion(done as DoneFn);
    }
  };
};

(() => {
  injectJasmineMocks();
  new AllTest().performTests();
})();
