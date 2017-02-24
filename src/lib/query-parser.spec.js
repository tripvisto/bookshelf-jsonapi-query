import R from 'ramda';
import { expect } from 'chai'; // eslint-disable-line
import lib from './query-parser';

const query = {
  filter: {
    name: 'foo',
    tags: 'foo,bar,baz',
    empty: '',
    array: ['foo', 'bar'],
    lt: {
      lt: 20,
    },
    lte: {
      lte: 20,
    },
    gt: {
      gt: 20,
    },
    gte: {
      gte: 20,
    },
    contains: {
      contains: 'hello',
    },
    like: {
      like: 'foo',
    },
  },
};

const takeFromQuery = (path, value) =>
  R.assocPath(
    path,
    R.ifElse(R.isNil, R.always(R.path(path, query)), R.identity)(value),
    {});

describe.only('lib/query-parser', () => {
  describe('filter', () => {
    describe('filter[like][like]=foo', () => {
      it('throws Unsuppported operator: like', () => {
        const q = takeFromQuery(['filter', 'like']);
        const r = lib.bind(null, q);

        expect(r).to.throw('Unsuppported operator: like');
      });
    });

    describe('filter[name]=foo', () => {
      it('returns filter[Object(name in [foo])]', () => {
        const q = takeFromQuery(['filter', 'name']);
        const expected = {
          column: 'name',
          operator: 'in',
          value: ['foo'],
        };
        const r = lib(q);

        expect(r).to.have.property('filter').that.is.an('array');
        expect(r).to.have.property('filter').that.length(1);
        expect(r).to.have.property('filter').that.include(expected);
      });
    });

    describe('filter[tag]=foo,bar,baz', () => {
      it('returns filter[Object(tags in [foo, bar, baz])]', () => {
        const q = takeFromQuery(['filter', 'tags']);
        const expected = {
          column: 'tags',
          operator: 'in',
          value: ['foo', 'bar', 'baz'],
        };
        const r = lib(q);

        expect(r).to.have.property('filter').that.is.an('array');
        expect(r).to.have.property('filter').that.length(1);
        expect(r).to.have.property('filter').that.include(expected);
      });
    });

    describe('filter[empty]=', () => {
      it('returns filter[]', () => {
        const q = takeFromQuery(['filter', 'empty']);
        const r = lib(q);

        expect(r).to.have.property('filter').that.is.an('array');
        expect(r).to.have.property('filter').that.length(0);
      });
    });

    describe('parsed filter[array]=[foo, bar]', () => {
      it('returns filter[Object(array in [foo, bar])]', () => {
        const q = takeFromQuery(['filter', 'array']);
        const r = lib(q);
        const expected = {
          column: 'array',
          operator: 'in',
          value: ['foo', 'bar'],
        };

        expect(r).to.have.property('filter').that.is.an('array');
        expect(r).to.have.property('filter').that.length(1);
        expect(r).to.have.property('filter').that.include(expected);
      });
    });

    describe('parsed filter[array]=[]', () => {
      it('returns filter[]', () => {
        const q = takeFromQuery(['filter', 'array'], '');
        const r = lib(q);

        expect(r).to.have.property('filter').that.length(0);
      });
    });

    describe('filter[lt][lt]=20', () => {
      it('returns filter[Object(lt < 20)]', () => {
        const q = takeFromQuery(['filter', 'lt']);
        const r = lib(q);
        const expected = {
          column: 'lt',
          operator: '<',
          value: 20,
        };

        expect(r).to.have.property('filter').that.length(1);
        expect(r).to.have.property('filter').that.include(expected);
      });
    });

    describe('filter[lt][lt]=', () => {
      it('returns filter[]', () => {
        const q = takeFromQuery(['filter', 'lt'], { lt: '' });
        const r = lib(q);

        expect(r).to.have.property('filter').that.length(0);
      });
    });

    describe('filter[lte][lte]=20', () => {
      it('returns filter[Object(lte <= 20)]', () => {
        const q = takeFromQuery(['filter', 'lte']);
        const r = lib(q);
        const expected = {
          column: 'lte',
          operator: '<=',
          value: 20,
        };

        expect(r).to.have.property('filter').that.length(1);
        expect(r).to.have.property('filter').that.include(expected);
      });
    });


    describe('filter[lte][lte]=', () => {
      it('returns filter[]', () => {
        const q = takeFromQuery(['filter', 'lte'], { lte: '' });
        const r = lib(q);

        expect(r).to.have.property('filter').that.length(0);
      });
    });

    describe('filter[gt][gt]=20', () => {
      it('returns filter[Object(gt > 20)]', () => {
        const q = takeFromQuery(['filter', 'gt']);
        const r = lib(q);
        const expected = {
          column: 'gt',
          operator: '>',
          value: 20,
        };

        expect(r).to.have.property('filter').that.length(1);
        expect(r).to.have.property('filter').that.include(expected);
      });
    });

    describe('filter[gt][gt]=', () => {
      it('returns filter[]', () => {
        const q = takeFromQuery(['filter', 'gt'], { gt: '' });
        const r = lib(q);

        expect(r).to.have.property('filter').that.length(0);
      });
    });

    describe('filter[gte][gte]=20', () => {
      it('returns filter[Object(gte >= 20)]', () => {
        const q = takeFromQuery(['filter', 'gte']);
        const r = lib(q);
        const expected = {
          column: 'gte',
          operator: '>=',
          value: 20,
        };

        expect(r).to.have.property('filter').that.length(1);
        expect(r).to.have.property('filter').that.include(expected);
      });
    });

    describe('filter[gte][gte]=', () => {
      it('returns filter[]', () => {
        const q = takeFromQuery(['filter', 'gte'], { gte: '' });
        const r = lib(q);

        expect(r).to.have.property('filter').that.length(0);
      });
    });

    describe('filter[contains][contains]=20', () => {
      it('returns filter[Object(contains like %hello%)]', () => {
        const q = takeFromQuery(['filter', 'contains']);
        const r = lib(q);
        const expected = {
          column: 'contains',
          operator: 'like',
          value: '%hello%',
        };

        expect(r).to.have.property('filter').that.length(1);
        expect(r).to.have.property('filter').that.include(expected);
      });
    });

    describe('filter[contains][contains]=', () => {
      it('returns filter[]', () => {
        const q = takeFromQuery(['filter', 'contains'], { contains: '' });
        const r = lib(q);

        expect(r).to.have.property('filter').that.length(0);
      });
    });

    describe('filter[name]=foo&filter[contains][contains]=20', () => {
      it('returns filter[Object(name in [foo]), Object(contains like %hello%)]', () => {
        const q = R.pipe(
          R.merge(takeFromQuery(['filter', 'contains']).filter),
          R.merge(takeFromQuery(['filter', 'name']).filter),
          R.assocPath(['filter'], R.__, {}),
        )({});
        const r = lib(q);
        const expected1 = {
          column: 'contains',
          operator: 'like',
          value: '%hello%',
        };
        const expected2 = {
          column: 'name',
          operator: 'in',
          value: ['foo'],
        };

        expect(r).to.have.property('filter').that.length(2);
        expect(r).to.have.property('filter').that.include(expected1);
        expect(r).to.have.property('filter').that.include(expected2);
      });
    });
  });
});
