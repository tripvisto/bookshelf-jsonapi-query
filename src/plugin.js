import R from 'ramda';
import parse from './lib/query-parser.js';

const hasNot = R.curry(R.compose(R.not, R.has));
const getPropThenFilter = R.curry((prop, filterFn, o) =>
  R.pipe(
    R.propOr([], prop),
    R.filter(filterFn),
)(o));

const applyFilter = R.curry((model, filter) =>
  model.query(qb =>
    R.forEach(v => qb.where(v.column, v.operator, v.value), filter),
  ));
const processFilter = R.curry((model, q) => R.pipe(
  getPropThenFilter('filter', hasNot('relations')),
  applyFilter(model),
)(q));
const applyFilterWithRelation = R.curry((filter, model) => {});

const buildFilter = R.curry((q, model) =>
  R.pipe(
    processFilter(model),
)(q));

const cloneModel = ref => ref.constructor
  .forge()
  .query(q => R.merge(q, ref.query().clone()));

export default function query(Bookshelf) {
  /**
   * Fetches the model with the given jsonapi query object.
   *
   * @param {Object} q URL query object from
   * @param {Object} [options] Fetch options
   * @param {Object} [options.transaction] Knex's transaction object
   * @param {Boolean} [options.isResource] `true` when fetching a single resource,
   *  default is set to `false`
   **/
  function fetchJsonapi(q, options = { isResource: false }) {
    try {
      return R.pipe(
        cloneModel,
        buildFilter(parse(q)),
        r => r.fetchAll(),
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
