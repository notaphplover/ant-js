# 2. Adding a model

Now, we are ready to connect the library to a MySQL database. This tutorial asumes that you have a MySQL database server running.

Create an src/provider directory. Lets add inside a module to provide our Models. Our first model will be the user model.

The user model has id field, and an username field. The MySQL code to generate the table could be the following one:

```sql
CREATE TABLE User(
  id INT NOT NULL,
  username VARCHAR(255) NOT NULL,
  PRIMARY KEY(id)
)
```

The Typescript code for our provider could be the following one:

__src/provider/ModelProvider.ts__
```typescript
import { AntSqlModel } from '@antjs/ant-sql/src/model/AntSqlModel';

const User = new AntSqlModel('id', { prefix: 'user::' }, 'User');

export { User };

```

The Javascript code for our provider could be the following one:

__src/provider/ModelProvider.js__
```js
const AntSqlModel = require('@antjs/ant-sql/src/model/AntSqlModel');

const User = new AntSqlModel('id', { prefix: 'user::' }, 'User');

module.exports = { User };

```

We have defined our first model:

1. The first argument is the name of the identifier field of the model. AntJS needs models identified by a field.
2. The second argument is the key generation configuration. This config is used to define redis keys. An user with id equal to three will be stored in redis with a 'user::3' key.
3. The third argument is the SQL table name.

Now, lets create our AntManager provider. This provider will be the entrypoint to AntJS. Remember that we are using the SQL extension, so we will create an AntSqlManager instead.

The Typescript code could be the following one:

__src/provider/ModelProvider.ts__
```typescript


```

