import { IPersistencyDeleteOptions } from './IPersistencyDeleteOptions';
import { IPersistencyUpdateOptions } from './IPersistencyUpdateOptions';

export interface IPersistencySearchOptions extends IPersistencyDeleteOptions, IPersistencyUpdateOptions {}
