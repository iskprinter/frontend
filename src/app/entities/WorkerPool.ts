import { Observable, Subscriber } from 'rxjs';

export class WorkerPool {

    private static readonly DEFAULT_SIZE = 16;
    private static readonly DEFAULT_MAX_RETRIES = 4;

    private size: number;
    private queue: { observer: Subscriber<any>, task: () => Promise<any> }[] = [];
    private runningWorkers = 0;
    private maxRetries: number;

    constructor(
      options: any = {}
    ) {
      this.size = options.size || WorkerPool.DEFAULT_SIZE;
      this.maxRetries = options.maxRetries || WorkerPool.DEFAULT_MAX_RETRIES;
    }

    async runTask(next: () => Promise<any>): Promise<any> {
      return new Observable((observer) => {

        this.queue.push({ observer, task: next });
        if (this.runningWorkers < this.size) {
          this.startNewRequestLoop();
        }

      }).toPromise();
    }

    async execute(task: () => Promise<any>): Promise<any> {
      let error;
      for (const _ of new Array(this.maxRetries)) {
        try {
          return await task();
        } catch (err) {
          error = err;
        }
      }
      throw error;
    }

    async startNewRequestLoop(): Promise<void> {
      this.runningWorkers += 1;

      while (this.queue.length > 0) {

        // Get a new task from the queue.
        const request = this.queue.pop();
        if (request === undefined) {
          throw new Error('Reached impossible condition.');
        }
        const { observer, task } = request;

        // Run it and return the result.
        try {
          const result = await this.execute(task);
          observer.next(result);
        } catch (err) {
          observer.error(err);
        }
        observer.complete();

      }

      this.runningWorkers -= 1;
    }

}
