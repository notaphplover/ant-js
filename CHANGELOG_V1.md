## 2.0.0-beta.0

- Interface improvements: primary layer interfaces no longer inherits secondary layer interfaces.
- Secondary layer interface is has a delete method.
- Api layer managers no longer have an update method. In the context of AntJs, it's not possible to know whether or not an upsert operation exists in the secondary layer or is good enough.
- Persistency options are partial at the API level: if some options are not provided, they are filled with default values.
- Added ignore layer options.
- Added Scheduler layer in order to operate between layers.
- Remove unused getQueries method at primary layer.

## 1.0.2

- Added API docs.
- Lodash map is used instead of Array.map.
- Improved array copy implementations.
- Updated Typescript version.

## 1.0.1

- Added readonly fields to interfaces when appropiated.
- Docker compose configuration has been simplified.

## 1.0.0

- Initial stable version
