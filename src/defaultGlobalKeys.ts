import {
  IS_PROXY,
  NEXT,
  PREVIOUS,
  HISTORY,
  SKIP_HISTORY,
  HISTORY_BATCH,
  QUICK_CHANGE,
  CHANGED,
  TARGET,
} from './constants';

export const DEFAULT_GLOBAL_KEYS = {
  [IS_PROXY]: true,

  [NEXT]: (_, globalState, historyObj) => () => {
    globalState.historyChanged = true;
    historyObj.history.next();
  },

  [PREVIOUS]: (_, globalState, historyObj) => () => {
    globalState.historyChanged = true;
    historyObj.history.previous();
  },

  [HISTORY]: (_, __, historyObj) => historyObj,

  [SKIP_HISTORY]: (_, internalGlobalState) => () => {
    internalGlobalState.skipHistoryUpdate = !internalGlobalState.skipHistoryUpdate;
  },

  [QUICK_CHANGE]: (_, internalGlobalState) => () => {
    internalGlobalState[QUICK_CHANGE] = !internalGlobalState[QUICK_CHANGE];
  },

  [HISTORY_BATCH]: (_, __, historyObj) => () => {
    historyObj.history.batch();
  },

  [CHANGED]: (_, internalGlobalState, __, target) =>
    internalGlobalState.changedObjects.has(target),
  [TARGET]: (_, __, ___, target) => target,
};
