import { PersistencyDeleteOptions } from './persistency-delete-options';
import { PersistencyUpdateOptions } from './persistency-update-options';

export interface PersistencySearchOptions extends PersistencyDeleteOptions, PersistencyUpdateOptions {}
