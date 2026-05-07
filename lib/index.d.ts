import type { WorkerOptions } from 'node:worker_threads';

export interface WorkerPoolOptions {
  size?: number;
  workerOptions?: WorkerOptions;
}

export type WorkerTaskHandler<TPayload = unknown, TResult = unknown> = (
  payload: TPayload,
) => TResult | Promise<TResult>;

export type WorkerTaskCallback<TResult = unknown> = (
  error: Error | null,
  result?: TResult,
) => void;

export class WorkerPool {
  constructor(workerUrl: URL | string, options?: WorkerPoolOptions);

  readonly size: number;
  readonly queuedTaskCount: number;
  readonly busyWorkerCount: number;
  readonly idleWorkerCount: number;

  run<TPayload = unknown, TResult = unknown>(
    name: string,
    payload: TPayload,
    callback: WorkerTaskCallback<TResult>,
  ): void;

  run<TResult = unknown>(
    name: string,
    callback: WorkerTaskCallback<TResult>,
  ): void;

  destroy(): Promise<void>;
}

export function createWorkerHandler(
  handlers: Record<string, WorkerTaskHandler>,
): void;
