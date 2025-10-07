/**
 * Reactive Utilities Unit Tests
 */

describe('Reactive Utilities', () => {
  test('should handle observable implementation', () => {
    const createObservable = (initialValue) => {
      let value = initialValue;
      const observers = [];
      
      return {
        get: () => value,
        set: (newValue) => {
          const oldValue = value;
          value = newValue;
          observers.forEach(observer => observer(newValue, oldValue));
        },
        subscribe: (observer) => {
          observers.push(observer);
          return () => {
            const index = observers.indexOf(observer);
            if (index > -1) observers.splice(index, 1);
          };
        },
        map: (fn) => {
          const mapped = createObservable(fn(value));
          this.subscribe((newValue) => mapped.set(fn(newValue)));
          return mapped;
        }
      };
    };

    const counter = createObservable(0);
    const doubled = counter.map(x => x * 2);
    
    let lastValue = null;
    counter.subscribe(value => lastValue = value);
    
    counter.set(5);
    expect(lastValue).toBe(5);
    expect(doubled.get()).toBe(10);
  });

  test('should handle computed values', () => {
    const createComputed = (dependencies, computeFn) => {
      let value = computeFn(...dependencies.map(dep => dep.get()));
      const observers = [];
      
      const update = () => {
        const newValue = computeFn(...dependencies.map(dep => dep.get()));
        if (newValue !== value) {
          const oldValue = value;
          value = newValue;
          observers.forEach(observer => observer(newValue, oldValue));
        }
      };
      
      dependencies.forEach(dep => dep.subscribe(update));
      
      return {
        get: () => value,
        subscribe: (observer) => {
          observers.push(observer);
          return () => {
            const index = observers.indexOf(observer);
            if (index > -1) observers.splice(index, 1);
          };
        }
      };
    };

    const createObservable = (value) => {
      const observers = [];
      return {
        get: () => value,
        set: (newValue) => {
          value = newValue;
          observers.forEach(observer => observer(newValue));
        },
        subscribe: (observer) => {
          observers.push(observer);
          return () => {
            const index = observers.indexOf(observer);
            if (index > -1) observers.splice(index, 1);
          };
        }
      };
    };

    const a = createObservable(2);
    const b = createObservable(3);
    const sum = createComputed([a, b], (aVal, bVal) => aVal + bVal);
    
    expect(sum.get()).toBe(5);
    
    a.set(4);
    expect(sum.get()).toBe(7);
  });

  test('should handle reactive state management', () => {
    const createReactiveState = (initialState) => {
      const state = { ...initialState };
      const observers = {};
      
      return {
        get: (key) => key ? state[key] : { ...state },
        set: (key, value) => {
          const oldValue = state[key];
          state[key] = value;
          
          if (observers[key]) {
            observers[key].forEach(observer => observer(value, oldValue));
          }
          if (observers['*']) {
            observers['*'].forEach(observer => observer({ ...state }, key));
          }
        },
        subscribe: (key, observer) => {
          if (!observers[key]) observers[key] = [];
          observers[key].push(observer);
          
          return () => {
            const index = observers[key].indexOf(observer);
            if (index > -1) observers[key].splice(index, 1);
          };
        },
        update: (updates) => {
          Object.entries(updates).forEach(([key, value]) => {
            this.set(key, value);
          });
        }
      };
    };

    const store = createReactiveState({ count: 0, name: 'test' });
    
    let countChanges = 0;
    store.subscribe('count', () => countChanges++);
    
    store.set('count', 1);
    store.set('count', 2);
    
    expect(store.get('count')).toBe(2);
    expect(countChanges).toBe(2);
  });

  test('should handle event emitter pattern', () => {
    const createEventEmitter = () => {
      const events = {};
      
      return {
        on: (event, listener) => {
          if (!events[event]) events[event] = [];
          events[event].push(listener);
          
          return () => {
            const index = events[event].indexOf(listener);
            if (index > -1) events[event].splice(index, 1);
          };
        },
        once: (event, listener) => {
          const unsubscribe = this.on(event, (...args) => {
            unsubscribe();
            listener(...args);
          });
          return unsubscribe;
        },
        emit: (event, ...args) => {
          if (events[event]) {
            events[event].forEach(listener => listener(...args));
          }
        },
        off: (event, listener) => {
          if (events[event]) {
            const index = events[event].indexOf(listener);
            if (index > -1) events[event].splice(index, 1);
          }
        },
        removeAllListeners: (event) => {
          if (event) {
            delete events[event];
          } else {
            Object.keys(events).forEach(key => delete events[key]);
          }
        }
      };
    };

    const emitter = createEventEmitter();
    
    let callCount = 0;
    const listener = () => callCount++;
    
    emitter.on('test', listener);
    emitter.emit('test');
    emitter.emit('test');
    
    expect(callCount).toBe(2);
    
    emitter.off('test', listener);
    emitter.emit('test');
    
    expect(callCount).toBe(2); // No change after removing listener
  });

  test('should handle reactive collections', () => {
    const createReactiveArray = (initialItems = []) => {
      const items = [...initialItems];
      const observers = [];
      
      const notify = (type, index, item) => {
        observers.forEach(observer => observer({ type, index, item, items: [...items] }));
      };
      
      return {
        get: (index) => index !== undefined ? items[index] : [...items],
        push: (item) => {
          const index = items.length;
          items.push(item);
          notify('add', index, item);
          return items.length;
        },
        pop: () => {
          if (items.length === 0) return undefined;
          const item = items.pop();
          notify('remove', items.length, item);
          return item;
        },
        splice: (start, deleteCount, ...newItems) => {
          const deleted = items.splice(start, deleteCount, ...newItems);
          deleted.forEach((item, i) => notify('remove', start + i, item));
          newItems.forEach((item, i) => notify('add', start + i, item));
          return deleted;
        },
        length: () => items.length,
        subscribe: (observer) => {
          observers.push(observer);
          return () => {
            const index = observers.indexOf(observer);
            if (index > -1) observers.splice(index, 1);
          };
        }
      };
    };

    const reactiveArray = createReactiveArray([1, 2, 3]);
    
    const changes = [];
    reactiveArray.subscribe(change => changes.push(change));
    
    reactiveArray.push(4);
    reactiveArray.pop();
    
    expect(changes).toHaveLength(2);
    expect(changes[0].type).toBe('add');
    expect(changes[1].type).toBe('remove');
  });

  test('should handle dependency tracking', () => {
    const createDependencyTracker = () => {
      let currentComputation = null;
      const dependencies = new Map();
      
      return {
        track: (target, key) => {
          if (currentComputation) {
            if (!dependencies.has(target)) {
              dependencies.set(target, new Map());
            }
            if (!dependencies.get(target).has(key)) {
              dependencies.get(target).set(key, new Set());
            }
            dependencies.get(target).get(key).add(currentComputation);
          }
        },
        trigger: (target, key) => {
          if (dependencies.has(target) && dependencies.get(target).has(key)) {
            dependencies.get(target).get(key).forEach(computation => {
              computation();
            });
          }
        },
        computed: (fn) => {
          const computation = () => {
            currentComputation = computation;
            const result = fn();
            currentComputation = null;
            return result;
          };
          return computation();
        }
      };
    };

    const tracker = createDependencyTracker();
    
    const state = { count: 0 };
    const proxy = new Proxy(state, {
      get: (target, key) => {
        tracker.track(target, key);
        return target[key];
      },
      set: (target, key, value) => {
        target[key] = value;
        tracker.trigger(target, key);
        return true;
      }
    });

    let computedValue = 0;
    tracker.computed(() => {
      computedValue = proxy.count * 2;
    });

    expect(computedValue).toBe(0);
    
    proxy.count = 5;
    expect(computedValue).toBe(10);
  });
});
