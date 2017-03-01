import R from 'ramda';

const isNotEmpty = R.compose(R.not, R.isEmpty);
const isObject = R.allPass([R.is(Object), R.compose(R.not, R.isArrayLike)]);
const getFirstKey = R.pipe(R.keys, R.head);
const getFirstValue = R.pipe(R.values, R.head);
const isNotRelation = R.allPass([R.is(String), R.compose(R.not, R.test(/\./))]);
const isRelation = R.allPass([R.is(String), R.test(/\./)]);
const throwUnsupportedOperator = (o) => {
  throw new Error(`Unsuppported operator: ${o}`);
};
const throwError = R.curry((fnError, params) =>
  () => fnError(...params));
const executeOrThrowWhenNil = R.curry((fnError, errParams, fnParams) =>
  R.ifElse(
    R.isNil,
    throwError(fnError, errParams),
    f => f(...fnParams),
  ));


const stringToArray = R.cond([
  [R.isEmpty, R.empty],
  [R.allPass([R.is(String), R.test(/,/)]), R.split(',')],
  [R.is(String), R.of],
  [R.T, R.identity],
]);

const buildFilterItem = R.curry((operator, column, value) => ({
  column,
  operator,
  value,
}));

const applyFnToParamOrReturnEmpty = R.curry((fn, v) => R.ifElse(
  R.isEmpty,
  R.empty,
  fn,
)(v));

const filterItemBuilder = {
  in(column, value) {
    return applyFnToParamOrReturnEmpty(buildFilterItem('in', column))(stringToArray(value));
  },

  lt(column, value) {
    return applyFnToParamOrReturnEmpty(buildFilterItem('<', column))(getFirstValue(value));
  },

  lte(column, value) {
    return applyFnToParamOrReturnEmpty(buildFilterItem('<=', column))(getFirstValue(value));
  },

  gt(column, value) {
    return applyFnToParamOrReturnEmpty(buildFilterItem('>', column))(getFirstValue(value));
  },

  gte(column, value) {
    return applyFnToParamOrReturnEmpty(buildFilterItem('>=', column))(getFirstValue(value));
  },

  contains(column, value) {
    return applyFnToParamOrReturnEmpty(
      R.pipe(v => `%${v}%`, buildFilterItem('like', column)),
    )(getFirstValue(value));
  },
};

const buildFilter = R.curry((operator, k, v) =>
  R.pipe(
    R.prop(operator),
    executeOrThrowWhenNil(throwUnsupportedOperator, [operator], [k, v]),
)(filterItemBuilder));

const getFilterOperator = R.ifElse(
  isObject,
  getFirstKey,
  R.always('in'),
);

const getOperatorAndBuildFilter = R.curry((k, v) =>
  R.pipe(
    R.always(getFilterOperator(v)),
    buildFilter(R.__, k, v))); // eslint-disable-line no-underscore-dangle

const parseNonRelationFilter = R.curry((k, v) =>
  getOperatorAndBuildFilter(k, v));

const buildRelationProperty = R.pipe(
  R.split('.'),
  r => ({ relations: R.dropLast(1, r), column: R.last(r) }));

const parseRelationFilter = R.curry((k, v) =>
  R.pipe(
    getOperatorAndBuildFilter(k, v),
    R.flip(R.merge)(buildRelationProperty(k))));

const parseFilterValue = R.curry((k, v) =>
  R.cond([
    [isNotRelation, parseNonRelationFilter(k, v)],
    [isRelation, parseRelationFilter(k, v)],
    [R.T, R.empty],
  ])(k));

const processFilter = R.pipe(
  R.toPairs,
  R.map(([x, v]) => parseFilterValue(x, v)),
  R.filter(isNotEmpty),
);

const parseFilter = R.curry((q, o) =>
  R.pipe(
    R.propOr({}, 'filter'),
    processFilter,
    r => ({ filter: r }),
    R.merge(o),
  )(q));

const processPage = v => ({
  page: R.propOr(1, 'number', v),
  pageSize: R.propOr(20, 'size', v),
});

const parsePage = R.curry((q, o) =>
  R.pipe(
    R.propOr({}, 'page'),
    processPage,
    r => ({ page: r }),
    R.merge(o),
  )(q));

const buildSortItem = R.ifElse(
  R.compose(R.equals('-'), R.head),
  r => ({ column: R.drop(1, r), order: 'DESC' }),
  r => ({ column: r, order: 'ASC' }),
);

const processSort = R.pipe(
    stringToArray,
    R.map(buildSortItem),
  );

const parseSort = R.curry((q, o) =>
  R.pipe(
    R.propOr({}, 'sort'),
    processSort,
    r => ({ sort: r }),
    R.merge(o),
  )(q));

const parseInclude = R.curry((q, o) =>
  R.pipe(
    R.propOr({}, 'include'),
    stringToArray,
    r => ({ include: r }),
    R.merge(o),
  )(q));

/**
 * Parses express req.query so that it can be
 * consumed by the plugin
 *
 * @param {Object} q Query object
 *
 * @returns {Object} The parsed query
 */
export default function parse(q) {
  return R.pipe(
    parseFilter(q),
    parsePage(q),
    parseSort(q),
    parseInclude(q),
    R.filter(isNotEmpty),
  )({});
}
