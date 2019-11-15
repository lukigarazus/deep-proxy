import { Path } from './types/index';
import { BATCH } from './constants';

type GlobalKeys = {
  [key in symbol]: (target: object, key: string, path, globalState) => any;
};

interface DeepProxyConfig {
  target: object;
  globalState: object;
  globalKeys: GlobalKeys;
  history: boolean;
  onGet: (target: object, key: string, path: Path, globalState: object) => any;
  onSet: () => any;
  onDelete: () => any;
}

const attachDefaultGlobalKeys = (globalKeys: GlobalKeys) => {
  globalKeys[BATCH] = (_, __, ___, globalState) => {
    globalState[BATCH] = !globalState[BATCH];
  };
};

export const deepProxy = ({
  target,
  globalState,
  globalKeys,
  history,
  onGet,
  onSet,
  onDelete,
}: DeepProxyConfig) => {
  let historyObj = [];
  if (history) {
    historyObj = new Proxy(historyObj, {});
  }
  attachDefaultGlobalKeys(globalKeys);
  return new Proxy(target, {});
};
