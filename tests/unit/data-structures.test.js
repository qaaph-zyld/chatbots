/**
 * Data Structures Unit Tests
 */

describe('Data Structures', () => {
  test('should handle stack implementation', () => {
    const createStack = () => {
      const items = [];
      
      return {
        push: (item) => items.push(item),
        pop: () => items.pop(),
        peek: () => items[items.length - 1],
        isEmpty: () => items.length === 0,
        size: () => items.length,
        toArray: () => [...items]
      };
    };

    const stack = createStack();
    
    stack.push(1);
    stack.push(2);
    stack.push(3);
    
    expect(stack.size()).toBe(3);
    expect(stack.peek()).toBe(3);
    expect(stack.pop()).toBe(3);
    expect(stack.size()).toBe(2);
  });

  test('should handle linked list implementation', () => {
    const createLinkedList = () => {
      let head = null;
      let size = 0;
      
      const Node = (data) => ({ data, next: null });
      
      return {
        append: (data) => {
          const newNode = Node(data);
          if (!head) {
            head = newNode;
          } else {
            let current = head;
            while (current.next) {
              current = current.next;
            }
            current.next = newNode;
          }
          size++;
        },
        prepend: (data) => {
          const newNode = Node(data);
          newNode.next = head;
          head = newNode;
          size++;
        },
        find: (data) => {
          let current = head;
          while (current) {
            if (current.data === data) return current;
            current = current.next;
          }
          return null;
        },
        remove: (data) => {
          if (!head) return false;
          
          if (head.data === data) {
            head = head.next;
            size--;
            return true;
          }
          
          let current = head;
          while (current.next && current.next.data !== data) {
            current = current.next;
          }
          
          if (current.next) {
            current.next = current.next.next;
            size--;
            return true;
          }
          
          return false;
        },
        size: () => size,
        toArray: () => {
          const result = [];
          let current = head;
          while (current) {
            result.push(current.data);
            current = current.next;
          }
          return result;
        }
      };
    };

    const list = createLinkedList();
    
    list.append(1);
    list.append(2);
    list.prepend(0);
    
    expect(list.toArray()).toEqual([0, 1, 2]);
    expect(list.find(1)).toBeTruthy();
    expect(list.remove(1)).toBe(true);
    expect(list.toArray()).toEqual([0, 2]);
  });

  test('should handle binary tree implementation', () => {
    const createBinaryTree = () => {
      let root = null;
      
      const Node = (data) => ({
        data,
        left: null,
        right: null
      });
      
      return {
        insert: (data) => {
          const newNode = Node(data);
          
          if (!root) {
            root = newNode;
            return;
          }
          
          const insertNode = (node, newNode) => {
            if (newNode.data < node.data) {
              if (!node.left) {
                node.left = newNode;
              } else {
                insertNode(node.left, newNode);
              }
            } else {
              if (!node.right) {
                node.right = newNode;
              } else {
                insertNode(node.right, newNode);
              }
            }
          };
          
          insertNode(root, newNode);
        },
        search: (data) => {
          const searchNode = (node, data) => {
            if (!node) return null;
            if (data === node.data) return node;
            if (data < node.data) return searchNode(node.left, data);
            return searchNode(node.right, data);
          };
          
          return searchNode(root, data);
        },
        inOrder: () => {
          const result = [];
          
          const traverse = (node) => {
            if (node) {
              traverse(node.left);
              result.push(node.data);
              traverse(node.right);
            }
          };
          
          traverse(root);
          return result;
        }
      };
    };

    const tree = createBinaryTree();
    
    tree.insert(5);
    tree.insert(3);
    tree.insert(7);
    tree.insert(1);
    tree.insert(9);
    
    expect(tree.search(3)).toBeTruthy();
    expect(tree.search(4)).toBe(null);
    expect(tree.inOrder()).toEqual([1, 3, 5, 7, 9]);
  });

  test('should handle hash table implementation', () => {
    const createHashTable = (size = 10) => {
      const buckets = new Array(size).fill(null).map(() => []);
      
      const hash = (key) => {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
          hash += key.charCodeAt(i);
        }
        return hash % size;
      };
      
      return {
        set: (key, value) => {
          const index = hash(key);
          const bucket = buckets[index];
          const existingPair = bucket.find(pair => pair[0] === key);
          
          if (existingPair) {
            existingPair[1] = value;
          } else {
            bucket.push([key, value]);
          }
        },
        get: (key) => {
          const index = hash(key);
          const bucket = buckets[index];
          const pair = bucket.find(pair => pair[0] === key);
          return pair ? pair[1] : undefined;
        },
        has: (key) => {
          const index = hash(key);
          const bucket = buckets[index];
          return bucket.some(pair => pair[0] === key);
        },
        delete: (key) => {
          const index = hash(key);
          const bucket = buckets[index];
          const pairIndex = bucket.findIndex(pair => pair[0] === key);
          
          if (pairIndex !== -1) {
            bucket.splice(pairIndex, 1);
            return true;
          }
          return false;
        },
        keys: () => {
          const keys = [];
          buckets.forEach(bucket => {
            bucket.forEach(pair => keys.push(pair[0]));
          });
          return keys;
        }
      };
    };

    const hashTable = createHashTable(5);
    
    hashTable.set('name', 'John');
    hashTable.set('age', 30);
    hashTable.set('city', 'New York');
    
    expect(hashTable.get('name')).toBe('John');
    expect(hashTable.has('age')).toBe(true);
    expect(hashTable.delete('city')).toBe(true);
    expect(hashTable.has('city')).toBe(false);
  });

  test('should handle graph implementation', () => {
    const createGraph = () => {
      const adjacencyList = new Map();
      
      return {
        addVertex: (vertex) => {
          if (!adjacencyList.has(vertex)) {
            adjacencyList.set(vertex, []);
          }
        },
        addEdge: (vertex1, vertex2) => {
          if (adjacencyList.has(vertex1) && adjacencyList.has(vertex2)) {
            adjacencyList.get(vertex1).push(vertex2);
            adjacencyList.get(vertex2).push(vertex1);
          }
        },
        getVertices: () => Array.from(adjacencyList.keys()),
        getEdges: (vertex) => adjacencyList.get(vertex) || [],
        bfs: (startVertex) => {
          const visited = new Set();
          const queue = [startVertex];
          const result = [];
          
          while (queue.length > 0) {
            const vertex = queue.shift();
            
            if (!visited.has(vertex)) {
              visited.add(vertex);
              result.push(vertex);
              
              const neighbors = adjacencyList.get(vertex) || [];
              neighbors.forEach(neighbor => {
                if (!visited.has(neighbor)) {
                  queue.push(neighbor);
                }
              });
            }
          }
          
          return result;
        }
      };
    };

    const graph = createGraph();
    
    graph.addVertex('A');
    graph.addVertex('B');
    graph.addVertex('C');
    graph.addEdge('A', 'B');
    graph.addEdge('B', 'C');
    
    expect(graph.getVertices()).toContain('A');
    expect(graph.getEdges('A')).toContain('B');
    expect(graph.bfs('A')).toEqual(['A', 'B', 'C']);
  });
});
