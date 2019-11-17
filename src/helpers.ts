import { get } from 'lodash';
import { TARGET } from './constants';

export const isRealObject = (object: any) =>
  typeof object === 'object' && object.constructor.name === 'Object';

export const setOnAllPathLevels = (rootObj, path, changed) => {
  for (let i = 0; i < path.length; i++) {
    const got = get(rootObj, path.slice(0, i), rootObj);
    changed.set(got[TARGET] || got, true);
  }
};

// export const getChangedSymbol = () => Symbol('changed');
