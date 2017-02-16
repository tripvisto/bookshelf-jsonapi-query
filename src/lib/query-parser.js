import R from 'ramda';

const splitStringWithComma = R.when(R.test(/,/), R.split(','));
const splitValuesToArrays = R.pipe(
  R.toPairs,
  R.map(([x, v]) => [x, splitStringWithComma(v)]),
  R.fromPairs,
);

const parseFilter = R.curry((q, o) =>
  R.pipe(
    R.propOr({}, 'filter'),
    splitValuesToArrays,
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
