import { WorkerPool } from '../lib/promise.js';

const pool = new WorkerPool(new URL('./prime-worker.js', import.meta.url), {
  size: 3,
});

try {
  const [firstBatch, secondBatch] = await Promise.all([
    pool.run('primes', { count: 10 }),
    pool.run('primes', { count: 20 }),
  ]);

  console.log(firstBatch);
  console.log(secondBatch);
} finally {
  await pool.destroy();
}
