import R from 'ramda';
import { expect } from 'chai'; // eslint-disable-line
import lib from './query-parser';

const query = {
  filter: {
    name: 'foo',
    tags: 'foo,bar,baz',
  },
};

const takeFromQuery = path =>
  R.assocPath(path, R.path(path, query), {});

describe.only('lib/query-parser', () => {
  describe('filter', () => {
    describe('filter[name]=foo', () => {
      it('returns filter.name = foo', () => {
        const q = takeFromQuery(['filter', 'name']);
        const expected = {
          name: 'foo',
        };
        const r = lib(q);

        expect(r.filter).eql(expected);
      });
    });

    describe('filter[tag]=foo,bar,baz', () => {
      it('returns filter.tags = [foo, bar, baz]', () => {
        const q = takeFromQuery(['filter', 'tags']);
        const expected = {
          tags: ['foo', 'bar', 'baz'],
        };
        const r = lib(q);

        expect(r).to.have.property('filter').that.eql(expected);
      });
    });

    describe('filter[baz]=', () => {
      it('returns filter.baz=\'\'', () => {
        const q = { filter: { baz: '' } };
        const r = lib(q);
        const expected = { baz: '' };

        expect(r).to.have.property('filter').that.eql(expected);
      });
    });
  });
});
