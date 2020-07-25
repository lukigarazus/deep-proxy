![coverage lines](coverage/badge-lines.svg 'Coverage lines') ![coverage functions](coverage/badge-functions.svg 'Coverage functions') ![coverage branches](coverage/badge-branches.svg 'Coverage branches') ![coverage statements](coverage/badge-statements.svg 'Coverage statements')

# Immutable-like-deep-proxy

This is an implementation of deep proxy with a twist. Unlike the most popular deep proxy package out there this one caches nested proxies and avoids regenerating them on each get. There are also some additional features which come in handy for me in my other projects, like:

1. History tracking and navigation
1. Global keys
1. Custom trap handlers
1. Special modes like skip history, batch changes, quick access and more.
1. Object change signalling without new references

## Performance issues

This is a graph showing the difference in milliseconds (y axis) needed to perform various number (x axis) of sets, gets and deletes (orange, blue and red, respectively) between an object created with this package and a regular one.

![withHistory](performance-history-no-deletion.png 'With History')

This one measures the same thing but without history tracking

![withoutHistory](performance-no-history-no-deletion.png 'Without History')

## Use cases

This package is obviously not meant to be used in situations requiring outstanding read and write performance. It has been developed primarily for a GUI object editor and many of the existing features stem directly from this use-case. If you want to perform millions of operations, do not use this package.

## Documentation

### Change tracking

Change tracking was implemented in order to enable using this package with React. It was also done due to a need of preserving object references and not recreating everything on every change. This design decision is an experiment.

Every time you change something, the whole path is marked as changed, like this:

```javascript
import { deepProxy, CHANGED } from 'deep-proxy';

const object = deepProxy({ target: { a: { b: { c: { d: 1 } } } } });
object.a.b.c.d = 2;
console.log(object.a[CHANGED]); // true
console.log(object.a.b[CHANGED]); // true
console.log(object.a.b.c[CHANGED]); // true
```

However, this is (fortunately) not permanent. This will change on the next change to the object:

```javascript
object.a.d = 1;

console.log(object.a[CHANGED]); // true
console.log(object.a.b[CHANGED]); // false
console.log(object.a.b.c[CHANGED]); // false
```

But don't worry, those objects are not mutated directly, it is done in a more elegant and efficient manner.

### History

This package enables you history tracking and navigation. Let me show you:

```javascript
import { deepProxy, PREVIOUS, NEXT } from 'deep-proxy';

const object = deepProxy({ target: { a: 1 }, history: true });

object.a = 2;
object.a = 3;

console.log(object.a); // 3
object[PREVIOUS]();
console.log(object.a); // 2
object[PREVIOUS]();
console.log(object.a); // 1

object[NEXT]();
console.log(object.a); // 2
object[NEXT]();
console.log(object.a); // 3
```

However, there's a limit to this: you can only go 100 (this will be customizable one day) steps back. If you go back 50 steps and then make a change you will lose those 50 changes, so be careful!

#### Batches

Sometimes you will probably want to treat a series of changes as a whole. I've got you covered!

```javascript
import { deepProxy, PREVIOUS, NEXT, HISTORY_BATCH } from 'deep-proxy';

const object = deepProxy({ target: { a: 1 }, history: true });

// open batch
object[HISTORY_BATCH]();
for (let i = 0; i < 50; i++) {
  object.a = i;
}
// close batch
object[HISTORY_BATCH]();

console.log(object.a); // 49
object[PREVIOUS]();
console.log(object.a); // 1
```

Batches do not have a size limit (this will be addressed) so be careful. Navigation is done "in place" so referential equality is preserved.

#### Skipping history

If you want to skip history there are two ways:

1. Do not pass the history argument to configuration
1. Use QUICK_CHANGE

```javascript
import { deepProxy, QUICK_CHANGE, PREVIOUS } from 'deep-proxy';

const object = deepProxy({ target: { a: 1 }, history: true });

object[QUICK_CHANGE]();
object.a = 2;
object[QUICK_CHANGE]();

console.log(object.a); // 2
object[PREVIOUS](); // does nothing, history has not been saved
console.log(object.a); // 2
```

### Global keys

This was caused by a need to access some things from every nested object. I like to conceptualize it as a house in which there are different rooms and floors but you can access energy from a single source everywhere.

```javascript
import { deepProxy } from 'deep-proxy';

const GLOBAL_KEY = Symbol('global');

const object = deepProxy({
  target: { a: { b: { c: {} } } },
  globalState: { [GLOBAL_KEY]: 2 },
});

console.log(object[GLOBAL_KEY]); // 2
console.log(object.a.b.c[GLOBAL_KEY]); // 2
```
