// This symbol is used to start a batch of object mutations
export const BATCH = Symbol('batch');

// This symbol is used for proxy checking
export const IS_PROXY = Symbol('is_proxy');

// These symbols are used for history navigation
export const NEXT = Symbol('next');
export const PREVIOUS = Symbol('previous');

// This symbol is used to retrieve history object. It is used mainly for testing purposes
export const HISTORY = Symbol('history');

// This is used to disable/enable skip history mode
export const SKIP_HISTORY = Symbol('skip_history');

// This is used to enable/disable batching many object changes into one history step
export const HISTORY_BATCH = Symbol('history_batch');

// This is used to signal changes in objects
export const CHANGED = Symbol('changed');

// This is used to enable/disable quick change mode
export const QUICK_CHANGE = Symbol('quick_change');

// This is used to retrieve the original object from a proxy
export const TARGET = Symbol('target');
