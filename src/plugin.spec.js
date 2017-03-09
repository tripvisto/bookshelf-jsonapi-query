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
        }),
        Bookshelf.knex.schema.createTable('comments', (t) => {
          t.increments('id').primary();
          t.int('author_id');
          t.int('post_id');
          t.string('comment');
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
          }),
          Post.forge().save({
            id: 2,
            author_id: 1,
            title: 'Post 2',
            post: 'Post number 2',
          }),
          Post.forge().save({
            id: 3,
            author_id: 2,
            title: 'Post 3',
            post: 'Post by author #2',
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
      .then(call(done));
  });

  after((done) => {
    Bookshelf.knex.destroy(done);
  });

  describe.skip('morph', () => {
    describe('fetch avatar', () => {
      it('returns avatar for id 1',  (done) => {
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

  describe.only('filter', () => {
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

    describe('post?filter[author.name]=John F Doe', () => {
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
  });
});
