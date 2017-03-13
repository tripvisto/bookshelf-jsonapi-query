# bookshelf-jsonapi-query

A Bookshelf plugin to fetch data using [JSON API](http://jsonapi.org/format/)
query format.

## Installation

```
$ npm install --save bookshelf-jsonapi-query
```

## Usage

```javascript
import plugin from 'bookshelf-jsonapi-query';
// Some Bookshelf instantiation code

const q = {
  filter: {
    title: 'Post 1',
  },
};
Bookshelf.plugin(plugin);

Const Posts = Bookshelf.Model.extend({
  ...
});

Posts.fetchJsonapi(q);
```

The `fetchJsonapi` takes a query object as its parameter.
The query object are most likely constructed by web frameworks
such as [expressjs][http://expressjs.com/] from a URL query.
