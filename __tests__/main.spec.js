const { deepProxy } = require('../src/main');
const {
  PATH,
  IS_PROXY,
  PREVIOUS,
  NEXT,
  HISTORY,
  HISTORY_BATCH,
  CHANGED,
  QUICK_CHANGE,
  CHANGE_BATCH,
} = require('../src/constants');
const { plot } = require('../visualize');
const { key } = require('vega');

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

for (const history of [true, false]) {
  for (const deletion of [true, false]) {
    describe('deepProxy', () => {
      let state, config;
      const getState = () => {
        const obj = {};
        const globalState = {};
        const globalActions = { [TEST_KEY]: () => 2 };
        const config = {
          target: obj,
          globalState,
          globalActions,
          history,
          deletion,
          handlers: {},
        };
        const state = deepProxy(config);
        return { config, state };
      };

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
        if (config.history) {
          state.a = 2;
          expect(state.a).toEqual(2);
          state[PREVIOUS]();
          expect(state.a).toEqual(undefined);
          state[NEXT]();
          expect(state.a).toEqual(2);
        } else {
          expect(() => state[PREVIOUS]()).toThrow();
          expect(() => state[NEXT]()).toThrow();
        }
      });
      it('Navigation limit works', () => {
        if (config.history) {
          for (let i = 0; i < 120; i++) {
            state.b = i;
          }
          expect(state.b).toEqual(119);
          for (let i = 0; i < 120; i++) {
            state[PREVIOUS]();
          }

          expect(state.b).toEqual(19);
        } else {
          expect(() => state[PREVIOUS]()).toThrow();
        }
      });
      it('Navigation on nested changes works', () => {
        if (config.history) {
          state.c = {};
          state.c.a = 1;
          expect(state.c.a).toEqual(1);
          state[PREVIOUS]();
          expect(state.c.a).toEqual(undefined);
          state[NEXT]();
          expect(state.c.a).toEqual(1);
        } else {
          expect(() => state[PREVIOUS]()).toThrow();
        }
      });
      it('Change batches work', () => {
        if (config.history) {
          state[HISTORY_BATCH]();
          state.a = 2;
          state.b = 3;
          state.c = 4;
          state[HISTORY_BATCH]();
          expect(state.a).toEqual(2);
          expect(state.b).toEqual(3);
          expect(state.c).toEqual(4);
          state[PREVIOUS]();
          expect(state.a).toEqual(undefined);
          expect(state.b).toEqual(undefined);
          expect(state.c).toEqual(undefined);
          state[NEXT]();
          expect(state.a).toEqual(2);
          expect(state.b).toEqual(3);
          expect(state.c).toEqual(4);
        } else {
          expect(() => state[PREVIOUS]()).toThrow();
        }
      });
      it.skip('Performance test', () => {
        const loopsCases = Array(10)
          .fill(undefined)
          .map((el, i) => i * 1000);
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
      it('Changes are saved', async () => {
        state.a = {};
        expect(state[CHANGED]).toEqual(true);
        state.a.b = {};
        expect(state.a[CHANGED]).toEqual(true);
        state.a.b.c = 2;
        expect(state.a.b[CHANGED]).toEqual(true);
        state.b = {};
        state.b.a = 2;
        expect(state.a[CHANGED]).toEqual(false);
      });
      it('Deleting a key works', () => {
        state.a = 2;
        expect(state.a).toEqual(2);
        delete state.a;
        expect(state.a).toEqual(undefined);
      });
      it('Quick change mode words for deletion and set', () => {
        state.a = 2;
        state.c = {};
        expect(state.a).toEqual(2);
        state[QUICK_CHANGE]();
        delete state.a;
        state.b = 3;
        state.c.a = 1;
        state[QUICK_CHANGE]();
        expect(state.a).toEqual(undefined);
        expect(state.b).toEqual(3);
        // Change should not be registered
        expect(state.c[CHANGED]).toEqual(false);
        if (config.history) {
          expect(state[HISTORY].history.step).toEqual(2);
        }
      });
      it('History cannot be interacted with outside of its API', async () => {
        if (config.history) {
          expect(state[HISTORY].history.length.constructor.name).toEqual(
            'Error',
          );
          state[HISTORY].history[2] = 5;
        } else {
          expect(state[HISTORY].history).toEqual(undefined);
        }
      });
      it('Global state works with global actions', () => {
        const obj = {};
        const globalState = { obj: {} };
        const FLASH = Symbol('flash');
        const globalActions = {
          [FLASH]: (_, globalState) => () => {
            globalState.obj.a = 2;
          },
        };
        const config = {
          target: obj,
          globalState,
          globalActions,
          handlers: {},
          history: true,
          deletion: false,
        };
        const state = deepProxy(config);
        state[FLASH]();
        expect(globalState.obj.a).toEqual(2);
      });
      it('Path retrieval works', () => {
        state.a = { b: { c: { d: { e: { f: { g: { h: {} } } } } } } };
        expect(state.a.b.c.d.e.f.g.h[PATH]).toEqual([
          'a',
          'b',
          'c',
          'd',
          'e',
          'f',
          'g',
          'h',
        ]);
      });
      it('Change batch works', () => {
        const keys = ['a', 'b', 'c'];
        keys.forEach(k => (state[k] = {}));
        state[CHANGE_BATCH]();
        keys.forEach(k => (state[k].a = 2));
        state[CHANGE_BATCH]();
        expect(keys.every(k => state[k][CHANGED])).toEqual(true);
        state.a.a = 6;
        expect(keys.every(k => state[k][CHANGED])).toEqual(false);
      });
    });
  }
}
