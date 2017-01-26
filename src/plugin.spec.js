import { expect } from 'chai'; // eslint-disable-line
import knex from 'knex'; // eslint-disable-line
import Bookshelf from 'bookshelf'; // eslint-disable-line
import plugin from './plugin';

// Test data set:
// - posts { id, title, post, author_id }
// - authors { id, name }
// - comments { id, author_id, post_id, comment }

describe('plugin', () => {
  Bookshelf.plugin('registry');

  const Author = Bookshelf.Model.extend({
    tableName: 'users',
    defaults: {
      name: 'Anonymous',
    },
    posts() {
      return this.hasMany('Post');
    },
    comments() {
      return this.hasMany('Comment');
    },
  });
  Bookshelf.model('Author', Author);

  const Post = Bookshelf.Model.extend({
    tableName: 'posts',
    defaults: {
      title: 'foo bar',
      post: 'Lorem ipsum dolor sit amet',
    },
    author() {
      return this.belongsTo('Author');
    },
  });
  Bookshelf.model('Post', Post);

  const Comment = Bookshelf.Model.extend({
    tableName: 'comments',
    defaults: {
      comment: 'Hi there',
    },
    author() {
      return this.belongsTo('Author');
    },
  });
  Bookshelf.model('Comment', Comment);

  describe('filter', () => {
    describe('posts?filter[title]=foo', () => {
      it('returns post with title foo', (done) => {
        done(new Error('not implemented'));
      });
    });

    describe('post?filter[title]=foo,bar', () => {
      it('returns posts with title foo and bar', (done) => {
        done(new Error('not implemented'));
      });
    });
  });
});
