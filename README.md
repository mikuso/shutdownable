# shutdownable

Shutdownable is a Class decorator.

The purpose of this decorator is to add (or modify) an async `shutdown` method to the class.

The `shutdown` method will await for any existing calls on other named methods to complete before returning. Once `shutdown()` has begun, calling any of the other named methods will throw a `ShuttingDownError` error, preventing them from running.

## Installation

```sh
npm install shutdownable
```

## Usage

```js
const shutdownable = require('shutdownable');

const delay = (ms) => new Promise(r => setTimeout(r, ms));

class A {
    async init() {
        console.log('init start');
        await delay(1000);
        console.log('init end');
    }

    async run() {
        console.log('run start');
        await delay(2000);
        console.log('run end');
    }
}

// apply the decorator to the class and its methods
shutdownable(A, ['init', 'run']);

async function main() {
    const a = new A();

    setTimeout(async () => {
        console.log('shutting down');
        await a.shutdown();
        console.log('shutdown complete. All init() & run() methods have completed.');
    }, 1500);

    await a.init();
    await Promise.all([
        a.run(),
        a.run(),
        a.run(),
    ]);
    console.log('end of main()');
}
main().catch(console.error);
```
