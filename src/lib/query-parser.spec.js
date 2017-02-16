import R from 'ramda';
import { expect } from 'chai'; // eslint-disable-line
import lib from './query-parser';

const query = {
  filter: {
    name: 'foo',
    tags: 'foo,bar,baz',
    empty: '',
    array: ['foo', 'bar'],
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

    describe('filter[empty]=', () => {
      it('returns filter.empty=\'\'', () => {
        const q = takeFromQuery(['filter', 'empty']);
        const r = lib(q);
        const expected = { empty: '' };

        expect(r).to.have.property('filter').that.eql(expected);
      });
    });

    describe('parsed filter[array]=[foo, bar]', () => {
      it('returns filter.array = [foo, bar]', () => {
        const q = takeFromQuery(['filter', 'array']);
        const r = lib(q);
        const expected = { array: ['foo', 'bar'] };

        expect(r).to.have.property('filter').that.eql(expected);
      });
    });
  });
});
