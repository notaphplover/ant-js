# 3. Adding queries (Javascript)

We are now able to define multiple models and find entities by ids. ¿What if we want to perform a more complex search?

First of all, let's define a query in the library context. A query is a request for a set of entities of the __same model__. If you want to perform queries that targets different models, you will have to create (at least) one query for each model.

Another important restriction when creating queries is the following one:

__For each query, there must be only a way to find an entity__

__Example of a good query__: A query that takes a letter and finds all the users whose username starts with the letter is a valid query because, for each user, there is only a way to find the user. The only way to find the user "notaphplover" is passing "n" to the query.

__Example of a bad query__: A query that takes a letter and finds all the users whose username contains the letter is a bad query. There are multuple ways to find the user "notaphplover" ("n", "o", "t"...)

This restriction is one of the keys to build a fast cache algorithm.

If you really need to cache a "bad" query, you can try to simulate it as a set of multiple "good" queries:

  * Supose the user model has a "money" field. Supose we want to search users with in a certain range of money. We could create a query of appropiate ranges and then create the query as a process of the result of multiple queries. We could create, for example, a query that takes a number and returns users with money between (number * 10000) and ((number + 1) * 10000 - 1).Then, we could use this query multiple times to search users at almost any range.

  * Supose we want to query users whose username contains a letter. There is a way to achieve this:
    * First of all, create a query that takes a number n and a letter l and returns all the users whose n-th letter is l.
    * Request a multiple query for each position, from 0 to the length limit of the field.

  Sometimes you won't be able to create a "good" query. In these cases, it's probably because it's not a good idea to create the cached query.

In this tutorial we are creating two queries:

  1. A query to search all the users whose username is a certain string.
  2. A query to search all the users whose username starts by a certain letter.

Now, the idea is to inject the queries into the manager. Let's create our query injector:

__src/provider/UserQueriesProvider.js__
```javascript
'use strict';

class UserQueriesProvider {

  /**
   * Injects queries in the user manager and returns the query managers generated.
   * @param { import('knex') } knex Knex instance.
   * @param { import('@antjs/ant-sql/src/api/AntSqlModelManager').AntSqlModelManager } antModelManager User manager
   * @param { import('@antjs/ant-sql/src/model/AntSqlModel').AntSqlModel } model User model
   * @returns { object } Queries object.
   */
  injectQueries(
    knex,
    antModelManager,
    model,
  ) {
    return {
      usersByUsernameQuery: this._addUsersByUsernameQuery(
        knex, antModelManager, model,
      ),
      usersStartingByLetterQuery: this._addUsersStartingByLetterQuery(
        knex, antModelManager, model,
      ),
    };
  }

  /**
   * Adds a "users by username" query.
   * @param { import('knex') } knex Knex instance.
   * @param { import('@antjs/ant-sql/src/api/AntSqlModelManager').AntSqlModelManager } userManager User manager
   * @param { import('@antjs/ant-sql/src/model/AntSqlModel').AntSqlModel } userModel User model
   * @returns { import('@antjs/ant-js/src/persistence/primary/query/SingleResultQueryManager') } Query manager created.
   */
  _addUsersByUsernameQuery(
    knex,
    userManager,
    userModel,
  ) {
    /**
     * Serachs for an user whose username is the username provided.
     * @param { object } params Query params
     * @returns { Promise<number> } Promise of id found.
     */
    const usersByUsername = (params) => {
      if (!params) {
        throw new Error('Expected params!');
      }
      /** @type string */
      const username = params.username;
      if (!username) {
        throw new Error('Expected an username!');
      }
      return knex
        .select(userModel.id)
        .from(userModel.tableName)
        .where('username', username)
        .first()
        .then(
          (result) => result ? result.id : null,
        );
    };

    return userManager.query({
      isMultiple: false,
      queryKeyGen: (params) => 'user/name::' + params.letter,
      query: usersByUsername,
      reverseHashKey: 'user/name/reverse',
    });
  }

  /**
   * Adds a "users starting with letter" query.
   * @param { import('knex') } knex Knex instance.
   * @param { import('@antjs/ant-sql/src/api/AntSqlModelManager').AntSqlModelManager } userManager User manager
   * @param { import('@antjs/ant-sql/src/model/AntSqlModel').AntSqlModel } userModel User model
   * @returns { import('@antjs/ant-js/src/persistence/primary/query/MultipleResultQueryManager') } query manager created.
   */
  _addUsersStartingByLetterQuery(
    knex,
    userManager,
    userModel,
  ) {
    /**
     * Search fot users whose username starts with a letter.
     * @param { object } params Query params.
     * @returns { Promise<number[]> } Promise of ids found.
     */
    const usersStaringByLetterDBQuery = (params) => {
      if (!params) {
        throw new Error('Expected params!');
      }
      /** @type string */
      const letter = params.letter;
      if (!letter || letter.length !== 1) {
        throw new Error('Expected a letter!');
      }
      return knex
        .select(userModel.id)
        .from(userModel.tableName)
        .where('username', 'like', letter + '%')
        .then(
          (results) => results.map((result) => result.id),
        );
    };
    return userManager.query({
      isMultiple: true,
      queryKeyGen: (params) => 'user/name-start::' + params.letter,
      query: usersStaringByLetterDBQuery,
      reverseHashKey: 'user/name-start/reverse',
    });
  }
}

module.exports = { UserQueriesProvider };

```

The steps to follow are simple. For each query:

  1. Create a query to the database. We are using knex for this purpose. Keep in mind that this query must return an id or a collection of ids of the entities that must be the result of the query.
  2. Create the AntJS query generation object. This object has the following params:

  * __entityKeyGen (optional)__: function that determines, for an entity, the redis key of the query associated to the entity. If no entityKeyGen is provided, the function provided as queryKeyGen will be used for this purpose.
  * __isMultiple__: Must be true if the query returns an array of ids (that could be empty) or false if the query returns one id (that could be null if no entity is valid).
  * __queryKeyGen__: function that determines, for each query params, the redis key of the query results.
  * __query__: Query created at the step 1.
  * __reverseHashKey__: Key of a special hash that is used by this library to manage query results of this query.

  3. Call the query method of the model manager passing the query genertion object. A query manager will be generated and returned.

Once we have our provider, we can just use it in out AntSqlProvider:

__src/provider/AntSqlProvider.ts__

```javascript
...

const {
  usersByUsernameQuery,
  usersStartingByLetterQuery,
} = new UserQueriesProvider().injectQueries(
  knex, userManager, userModel,
);

...
```

Don't forget to export the query managers, they are the objects we will use to perform queries.

```javascript
...

module.exports = {
  manager,
  userManager,
  usersByUsernameQuery,
  usersStartingByLetterQuery,
};

```

That's all, we are ready to work with the query managers!

You can access the [tutorial repository](https://github.com/notaphplover/ant-js-tutorial) in order to see the code in action. If you have Docker installed, you will be able to run the code with the following command:

```
npm run docker-test-user-queries-js
```
