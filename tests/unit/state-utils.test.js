/**
 * State Management Utilities Unit Tests
 */

describe('State Management Utilities', () => {
  test('should handle simple state management', () => {
    const createState = (initialState = {}) => {
      let state = { ...initialState };
      const listeners = [];
      
      return {
        get: (key) => key ? state[key] : state,
        set: (key, value) => {
          const oldValue = state[key];
          state[key] = value;
          listeners.forEach(listener => listener(key, value, oldValue));
        },
        update: (updates) => {
          Object.entries(updates).forEach(([key, value]) => {
            this.set(key, value);
          });
        },
        subscribe: (listener) => {
          listeners.push(listener);
          return () => {
            const index = listeners.indexOf(listener);
            if (index > -1) listeners.splice(index, 1);
          };
        }
      };
    };

    const state = createState({ count: 0 });
    expect(state.get('count')).toBe(0);
    
    state.set('count', 5);
    expect(state.get('count')).toBe(5);
  });

  test('should handle state immutability', () => {
    const createImmutableState = (initialState = {}) => {
      let state = { ...initialState };
      
      return {
        get: () => ({ ...state }),
        set: (updates) => {
          state = { ...state, ...updates };
          return state;
        },
        reset: () => {
          state = { ...initialState };
          return state;
        }
      };
    };

    const state = createImmutableState({ name: 'test', count: 0 });
    const current = state.get();
    
    expect(current).toEqual({ name: 'test', count: 0 });
    
    const updated = state.set({ count: 5 });
    expect(updated.count).toBe(5);
    expect(current.count).toBe(0); // Original unchanged
  });

  test('should handle state history', () => {
    const createHistoryState = (initialState = {}) => {
      const history = [{ ...initialState }];
      let currentIndex = 0;
      
      return {
        get: () => ({ ...history[currentIndex] }),
        set: (updates) => {
          const newState = { ...history[currentIndex], ...updates };
          history.splice(currentIndex + 1); // Remove future history
          history.push(newState);
          currentIndex = history.length - 1;
          return newState;
        },
        undo: () => {
          if (currentIndex > 0) {
            currentIndex--;
            return { ...history[currentIndex] };
          }
          return null;
        },
        redo: () => {
          if (currentIndex < history.length - 1) {
            currentIndex++;
            return { ...history[currentIndex] };
          }
          return null;
        },
        canUndo: () => currentIndex > 0,
        canRedo: () => currentIndex < history.length - 1
      };
    };

    const state = createHistoryState({ value: 1 });
    state.set({ value: 2 });
    state.set({ value: 3 });
    
    expect(state.get().value).toBe(3);
    expect(state.canUndo()).toBe(true);
    
    const undone = state.undo();
    expect(undone.value).toBe(2);
    
    const redone = state.redo();
    expect(redone.value).toBe(3);
  });

  test('should handle computed state', () => {
    const createComputedState = (initialState = {}) => {
      let state = { ...initialState };
      const computed = {};
      
      return {
        get: (key) => {
          if (computed[key]) {
            return computed[key](state);
          }
          return state[key];
        },
        set: (key, value) => {
          state[key] = value;
        },
        computed: (key, fn) => {
          computed[key] = fn;
        }
      };
    };

    const state = createComputedState({ firstName: 'John', lastName: 'Doe' });
    
    state.computed('fullName', (s) => `${s.firstName} ${s.lastName}`);
    state.computed('initials', (s) => `${s.firstName[0]}${s.lastName[0]}`);
    
    expect(state.get('fullName')).toBe('John Doe');
    expect(state.get('initials')).toBe('JD');
    
    state.set('firstName', 'Jane');
    expect(state.get('fullName')).toBe('Jane Doe');
  });

  test('should handle state validation', () => {
    const createValidatedState = (initialState = {}, validators = {}) => {
      let state = { ...initialState };
      
      return {
        get: (key) => key ? state[key] : state,
        set: (key, value) => {
          if (validators[key]) {
            const isValid = validators[key](value);
            if (!isValid) {
              throw new Error(`Invalid value for ${key}: ${value}`);
            }
          }
          state[key] = value;
          return state[key];
        },
        validate: () => {
          const errors = [];
          Object.entries(validators).forEach(([key, validator]) => {
            if (state[key] !== undefined && !validator(state[key])) {
              errors.push(`Invalid ${key}: ${state[key]}`);
            }
          });
          return errors;
        }
      };
    };

    const validators = {
      age: (value) => typeof value === 'number' && value >= 0 && value <= 150,
      email: (value) => typeof value === 'string' && value.includes('@')
    };

    const state = createValidatedState({ age: 25 }, validators);
    
    expect(state.set('age', 30)).toBe(30);
    expect(() => state.set('age', -5)).toThrow('Invalid value for age: -5');
    expect(() => state.set('email', 'invalid')).toThrow('Invalid value for email: invalid');
  });
});
