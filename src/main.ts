import { Path, History, ChangeDescription } from './types/index';
import { IS_PROXY, QUICK_CHANGE } from './constants';
import { DEFAULT_GLOBAL_KEYS } from './defaultGlobalKeys';
import { callOrValue, isRealObject, setOnAllPathLevels } from './helpers';
import historyProxy from './history';

type GlobalKeys = object;

type InternalGlobalState = object & {
  history?: boolean;
  skipHistoryUpdate?: boolean;
  rootTarget: object;
};

interface DeepProxyConfig {
  target: object;
  globalState?: object;
  internalGlobalState?: InternalGlobalState;
  globalKeys: GlobalKeys;
  history?: boolean;
  onGet?: (
    target: object,
    key: string,
    path: Path,
    internalGlobalState: object,
  ) => any;
  onSet?: () => any;
  onDelete?: () => any;
}

const attachDefaultGlobalKeys = (globalKeys: GlobalKeys) => {
  Object.assign(globalKeys, DEFAULT_GLOBAL_KEYS);
};

// This has been taken out of the main function since we have to create nested proxies the same way but without the initial deepProxy work
const getProxyObject = ({
  target,
  historyObj,
  globalKeys,
  globalState,
  internalGlobalState,
  onGet = () => {},
  onSet = () => {},
  onDelete = () => {},
  path,
}: DeepProxyConfig & {
  path: Path;
  historyObj: { history: History };
}) =>
  new Proxy(target, {
    get(target: object, key: string) {
      const value = target[key];
      if (internalGlobalState[QUICK_CHANGE]) {
        return target[key];
      }
      if (value && value[IS_PROXY]) return value;
      if (globalKeys[key]) {
        return callOrValue(globalKeys[key], [
          path,
          internalGlobalState,
          historyObj,
        ]);
      }
      // TODO: This can be handled better, I think
      if (isRealObject(value)) {
        // We check whether the object has already been proxified
        // We switch the original object for a proxy in order to avoid recreating it on each access
        const proxy = getProxyObject({
          target: value,
          historyObj,
          globalKeys,
          globalState,
          internalGlobalState,
          onGet,
          onSet,
          onDelete,
          path: path.concat(key),
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
      internalGlobalState[QUICK_CHANGE] = true;
      setOnAllPathLevels(internalGlobalState.rootTarget, path);
      internalGlobalState[QUICK_CHANGE] = false;
      return true;
    },
  });

export const deepProxy = ({
  target,
  globalState,
  globalKeys,
  history = false,
  onGet,
  onSet,
  onDelete,
}: DeepProxyConfig) => {
  const internalGlobalState: InternalGlobalState = {
    rootTarget: target,
    ...globalState,
  };
  let historyObj = { history: undefined };
  internalGlobalState.history = history;
  attachDefaultGlobalKeys(globalKeys);
  const proxy = getProxyObject({
    target,
    historyObj,
    globalKeys,
    internalGlobalState,
    onGet,
    onSet,
    onDelete,
    path: [],
  });
  if (history) {
    historyObj.history = historyProxy(proxy, 100);
  }
  return proxy;
};
