import R from 'ramda';


const isObject = R.allPass([R.is(Object), R.compose(R.not, R.isArrayLike)]);
const getFirstKey = R.pipe(R.keys, R.head);
const getFirstValue = R.pipe(R.values, R.head);
const isNotRelation = R.allPass([R.is(String), R.compose(R.not, R.test(/\./))]);
const isRelation = R.allPass([R.is(String), R.test(/\./)]);
const throwUnsupportedOperator = (o) => {
  throw new Error(`Unsuppported operator ${o}`);
};
const throwError = R.curry((fnError, params) =>
  () => fnError(...params));
const executeOrThrowWhenNil = R.curry((fnError, errParams, fnParams) =>
  R.ifElse(
    R.isNil,
    throwError(fnError, errParams),
    f => f(...fnParams),
  ));

const splitStringWithComma = R.when(
  // only split the input when it is a string otherwise return it
  R.allPass([R.is(String), R.test(/,/)]),
  R.split(','));

const buildFilterItem = R.curry((operator, column, value) => ({
  column,
  operator,
  value,
}));

const filterItemBuilder = {
  in(column, value) {
    return buildFilterItem('in', column, splitStringWithComma(value));
  },

  lt(column, value) {
    return buildFilterItem('<', column, getFirstValue(value));
  },

  lte(column, value) {
    return buildFilterItem('<=', column, getFirstValue(value));
  },

  gt(column, value) {
    return buildFilterItem('>', column, getFirstValue(value));
  },

  gte(column, value) {
    return buildFilterItem('>=', column, getFirstValue(value));
  },

  contains(column, value) {
    return buildFilterItem('like', column, `%${value}%`);
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
  R.when(
    isNotRelation,
    getOperatorAndBuildFilter(k, v))(k));

const parseFilterValue = R.curry((k, v) =>
  R.pipe(
    parseNonRelationFilter(k),
  )(v));

const processFilter = R.pipe(
  R.toPairs,
  R.map(([x, v]) => parseFilterValue(x, v)));

const parseFilter = R.curry((q, o) =>
  R.pipe(
    R.propOr({}, 'filter'),
    processFilter,
    r => ({ filter: r }),
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
  )({});
}
