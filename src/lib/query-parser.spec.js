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
    'related.in': 'foo',
    'related.inArray': 'foo,bar,baz',
    'related.lt': {
      lt: 20,
    },
    'related.contains': {
      contains: 'hello',
    },
    'related.like': {
      like: 'foo',
    },
    'related.table.contains': {
      contains: 'hello',
    },
  },
  page: {
    number: 8,
    size: 10,
  },
  sort: 'foo,-bar',
  field: {
    resource1: 'foo,bar',
    resource2: 'bar,baz',
    resource3: '',
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

    describe('filter[related.like][like]=foo', () => {
      it('throws Unsuppported operator: like', () => {
        const q = takeFromQuery(['filter', 'related.like']);
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

        expect(r).to.not.have.property('filter');
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
      it('returns Object without filter', () => {
        const q = takeFromQuery(['filter', 'array'], '');
        const r = lib(q);

        expect(r).to.not.have.property('filter');
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
      it('returns Object without filter', () => {
        const q = takeFromQuery(['filter', 'lt'], { lt: '' });
        const r = lib(q);

        expect(r).to.not.have.property('filter');
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
      it('returns Object without filter', () => {
        const q = takeFromQuery(['filter', 'lte'], { lte: '' });
        const r = lib(q);

        expect(r).to.not.have.property('filter');
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
      it('returns Object without filter', () => {
        const q = takeFromQuery(['filter', 'gt'], { gt: '' });
        const r = lib(q);

        expect(r).to.not.have.property('filter');
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
      it('returns Object without filter', () => {
        const q = takeFromQuery(['filter', 'gte'], { gte: '' });
        const r = lib(q);

        expect(r).to.not.have.property('filter');
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
      it('returns Object without filter', () => {
        const q = takeFromQuery(['filter', 'contains'], { contains: '' });
        const r = lib(q);

        expect(r).to.not.have.property('filter');
      });
    });

    describe('filter[name]=foo&filter[contains][contains]=hello', () => {
      it('returns filter[Object(name in [foo]), Object(contains like %hello%)]', () => {
        const q = R.pipe(
          R.merge(takeFromQuery(['filter', 'contains']).filter),
          R.merge(takeFromQuery(['filter', 'name']).filter),
          R.assocPath(['filter'], R.__, {}), // eslint-disable-line
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

    describe('filter[related.in]=foo', () => {
      it('returns filter[Object([related] in in [foo])]', () => {
        const q = takeFromQuery(['filter', 'related.in']);
        const expected = {
          relations: ['related'],
          column: 'in',
          operator: 'in',
          value: ['foo'],
        };
        const r = lib(q);

        expect(r).to.have.property('filter').that.length(1);
        expect(r).to.have.property('filter').that.include(expected);
      });
    });

    describe('filter[related.inArray]=foo,bar,baz', () => {
      it('returns filter[Object([related] inArray in [foo, bar, baz])]', () => {
        const q = takeFromQuery(['filter', 'related.inArray']);
        const expected = {
          relations: ['related'],
          column: 'inArray',
          operator: 'in',
          value: ['foo', 'bar', 'baz'],
        };
        const r = lib(q);

        expect(r).to.have.property('filter').that.length(1);
        expect(r).to.have.property('filter').that.include(expected);
      });
    });

    describe('filter[related.lt][lt]=20', () => {
      it('returns filter[Object([related] lt < 20)]', () => {
        const q = takeFromQuery(['filter', 'related.lt']);
        const expected = {
          relations: ['related'],
          column: 'lt',
          operator: '<',
          value: 20,
        };
        const r = lib(q);

        expect(r).to.have.property('filter').that.length(1);
        expect(r).to.have.property('filter').that.include(expected);
      });
    });

    describe('filter[related.contains][contains]=hello', () => {
      it('returns filter[Object([related] contains like %hello%)]', () => {
        const q = takeFromQuery(['filter', 'related.contains']);
        const expected = {
          relations: ['related'],
          column: 'contains',
          operator: 'like',
          value: '%hello%',
        };
        const r = lib(q);

        expect(r).to.have.property('filter').that.length(1);
        expect(r).to.have.property('filter').that.include(expected);
      });
    });

    describe('filter[related.table.contains][contains]=hello', () => {
      it('returns filter[Object([related, table] contains like %hello%)]', () => {
        const q = takeFromQuery(['filter', 'related.table.contains']);
        const expected = {
          relations: ['related', 'table'],
          column: 'contains',
          operator: 'like',
          value: '%hello%',
        };
        const r = lib(q);

        expect(r).to.have.property('filter').that.length(1);
        expect(r).to.have.property('filter').that.include(expected);
      });
    });
  });

  describe('page', () => {
    describe('page[number]=8&page[size]=10', () => {
      it('returns page{Object(page: 8, pageSize: 10)}', () => {
        const q = {
          page: {
            number: 8,
            size: 10,
          },
        };
        const expected = {
          page: 8,
          pageSize: 10,
        };
        const r = lib(q);

        expect(r).to.have.property('page').that.eql(expected);
      });
    });

    describe('page[number]=8', () => {
      it('returns page{Object(page: 8, pageSize: 20)}', () => {
        const q = {
          page: {
            number: 8,
          },
        };
        const expected = {
          page: 8,
          pageSize: 20,
        };
        const r = lib(q);

        expect(r).to.have.property('page').that.eql(expected);
      });
    });

    describe('page[size]=8', () => {
      it('returns page{Object(page: 1, pageSize: 20)}', () => {
        const q = {
          page: {
            size: 8,
          },
        };
        const expected = {
          page: 1,
          pageSize: 8,
        };
        const r = lib(q);

        expect(r).to.have.property('page').that.eql(expected);
      });
    });

    describe('page[size]=8', () => {
      it('returns page{Object(page: 1, pageSize: 20)}', () => {
        const q = {
          page: {
            size: 8,
          },
        };
        const expected = {
          page: 1,
          pageSize: 8,
        };
        const r = lib(q);

        expect(r).to.have.property('page').that.eql(expected);
      });
    });
  });

  describe('sort', () => {
    describe('sort=foo,bar', () => {
      it('returns sort[Object(foo, ASC), Object(bar ASC)]', () => {
        const q = {
          sort: 'foo,bar',
        };
        const expected = [
          {
            column: 'foo',
            order: 'ASC',
          },
          {
            column: 'bar',
            order: 'ASC',
          },
        ];
        const r = lib(q);

        expect(r).to.have.property('sort').that.eql(expected);
      });
    });

    describe('sort=foo,-bar', () => {
      it('returns sort[Object(foo, ASC), Object(bar DESC)]', () => {
        const q = {
          sort: 'foo,-bar',
        };
        const expected = [
          {
            column: 'foo',
            order: 'ASC',
          },
          {
            column: 'bar',
            order: 'DESC',
          },
        ];
        const r = lib(q);

        expect(r).to.have.property('sort').that.eql(expected);
      });
    });

    describe('sort=-foo,-bar', () => {
      it('returns sort[Object(foo, DESC), Object(bar DESC)]', () => {
        const q = {
          sort: '-foo,-bar',
        };
        const expected = [
          {
            column: 'foo',
            order: 'DESC',
          },
          {
            column: 'bar',
            order: 'DESC',
          },
        ];
        const r = lib(q);

        expect(r).to.have.property('sort').that.eql(expected);
      });
    });
  });

  describe('include', () => {
    describe('include=foo,bar,baz.buz', () => {
      it('returns include[foo, bar, baz.buz]', () => {
        const q = {
          include: 'foo,bar,baz.buz',
        };
        const expected = ['foo', 'bar', 'baz.buz'];
        const r = lib(q);

        expect(r).to.have.property('include').that.eql(expected);
      });
    });
  });

  describe('field', () => {
    describe('field[resource1]=foo,bar&field[resource3]=', () => {
      it('returns field[Object(resource1 [foo, bar]))]', () => {
        const q = R.pipe(
          R.merge(takeFromQuery(['field', 'resource1']).field),
          R.merge(takeFromQuery(['field', 'resource3']).field),
          R.assocPath(['field'], R.__, {}), // eslint-disable-line
        )({});
        const expected = [
          {
            resource: 'resource1',
            columns: ['foo', 'bar'],
          },
        ];
        const r = lib(q);

        expect(r).to.have.property('field').that.eql(expected);
      });
    });

    describe('field[resource1]=foo,bar&field[resource2]=bar,baz', () => {
      it('returns field[Object(resource1 [foo, bar]), Object(resource2 [bar, baz])]', () => {
        const q = takeFromQuery(['field']);
        const expected = [
          {
            resource: 'resource1',
            columns: ['foo', 'bar'],
          },
          {
            resource: 'resource2',
            columns: ['bar', 'baz'],
          },
        ];
        const r = lib(q);

        expect(r).to.have.property('field').that.eql(expected);
      });
    });
  });

  describe('combination', () => {
    describe('filter[name]=foo&page[number]=8&page[size]=10', () => {
      it('returns { filter[Object(name in [foo])], page{page: 8, pageSize: 10} }', () => {
        const q = R.pipe(
          R.merge(takeFromQuery(['filter', 'name']).filter),
          R.assocPath(['filter'], R.__, {}), // eslint-disable-line
          R.merge(takeFromQuery(['page'])),
        )({});
        const expected = {
          filter: [
            {
              operator: 'in',
              column: 'name',
              value: ['foo'],
            },
          ],
          page: {
            page: 8,
            pageSize: 10,
          },
        };
        const r = lib(q);

        expect(r).to.eql(expected);
      });
    });
  });
});
