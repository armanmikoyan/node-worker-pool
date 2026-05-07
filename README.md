# Worker Pool

A small worker pool for Node.js `worker_threads`, with callback and Promise APIs.

## Install

```sh
npm install worker-pool
```

Before publishing, change the package name in `package.json` to a name you own on npm.

## Usage

Create a worker file with named task handlers:

```js
import { createWorkerHandler } from 'worker-pool';

createWorkerHandler({
  double(value) {
    return value * 2;
  },

  async expensiveTask(input) {
    return runExpensiveWork(input);
  },
});
```

Run tasks through the callback API:

```js
import { WorkerPool } from 'worker-pool';

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

Use the Promise API from the `/promise` entrypoint:

```js
import { WorkerPool } from 'worker-pool/promise';

const pool = new WorkerPool(new URL('./worker.js', import.meta.url), {
  size: 4,
});

const result = await pool.run('double', 21);
console.log(result); // 42

await pool.destroy();
```

## API

### `new WorkerPool(workerUrl, options)`

- `workerUrl`: a `URL` or path passed to Node's `Worker` constructor.
- `options.size`: number of workers to start. Defaults to one less than the available CPU count.
- `options.workerOptions`: extra options passed to `new Worker()`.

### `pool.run(name, payload, callback)`

Queues a named task and calls `callback(error, result)` when it finishes.

You can omit `payload` when the task does not need input:

```js
pool.run('refreshCache', callback);
```

### `pool.run(name, payload)` from `worker-pool/promise`

Queues a named task and returns a promise with the worker result.

### `pool.destroy()`

Terminates workers and rejects queued tasks.

### `createWorkerHandler(handlers)`

Registers named async or sync task handlers inside a worker file.

## Publish Checklist

- Pick a unique npm package name and update `package.json`.
- Add your author details and confirm the license.
- Add a GitHub repository URL once the code is pushed.
- Run `npm test` before every publish.
- Publish with `npm publish --access public` for scoped public packages.
