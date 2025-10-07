/**
 * Immutable Utilities Unit Tests
 */

describe('Immutable Utilities', () => {
  test('should handle immutable array operations', () => {
    const immutableArray = {
      append: (arr, item) => [...arr, item],
      prepend: (arr, item) => [item, ...arr],
      remove: (arr, index) => arr.filter((_, i) => i !== index),
      update: (arr, index, item) => arr.map((current, i) => i === index ? item : current),
      insert: (arr, index, item) => [...arr.slice(0, index), item, ...arr.slice(index)]
    };

    const original = [1, 2, 3];
    
    const appended = immutableArray.append(original, 4);
    expect(appended).toEqual([1, 2, 3, 4]);
    expect(original).toEqual([1, 2, 3]); // Original unchanged
    
    const prepended = immutableArray.prepend(original, 0);
    expect(prepended).toEqual([0, 1, 2, 3]);
    
    const removed = immutableArray.remove(original, 1);
    expect(removed).toEqual([1, 3]);
    
    const updated = immutableArray.update(original, 1, 'two');
    expect(updated).toEqual([1, 'two', 3]);
  });

  test('should handle immutable object operations', () => {
    const immutableObject = {
      set: (obj, key, value) => ({ ...obj, [key]: value }),
      delete: (obj, key) => {
        const { [key]: deleted, ...rest } = obj;
        return rest;
      },
      merge: (obj1, obj2) => ({ ...obj1, ...obj2 }),
      deepSet: (obj, path, value) => {
        const keys = path.split('.');
        if (keys.length === 1) {
          return { ...obj, [keys[0]]: value };
        }
        
        const [first, ...rest] = keys;
        return {
          ...obj,
          [first]: immutableObject.deepSet(obj[first] || {}, rest.join('.'), value)
        };
      },
      deepGet: (obj, path) => {
        return path.split('.').reduce((current, key) => current?.[key], obj);
      }
    };

    const original = { a: 1, b: 2, c: { d: 3 } };
    
    const updated = immutableObject.set(original, 'a', 10);
    expect(updated.a).toBe(10);
    expect(original.a).toBe(1); // Original unchanged
    
    const deleted = immutableObject.delete(original, 'b');
    expect(deleted).toEqual({ a: 1, c: { d: 3 } });
    
    const merged = immutableObject.merge(original, { e: 4 });
    expect(merged).toEqual({ a: 1, b: 2, c: { d: 3 }, e: 4 });
    
    const deepUpdated = immutableObject.deepSet(original, 'c.d', 30);
    expect(deepUpdated.c.d).toBe(30);
    expect(original.c.d).toBe(3); // Original unchanged
    
    expect(immutableObject.deepGet(original, 'c.d')).toBe(3);
  });

  test('should handle immutable list implementation', () => {
    const createImmutableList = (items = []) => {
      return {
        items: [...items],
        
        get: function(index) {
          return this.items[index];
        },
        
        size: function() {
          return this.items.length;
        },
        
        push: function(item) {
          return createImmutableList([...this.items, item]);
        },
        
        pop: function() {
          return createImmutableList(this.items.slice(0, -1));
        },
        
        map: function(fn) {
          return createImmutableList(this.items.map(fn));
        },
        
        filter: function(predicate) {
          return createImmutableList(this.items.filter(predicate));
        },
        
        toArray: function() {
          return [...this.items];
        }
      };
    };

    const list1 = createImmutableList([1, 2, 3]);
    const list2 = list1.push(4);
    const list3 = list2.map(x => x * 2);
    
    expect(list1.toArray()).toEqual([1, 2, 3]);
    expect(list2.toArray()).toEqual([1, 2, 3, 4]);
    expect(list3.toArray()).toEqual([2, 4, 6, 8]);
  });

  test('should handle immutable record implementation', () => {
    const createRecord = (schema, data = {}) => {
      const record = {};
      
      // Initialize with schema defaults
      Object.keys(schema).forEach(key => {
        record[key] = data[key] !== undefined ? data[key] : schema[key].default;
      });
      
      return {
        get: (key) => record[key],
        
        set: (key, value) => {
          if (!schema[key]) {
            throw new Error(`Unknown field: ${key}`);
          }
          
          const newData = { ...record, [key]: value };
          return createRecord(schema, newData);
        },
        
        merge: (updates) => {
          const newData = { ...record, ...updates };
          return createRecord(schema, newData);
        },
        
        toObject: () => ({ ...record })
      };
    };

    const PersonSchema = {
      name: { default: '' },
      age: { default: 0 },
      email: { default: '' }
    };

    const person1 = createRecord(PersonSchema, { name: 'John', age: 25 });
    const person2 = person1.set('age', 26);
    const person3 = person2.merge({ email: 'john@example.com' });
    
    expect(person1.get('age')).toBe(25);
    expect(person2.get('age')).toBe(26);
    expect(person3.toObject()).toEqual({
      name: 'John',
      age: 26,
      email: 'john@example.com'
    });
  });

  test('should handle immutable map implementation', () => {
    const createImmutableMap = (entries = []) => {
      const map = new Map(entries);
      
      return {
        get: (key) => map.get(key),
        
        has: (key) => map.has(key),
        
        set: (key, value) => {
          const newEntries = [...map.entries()];
          const existingIndex = newEntries.findIndex(([k]) => k === key);
          
          if (existingIndex >= 0) {
            newEntries[existingIndex] = [key, value];
          } else {
            newEntries.push([key, value]);
          }
          
          return createImmutableMap(newEntries);
        },
        
        delete: (key) => {
          const newEntries = [...map.entries()].filter(([k]) => k !== key);
          return createImmutableMap(newEntries);
        },
        
        size: () => map.size,
        
        keys: () => [...map.keys()],
        
        values: () => [...map.values()],
        
        entries: () => [...map.entries()]
      };
    };

    const map1 = createImmutableMap([['a', 1], ['b', 2]]);
    const map2 = map1.set('c', 3);
    const map3 = map2.delete('a');
    
    expect(map1.get('a')).toBe(1);
    expect(map1.size()).toBe(2);
    
    expect(map2.get('c')).toBe(3);
    expect(map2.size()).toBe(3);
    
    expect(map3.has('a')).toBe(false);
    expect(map3.size()).toBe(2);
  });

  test('should handle immutable tree operations', () => {
    const createNode = (value, children = []) => ({
      value,
      children: [...children]
    });

    const immutableTree = {
      addChild: (node, child) => ({
        ...node,
        children: [...node.children, child]
      }),
      
      updateValue: (node, newValue) => ({
        ...node,
        value: newValue
      }),
      
      mapValues: (node, fn) => ({
        ...node,
        value: fn(node.value),
        children: node.children.map(child => immutableTree.mapValues(child, fn))
      }),
      
      findNode: (node, predicate) => {
        if (predicate(node)) return node;
        
        for (const child of node.children) {
          const found = immutableTree.findNode(child, predicate);
          if (found) return found;
        }
        
        return null;
      }
    };

    const root = createNode('root', [
      createNode('child1'),
      createNode('child2')
    ]);

    const withNewChild = immutableTree.addChild(root, createNode('child3'));
    expect(withNewChild.children).toHaveLength(3);
    expect(root.children).toHaveLength(2); // Original unchanged

    const doubled = immutableTree.mapValues(root, value => value + '_doubled');
    expect(doubled.value).toBe('root_doubled');
    expect(doubled.children[0].value).toBe('child1_doubled');
  });
});
