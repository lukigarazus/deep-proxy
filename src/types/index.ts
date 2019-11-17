export type PathElement = string | number;
export type Path = PathElement[];

export interface ChangeDescription {
  path: Path;
  oldValue: any;
  newValue: any;
}

export interface History {
  push: (value: ChangeDescription) => number;
  previous: () => boolean;
  next: () => boolean;
}

export type GlobalActions = object;

export type InternalGlobalState = object & {
  history?: boolean;
  skipHistoryUpdate?: boolean;
  rootTarget: object;
  deletion?: boolean;
  // TODO: think about it and get rid of it if applicable
  currentChangedSymbol?: symbol;
  changedObjects?: object;
};

export interface DeepProxyConfig {
  deletion?: boolean;
  target: object;
  globalState?: object;
  internalGlobalState?: InternalGlobalState;
  globalActions: GlobalActions;
  history?: boolean;
  // historyBatchInterval?: number;
  onGet?: (
    target: object,
    key: string,
    path: Path,
    internalGlobalState: object,
  ) => any;
  onSet?: (target, key, value, path, internalGlobalState) => any;
  onDelete?: (target, key, path, internalGlobalState) => any;
}
