import { expect } from 'chai'; // eslint-disable-line
import plugin from './plugin';

// Test data set:
// - posts { id, title, post, author_id }
// - authors { id, name }
// - comments { id, author_id, post_id, comment }

describe('plugin', () => {
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
