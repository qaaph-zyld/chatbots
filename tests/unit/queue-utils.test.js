/**
 * Queue Utilities Unit Tests
 */

describe('Queue Utilities', () => {
  test('should handle FIFO queue operations', () => {
    const queue = {
      items: [],
      
      enqueue: function(item) {
        this.items.push(item);
      },
      
      dequeue: function() {
        return this.items.shift();
      },
      
      peek: function() {
        return this.items[0];
      },
      
      isEmpty: function() {
        return this.items.length === 0;
      },
      
      size: function() {
        return this.items.length;
      }
    };

    queue.enqueue('first');
    queue.enqueue('second');
    queue.enqueue('third');

    expect(queue.size()).toBe(3);
    expect(queue.peek()).toBe('first');
    expect(queue.dequeue()).toBe('first');
    expect(queue.size()).toBe(2);
  });

  test('should handle priority queue operations', () => {
    const priorityQueue = {
      items: [],
      
      enqueue: function(item, priority = 0) {
        const queueItem = { item, priority };
        
        if (this.items.length === 0) {
          this.items.push(queueItem);
        } else {
          let added = false;
          for (let i = 0; i < this.items.length; i++) {
            if (queueItem.priority > this.items[i].priority) {
              this.items.splice(i, 0, queueItem);
              added = true;
              break;
            }
          }
          if (!added) {
            this.items.push(queueItem);
          }
        }
      },
      
      dequeue: function() {
        return this.items.shift()?.item;
      },
      
      size: function() {
        return this.items.length;
      }
    };

    priorityQueue.enqueue('low', 1);
    priorityQueue.enqueue('high', 5);
    priorityQueue.enqueue('medium', 3);

    expect(priorityQueue.dequeue()).toBe('high');
    expect(priorityQueue.dequeue()).toBe('medium');
    expect(priorityQueue.dequeue()).toBe('low');
  });

  test('should handle circular queue operations', () => {
    const circularQueue = {
      items: new Array(3),
      front: 0,
      rear: 0,
      count: 0,
      maxSize: 3,
      
      enqueue: function(item) {
        if (this.count >= this.maxSize) {
          return false; // Queue full
        }
        
        this.items[this.rear] = item;
        this.rear = (this.rear + 1) % this.maxSize;
        this.count++;
        return true;
      },
      
      dequeue: function() {
        if (this.count === 0) {
          return null; // Queue empty
        }
        
        const item = this.items[this.front];
        this.front = (this.front + 1) % this.maxSize;
        this.count--;
        return item;
      },
      
      isFull: function() {
        return this.count >= this.maxSize;
      },
      
      isEmpty: function() {
        return this.count === 0;
      }
    };

    expect(circularQueue.enqueue('a')).toBe(true);
    expect(circularQueue.enqueue('b')).toBe(true);
    expect(circularQueue.enqueue('c')).toBe(true);
    expect(circularQueue.enqueue('d')).toBe(false); // Full

    expect(circularQueue.dequeue()).toBe('a');
    expect(circularQueue.enqueue('d')).toBe(true); // Now has space
  });

  test('should handle async queue processing', async () => {
    const asyncQueue = {
      items: [],
      processing: false,
      
      add: function(task) {
        this.items.push(task);
        this.process();
      },
      
      process: async function() {
        if (this.processing || this.items.length === 0) {
          return;
        }
        
        this.processing = true;
        
        while (this.items.length > 0) {
          const task = this.items.shift();
          try {
            await task();
          } catch (error) {
            console.error('Task failed:', error);
          }
        }
        
        this.processing = false;
      }
    };

    const results = [];
    const createTask = (value) => async () => {
      results.push(value);
    };

    asyncQueue.add(createTask('first'));
    asyncQueue.add(createTask('second'));
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(results).toEqual(['first', 'second']);
  });

  test('should handle queue with size limit', () => {
    const boundedQueue = {
      items: [],
      maxSize: 3,
      
      enqueue: function(item) {
        if (this.items.length >= this.maxSize) {
          this.items.shift(); // Remove oldest
        }
        this.items.push(item);
      },
      
      dequeue: function() {
        return this.items.shift();
      },
      
      size: function() {
        return this.items.length;
      },
      
      toArray: function() {
        return [...this.items];
      }
    };

    boundedQueue.enqueue(1);
    boundedQueue.enqueue(2);
    boundedQueue.enqueue(3);
    boundedQueue.enqueue(4); // Should remove 1

    expect(boundedQueue.toArray()).toEqual([2, 3, 4]);
    expect(boundedQueue.size()).toBe(3);
  });
});
