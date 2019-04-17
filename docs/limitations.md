# Scalability notes

This library is suposed to be used to managed a redis server, a redis cluster or multiple redis cluster. There are two important limits when using the library:

  1. The reverse hashes should never be deleted.
  2. All the entities of the same model must be assigned to the same master redis instance.

  These are two important limits, that's something we know. We have plans to solve this problems in a future major version.