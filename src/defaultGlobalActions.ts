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
  PATH,
  CHANGE_BATCH,
} from './constants';

export const DEFAULT_GLOBAL_ACTIONS = {
  [IS_PROXY]: () => true,

  [NEXT]: (_, globalState, historyObj) => () => {
    if (historyObj.history) {
      globalState.historyChanged = true;
      historyObj.history.next();
    } else {
      throw new Error('History was not enabled!');
    }
  },

  [PREVIOUS]: (_, globalState, historyObj) => () => {
    if (historyObj.history) {
      globalState.historyChanged = true;
      historyObj.history.previous();
    } else {
      throw new Error('History was not enabled!');
    }
  },

  [HISTORY]: (_, __, historyObj) => historyObj,

  [SKIP_HISTORY]: (_, internalGlobalState) => () => {
    internalGlobalState.skipHistoryUpdate = !internalGlobalState.skipHistoryUpdate;
  },

  [QUICK_CHANGE]: (_, internalGlobalState) => () => {
    internalGlobalState[QUICK_CHANGE] = !internalGlobalState[QUICK_CHANGE];
  },

  [HISTORY_BATCH]: (_, __, historyObj) => () => {
    if (historyObj.history) historyObj.history.batch();
  },

  [CHANGED]: (_, internalGlobalState, __, target) =>
    internalGlobalState.changedObjects.has(target),

  [TARGET]: (_, __, ___, target) => target,

  [PATH]: path => path,

  [CHANGE_BATCH]: (_, internalGlobalState) => () => {
    internalGlobalState[CHANGE_BATCH] = !internalGlobalState[CHANGE_BATCH];
  },
};
