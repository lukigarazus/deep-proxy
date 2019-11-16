import { set } from 'lodash';
import { CHANGED } from './constants';

export const callOrValue = (obj: any, args: any[]) =>
  typeof obj === 'function' ? obj(...args) : obj;

export const isRealObject = (object: any) =>
  typeof object === 'object' && object.constructor.name === 'Object';

export const setOnAllPathLevels = (rootObj, path) => {
  for (let i = 1; i < path.length - 1; i++) {
    set(rootObj, path.slice(0, i).concat(CHANGED));
  }
};
