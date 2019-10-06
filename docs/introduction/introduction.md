# 1. Introduction

¿Do you use redis in your projects? If yes, this library could be interesting for you.

AntJS is a NodeJS library to manage a redis server, or even multiple clusters in an easy way. And it scales! For now, it has some limitations that are detailed [here](../limitations.md), but we expect to solve them in a future major version.

### ¿What does "an easy way" mean?

It means that, providing the library a collection of models and queries, this library will handle redis for you.

* Don't care anymore of choosing redis data structures.
* __Key collision__ is not possible with models and queries managed by AntJS.
* Queries are __sync__ automatically when the library registers an entity creation, update or removal in the library.
* __Performance__ and __atomicy__ are guaranteed using Lua Scripts.

Would you like to get started using this library? Then you can follow our [tutorials](../tutorial/introduction.md).

Would you like to understand the key concepts of the library? Then you can read the [fundamentals](../fundamentals/introduction.md).
