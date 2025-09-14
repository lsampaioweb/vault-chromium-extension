import { I18n } from './i18n.js';

/**
 * A utility class to process asynchronous tasks in parallel with a concurrency limit.
 * This implements a "worker pool" pattern that is more efficient than sequential
 * batching, as it starts a new task the moment a worker becomes free.
 *
 * Example usage:
 * const results = await PromisePool.process(engines, async (engine) => {
 *   return await vault.processEngine(engine);
 * });
 */
export class PromisePool {

  /**
   * Default concurrency limit for processing items in parallel.
   * @private
   * @static
   * @readonly
   */
  static #DEFAULT_CONCURRENCY = 6;

  /**
   * Status constant for rejected promises to maintain consistency.
   * @private
   * @static
   * @readonly
   */
  static #STATUS_REJECTED = 'rejected';

  // Error message keys.
  static #ERROR_INVALID_ITEMS = 'error_promise_pool_invalid_items';
  static #ERROR_INVALID_FUNCTION = 'error_promise_pool_invalid_function';
  static #ERROR_INVALID_CONCURRENCY = 'error_promise_pool_invalid_concurrency';
  /**
   * Processes an array of items with a given async function, respecting the concurrency limit.
   * Uses a worker pool pattern where multiple workers pull items from a shared generator,
   * ensuring optimal resource utilization and maintaining result order.
   *
   * @param {Array<T>} items - The array of items to process.
   * @param {function(item: T, index: number): Promise<U>} asyncFn - The async function to apply to each item.
   *   Receives the item and its original index as parameters.
   * @param {number} [concurrency] - The maximum number of promises to run in parallel (must be > 0).
   *   Defaults to PromisePool.#DEFAULT_CONCURRENCY if not provided.
   * @returns {Promise<Array<U|Object>>} A promise that resolves with an array of results.
   *   Successful results are stored directly, failed results are stored as
   *   `{ status: 'rejected', reason: Error }` objects.
   * @template T, U
   * @throws {Error} If concurrency is not a positive integer or asyncFn is not a function.
   */
  static async process(items, asyncFn, concurrency = PromisePool.#DEFAULT_CONCURRENCY) {
    // Input validation (following your style of proper error handling)
    if (!Array.isArray(items)) {
      throw new Error(I18n.getMessage(PromisePool.#ERROR_INVALID_ITEMS));
    }

    if (typeof asyncFn !== 'function') {
      throw new Error(I18n.getMessage(PromisePool.#ERROR_INVALID_FUNCTION));
    }

    if (!Number.isInteger(concurrency) || concurrency <= 0) {
      throw new Error(I18n.getMessage(PromisePool.#ERROR_INVALID_CONCURRENCY));
    }

    // Early return for empty arrays
    if (items.length === 0) {
      return [];
    }

    // Optimize concurrency to not exceed the number of items
    const effectiveConcurrency = Math.min(concurrency, items.length);

    // A generator makes it easy for multiple workers to pull items from the list without conflict.
    const itemGenerator = items.entries();

    // Pre-allocate the results array to guarantee order is preserved.
    const results = new Array(items.length);

    /**
     * The "worker" function. Each worker will pull items from the generator
     * and process them until the generator is exhausted.
     * @returns {Promise<void>} A promise that resolves when this worker has processed all available items.
     */
    const worker = async () => {
      // The `for...of` loop will automatically handle the generator's state.
      for (const [index, item] of itemGenerator) {
        try {
          // Await the user-provided async function for the current item.
          const result = await asyncFn(item, index);

          // Store the result at its original index.
          results[index] = result;

        } catch (error) {
          // Similar to Promise.allSettled.
          results[index] = { status: PromisePool.#STATUS_REJECTED, reason: error };
        }
      }
    };

    // Create and start all the worker promises.
    const workerPromises = Array.from({ length: effectiveConcurrency }, () => worker());

    // Wait for all workers to complete their tasks.
    await Promise.all(workerPromises);

    return results;
  }
}
