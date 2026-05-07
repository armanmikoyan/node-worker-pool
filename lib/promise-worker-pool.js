import { WorkerPool as CallbackWorkerPool, createWorkerHandler } from './worker-pool.js';

export { createWorkerHandler };

export class WorkerPool extends CallbackWorkerPool {
  run(name, payload) {
    return new Promise((resolve, reject) => {
      super.run(name, payload, (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      });
    });
  }
}
