import R from 'ramda';
import { expect } from 'chai'; // eslint-disable-line
import lib from './query-parser';

const query = {
  filter: {
    name: 'foo',
    tags: 'foo,bar,baz',
  },
};

describe.only('lib/query-parser', () => {
  describe('filter', () => {
    describe('filter[name]=foo', () => {
      it('returns filter.name = foo', () => {
        const q = R.assocPath(
          ['filter', 'name'],
          query.filter.name,
          {},
        );
        const expected = {
          name: 'foo',
        };
        const r = lib(q);

        expect(r.filter).eql(expected);
      });
    });

    describe('filter[tag]=foo,bar,baz', () => {
      it('returns filter.tags = [foo, bar, baz]', () => {
        const q = R.assocPath(
          ['filter', 'tags'],
          query.filter.tags,
          {},
        );
        const expected = {
          tags: ['foo', 'bar', 'baz'],
        };
        const r = lib(q);

        expect(r).have.property('filter').that.eql(expected);
      });
    });
  });
});
