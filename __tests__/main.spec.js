const { deepProxy } = require('../src/main');
const {
  IS_PROXY,
  PREVIOUS,
  NEXT,
  HISTORY,
  HISTORY_BATCH,
  CHANGED,
  QUICK_CHANGE,
} = require('../src/constants');
const { plot } = require('../visualize');

const TEST_KEY = Symbol('test-key');

const performanceTester = {
  proxy: { setting: [], getting: [], deleting: [] },
  object: { setting: [], getting: [], deleting: [] },
  start: undefined,
  timer(type, action) {
    if (!this.start) {
      this.start = Date.now();
    } else {
      const end = Date.now() - this.start;
      this[type][action].push(end);
      this.start = undefined;
    }
  },
  getResult() {
    const settingStats = [];
    this.proxy.setting.forEach((el, i) =>
      settingStats.push(Math.floor(el - this.object.setting[i])),
    );
    const gettingStats = [];
    this.proxy.getting.forEach((el, i) =>
      gettingStats.push(Math.floor(el - this.object.getting[i])),
    );
    const deletingStats = [];
    this.proxy.deleting.forEach((el, i) =>
      deletingStats.push(Math.floor(el - this.object.deleting[i])),
    );
    return { gettingStats, settingStats, deletingStats };
  },
};

const getState = () => {
  const obj = {};
  const globalState = {};
  const globalKeys = { [TEST_KEY]: 2 };
  const config = {
    target: obj,
    globalState,
    globalKeys,
    history: true,
    deletion: false,
  };
  const state = deepProxy(config);
  return { config, state };
};

describe('deepProxy', () => {
  let state, config;

  beforeEach(() => {
    const obj = getState();
    state = obj.state;
    config = obj.config;
  });
  it('Custom global keys work', () => {
    expect(state[TEST_KEY]).toEqual(2);
  });
  it('Proxification of added objects works', () => {
    state.obj = {};
    expect(state.obj[IS_PROXY]).toEqual(true);
  });
  it('Navigation works', () => {
    state.a = 2;
    expect(state.a).toEqual(2);
    state[PREVIOUS]();
    expect(state.a).toEqual(undefined);
    state[NEXT]();
    expect(state.a).toEqual(2);
  });
  it('Navigation limit works', () => {
    for (let i = 0; i < 120; i++) {
      state.b = i;
    }
    expect(state.b).toEqual(119);
    for (let i = 0; i < 120; i++) {
      state[PREVIOUS]();
    }

    expect(state.b).toEqual(19);
  });
  it('Navigation on nested changes works', () => {
    state.c = {};
    state.c.a = 1;
    // expect(2).toEqual(2);
    expect(state.c.a).toEqual(1);
    state[PREVIOUS]();
    expect(state.c.a).toEqual(undefined);
    state[NEXT]();
    expect(state.c.a).toEqual(1);
  });
  it('Change batches work', () => {
    state[HISTORY_BATCH]();
    state.a = 2;
    state.b = 3;
    state.c = 4;
    expect(state.a).toEqual(2);
    expect(state.b).toEqual(3);
    expect(state.c).toEqual(4);
    state[HISTORY_BATCH]();
    state[PREVIOUS]();
    expect(state.a).toEqual(undefined);
    expect(state.b).toEqual(undefined);
    expect(state.c).toEqual(undefined);
    state[NEXT]();
    expect(state.a).toEqual(2);
    expect(state.b).toEqual(3);
    expect(state.c).toEqual(4);
  });
  it.skip('Performance test', () => {
    const loopsCases = Array(10)
      .fill(undefined)
      .map((el, i) => i * 10000);
    for (const loops of loopsCases) {
      performanceTester.timer();
      for (const letter of 'qwertyuiopasdfghjklzxcvbnm'.split('').sort()) {
        for (let i = 1; i <= loops; i++) {
          const key = `${letter}${i}`;
          state[key] = { a: 1 };
          state[key].b = 2;
        }
      }
      performanceTester.timer('proxy', 'setting');
      performanceTester.timer();
      for (const letter of 'qwertyuiopasdfghjklzxcvbnm'.split('').sort()) {
        for (let i = 1; i <= loops; i++) {
          const key = `${letter}${i}`;
          const a = state[key];
          const b = state[key].b;
        }
      }
      performanceTester.timer('proxy', 'getting');
      performanceTester.timer();
      for (const letter of 'qwertyuiopasdfghjklzxcvbnm'.split('').sort()) {
        for (let i = 1; i <= loops; i++) {
          const key = `${letter}${i}`;
          delete state[key].b;
          delete state[key];
        }
      }
      performanceTester.timer('proxy', 'deleting');
      const obj = {};
      performanceTester.timer();
      for (const letter of 'qwertyuiopasdfghjklzxcvbnm'.split('').sort()) {
        for (let i = 1; i <= loops; i++) {
          const key = `${letter}${i}`;
          obj[key] = { a: 1 };
          obj[key].b = 2;
        }
      }
      performanceTester.timer('object', 'setting');
      performanceTester.timer();
      for (const letter of 'qwertyuiopasdfghjklzxcvbnm'.split('').sort()) {
        for (let i = 1; i <= loops; i++) {
          const key = `${letter}${i}`;
          const a = obj[key];
          const b = obj[key].b;
        }
      }
      performanceTester.timer('object', 'getting');
      performanceTester.timer();
      for (const letter of 'qwertyuiopasdfghjklzxcvbnm'.split('').sort()) {
        for (let i = 1; i <= loops; i++) {
          const key = `${letter}${i}`;
          delete obj[key].b;
          delete obj[key];
        }
      }
      performanceTester.timer('object', 'deleting');
    }
    const {
      gettingStats,
      settingStats,
      deletingStats,
    } = performanceTester.getResult();
    plot(
      [
        ...gettingStats.map((el, i) => ({
          x: loopsCases[i] * 26,
          y: el,
          c: 0,
        })),
        ...settingStats.map((el, i) => ({
          x: loopsCases[i] * 26,
          y: el,
          c: 1,
        })),
        ...deletingStats.map((el, i) => ({
          x: loopsCases[i] * 26,
          y: el,
          c: 2,
        })),
      ],
      (() => {
        const history = config.history ? 'history' : 'no-history';
        const deletion = config.deletion ? 'deletion' : 'no-deletion';
        return `performance-${history}-${deletion}`;
      })(),
    );
    expect(2).toEqual(2);
  });
  it('Changes are saved', () => {
    state.a = {};
    expect(state[CHANGED]).toEqual(true);
    state.a.b = {};
    expect(state.a[CHANGED]).toEqual(true);
    state.a.b.c = 2;
    expect(state.a.b[CHANGED]).toEqual(true);
  });
  it('Deleting a key works', () => {
    state.a = 2;
    expect(state.a).toEqual(2);
    delete state.a;
    expect(state.a).toEqual(undefined);
  });
  it('Quick change mode words for deletion and set', () => {
    state.a = 2;
    expect(state.a).toEqual(2);
    state[QUICK_CHANGE]();
    delete state.a;
    state.b = 3;
    state[QUICK_CHANGE]();
    expect(state.a).toEqual(undefined);
    expect(state.b).toEqual(3);
    expect(state[HISTORY].history.step).toEqual(1);
  });
  it('History cannot be interacted with outside of its API', async () => {
    expect(state[HISTORY].history.length.constructor.name).toEqual('Error');
    state[HISTORY].history[2] = 5;
    // expect(state[HISTORY].history).toEqual([]);
  });
});
