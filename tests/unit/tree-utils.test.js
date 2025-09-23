/**
 * Tree Utilities Unit Tests
 */

describe('Tree Utilities', () => {
  test('should handle binary tree traversal', () => {
    const createNode = (value, left = null, right = null) => ({ value, left, right });
    
    const tree = createNode(1,
      createNode(2, createNode(4), createNode(5)),
      createNode(3, createNode(6), createNode(7))
    );

    const inOrderTraversal = (node, result = []) => {
      if (node) {
        inOrderTraversal(node.left, result);
        result.push(node.value);
        inOrderTraversal(node.right, result);
      }
      return result;
    };

    const preOrderTraversal = (node, result = []) => {
      if (node) {
        result.push(node.value);
        preOrderTraversal(node.left, result);
        preOrderTraversal(node.right, result);
      }
      return result;
    };

    const postOrderTraversal = (node, result = []) => {
      if (node) {
        postOrderTraversal(node.left, result);
        postOrderTraversal(node.right, result);
        result.push(node.value);
      }
      return result;
    };

    expect(inOrderTraversal(tree)).toEqual([4, 2, 5, 1, 6, 3, 7]);
    expect(preOrderTraversal(tree)).toEqual([1, 2, 4, 5, 3, 6, 7]);
    expect(postOrderTraversal(tree)).toEqual([4, 5, 2, 6, 7, 3, 1]);
  });

  test('should handle tree depth calculations', () => {
    const createNode = (value, left = null, right = null) => ({ value, left, right });
    
    const tree = createNode(1,
      createNode(2, createNode(4), null),
      createNode(3, null, createNode(5))
    );

    const maxDepth = (node) => {
      if (!node) return 0;
      return 1 + Math.max(maxDepth(node.left), maxDepth(node.right));
    };

    const minDepth = (node) => {
      if (!node) return 0;
      if (!node.left && !node.right) return 1;
      if (!node.left) return 1 + minDepth(node.right);
      if (!node.right) return 1 + minDepth(node.left);
      return 1 + Math.min(minDepth(node.left), minDepth(node.right));
    };

    expect(maxDepth(tree)).toBe(3);
    expect(minDepth(tree)).toBe(2);
  });

  test('should handle tree search operations', () => {
    const createNode = (value, left = null, right = null) => ({ value, left, right });
    
    const tree = createNode(10,
      createNode(5, createNode(3), createNode(7)),
      createNode(15, createNode(12), createNode(18))
    );

    const searchBST = (node, target) => {
      if (!node) return null;
      if (node.value === target) return node;
      if (target < node.value) return searchBST(node.left, target);
      return searchBST(node.right, target);
    };

    const findPath = (node, target, path = []) => {
      if (!node) return null;
      
      path.push(node.value);
      
      if (node.value === target) return [...path];
      
      const leftPath = findPath(node.left, target, path);
      if (leftPath) return leftPath;
      
      const rightPath = findPath(node.right, target, path);
      if (rightPath) return rightPath;
      
      path.pop();
      return null;
    };

    expect(searchBST(tree, 7).value).toBe(7);
    expect(searchBST(tree, 20)).toBe(null);
    expect(findPath(tree, 7)).toEqual([10, 5, 7]);
  });

  test('should handle tree insertion and deletion', () => {
    const createNode = (value, left = null, right = null) => ({ value, left, right });

    const insertBST = (node, value) => {
      if (!node) return createNode(value);
      
      if (value < node.value) {
        node.left = insertBST(node.left, value);
      } else if (value > node.value) {
        node.right = insertBST(node.right, value);
      }
      
      return node;
    };

    const findMin = (node) => {
      while (node.left) {
        node = node.left;
      }
      return node;
    };

    const deleteBST = (node, value) => {
      if (!node) return null;
      
      if (value < node.value) {
        node.left = deleteBST(node.left, value);
      } else if (value > node.value) {
        node.right = deleteBST(node.right, value);
      } else {
        // Node to delete found
        if (!node.left) return node.right;
        if (!node.right) return node.left;
        
        // Node has two children
        const minRight = findMin(node.right);
        node.value = minRight.value;
        node.right = deleteBST(node.right, minRight.value);
      }
      
      return node;
    };

    let tree = createNode(10);
    tree = insertBST(tree, 5);
    tree = insertBST(tree, 15);
    tree = insertBST(tree, 3);
    tree = insertBST(tree, 7);

    expect(tree.left.value).toBe(5);
    expect(tree.right.value).toBe(15);
    expect(tree.left.left.value).toBe(3);
    expect(tree.left.right.value).toBe(7);

    tree = deleteBST(tree, 5);
    expect(tree.left.value).toBe(7); // 7 replaces 5
  });

  test('should handle tree validation', () => {
    const createNode = (value, left = null, right = null) => ({ value, left, right });

    const isValidBST = (node, min = -Infinity, max = Infinity) => {
      if (!node) return true;
      
      if (node.value <= min || node.value >= max) return false;
      
      return isValidBST(node.left, min, node.value) && 
             isValidBST(node.right, node.value, max);
    };

    const isBalanced = (node) => {
      const checkBalance = (node) => {
        if (!node) return { balanced: true, height: 0 };
        
        const left = checkBalance(node.left);
        const right = checkBalance(node.right);
        
        const balanced = left.balanced && right.balanced && 
                        Math.abs(left.height - right.height) <= 1;
        
        return {
          balanced,
          height: 1 + Math.max(left.height, right.height)
        };
      };
      
      return checkBalance(node).balanced;
    };

    const validBST = createNode(10,
      createNode(5, createNode(3), createNode(7)),
      createNode(15, createNode(12), createNode(18))
    );

    const invalidBST = createNode(10,
      createNode(5, createNode(3), createNode(12)), // 12 > 10, invalid
      createNode(15)
    );

    expect(isValidBST(validBST)).toBe(true);
    expect(isValidBST(invalidBST)).toBe(false);
    expect(isBalanced(validBST)).toBe(true);
  });

  test('should handle tree serialization', () => {
    const createNode = (value, left = null, right = null) => ({ value, left, right });

    const serialize = (node) => {
      if (!node) return 'null';
      return `${node.value},${serialize(node.left)},${serialize(node.right)}`;
    };

    const deserialize = (data) => {
      const values = data.split(',');
      let index = 0;
      
      const buildTree = () => {
        if (index >= values.length || values[index] === 'null') {
          index++;
          return null;
        }
        
        const node = createNode(parseInt(values[index]));
        index++;
        node.left = buildTree();
        node.right = buildTree();
        return node;
      };
      
      return buildTree();
    };

    const tree = createNode(1,
      createNode(2, createNode(4), createNode(5)),
      createNode(3)
    );

    const serialized = serialize(tree);
    const deserialized = deserialize(serialized);

    expect(deserialized.value).toBe(1);
    expect(deserialized.left.value).toBe(2);
    expect(deserialized.right.value).toBe(3);
    expect(deserialized.left.left.value).toBe(4);
  });

  test('should handle tree level operations', () => {
    const createNode = (value, left = null, right = null) => ({ value, left, right });

    const tree = createNode(1,
      createNode(2, createNode(4), createNode(5)),
      createNode(3, null, createNode(6))
    );

    const levelOrder = (node) => {
      if (!node) return [];
      
      const result = [];
      const queue = [node];
      
      while (queue.length > 0) {
        const current = queue.shift();
        result.push(current.value);
        
        if (current.left) queue.push(current.left);
        if (current.right) queue.push(current.right);
      }
      
      return result;
    };

    const levelOrderGrouped = (node) => {
      if (!node) return [];
      
      const result = [];
      let currentLevel = [node];
      
      while (currentLevel.length > 0) {
        const levelValues = [];
        const nextLevel = [];
        
        for (const node of currentLevel) {
          levelValues.push(node.value);
          if (node.left) nextLevel.push(node.left);
          if (node.right) nextLevel.push(node.right);
        }
        
        result.push(levelValues);
        currentLevel = nextLevel;
      }
      
      return result;
    };

    expect(levelOrder(tree)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(levelOrderGrouped(tree)).toEqual([[1], [2, 3], [4, 5, 6]]);
  });
});
