import { KeyGenParams } from '../../model/key-gen-params';

/**
 * Creates a function that creates a lua script to create an entity key from an id.
 * @param keyGenParams Key generation params.
 * @returns function that creates lua code to generate a key from an id.
 */
export const luaKeyGenerator = (keyGenParams: KeyGenParams): (alias: string) => string => {
  return (alias: string): string => {
    return '"' + keyGenParams.prefix + '" .. ' + alias;
  };
};
