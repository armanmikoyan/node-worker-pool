import { createWorkerHandler } from '../../lib/index.js';

createWorkerHandler({
  double(value) {
    return value * 2;
  },

  fail() {
    throw new Error('boom');
  },

  wait({ delay, value }) {
    return new Promise(resolve => {
      setTimeout(() => resolve(value), delay);
    });
  },
});
