export const iterableFilter = <T>(iterable: Iterable<T>, filter: (elem: T) => boolean): T[] => {
  const filteredElements = new Array<T>();

  for (const elem of iterable) {
    if (filter(elem)) {
      filteredElements.push(elem);
    }
  }

  return filteredElements;
};
