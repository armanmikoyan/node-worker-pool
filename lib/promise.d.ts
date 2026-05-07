import type { WorkerPoolOptions } from './index.js';

export type {
  WorkerPoolOptions,
  WorkerTaskHandler,
} from './index.js';

export { createWorkerHandler } from './index.js';

export class WorkerPool {
  constructor(workerUrl: URL | string, options?: WorkerPoolOptions);

  readonly size: number;
  readonly queuedTaskCount: number;
  readonly busyWorkerCount: number;
  readonly idleWorkerCount: number;

  run<TPayload = unknown, TResult = unknown>(
    name: string,
    payload?: TPayload,
  ): Promise<TResult>;

  destroy(): Promise<void>;
}
