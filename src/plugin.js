import R from 'ramda';
import Promise from 'bluebird';
import { singularize } from 'inflection';
import parse from './lib/query-parser';
import {
  isNotNil,
  executeOrThrowWhenNil,
} from './lib/helper';

const shout = (...params) => R.tap(r => console.log(...params, r));
const tap = (f, ...params) => R.tap(r => console.log(...params, f(r)));

const toModelParamHash = R.curry((options, model) => ({ model, options }));
const throwUnknownRelation = (r) => {
  throw new Error(`Unknown relation: ${r}`);
};
const throwUnsupportedAggregation = (a) => {
  throw new Error(`Unsuppported aggregation: ${a}`);
};

const hasNot = R.curry(R.compose(R.not, R.has));
const getPropThenFilter = R.curry((prop, filterFn, o) =>
  R.pipe(
    R.propOr([], prop),
    R.filter(filterFn),
)(o));
const getJoins = R.propOr([], 'joins');
const filterPropSatisfies = R.curry((pred, prop, list) =>
  R.filter(R.propSatisfies(pred, prop), list));
const containsAnyFromProp = R.curry((prop, l) => R.pipe(
  R.map(R.compose(R.contains, R.prop(prop))),
  R.anyPass,
)(l));
const findIndexInMixType = R.curry((prop, list) =>
  R.findIndex(R.ifElse(R.is(Object), R.has(prop), R.equals(prop)), list));
const toObject = R.curry((k, v) => ({ [k]: v }));

const applyFilter = R.curry((model, filter) =>
  model.query(qb =>
    R.forEach(v => qb.where(v.column, v.operator, v.value), filter),
  ));
const processFilter = R.curry((q, { model, options }) => R.pipe(
  getPropThenFilter('filter', hasNot('relations')),
  applyFilter(model),
  toModelParamHash(options),
)(q));

const buildForeignKey = R.ifElse(
  R.compose(isNotNil, R.prop('foreignKey')),
  R.prop('foreignKey'),
  o => `${singularize(o.parentTableName)}_${o.parentIdAttribute}`,
);

const buildJoinData = R.curry((relation, parent, table, foreignKey, parentKey) => ({
  relation,
  parent,
  table,
  foreignKey,
  parentKey,
}));
const buildBelongsToJoinData = R.curry((relation, o) =>
  buildJoinData(
    relation,
    o.parentTableName,
    o.targetTableName,
    `${o.targetTableName}.${o.targetIdAttribute}`,
    `${o.parentTableName}.${buildForeignKey(o)}`,
  ));
const buildDefaultJoinData = R.curry((relation, o) =>
  buildJoinData(
    relation,
    o.parentTableName,
    o.targetTableName,
    `${o.targetTableName}.${buildForeignKey(o)}`,
    `${o.parentTableName}.${o.parentIdAttribute}`,
  ));

const buildJoinParams = R.curry((data, relation) => R.cond([
  [R.propEq('type', 'belongsTo'), buildBelongsToJoinData(relation)],
  [R.T, buildDefaultJoinData(relation)],
])(data));

const forgeRelatedModel = R.curry((model, relation) => R.pipe(
  m => m[relation],
  R.when(isNotNil, R.bind(R.__, model)), // eslint-disable-line
  f => executeOrThrowWhenNil(throwUnknownRelation, [relation], f, [], f),
  R.when(R.has('model'), m => m.model.forge()),
)(model));

const reduceToTableRelation = R.curry(({ model, joins }, v) => ({
  model: forgeRelatedModel(model.clone(), v),
  joins: R.append(buildJoinParams(model.clone()[v]().relatedData, v), joins),
}));

const extractTableRelation = R.curry((model, relations) => R.pipe(
  R.reduce(reduceToTableRelation, { model }),
  R.propOr({}, 'joins'),
)(relations));

const buildJoinDataToMerge = R.curry((o, joins) => ({
  joins,
  column: `${R.compose(R.propOr('', 'table'), R.last)(joins)}.${R.prop('column', o)}`,
}));

const buildJoinProp = R.curry((model, o) => R.pipe(
  R.prop('relations'),
  extractTableRelation(model),
  buildJoinDataToMerge(o),
  R.merge(o),
)(o));

const addJoinPropToQuery = R.curry((model, filters) =>
  R.map(
    o => R.pipe(
      buildJoinProp(model),
      R.merge(o),
    )(o),
    filters,
  ));

const extractJoins = R.pipe(
  R.map(R.prop('joins')),
  R.flatten,
  R.uniq,
);

const processFilterWithRelation = R.curry((q, { model, options }) => R.pipe(
  getPropThenFilter('filter', R.has('relations')),
  addJoinPropToQuery(model), // -> { withParams: [], joins: [] }
  o => toModelParamHash(
    R.mergeAll([options, R.assoc('joins', extractJoins(o), {}), R.assoc('filters', o, {})]),
    applyFilter(model, o),
  ),
)(q));

const buildWithRelatedQuery = R.curry((relation, joins, filters) => R.pipe(
  R.filter(R.propEq('parent', relation)),
  l => (qb) => {
    const pred = R.pipe(R.append({ relation }), containsAnyFromProp)(l);
    const fs = filterPropSatisfies(pred, 'column', filters);
    R.forEach(o => qb.join(o.table, o.foreignKey, o.parentKey), l);
    R.forEach(f => qb.where(f.column, f.operator, f.value), fs);
    return qb;
  },
  toObject(relation),
)(joins));

const isRelationInFilterItem = R.curry((relation, filter) => R.compose(
  R.equals(relation),
  R.head,
  R.propOr([], 'relations'),
)(filter));
const isRelationInFilter = R.curry((relation, filters) => R.any(
  isRelationInFilterItem(relation),
)(filters));

const mapWithRelated = R.curry((options, filters, relation) => R.ifElse(
  isRelationInFilter(relation),
  R.pipe(
    R.filter(isRelationInFilterItem(relation)),
    buildWithRelatedQuery(relation, getJoins(options)),
  ),
  R.always(relation),
)(filters));

const decorateWithRelatedWithQueries = R.curry((options, filters) => R.pipe(
  R.propOr([], 'withRelated'),
  R.map(mapWithRelated(options, filters)),
)(options));

const processFilterInRelation = R.curry((q, { model, options }) => R.pipe(
  getPropThenFilter('filters', R.has('relations')),
  R.ifElse(
    R.isEmpty,
    R.always(options),
    R.pipe(
      decorateWithRelatedWithQueries(options),
      R.assoc('withRelated', R.__, options), // eslint-disable-line
    ),
  ),
  R.flip(toModelParamHash)(model),
)(options));

// Handles filters
const buildFilter = R.curry((q, hash) => R.pipe(
  processFilter(q),

  // To handle filter with relations. This includes
  // building joins and apply the filter to model
  processFilterWithRelation(q),

  // To filter the relations in included model to
  // comply with the defined filter
  processFilterInRelation(q),
)(hash));

// Handles includes
const buildInclude = R.curry((q, { model, options }) => R.pipe(
  R.propOr([], 'include'),
  R.assoc('withRelated', R.__, options), // eslint-disable-line
  R.flip(toModelParamHash)(model),
)(q));

// Handles pagination
const buildPage = R.curry((q, { model, options }) => R.pipe(
  R.propOr({}, 'page'),
  R.ifElse(
    R.isEmpty,
    R.always(options),
    R.merge(options),
  ),
  R.flip(toModelParamHash)(model),
)(q));

const applySelect = R.curry((model, f) => model.query(qb => qb.select(model.idAttribute, f)));

const processFieldsWhenNotInRelation = R.curry((model, options, field) => R.pipe(
  () => applySelect(model, R.propOr('*', 'columns', field)),
  toModelParamHash(options),
));

/**
 * :: Object -> Object | String -> Object
 *
 * Decorates an item in `withRelated` option with `select` query. To make the
 * relation works, tables' primary key and also foreign key(s) need to be in
 * select statement also.
 *
 * TODO:
 * - To include foreign key when decorating relation. Without it, it will fail
 *   the test.
 *
 * @private
 *
 * @param {Object} field - The object containing fields and resource to select
 * @param {Object|String} relation - The relation in `withRelated` to be decorated
 * @return {Object} The decorated relation
 */
const decorateRelationItemWithSelect = R.curry((field, relation) => R.pipe(
  R.ifElse(
    R.is(Object),
    R.pipe(
      R.prop(field.resource),
      f => R.pipe(f, qb => qb.select(R.propOr('*', 'columns', field))),
      toObject(relation),
    ),
    R.flip(toObject)(qb => qb.select(R.propOr('*', 'columns', field))),
  ),
)(relation));

const processFieldsWhenInRelation = R.curry((model, options, field, i) => R.pipe(
  R.prop('withRelated'),
  R.nth(i),
  decorateRelationItemWithSelect(field),
  o => R.adjust(R.always(o), i, R.propOr('withRelated', options)),
  R.flip(R.assoc('withRelated'))(options),
  R.flip(toModelParamHash)(model),
)(options));

const processFields = R.curry(({ model, options }, v) => R.pipe(
  R.propOr([], 'withRelated'),
  findIndexInMixType(R.prop('resource', v)),
  R.ifElse(
    R.gt(0),
    processFieldsWhenNotInRelation(model, options, v),
    processFieldsWhenInRelation(model, options, v),
  ),
)(options));

// Handles fields. Whan a resource is included in `withRelated`
// (as a relation), that particular relation will be decorated
// to include `select([columns])`. Resources that are not
// in `withRelated` is assumed to be this model
const buildFields = R.curry((q, { model, options }) => R.pipe(
  R.propOr([], 'fields'),
  R.reduce(processFields, { model, options }),
)(q));

const cloneModel = ref => ref.constructor
  .forge()
  .query(q => Object.assign(q, ref.query().clone()));

const buildModelParamHash = R.curry((opts, model) => R.pipe(
  cloneModel,
  m => ({ model: m, options: opts }),
)(model));

const fetchAndAggregateIfExist = R.curry((fetchName, model, aggregateModel, options) => R.ifElse(
  R.isNil,
  () => model[fetchName](options),
  () => Promise.all([model[fetchName](options), aggregateModel.fetch()])
    .then(r => Object.assign(r[0], { aggregation: r[1].toJSON() })),
)(aggregateModel));

const fetchModel = ({ model, aggregateModel, options }) => R.cond([
  [R.complement(R.propOr(R.T, 'isCollection')), fetchAndAggregateIfExist('fetch', model, aggregateModel)],
  [R.T, fetchAndAggregateIfExist('fetchPage', model, aggregateModel)],
])(options);

// Apply joins to model
const applyJoin = R.curry((model, joins) =>
  model.query(q =>
    R.forEach(v => q.join(v.table, v.foreignKey, v.parentKey), joins),
  ));

// Handles joins
const buildJoin = ({ model, options }) => R.pipe(
  R.propOr([], 'joins'),
  applyJoin(model),
  toModelParamHash(options),
)(options);

const applySortItem = R.curry((model, sort) => model.orderBy(sort.column, sort.order));

const applySort = R.curry((model, sorts) => R.reduce(applySortItem, model, sorts));

const buildSort = R.curry((q, { model, options }) => R.pipe(
  R.propOr([], 'sort'),
  applySort(model),
  toModelParamHash(options),
)(q));

const applyAggregateItem = R.curry((table, q, i) => R.pipe(
  R.propOr([], 'columns'),
  R.forEach(
    v => q[i.operator](`${table}.${v} as ${i.operator}_${v}`),
  ),
  R.always(q),
)(i));

const applyAggregateWhenOperatorValid = R.curry((table, q, i) => R.pipe(
  R.prop(i.operator),
  executeOrThrowWhenNil(
    throwUnsupportedAggregation,
    [i.operator],
    applyAggregateItem,
    [table, q, i],
  ),
)(q));

const applyAggregate = R.curry((table, aggregations) => q =>
  R.reduce(applyAggregateWhenOperatorValid(table), q, aggregations));

const buildAggregateModel = R.curry((model, aggregations) => R.pipe(
  R.always(cloneModel(model)),
  m => m.query(applyAggregate(m.tableName, aggregations)),
)());

const buildAggregate = R.curry((q, { model, options }) => R.pipe(
  R.propOr([], 'aggregate'),
  buildAggregateModel(model),
  o => ({ model, options, aggregateModel: o }),
)(q));

export default function query(Bookshelf) {
  Bookshelf.plugin('pagination');

  /**
   * Fetches the model with the given jsonapi query object. The jsonapi
   * query object itself is normally generated by web framework, e.g.,
   * [expressjs]{@link http://expressjs.com/}.
   *
   * @example
   * const q = {
   *  filter: {
   *    title: 'post 1,post 2',
   *  }
   * };
   * Post.fetchJsonapi(q); //> Posts with title 'post 1' and 'post 2' respectively
   *
   * @param {Object} q URL query object from
   * @param {Object} [options] Fetch options
   * @param {Object} [options.transaction] Knex's transaction object
   * @param {Boolean} [options.isResource] `true` when fetching a single resource,
   *  default is set to `false`
   **/
  function fetchJsonapi(q, options = { isCollection: true }) {
    try {
      const parsed = parse(q);

      // Object {model, opts} are used to store
      // the decorated bookshelf model and the parameter
      // should the model be called with. This is useful
      // as we want to build the options through the pipeline
      // especially when dealing with include and filtering relations.
      return R.pipe(
        buildModelParamHash(options),
        buildInclude(parsed),
        buildPage(parsed),
        buildFilter(parsed),
        buildFields(parsed),
        buildJoin,
        buildSort(parsed),
        buildAggregate(parsed),
        fetchModel,
      )(this);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  Bookshelf.Model.prototype.fetchJsonapi = fetchJsonapi; // eslint-disable-line no-param-reassign
  Bookshelf.Model.fetchJsonapi = function f(...args) { // eslint-disable-line no-param-reassign
    return this.forge().fetchJsonapi(...args);
  };
  Bookshelf.Collection.prototype // eslint-disable-line no-param-reassign
    .fetchJsonapi = function f(...args) {
      return fetchJsonapi.apply(this.model.forge(), ...args);
    };
}
