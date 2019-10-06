# Queries

A query is a request for data or information from a data source. In the context of AntJS, a query is in the context of a model, a __request for ids__ of certain entities (of the model) from a data source.

We define queries as ids requests because it allows us to have a fast cache system:

1. Cached entities are mapped by its id field.
2. Any decent data source should be able to index entities by its id.
3. Ids are inmutable.

Keeping that in mind, defining queries as ids requests allow us to sync the cache system in an efficient way because a change in an entity can be reflected in the cache system with just two simple write operations:

  1. Write the new entity.
  2. Move (if necessary) the entity id from a query to other one. This operation is necessary if the entity is no longer associated to the cached query because of the entity's change.

Remember that a query is a request for entities of the same model. If you want to perform queries that targets different models, you will have to create (at least) one query for each model.

Another important restriction when creating queries is the following one:

__For each query, there must be only a way to find an entity__

__Example of a good query__: A query that takes a letter and finds all the users whose username starts with the letter is a valid query because, for each user, there is only a way to find the user. The only way to find the user "notaphplover" is passing "n" to the query.

__Example of a bad query__: A query that takes a letter and finds all the users whose username contains the letter is a bad query. There are multuple ways to find the user "notaphplover" ("n", "o", "t"...)

This restriction is one of the keys to build a fast cache algorithm.

If you really need to cache a "bad" query, you can try to simulate it as a set of multiple "good" queries:

  * Supose the user model has a "money" field. Supose we want to search users with in a certain range of money. We could create a query of appropiate ranges and then create the query as a process of the result of multiple queries. We could create, for example, a query that takes a number and returns users with money between (number * 10000) and ((number + 1) * 10000 - 1).Then, we could use this query multiple times to search users at almost any range.

  Sometimes you won't be able to create a "good" query. In these cases, it's probably because it's not a good idea to create the cached query.
