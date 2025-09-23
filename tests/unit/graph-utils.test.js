/**
 * Graph Utilities Unit Tests
 */

describe('Graph Utilities', () => {
  test('should handle adjacency list representation', () => {
    const createGraph = () => {
      const adjacencyList = new Map();
      
      return {
        addVertex: (vertex) => {
          if (!adjacencyList.has(vertex)) {
            adjacencyList.set(vertex, []);
          }
        },
        
        addEdge: (vertex1, vertex2, directed = false) => {
          if (!adjacencyList.has(vertex1)) this.addVertex(vertex1);
          if (!adjacencyList.has(vertex2)) this.addVertex(vertex2);
          
          adjacencyList.get(vertex1).push(vertex2);
          if (!directed) {
            adjacencyList.get(vertex2).push(vertex1);
          }
        },
        
        getVertices: () => Array.from(adjacencyList.keys()),
        getEdges: (vertex) => adjacencyList.get(vertex) || [],
        hasVertex: (vertex) => adjacencyList.has(vertex),
        hasEdge: (vertex1, vertex2) => {
          return adjacencyList.has(vertex1) && 
                 adjacencyList.get(vertex1).includes(vertex2);
        }
      };
    };

    const graph = createGraph();
    graph.addVertex('A');
    graph.addVertex('B');
    graph.addEdge('A', 'B');
    graph.addEdge('B', 'C'); // C will be auto-added

    expect(graph.hasVertex('A')).toBe(true);
    expect(graph.hasVertex('C')).toBe(true);
    expect(graph.hasEdge('A', 'B')).toBe(true);
    expect(graph.hasEdge('B', 'A')).toBe(true); // Undirected
    expect(graph.getVertices()).toContain('A');
    expect(graph.getEdges('A')).toContain('B');
  });

  test('should handle breadth-first search', () => {
    const bfs = (graph, startVertex) => {
      const visited = new Set();
      const queue = [startVertex];
      const result = [];
      
      while (queue.length > 0) {
        const vertex = queue.shift();
        
        if (!visited.has(vertex)) {
          visited.add(vertex);
          result.push(vertex);
          
          const neighbors = graph.getEdges(vertex);
          neighbors.forEach(neighbor => {
            if (!visited.has(neighbor)) {
              queue.push(neighbor);
            }
          });
        }
      }
      
      return result;
    };

    const createGraph = () => {
      const adjacencyList = new Map();
      return {
        addVertex: (vertex) => {
          if (!adjacencyList.has(vertex)) {
            adjacencyList.set(vertex, []);
          }
        },
        addEdge: (vertex1, vertex2) => {
          if (!adjacencyList.has(vertex1)) this.addVertex(vertex1);
          if (!adjacencyList.has(vertex2)) this.addVertex(vertex2);
          adjacencyList.get(vertex1).push(vertex2);
          adjacencyList.get(vertex2).push(vertex1);
        },
        getEdges: (vertex) => adjacencyList.get(vertex) || []
      };
    };

    const graph = createGraph();
    graph.addEdge('A', 'B');
    graph.addEdge('A', 'C');
    graph.addEdge('B', 'D');
    graph.addEdge('C', 'E');

    const result = bfs(graph, 'A');
    expect(result[0]).toBe('A');
    expect(result.includes('B')).toBe(true);
    expect(result.includes('C')).toBe(true);
    expect(result).toHaveLength(5);
  });

  test('should handle depth-first search', () => {
    const dfs = (graph, startVertex, visited = new Set(), result = []) => {
      visited.add(startVertex);
      result.push(startVertex);
      
      const neighbors = graph.getEdges(startVertex);
      neighbors.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          dfs(graph, neighbor, visited, result);
        }
      });
      
      return result;
    };

    const createGraph = () => {
      const adjacencyList = new Map();
      return {
        addVertex: (vertex) => {
          if (!adjacencyList.has(vertex)) {
            adjacencyList.set(vertex, []);
          }
        },
        addEdge: (vertex1, vertex2) => {
          if (!adjacencyList.has(vertex1)) this.addVertex(vertex1);
          if (!adjacencyList.has(vertex2)) this.addVertex(vertex2);
          adjacencyList.get(vertex1).push(vertex2);
          adjacencyList.get(vertex2).push(vertex1);
        },
        getEdges: (vertex) => adjacencyList.get(vertex) || []
      };
    };

    const graph = createGraph();
    graph.addEdge('A', 'B');
    graph.addEdge('A', 'C');
    graph.addEdge('B', 'D');
    graph.addEdge('C', 'E');

    const result = dfs(graph, 'A');
    expect(result[0]).toBe('A');
    expect(result).toHaveLength(5);
    expect(result.includes('D')).toBe(true);
    expect(result.includes('E')).toBe(true);
  });

  test('should handle shortest path finding', () => {
    const dijkstra = (graph, startVertex) => {
      const distances = new Map();
      const previous = new Map();
      const unvisited = new Set();
      
      // Initialize distances
      graph.getVertices().forEach(vertex => {
        distances.set(vertex, vertex === startVertex ? 0 : Infinity);
        unvisited.add(vertex);
      });
      
      while (unvisited.size > 0) {
        // Find unvisited vertex with minimum distance
        let currentVertex = null;
        let minDistance = Infinity;
        
        unvisited.forEach(vertex => {
          if (distances.get(vertex) < minDistance) {
            minDistance = distances.get(vertex);
            currentVertex = vertex;
          }
        });
        
        if (currentVertex === null) break;
        unvisited.delete(currentVertex);
        
        // Update distances to neighbors
        const neighbors = graph.getEdges(currentVertex);
        neighbors.forEach(neighbor => {
          if (unvisited.has(neighbor)) {
            const weight = graph.getWeight ? graph.getWeight(currentVertex, neighbor) : 1;
            const newDistance = distances.get(currentVertex) + weight;
            
            if (newDistance < distances.get(neighbor)) {
              distances.set(neighbor, newDistance);
              previous.set(neighbor, currentVertex);
            }
          }
        });
      }
      
      return { distances, previous };
    };

    const createWeightedGraph = () => {
      const adjacencyList = new Map();
      const weights = new Map();
      
      return {
        addVertex: (vertex) => {
          if (!adjacencyList.has(vertex)) {
            adjacencyList.set(vertex, []);
          }
        },
        addEdge: (vertex1, vertex2, weight = 1) => {
          if (!adjacencyList.has(vertex1)) this.addVertex(vertex1);
          if (!adjacencyList.has(vertex2)) this.addVertex(vertex2);
          
          adjacencyList.get(vertex1).push(vertex2);
          adjacencyList.get(vertex2).push(vertex1);
          weights.set(`${vertex1}-${vertex2}`, weight);
          weights.set(`${vertex2}-${vertex1}`, weight);
        },
        getVertices: () => Array.from(adjacencyList.keys()),
        getEdges: (vertex) => adjacencyList.get(vertex) || [],
        getWeight: (vertex1, vertex2) => weights.get(`${vertex1}-${vertex2}`) || 1
      };
    };

    const graph = createWeightedGraph();
    graph.addEdge('A', 'B', 4);
    graph.addEdge('A', 'C', 2);
    graph.addEdge('B', 'D', 3);
    graph.addEdge('C', 'D', 1);

    const { distances } = dijkstra(graph, 'A');
    expect(distances.get('A')).toBe(0);
    expect(distances.get('C')).toBe(2);
    expect(distances.get('D')).toBe(3); // A->C->D is shorter than A->B->D
  });

  test('should handle cycle detection', () => {
    const hasCycle = (graph) => {
      const visited = new Set();
      const recursionStack = new Set();
      
      const dfsHasCycle = (vertex) => {
        visited.add(vertex);
        recursionStack.add(vertex);
        
        const neighbors = graph.getEdges(vertex);
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            if (dfsHasCycle(neighbor)) return true;
          } else if (recursionStack.has(neighbor)) {
            return true;
          }
        }
        
        recursionStack.delete(vertex);
        return false;
      };
      
      for (const vertex of graph.getVertices()) {
        if (!visited.has(vertex)) {
          if (dfsHasCycle(vertex)) return true;
        }
      }
      
      return false;
    };

    const createDirectedGraph = () => {
      const adjacencyList = new Map();
      return {
        addVertex: (vertex) => {
          if (!adjacencyList.has(vertex)) {
            adjacencyList.set(vertex, []);
          }
        },
        addEdge: (vertex1, vertex2) => {
          if (!adjacencyList.has(vertex1)) this.addVertex(vertex1);
          if (!adjacencyList.has(vertex2)) this.addVertex(vertex2);
          adjacencyList.get(vertex1).push(vertex2);
        },
        getVertices: () => Array.from(adjacencyList.keys()),
        getEdges: (vertex) => adjacencyList.get(vertex) || []
      };
    };

    const cyclicGraph = createDirectedGraph();
    cyclicGraph.addEdge('A', 'B');
    cyclicGraph.addEdge('B', 'C');
    cyclicGraph.addEdge('C', 'A'); // Creates cycle

    const acyclicGraph = createDirectedGraph();
    acyclicGraph.addEdge('A', 'B');
    acyclicGraph.addEdge('B', 'C');
    acyclicGraph.addEdge('A', 'C');

    expect(hasCycle(cyclicGraph)).toBe(true);
    expect(hasCycle(acyclicGraph)).toBe(false);
  });

  test('should handle topological sorting', () => {
    const topologicalSort = (graph) => {
      const visited = new Set();
      const stack = [];
      
      const dfs = (vertex) => {
        visited.add(vertex);
        
        const neighbors = graph.getEdges(vertex);
        neighbors.forEach(neighbor => {
          if (!visited.has(neighbor)) {
            dfs(neighbor);
          }
        });
        
        stack.push(vertex);
      };
      
      graph.getVertices().forEach(vertex => {
        if (!visited.has(vertex)) {
          dfs(vertex);
        }
      });
      
      return stack.reverse();
    };

    const createDirectedGraph = () => {
      const adjacencyList = new Map();
      return {
        addVertex: (vertex) => {
          if (!adjacencyList.has(vertex)) {
            adjacencyList.set(vertex, []);
          }
        },
        addEdge: (vertex1, vertex2) => {
          if (!adjacencyList.has(vertex1)) this.addVertex(vertex1);
          if (!adjacencyList.has(vertex2)) this.addVertex(vertex2);
          adjacencyList.get(vertex1).push(vertex2);
        },
        getVertices: () => Array.from(adjacencyList.keys()),
        getEdges: (vertex) => adjacencyList.get(vertex) || []
      };
    };

    const graph = createDirectedGraph();
    graph.addEdge('A', 'C');
    graph.addEdge('B', 'C');
    graph.addEdge('B', 'D');
    graph.addEdge('C', 'E');
    graph.addEdge('D', 'F');
    graph.addEdge('E', 'F');

    const sorted = topologicalSort(graph);
    const aIndex = sorted.indexOf('A');
    const cIndex = sorted.indexOf('C');
    const eIndex = sorted.indexOf('E');
    const fIndex = sorted.indexOf('F');

    expect(aIndex).toBeLessThan(cIndex);
    expect(cIndex).toBeLessThan(eIndex);
    expect(eIndex).toBeLessThan(fIndex);
  });

  test('should handle connected components', () => {
    const findConnectedComponents = (graph) => {
      const visited = new Set();
      const components = [];
      
      const dfs = (vertex, component) => {
        visited.add(vertex);
        component.push(vertex);
        
        const neighbors = graph.getEdges(vertex);
        neighbors.forEach(neighbor => {
          if (!visited.has(neighbor)) {
            dfs(neighbor, component);
          }
        });
      };
      
      graph.getVertices().forEach(vertex => {
        if (!visited.has(vertex)) {
          const component = [];
          dfs(vertex, component);
          components.push(component);
        }
      });
      
      return components;
    };

    const createGraph = () => {
      const adjacencyList = new Map();
      return {
        addVertex: (vertex) => {
          if (!adjacencyList.has(vertex)) {
            adjacencyList.set(vertex, []);
          }
        },
        addEdge: (vertex1, vertex2) => {
          if (!adjacencyList.has(vertex1)) this.addVertex(vertex1);
          if (!adjacencyList.has(vertex2)) this.addVertex(vertex2);
          adjacencyList.get(vertex1).push(vertex2);
          adjacencyList.get(vertex2).push(vertex1);
        },
        getVertices: () => Array.from(adjacencyList.keys()),
        getEdges: (vertex) => adjacencyList.get(vertex) || []
      };
    };

    const graph = createGraph();
    // Component 1
    graph.addEdge('A', 'B');
    graph.addEdge('B', 'C');
    // Component 2
    graph.addEdge('D', 'E');
    // Isolated vertex
    graph.addVertex('F');

    const components = findConnectedComponents(graph);
    expect(components).toHaveLength(3);
    expect(components.some(comp => comp.includes('A') && comp.includes('C'))).toBe(true);
    expect(components.some(comp => comp.includes('D') && comp.includes('E'))).toBe(true);
    expect(components.some(comp => comp.includes('F') && comp.length === 1)).toBe(true);
  });
});
