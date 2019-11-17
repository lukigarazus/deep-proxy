![coverage lines](coverage/badge-lines.svg 'Coverage lines') ![coverage functions](coverage/badge-functions.svg 'Coverage functions') ![coverage branches](coverage/badge-branches.svg 'Coverage branches') ![coverage statements](coverage/badge-statements.svg 'Coverage statements')

# Immutable-like-deep-proxy

This is an implementation of deep proxy with a twist. Unlike the most popular deep proxy package out there this one caches nested proxies and avoids regenerating them on each get. There are also some additional features which come in handy for me in my other projects, like:

1. History tracking and navigation
1. Global keys
1. Custom trap handlers
1. Special modes like skip history, batch changes, quick access and more.
1. Object change signalling without new references

### Performance issues

This is a graph showing the difference in milliseconds (y axis) needed to perform various number (x axis) of sets, gets and deletes (orange, blue and red, respectively) between an object created with this package and a regular one.

![withHistory](performance-history-no-deletion.png 'With History')

This one measures the same thing but without history tracking

![withoutHistory](performance-no-history-no-deletion.png 'Without History')

### Use cases

This package is obviously not meant to be used in situations requiring outstanding read and write performance. It has been developed primarily for a GUI object editor and many of the existing features stem directly from this use-case. If you want to perform millions of operations, do not use this package.

### Usage

This package is under active development. This section will be added as soon as the first stable version (presumably 1.0.0) is released.
