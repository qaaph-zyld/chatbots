/**
 * Workflow Utilities Unit Tests
 */

describe('Workflow Utilities', () => {
  test('should handle step-by-step workflow execution', () => {
    const createWorkflow = () => {
      const steps = [];
      let currentStep = 0;
      let context = {};
      
      return {
        addStep: (name, fn) => {
          steps.push({ name, fn });
          return this;
        },
        
        execute: async () => {
          const results = [];
          
          for (let i = 0; i < steps.length; i++) {
            currentStep = i;
            const step = steps[i];
            
            try {
              const result = await step.fn(context);
              context = { ...context, ...result };
              results.push({ step: step.name, success: true, result });
            } catch (error) {
              results.push({ step: step.name, success: false, error: error.message });
              break;
            }
          }
          
          return { results, context };
        },
        
        getCurrentStep: () => currentStep,
        getSteps: () => steps.map(s => s.name)
      };
    };

    const workflow = createWorkflow();
    
    workflow
      .addStep('initialize', () => ({ initialized: true, value: 0 }))
      .addStep('process', (ctx) => ({ value: ctx.value + 10 }))
      .addStep('finalize', (ctx) => ({ final: ctx.value * 2 }));

    return workflow.execute().then(({ results, context }) => {
      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(context.final).toBe(20);
    });
  });

  test('should handle conditional workflow branches', () => {
    const createConditionalWorkflow = () => {
      const steps = [];
      
      return {
        addStep: (name, fn, condition = () => true) => {
          steps.push({ name, fn, condition });
          return this;
        },
        
        execute: async (initialContext = {}) => {
          let context = { ...initialContext };
          const executed = [];
          
          for (const step of steps) {
            if (step.condition(context)) {
              const result = await step.fn(context);
              context = { ...context, ...result };
              executed.push(step.name);
            }
          }
          
          return { context, executed };
        }
      };
    };

    const workflow = createConditionalWorkflow();
    
    workflow
      .addStep('setup', () => ({ ready: true, mode: 'test' }))
      .addStep('dev-only', () => ({ devFeature: true }), ctx => ctx.mode === 'dev')
      .addStep('test-only', () => ({ testFeature: true }), ctx => ctx.mode === 'test')
      .addStep('cleanup', () => ({ cleaned: true }));

    return workflow.execute().then(({ context, executed }) => {
      expect(executed).toEqual(['setup', 'test-only', 'cleanup']);
      expect(context.testFeature).toBe(true);
      expect(context.devFeature).toBeUndefined();
    });
  });

  test('should handle parallel workflow execution', () => {
    const createParallelWorkflow = () => {
      const groups = [];
      
      return {
        addParallelGroup: (steps) => {
          groups.push(steps);
          return this;
        },
        
        execute: async (initialContext = {}) => {
          let context = { ...initialContext };
          
          for (const group of groups) {
            const promises = group.map(async (step) => {
              const result = await step.fn(context);
              return { name: step.name, result };
            });
            
            const groupResults = await Promise.all(promises);
            
            // Merge all results into context
            groupResults.forEach(({ result }) => {
              context = { ...context, ...result };
            });
          }
          
          return context;
        }
      };
    };

    const workflow = createParallelWorkflow();
    
    workflow.addParallelGroup([
      { name: 'task1', fn: () => new Promise(resolve => setTimeout(() => resolve({ task1: 'done' }), 10)) },
      { name: 'task2', fn: () => new Promise(resolve => setTimeout(() => resolve({ task2: 'done' }), 5)) },
      { name: 'task3', fn: () => new Promise(resolve => setTimeout(() => resolve({ task3: 'done' }), 15)) }
    ]);

    return workflow.execute().then(context => {
      expect(context.task1).toBe('done');
      expect(context.task2).toBe('done');
      expect(context.task3).toBe('done');
    });
  });

  test('should handle workflow with retry logic', () => {
    const createRetryWorkflow = () => {
      return {
        executeWithRetry: async (fn, maxRetries = 3, delay = 100) => {
          let lastError;
          
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              return await fn(attempt);
            } catch (error) {
              lastError = error;
              
              if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
              }
            }
          }
          
          throw lastError;
        }
      };
    };

    const workflow = createRetryWorkflow();
    
    let attempts = 0;
    const unreliableTask = () => {
      attempts++;
      if (attempts < 3) {
        throw new Error(`Attempt ${attempts} failed`);
      }
      return 'success';
    };

    return workflow.executeWithRetry(unreliableTask, 5, 1).then(result => {
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });
  });

  test('should handle workflow state machine', () => {
    const createStateMachine = (initialState, transitions) => {
      let currentState = initialState;
      const history = [initialState];
      
      return {
        getCurrentState: () => currentState,
        
        transition: (event, payload = null) => {
          const stateTransitions = transitions[currentState];
          
          if (stateTransitions && stateTransitions[event]) {
            const transition = stateTransitions[event];
            
            if (typeof transition === 'function') {
              const newState = transition(payload);
              if (newState) {
                currentState = newState;
                history.push(newState);
              }
            } else {
              currentState = transition;
              history.push(transition);
            }
            
            return true;
          }
          
          return false;
        },
        
        canTransition: (event) => {
          const stateTransitions = transitions[currentState];
          return stateTransitions && stateTransitions.hasOwnProperty(event);
        },
        
        getHistory: () => [...history],
        
        reset: () => {
          currentState = initialState;
          history.length = 0;
          history.push(initialState);
        }
      };
    };

    const orderStateMachine = createStateMachine('pending', {
      pending: {
        confirm: 'confirmed',
        cancel: 'cancelled'
      },
      confirmed: {
        ship: 'shipped',
        cancel: 'cancelled'
      },
      shipped: {
        deliver: 'delivered'
      },
      delivered: {},
      cancelled: {}
    });

    expect(orderStateMachine.getCurrentState()).toBe('pending');
    expect(orderStateMachine.canTransition('confirm')).toBe(true);
    
    orderStateMachine.transition('confirm');
    expect(orderStateMachine.getCurrentState()).toBe('confirmed');
    
    orderStateMachine.transition('ship');
    expect(orderStateMachine.getCurrentState()).toBe('shipped');
    
    expect(orderStateMachine.getHistory()).toEqual(['pending', 'confirmed', 'shipped']);
  });

  test('should handle workflow with dependencies', () => {
    const createDependencyWorkflow = () => {
      const tasks = new Map();
      const completed = new Set();
      
      return {
        addTask: (name, fn, dependencies = []) => {
          tasks.set(name, { fn, dependencies });
          return this;
        },
        
        execute: async () => {
          const results = new Map();
          
          const executeTask = async (taskName) => {
            if (completed.has(taskName)) {
              return results.get(taskName);
            }
            
            const task = tasks.get(taskName);
            if (!task) {
              throw new Error(`Task ${taskName} not found`);
            }
            
            // Execute dependencies first
            for (const dep of task.dependencies) {
              await executeTask(dep);
            }
            
            // Execute the task
            const result = await task.fn();
            results.set(taskName, result);
            completed.add(taskName);
            
            return result;
          };
          
          // Execute all tasks
          for (const taskName of tasks.keys()) {
            await executeTask(taskName);
          }
          
          return Object.fromEntries(results);
        }
      };
    };

    const workflow = createDependencyWorkflow();
    
    workflow
      .addTask('database', () => Promise.resolve('db connected'))
      .addTask('cache', () => Promise.resolve('cache ready'))
      .addTask('server', () => Promise.resolve('server started'), ['database', 'cache'])
      .addTask('routes', () => Promise.resolve('routes loaded'), ['server']);

    return workflow.execute().then(results => {
      expect(results.database).toBe('db connected');
      expect(results.cache).toBe('cache ready');
      expect(results.server).toBe('server started');
      expect(results.routes).toBe('routes loaded');
    });
  });
});
