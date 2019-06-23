# 2. Adding a model (Javascript)

Now, we are ready to connect the library to a database. This tutorial asumes that you have a PostgreSQL database server running.

Let's start adding a user model. The user model has an id field, and an username field. Create the table in the database.

Create an src/provider directory. Lets add inside a module to provide our Models. Our first model will be the user model.

The code code for our provider could be the following one:

__src/provider/ModelProvider.js__
```js
'use strict';

const AntSqlModel = require('@antjs/ant-sql/src/model/AntSqlModel');

const userModel = new AntSqlModel('id', { prefix: 'user::' }, 'User');

module.exports = { userModel };

```

We have defined our first model:

1. The first argument is the name of the identifier field of the model. AntJS needs models identified by a field.
2. The second argument is the key generation configuration. This config is used to define redis keys. An user with id equal to three will be stored in redis with a 'user::3' key.
3. The third argument is the SQL table name.

We need to obtain a connection to the database. AntSQL is built on top of knex, so we are using knex to obtain that connection.

The code for the provider could be:

__src/provider/DBProvider.js__
```js
'use strict';

const Knex = require('knex');

const knex = Knex({
  client: 'pg',
  connection: {
    database : 'antsqltest',
    host : 'ant_db',
    password : 'antpassword',
    user : 'antuser',
  },
  version: '11.2',
});

module.exports = { knex };

```

We also need to obtain a connection for the redis server. AntJS uses ioredis for this purpose:

__src/provider/RedisProvider.js__
```js
'use strict';

const IORedis = require('ioredis');
const REDIS_PORT = 6379;
const REDIS_HOST = 'ant_redis';
const REDIS_DB = 0;
const redis = new IORedis({
    db: REDIS_DB,
    host: REDIS_HOST,
    port: REDIS_PORT,
});
module.exports = { redis };

```

Now, lets create our AntManager provider. This provider will be the entrypoint to AntJS. Remember that we are using the SQL extension, so we will create an AntSqlManager instead.

The code could be the following one:

__src/provider/AntSqlProvider.js__
```js
'use strict';

const { AntSqlManager } = require('@antjs/ant-sql');
const { knex } = require('./DBProvider');
const { userModel } = require('./ModelProvider');
const { redis } = require('./RedisProvider');

const manager = new AntSqlManager();
manager.config({
  default: {
    knex: knex,
    redis: redis,
  },
});

const userManager = manager.get(userModel);

module.exports = {
  manager,
  userManager,
};

```

That's all, we are ready to work with the manager!

You can access the [tutorial repository](https://github.com/notaphplover/ant-js-tutorial) in order to see the code in action. If you have Docker installed, you will be able to run the code with the following command:

```
npm run docker-test-user-entity-js
```

Next tutorial: Adding queries ([Javascript](./3_adding_queries_js.md) or [Typescript](./3_adding_queries_ts.md)).
