import R from 'ramda';

const isSplitable = R.allPass([R.is(String), R.test(/,/)]);

export const isNotEmpty = R.compose(R.not, R.isEmpty);
export const isObject = R.allPass([R.is(Object), R.compose(R.not, R.isArrayLike)]);
export const getFirstKey = R.pipe(R.keys, R.head);
export const getFirstValue = R.pipe(R.values, R.head);

export const throwError = R.curry((fnError, params) =>
  () => fnError(...params));
export const executeOrThrowWhenNil = R.curry((fnError, errParams, fnParams) =>
  R.ifElse(
    R.isNil,
    throwError(fnError, errParams),
    f => f(...fnParams),
  ));

export const stringToArray = R.cond([
  [R.isEmpty, R.empty],
  [isSplitable, R.compose(R.map(R.trim), R.split(','))],
  [R.is(String), R.of],
  [R.T, R.identity],
]);
