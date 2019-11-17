import {
  Path,
  History,
  ChangeDescription,
  DeepProxyConfig,
  InternalGlobalState,
  GlobalActions,
} from './types/index';
import { IS_PROXY, QUICK_CHANGE } from './constants';
import { DEFAULT_GLOBAL_ACTIONS } from './defaultGlobalActions';
import {
  isRealObject,
  setOnAllPathLevels,
  // getChangedSymbol,
} from './helpers';
import historyProxy from './history';

const attachDefaultGlobalActions = (globalActions: GlobalActions) => {
  return Object.assign({}, globalActions || {}, DEFAULT_GLOBAL_ACTIONS);
};

// This has been taken out of the main function since we have to create nested proxies the same way but without the initial deepProxy work
const getProxyObject = ({
  target,
  historyObj,
  globalActions,
  globalState,
  internalGlobalState,
  onGet = () => {},
  onSet = (target, key, value, path, internalGlobalState) => {
    let a = [target, key, value, path, internalGlobalState];
    a = [];
    return Number(a) + 2;
  },
  onDelete = (target, key, path, internalGlobalState) => {
    let a = [target, key, path, internalGlobalState];
    a = [];
    return Number(a) + 2;
  },
  path,
  deletion,
}: DeepProxyConfig & {
  path: Path;
  historyObj: { history: History };
}) =>
  new Proxy(target, {
    get(target: object, key: string) {
      const value = target[key];
      // if (internalGlobalState[QUICK_CHANGE]) {
      //   return target[key];
      // }
      if (value && value[IS_PROXY]) return value;
      if (globalActions[key]) {
        // console.log(globalActions);
        return globalActions[key](
          path,
          internalGlobalState,
          historyObj,
          target,
        );
      }
      // TODO: This can be handled better, I think
      if (isRealObject(value)) {
        // We check whether the object has already been proxified
        // We switch the original object for a proxy in order to avoid recreating it on each access
        const proxy = getProxyObject({
          target: value,
          historyObj,
          globalActions,
          globalState,
          internalGlobalState,
          onGet,
          onSet,
          onDelete,
          path: path.concat(key),
          deletion,
        });
        target[key] = proxy;
        return proxy;
      }
      onGet(target, key, path, internalGlobalState);
      return target[key];
    },
    set(target: object, key: string, value: any) {
      if (internalGlobalState[QUICK_CHANGE]) {
        target[key] = value;
        return true;
      }
      if (internalGlobalState.history) {
        // TODO: Creating a new object here might be redundant. Think about it
        const changeDescription: ChangeDescription = {
          path: path.concat(key),
          oldValue: target[key],
          newValue: value,
        };
        if (!internalGlobalState.skipHistoryUpdate) {
          historyObj.history.push(changeDescription);
        }
      }
      target[key] = value;
      // TODO: This should be handled differently
      // internalGlobalState.currentChangedSymbol = getChangedSymbol();
      internalGlobalState.changedObjects = new WeakMap();
      internalGlobalState[QUICK_CHANGE] = true;
      setOnAllPathLevels(
        internalGlobalState.rootTarget,
        path.concat(key),
        internalGlobalState.changedObjects,
      );
      internalGlobalState[QUICK_CHANGE] = false;
      onSet(target, key, value, path, internalGlobalState);
      return true;
    },
    deleteProperty(target: object, key: string) {
      if (internalGlobalState[QUICK_CHANGE]) {
        delete target[key];
        return true;
      }
      if (internalGlobalState.history) {
        // TODO: Creating a new object here might be redundant. Think about it
        const changeDescription: ChangeDescription = {
          path: path.concat(key),
          oldValue: target[key],
          // TODO: This should be handled differently
          newValue: undefined,
        };
        if (!internalGlobalState.skipHistoryUpdate) {
          historyObj.history.push(changeDescription);
        }
      }
      if (deletion) delete target[key];
      else {
        target[key] = undefined;
      }
      // TODO: This should be handled differently
      // internalGlobalState.currentChangedSymbol = getChangedSymbol();
      internalGlobalState.changedObjects = new WeakMap();
      internalGlobalState[QUICK_CHANGE] = true;
      setOnAllPathLevels(
        internalGlobalState.rootTarget,
        path,
        internalGlobalState.changedObjects,
      );
      internalGlobalState[QUICK_CHANGE] = false;
      onDelete(target, key, path, internalGlobalState);
      return true;
    },
  });

export const deepProxy = ({
  target,
  globalState,
  globalActions,
  history = false,
  onGet,
  onSet,
  onDelete,
  deletion = true,
}: DeepProxyConfig) => {
  const internalGlobalState: InternalGlobalState = {
    ...(globalState || {}),
    rootTarget: target,
    changedObjects: new WeakMap(),
  };
  let historyObj = { history: undefined };
  internalGlobalState.history = history;
  const customAndDefaultGlobalActions = attachDefaultGlobalActions(
    globalActions,
  );
  const proxy = getProxyObject({
    target,
    historyObj,
    globalActions: customAndDefaultGlobalActions,
    internalGlobalState,
    onGet,
    onSet,
    onDelete,
    path: [],
    deletion,
  });
  if (history) {
    historyObj.history = historyProxy(proxy, 100);
  }
  return proxy;
};
