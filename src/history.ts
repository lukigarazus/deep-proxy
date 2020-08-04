import * as set from 'lodash.set';
import { ChangeDescription } from './types/index';
import { SKIP_HISTORY } from './constants';

const enum HistoryChangeDirection {
  backwards,
  forwards,
}

const applyChange = (
  direction: HistoryChangeDirection,
  obj: object,
  description: ChangeDescription,
) => {
  // Here we handle change batches
  if (Array.isArray(description)) {
    description.forEach(desc => applyChange(direction, obj, desc));
    return;
  }
  // This is used in order to avoid putting history changes in history
  obj[SKIP_HISTORY]();
  switch (direction) {
    case HistoryChangeDirection.backwards:
      set(obj, description.path, description.oldValue);
      break;
    case HistoryChangeDirection.forwards:
      set(obj, description.path, description.newValue);
      break;
  }
  // Here we switch history tracing back on
  obj[SKIP_HISTORY]();
};

export default (initObj: object, limit: number) => {
  let step = 0;
  const push = (proxy, target) => value => {
    if (proxy.batchedStep) {
      // TODO: There maybe should be a limit on this
      proxy.batchedStep.push(value);
      return target.length;
    }
    if (step < target.length - 1) {
      while (target.length - 1 !== step) {
        target.pop();
      }
    }
    if (target.length + 1 > limit) {
      target.shift();
    }
    target.push(value);
    step = Math.min(step + 1, limit);
    return target.length;
  };
  // TODO: Implement limits here
  const historyObjectProxy = new Proxy([], {
    set() {
      return false;
    },
    get(target, key) {
      switch (key) {
        case 'push':
          return push(this, target);
        case 'previous':
          return () => {
            step = Math.max(step - 1, 0);
            applyChange(
              HistoryChangeDirection.backwards,
              initObj,
              target[step],
            );
            return true;
          };
        case 'next':
          return () => {
            step = Math.min(step + 1, target.length - 1);
            applyChange(HistoryChangeDirection.forwards, initObj, target[step]);
            return true;
          };
        case 'batch':
          return () => {
            if (this.batchedStep) {
              // target.push()
              const batchedStep = this.batchedStep;
              this.batchedStep = undefined;
              this.get(target, 'push')(batchedStep);
            } else this.batchedStep = [];
          };
        case 'step':
          return step;
        default:
          return new Error('Use history API!');
      }
    },
  });
  return historyObjectProxy;
};
