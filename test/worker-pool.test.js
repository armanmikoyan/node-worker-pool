import assert from 'node:assert/strict';
import test from 'node:test';
import { WorkerPool } from '../lib/index.js';
import { WorkerPool as PromiseWorkerPool } from '../lib/promise.js';

const workerUrl = new URL('./fixtures/task-worker.js', import.meta.url);

test('runs a named task with a callback', async () => {
  const pool = new WorkerPool(workerUrl, { size: 1 });

  try {
    const result = await new Promise((resolve, reject) => {
      pool.run('double', 21, (error, value) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(value);
      });
    });

    assert.equal(result, 42);
  } finally {
    await pool.destroy();
  }
});

test('passes task errors to callbacks', async () => {
  const pool = new WorkerPool(workerUrl, { size: 1 });

  try {
    const error = await new Promise(resolve => {
      pool.run('fail', resolve);
    });

    assert.match(error.message, /boom/);
  } finally {
    await pool.destroy();
  }
});

test('runs queued promise tasks across workers', async () => {
  const pool = new PromiseWorkerPool(workerUrl, { size: 2 });

  try {
    const results = await Promise.all([
      pool.run('wait', { delay: 20, value: 'a' }),
      pool.run('wait', { delay: 10, value: 'b' }),
      pool.run('wait', { delay: 1, value: 'c' }),
    ]);

    assert.deepEqual(results, ['a', 'b', 'c']);
  } finally {
    await pool.destroy();
  }
});

test('rejects promise task errors', async () => {
  const pool = new PromiseWorkerPool(workerUrl, { size: 1 });

  try {
    await assert.rejects(pool.run('fail'), /boom/);
  } finally {
    await pool.destroy();
  }
});

test('root callback API requires a callback', async () => {
  const pool = new WorkerPool(workerUrl, { size: 2 });

  try {
    assert.throws(() => pool.run('double', 21), /callback function/);
  } finally {
    await pool.destroy();
  }
});
