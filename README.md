# Node Worker Pool Lite

[![npm version](https://img.shields.io/npm/v/node-worker-pool-lite.svg)](https://www.npmjs.com/package/node-worker-pool-lite)
[![license](https://img.shields.io/npm/l/node-worker-pool-lite.svg)](https://github.com/armanmikoyan/node-worker-pool/blob/main/LICENSE)

A lightweight Node.js `worker_threads` pool with callback and Promise APIs.

Node Worker Pool Lite helps you move CPU-heavy work off the main event loop while keeping a small, predictable API. It supports named worker tasks, a fixed-size worker pool, queued jobs, worker replacement after failures, and TypeScript declarations.

## Features

- Callback-first API from the main package entrypoint.
- Promise API from `node-worker-pool-lite/promise`.
- Named task handlers inside worker files.
- Automatic task queueing when all workers are busy.
- Worker error propagation to callbacks or rejected promises.
- Graceful shutdown with `pool.destroy()`.
- ESM and TypeScript declaration support.

## Requirements

- Node.js 18 or newer.
- ESM projects, or files using `.mjs` / `"type": "module"`.

## Installation

```sh
npm install node-worker-pool-lite
```

## Quick Start

Create a worker file with named task handlers:

```js
// worker.js
import { createWorkerHandler } from 'node-worker-pool-lite';

createWorkerHandler({
  double(value) {
    return value * 2;
  },

  async hashPassword(input) {
    return runExpensiveHash(input);
  },
});
```

Run tasks with the callback API:

```js
// index.js
import { WorkerPool } from 'node-worker-pool-lite';

const pool = new WorkerPool(new URL('./worker.js', import.meta.url), {
  size: 4,
});

pool.run('double', 21, async (error, result) => {
  if (error) {
    console.error(error);
    await pool.destroy();
    return;
  }

  console.log(result); // 42
  await pool.destroy();
});
```

## Promise API

Import from `node-worker-pool-lite/promise` when you prefer `async` / `await`:

```js
import { WorkerPool } from 'node-worker-pool-lite/promise';

const pool = new WorkerPool(new URL('./worker.js', import.meta.url), {
  size: 4,
});

try {
  const result = await pool.run('double', 21);
  console.log(result); // 42
} finally {
  await pool.destroy();
}
```

## Worker Tasks

Workers are registered with `createWorkerHandler()`. Each key is the task name used by `pool.run()`.

```js
import { createWorkerHandler } from 'node-worker-pool-lite';

createWorkerHandler({
  resizeImage(payload) {
    return resizeImage(payload);
  },

  generateReport(payload) {
    return generateReport(payload);
  },
});
```

Handlers may be synchronous or asynchronous. If a handler throws, the error is passed to the callback API or rejects the Promise API.

## API

### `new WorkerPool(workerUrl, options)`

Creates a fixed-size pool of worker threads.

- `workerUrl`: a worker file URL or path passed to Node.js `new Worker()`.
- `options.size`: number of workers to start. Defaults to one less than the available CPU count.
- `options.workerOptions`: extra options passed to Node.js `new Worker()`.

```js
const pool = new WorkerPool(new URL('./worker.js', import.meta.url), {
  size: 4,
  workerOptions: {
    resourceLimits: {
      maxOldGenerationSizeMb: 128,
    },
  },
});
```

### `pool.run(name, payload, callback)`

Queues a named task and calls `callback(error, result)` when the task completes.

```js
pool.run('double', 21, (error, result) => {
  if (error) {
    console.error(error);
    return;
  }

  console.log(result);
});
```

You can omit `payload` for tasks that do not need input:

```js
pool.run('refreshCache', error => {
  if (error) {
    console.error(error);
  }
});
```

### `pool.run(name, payload)` from `node-worker-pool-lite/promise`

Queues a named task and returns a promise.

```js
const result = await pool.run('double', 21);
```

### `pool.destroy()`

Terminates all workers and rejects queued work.

```js
await pool.destroy();
```

### `createWorkerHandler(handlers)`

Registers named task handlers inside a worker file.

```js
createWorkerHandler({
  taskName(payload) {
    return doWork(payload);
  },
});
```

## Examples

This repository includes runnable examples:

```sh
node examples/basic.js
node examples/promise.js
```

## Development

Run the test suite:

```sh
npm test
```

Preview the package contents before publishing:

```sh
npm pack --dry-run
```

## Repository

- GitHub: [armanmikoyan/node-worker-pool](https://github.com/armanmikoyan/node-worker-pool)
- npm: [node-worker-pool-lite](https://www.npmjs.com/package/node-worker-pool-lite)

## Release Checklist

Before publishing a new npm version:

- Run `npm test` and `npm pack --dry-run`.
- Update the version with `npm version patch`, `npm version minor`, or `npm version major`.
- Publish with `npm publish`.

## License

MIT © [Arman Mikoyan](https://github.com/armanmikoyan)
