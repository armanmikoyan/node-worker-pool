import { createWorkerHandler } from '../lib/index.js';

createWorkerHandler({
  primes({ count = 1 } = {}) {
    return generatePrimes(count);
  },
});

function generatePrimes(count) {
  const primes = [];
  let candidate = 2;

  while (primes.length < count) {
    if (isPrime(candidate)) {
      primes.push(candidate);
    }

    candidate += 1;
  }

  return primes;
}

function isPrime(value) {
  if (value < 2) {
    return false;
  }

  for (let divisor = 2; divisor * divisor <= value; divisor += 1) {
    if (value % divisor === 0) {
      return false;
    }
  }

  return true;
}
