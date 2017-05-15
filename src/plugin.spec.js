import { expect } from 'chai'; // eslint-disable-line
import knex from 'knex'; // eslint-disable-line
import bookshelf from 'bookshelf'; // eslint-disable-line
import plugin from './plugin';

// Test data set:
// - posts { id, title, post, author_id }
// - authors { id, name }
// - comments { id, author_id, post_id, comment }
const toJSON = r => r.toJSON();
const call = f => () => f();

const Bookshelf = bookshelf(knex({ client: 'sqlite3', connection: { filename: ':memory:' } }));

Bookshelf.plugin('registry');
Bookshelf.plugin(plugin);

const Author = Bookshelf.Model.extend({
  tableName: 'users',
  defaults: {
    name: 'Anonymous',
  },
  posts() {
    return this.hasMany('Post', 'author_id');
  },
  comments() {
    return this.hasMany('Comment', 'author_id');
  },
  references() {
    return this.hasMany('Reference', 'author_id');
  },
  avatar() {
    return this.morphOne('Image', 'imageable');
  },
});
Bookshelf.model('Author', Author);

const Image = Bookshelf.Model.extend({
  tableName: 'images',
  imageable() {
    return this.morphTo('imageable', 'Author', 'Post');
  },
});
Bookshelf.model('Image', Image);

const Post = Bookshelf.Model.extend({
  tableName: 'posts',
  defaults: {
    title: 'foo bar',
    post: 'Lorem ipsum dolor sit amet',
  },
  author() {
    return this.belongsTo('Author', 'author_id');
  },
  comments() {
    return this.hasMany('Comment');
  },
  references() {
    return this.hasMany('Reference');
  },
});
Bookshelf.model('Post', Post);

const Comment = Bookshelf.Model.extend({
  tableName: 'comments',
  defaults: {
    comment: 'Hi there',
  },
  author() {
    return this.belongsTo('Author', 'author_id');
  },
  post() {
    return this.belongsTo('Post');
  },
});
Bookshelf.model('Comment', Comment);

const Reference = Bookshelf.Model.extend({
  tableName: 'ref',
  author() {
    return this.belongsTo('Author', 'author_id');
  },
  post() {
    return this.belongsTo('Post');
  },
});
Bookshelf.model('Reference', Reference);

describe('plugin', () => {
  before((done) => {
    Promise
      .all([
        Bookshelf.knex.schema.createTable('users', (t) => {
          t.increments('id').primary();
          t.string('name');
        }),
        Bookshelf.knex.schema.createTable('images', (t) => {
          t.increments('id').primary();
          t.string('url');
          t.integer('imageable_id');
          t.string('imageable_type');
        }),
        Bookshelf.knex.schema.createTable('posts', (t) => {
          t.increments('id').primary();
          t.int('author_id');
          t.string('title');
          t.string('post');
          t.timestamp('published');
        }),
        Bookshelf.knex.schema.createTable('comments', (t) => {
          t.increments('id').primary();
          t.int('author_id');
          t.int('post_id');
          t.string('comment');
        }),
        Bookshelf.knex.schema.createTable('ref', (t) => {
          t.increments('id').primary();
          t.int('author_id');
          t.int('post_id');
          t.string('url');
        }),
      ])
      .then(() =>
        Promise.all([
          Author.forge().save({
            id: 1,
            name: 'John F Doe',
          }),
          Author.forge().save({
            id: 2,
            name: 'Andy F Doe',
          }),
        ]),
      )
      .then(() =>
        Promise.all([
          Post.forge().save({
            id: 1,
            author_id: 1,
            title: 'Post 1',
            post: 'Post 1 content',
            published: '2017-05-01 08:00:00',
          }),
          Post.forge().save({
            id: 2,
            author_id: 1,
            title: 'Post 2',
            post: 'Post number 2',
            published: '2017-05-02 08:00:00',
          }),
          Post.forge().save({
            id: 3,
            author_id: 2,
            title: 'Post 3',
            post: 'Post by author #2',
            published: '2017-05-03 09:30:00',
          }),
        ]),
      )
      .then(() =>
        Promise.all([
          Image.forge().save({
            id: 1,
            imageable_id: 1,
            imageable_type: 'users',
            url: 'http://s3.aws.com/image1.png',
          }),
        ]),
      )
      .then(() =>
        Promise.all([
          Comment.forge().save({
            id: 1,
            author_id: 1,
            post_id: 1,
            comment: 'comment 1',
          }),
          Comment.forge().save({
            id: 2,
            author_id: 2,
            post_id: 1,
            comment: 'comment 2, by author 2',
          }),
          Comment.forge().save({
            id: 3,
            author_id: 1,
            post_id: 2,
            comment: 'comment 1 in post 2',
          }),
        ]),
      )
      .then(() =>
        Promise.all([
          Reference.forge().save({
            id: 1,
            author_id: 1,
            post_id: 1,
            url: 'http://wikipedia.org/ref1',
          }),
          Reference.forge().save({
            id: 2,
            author_id: 2,
            post_id: 1,
            url: 'http://wikipedia.org/ref2',
          }),
          Reference.forge().save({
            id: 3,
            author_id: 1,
            post_id: 2,
            url: 'http://wikipedia.org/ref3',
          }),
        ]),
      )
      .then(call(done));
  });

  after((done) => {
    Bookshelf.knex.destroy(done);
  });

  describe.skip('morph', () => {
    describe('fetch avatar', () => {
      it('returns avatar for id 1', (done) => {
        Author.fetchAll({
          withRelated: ['avatar'],
          debug: true,
        })
          .then(toJSON)
          .then(r => {
            console.log(r);
          })
          .then(call(done))
          .catch(done);
      });
    });
  });

  describe('filter', () => {
    describe('posts?filter[title][like]=roo', () => {
      it('throws Unsuppported operator: like', (done) => {
        const q = {
          filter: {
            title: { like: 'roo' },
          },
        };

        Post
          .fetchJsonapi(q)
          .then(() => done('Should be rejected'))
          .catch((e) => {
            expect(e).to.have.property('message').that.eql('Unsuppported operator: like');
            done();
          });
      });
    });

    describe('posts?', () => {
      it('returns model without aggregation', (done) => {
        Post
          .fetchJsonapi()
          .then((r) => {
            expect(r).to.not.have.property('aggregation');
          })
          .then(call(done))
          .catch(done);
      });
    });

    describe('posts?filter[title]=Post 1', () => {
      it('returns post with title Post 1', (done) => {
        const q = {
          filter: {
            title: 'Post 1',
          },
        };

        Post
          .fetchJsonapi(q)
          .then(toJSON)
          .then((r) => {
            expect(r).to.have.length(1);
            expect(r).to.have.deep.property('[0].title', 'Post 1');
          })
          .then(call(done))
          .catch(done);
      });
    });

    describe('post?filter[title]=Post 1,Post 2', () => {
      it('returns posts with title Post 1 and Post 2', (done) => {
        const q = {
          filter: {
            title: 'Post 1,Post 2',
          },
        };

        Post
          .fetchJsonapi(q)
          .then(toJSON)
          .then((r) => {
            expect(r).to.have.length(2);
            expect(r).to.have.deep.property('[0].title', 'Post 1');
            expect(r).to.have.deep.property('[1].title', 'Post 2');
          })
          .then(call(done))
          .catch(done);
      });
    });

    describe('posts?filter[published][gte]=2017-05-01 00:00:00&filter[published][lte]=2017-05-03 08:00:00', () => {
      it('returns posts between the date range', (done) => {
        const q = {
          filter: {
            published: {
              gte: '2017-05-01 00:00:00',
              lte: '2017-05-03 08:00:00',
            },
          },
        };

        Post
          .fetchJsonapi(q)
          .then(toJSON)
          .then((r) => {
            expect(r).to.have.length(2);
            expect(r).to.have.deep.property('[0].id', 1);
            expect(r).to.have.deep.property('[0].published', '2017-05-01 08:00:00');
            expect(r).to.have.deep.property('[1].id', 2);
            expect(r).to.have.deep.property('[1].published', '2017-05-02 08:00:00');
          })
          .then(call(done))
          .catch(done);
      });
    });

    describe('posts?filter[author.name]=John F Doe', () => {
      it('returns posts authored by John F Doe', (done) => {
        const q = {
          filter: {
            'author.name': 'John F Doe',
          },
        };

        Post
          .fetchJsonapi(q)
          .then(toJSON)
          .then((r) => {
            expect(r).to.have.length(2);
            expect(r).to.have.deep.property('[0].title', 'Post 1');
            expect(r).to.have.deep.property('[1].title', 'Post 2');
          })
          .then(call(done))
          .catch(done);
      });
    });

    describe('posts?filter[tags.name]=post', () => {
      it('throws Unknown relation: gender', (done) => {
        const q = {
          filter: {
            'tags.name': 'post',
          },
        };
        Post
          .fetchJsonapi(q)
          .then(() => done('Should be rejected'))
          .catch((e) => {
            expect(e).to.have.property('message').that.eql('Unknown relation: tags');
            done();
          });
      });
    });

    describe('posts?filter[comments.author.name][contains]=john', () => {
      it('returns posts that has been commented by someone whose name contains john', (done) => {
        const q = {
          filter: {
            'comments.author.name': {
              contains: 'john',
            },
          },
        };

        Post
          .fetchJsonapi(q)
          .then(toJSON)
          .then((r) => {
            expect(r).to.have.length(2);
            expect(r).to.have.deep.property('[0].title', 'Post 1');
            expect(r).to.have.deep.property('[1].title', 'Post 2');
          })
          .then(call(done))
          .catch(done);
      });
    });

    describe('posts?include=author', () => {
      it('returns all posts and its author detail', (done) => {
        const q = {
          include: 'author',
        };

        Post
          .fetchJsonapi(q)
          .then(toJSON)
          .then((r) => {
            expect(r).to.have.length(3);
            expect(r).to.have.deep.property('[0].author.name', 'John F Doe');
            expect(r).to.have.deep.property('[1].author.name', 'John F Doe');
            expect(r).to.have.deep.property('[2].author.name', 'Andy F Doe');
          })
          .then(call(done))
          .catch(done);
      });
    });

    describe('posts?filter[comments.author.name][contains]=john&include=comments', () => {
      it('returns all posts which has been commented by somebody whose name contains john', (done) => {
        const q = {
          filter: {
            'comments.author.name': {
              contains: 'john',
            },
          },
          include: 'comments',
        };
        const expectedComment1 = 'comment 1';
        const expectedComment2 = 'comment 1 in post 2';

        Post
          .fetchJsonapi(q)
          .then(toJSON)
          .then((r) => {
            expect(r).to.have.length(2);
            expect(r).to.have.deep.property('[0].comments').that.length(1);
            expect(r).to.have.deep.property('[0].comments[0].comment', expectedComment1);
            expect(r).to.have.deep.property('[1].comments').that.length(1);
            expect(r).to.have.deep.property('[1].comments[0].comment', expectedComment2);
          })
          .then(call(done))
          .catch(done);
      });
    });

    describe('posts?filter[references.author.name][contains]=john&include=references', () => {
      it('returns all posts having references authored by somebody whose name contains john', (done) => {
        const q = {
          filter: {
            'references.author.name': {
              contains: 'john',
            },
          },
          include: 'references',
        };
        const expectedRef1 = 'http://wikipedia.org/ref1';
        const expectedRef2 = 'http://wikipedia.org/ref3';

        Post
          .fetchJsonapi(q)
          .then(toJSON)
          .then((r) => {
            expect(r).to.have.length(2);
            expect(r).to.have.deep.property('[0].references').that.length(1);
            expect(r).to.have.deep.property('[0].references[0].url', expectedRef1);
            expect(r).to.have.deep.property('[1].references').that.length(1);
            expect(r).to.have.deep.property('[1].references[0].url', expectedRef2);
          })
          .then(call(done))
          .catch(done);
      });
    });


    describe('posts/1?include=comments', () => {
      it('returns post with id 1 and include its comments', (done) => {
        const q = {
          include: 'comments',
        };
        const expectedTitle = 'Post 1';

        Post
          .where({ id: 1 })
          .fetchJsonapi(q, {
            isCollection: false,
          })
          .then(toJSON)
          .then((r) => {
            expect(r).to.be.an('object');
            expect(r).to.have.deep.property('title', expectedTitle);
            expect(r).to.have.deep.property('comments').that.is.an('array');
            expect(r).to.have.deep.property('comments').that.length(2);
          })
          .then(call(done))
          .catch(done);
      });
    });

    describe('posts/1?include=comments,comments.author&filter[comments.author.name][contains]=john', () => {
      it('returns post with id 1 including comments only from john', (done) => {
        const q = {
          filter: {
            'comments.author.name': {
              contains: 'john',
            },
          },
          include: 'comments,comments.author',
        };
        const expectedTitle = 'Post 1';

        Post
          .where({ [`${Post.prototype.tableName}.id`]: 1 })
          .fetchJsonapi(q, {
            isCollection: false,
          })
          .then(toJSON)
          .then((r) => {
            expect(r).to.be.an('object');
            expect(r).to.have.deep.property('title', expectedTitle);
            expect(r).to.have.deep.property('comments').that.is.an('array');
            expect(r).to.have.deep.property('comments').that.length(1);
            expect(r).to.have.deep.property('comments[0].author.name').that.match(/john/i);
          })
          .then(call(done))
          .catch(done);
      });
    });

    describe('posts?page[number]=1&page[size]=2', () => {
      it('returns 2 posts and contains pagination metadata', (done) => {
        const q = {
          page: {
            number: 1,
            size: 2,
          },
        };

        Post
          .fetchJsonapi(q)
          .tap((r) => {
            expect(r).to.have.deep.property('pagination.rowCount', 3);
            expect(r).to.have.deep.property('pagination.pageCount', 2);
            expect(r).to.have.deep.property('pagination.page', 1);
            expect(r).to.have.deep.property('pagination.pageSize', 2);
          })
          .then(toJSON)
          .then((r) => {
            expect(r).to.have.length(2);
          })
          .then(call(done))
          .catch(done);
      });
    });

    describe('posts?fields[posts]=title', () => {
      it('returns posts containing only title and id field', (done) => {
        const q = {
          fields: {
            posts: 'title',
          },
        };

        Post
          .fetchJsonapi(q)
          .then(toJSON)
          .then((r) => {
            expect(r).to.have.length(3);
            r.forEach(i => expect(i).to.have.all.keys('id', 'title'));
          })
          .then(call(done))
          .catch(done);
      });
    });

    describe('posts?fields[posts]=title&fields[comments]=comment&include=comments', () => {
      it('returns posts containing title field with its comments containing only comment field', (done) => {
        const q = {
          fields: {
            posts: 'title',
            comments: 'comment',
          },
          include: 'comments',
        };

        Post
          .fetchJsonapi(q)
          .then(toJSON)
          .then((r) => {
            expect(r).to.have.deep.property('[0]').to.have.all.keys('id', 'comments', 'title');
            expect(r).to.have.deep.property('[0].comments[0]').that.have.all.keys('comment', 'post_id');
            expect(r).to.have.deep.property('[1]').to.have.all.keys('id', 'comments', 'title');
            expect(r).to.have.deep.property('[1].comments[0]').that.have.all.keys('comment', 'post_id');
            expect(r).to.have.deep.property('[2]').to.have.all.keys('id', 'comments', 'title');
          })
          .then(call(done))
          .catch(done);
      });
    });

    describe('posts?sort=-id', () => {
      it('return posts with descending order by id', (done) => {
        const q = {
          sort: '-id',
        };

        Post
          .fetchJsonapi(q)
          .then(toJSON)
          .then((r) => {
            expect(r).to.have.deep.property('[0].id', 3);
            expect(r).to.have.deep.property('[1].id', 2);
            expect(r).to.have.deep.property('[2].id', 1);
          })
          .then(call(done))
          .catch(done);
      });
    });

    describe('posts?aggregate[foo]', () => {
      it('throws Unsuppported aggregation: foo', (done) => {
        const q = {
          aggregate: {
            foo: 'id',
          },
        };

        Post
          .fetchJsonapi(q)
          .then(() => done('should be rejected'))
          .catch((e) => {
            expect(e).to.have.property('message').that.eql('Unsupported aggregation: foo');
            done();
          });
      });
    });

    describe('posts?aggregate[count]=id&aggregate[sum]=id&filter[author.name][contains]=john', () => {
      it('returns a Bookshelf Collection with aggregation metadata', (done) => {
        const q = {
          aggregate: {
            count: 'id',
            sum: 'id',
          },
          filter: {
            'author.name': {
              contains: 'john',
            },
          },
        };
        const expectedCount = 2;
        const expectedSum = 3;

        Post
          .fetchJsonapi(q)
          .then((r) => {
            expect(r).to.have.property('aggregation')
              .that.have.all.keys(
                'count_id',
                'sum_id',
              );
            expect(r).to.have.deep.property('aggregation.count_id', expectedCount);
            expect(r).to.have.deep.property('aggregation.sum_id', expectedSum);
          })
          .then(call(done))
          .catch(done);
      });
    });
  });
});
