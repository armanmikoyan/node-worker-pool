import os from 'node:os';
import { Worker, parentPort as defaultParentPort } from 'node:worker_threads';

export class WorkerPool {
  #idleWorkers = [];
  #isDestroyed = false;
  #queue = [];
  #runningTasks = new Map();
  #workerOptions;
  #workerUrl;
  #workers = new Set();

  constructor(workerUrl, options = {}) {
    if (!workerUrl) {
      throw new TypeError('WorkerPool requires a worker file URL or path.');
    }

    const size = options.size ?? defaultPoolSize();
    if (!Number.isInteger(size) || size < 1) {
      throw new RangeError('WorkerPool size must be a positive integer.');
    }

    this.size = size;
    this.#workerUrl = workerUrl;
    this.#workerOptions = options.workerOptions ?? {};

    for (let index = 0; index < this.size; index += 1) {
      this.#spawnWorker();
    }
  }

  get queuedTaskCount() {
    return this.#queue.length;
  }

  get busyWorkerCount() {
    return this.#runningTasks.size;
  }

  get idleWorkerCount() {
    return this.#idleWorkers.length;
  }

  run(name, payload, callback) {
    if (typeof payload === 'function') {
      callback = payload;
      payload = undefined;
    }

    if (typeof callback !== 'function') {
      throw new TypeError('WorkerPool.run requires a callback function.');
    }

    if (this.#isDestroyed) {
      queueMicrotask(() => callback(new Error('WorkerPool has been destroyed.')));
      return;
    }

    if (typeof name !== 'string' || name.length === 0) {
      queueMicrotask(() => callback(new TypeError('Task name must be a non-empty string.')));
      return;
    }

    this.#queue.push({
      callback,
      message: { name, payload },
    });

    this.#dispatch();
  }

  async destroy() {
    if (this.#isDestroyed) {
      return;
    }

    this.#isDestroyed = true;

    const destroyError = new Error('WorkerPool was destroyed before the task completed.');
    for (const task of this.#queue.splice(0)) {
      this.#completeTask(task, destroyError);
    }

    const terminations = [...this.#workers].map(worker => worker.terminate());
    this.#idleWorkers = [];

    await Promise.allSettled(terminations);
  }

  #dispatch() {
    while (!this.#isDestroyed && this.#idleWorkers.length > 0 && this.#queue.length > 0) {
      const worker = this.#idleWorkers.shift();

      if (!this.#workers.has(worker)) {
        continue;
      }

      const task = this.#queue.shift();
      this.#runningTasks.set(worker, task);

      try {
        worker.postMessage(task.message);
      } catch (error) {
        this.#runningTasks.delete(worker);
        this.#idleWorkers.push(worker);
        this.#completeTask(task, error);
      }
    }
  }

  #handleMessage(worker, message) {
    const task = this.#runningTasks.get(worker);
    if (!task) {
      return;
    }

    this.#runningTasks.delete(worker);

    if (isWorkerResult(message)) {
      if (message.ok) {
        this.#completeTask(task, null, message.value);
      } else {
        this.#completeTask(task, createWorkerError(message.error));
      }
    } else {
      this.#completeTask(task, null, message);
    }

    if (!this.#isDestroyed && this.#workers.has(worker)) {
      this.#idleWorkers.push(worker);
      this.#dispatch();
    }
  }

  #retireWorker(worker, error) {
    if (!this.#workers.has(worker)) {
      return;
    }

    this.#workers.delete(worker);
    this.#idleWorkers = this.#idleWorkers.filter(idleWorker => idleWorker !== worker);

    const task = this.#runningTasks.get(worker);
    if (task) {
      this.#runningTasks.delete(worker);
      this.#completeTask(task, error);
    }

    if (!this.#isDestroyed) {
      this.#spawnWorker();
      this.#dispatch();
    }
  }

  #spawnWorker() {
    const worker = new Worker(this.#workerUrl, this.#workerOptions);

    worker.on('message', message => {
      this.#handleMessage(worker, message);
    });

    worker.on('error', error => {
      this.#retireWorker(worker, error);
    });

    worker.on('exit', code => {
      const error = code === 0
        ? new Error('Worker exited before completing its current task.')
        : new Error(`Worker exited with code ${code}.`);

      this.#retireWorker(worker, error);
    });

    this.#workers.add(worker);
    this.#idleWorkers.push(worker);
  }

  #completeTask(task, error, result) {
    queueMicrotask(() => {
      task.callback(error, result);
    });
  }
}

export function createWorkerHandler(handlers, options = {}) {
  const port = options.parentPort ?? defaultParentPort;

  if (!port) {
    throw new Error('createWorkerHandler must be called inside a worker thread.');
  }

  if (!handlers || typeof handlers !== 'object') {
    throw new TypeError('Task handlers must be provided as an object.');
  }

  port.on('message', async ({ name, payload }) => {
    try {
      const handler = handlers[name];

      if (typeof handler !== 'function') {
        throw new Error(`Unknown task: ${String(name)}`);
      }

      const value = await handler(payload);
      port.postMessage({ ok: true, value });
    } catch (error) {
      port.postMessage({ ok: false, error: serializeError(error) });
    }
  });
}

function defaultPoolSize() {
  const availableParallelism = os.availableParallelism?.() ?? os.cpus().length;
  return Math.max(1, availableParallelism - 1);
}

function isWorkerResult(message) {
  return Boolean(
    message
    && typeof message === 'object'
    && Object.hasOwn(message, 'ok')
    && typeof message.ok === 'boolean',
  );
}

function serializeError(error) {
  return {
    message: error instanceof Error ? error.message : String(error),
    name: error instanceof Error ? error.name : 'Error',
    stack: error instanceof Error ? error.stack : undefined,
  };
}

function createWorkerError(error) {
  const workerError = new Error(error?.message ?? 'Worker task failed.');
  workerError.name = error?.name ?? 'WorkerTaskError';

  if (error?.stack) {
    workerError.stack = error.stack;
  }

  return workerError;
}
