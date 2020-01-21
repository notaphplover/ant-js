export const iterableFind = <T>(iterable: Iterable<T>, filter: (elem: T) => boolean): T => {
  for (const elem of iterable) {
    if (filter(elem)) {
      return elem;
    }
  }
  return null;
};
