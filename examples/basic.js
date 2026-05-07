import { WorkerPool } from '../lib/index.js';

const pool = new WorkerPool(new URL('./prime-worker.js', import.meta.url), {
  size: 3,
});

let pendingTasks = 2;

pool.run('primes', { count: 10 }, handleResult);
pool.run('primes', { count: 20 }, handleResult);

async function handleResult(error, primes) {
  pendingTasks -= 1;

  if (error) {
    console.error(error);
  } else {
    console.log(primes);
  }

  if (pendingTasks === 0) {
    await pool.destroy();
  }
}
