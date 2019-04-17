# 1. Setting up the project

In this tutorial we are creating the project and installing the library using npm.

First of all, let's create our project directory. In this sample, the directory name will be "redis-tutorial". After creating the directory, we must start npm. Open a terminal and navigate to the project's directory. Then, run the following command:

```
npm init
```

After providing some data requested for npm, we are ready to install the library:

```
npm install @antjs/ant-js
```

It's important to notice that @antjs/ant-js is a package that just manages redis, but it does not care about a secondary persistence layer, such a MySQL cluster. We provide you libraries that extends AntJS in order to work with different secondary persistence layers, but they all work in the same way. This tutorial series will use the SQL extension in order to simplify the learning process.

Lets install the SQL extension:

```
npm install @antjs/ant-sql
```

In the following tutorial we will conect AntJS to a PostgreSQL database and start caching some entities. In order to use PostgreSQL, we will need to install an additional library:

```
npm install pg
```

That's all! Now we are ready to start coding.

Next tutorial: Adding a model ([Javascript](./2_adding_a_model_js.md) or [Typescript](./2_adding_a_model_ts.md)).
