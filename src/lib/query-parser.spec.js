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

const takeFromQuery = path =>
  R.assocPath(path, R.path(path, query), {});

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
      it('returns filter[Object(name in foo)]', () => {
        const q = takeFromQuery(['filter', 'name']);
        const expected = {
          column: 'name',
          operator: 'in',
          value: 'foo',
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
      it('returns filter[Object(empty in \'\')]', () => {
        const q = takeFromQuery(['filter', 'empty']);
        const r = lib(q);
        const expected = {
          column: 'empty',
          operator: 'in',
          value: '',
        };


        expect(r).to.have.property('filter').that.is.an('array');
        expect(r).to.have.property('filter').that.length(1);
        expect(r).to.have.property('filter').that.include(expected);
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

    describe('filter[lt][lt]=20', () => {
      it('returns filter[{ column: lt, operator: <, value: 20 }]', () => {
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

    describe('filter[lte][lte]=20', () => {
      it('returns filter[{ column: lte, operator: <=, value: 20 }]', () => {
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

    describe('filter[gt][gt]=20', () => {
      it('returns filter[{ column: gt, operator: >, value: 20 }]', () => {
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

    describe('filter[gte][gte]=20', () => {
      it('returns filter[{ column: gte, operator: >, value: 20 }]', () => {
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

    describe('filter[contains][contains]=20', () => {
      it('returns filter[{ column: contains, operator: contains, value: %hello% }]', () => {
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
  });
});
