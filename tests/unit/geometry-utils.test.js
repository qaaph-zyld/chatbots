/**
 * Geometry Utilities Unit Tests
 */

describe('Geometry Utilities', () => {
  test('should handle point operations', () => {
    const createPoint = (x, y) => ({ x, y });
    
    const distance = (p1, p2) => {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      return Math.sqrt(dx * dx + dy * dy);
    };
    
    const midpoint = (p1, p2) => ({
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    });
    
    const p1 = createPoint(0, 0);
    const p2 = createPoint(3, 4);
    
    expect(distance(p1, p2)).toBe(5);
    expect(midpoint(p1, p2)).toEqual({ x: 1.5, y: 2 });
  });

  test('should handle circle operations', () => {
    const createCircle = (centerX, centerY, radius) => ({
      center: { x: centerX, y: centerY },
      radius
    });
    
    const circleArea = (circle) => Math.PI * circle.radius * circle.radius;
    const circleCircumference = (circle) => 2 * Math.PI * circle.radius;
    
    const pointInCircle = (point, circle) => {
      const dx = point.x - circle.center.x;
      const dy = point.y - circle.center.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= circle.radius;
    };
    
    const circle = createCircle(0, 0, 5);
    
    expect(circleArea(circle)).toBeCloseTo(78.54, 2);
    expect(circleCircumference(circle)).toBeCloseTo(31.42, 2);
    expect(pointInCircle({ x: 3, y: 4 }, circle)).toBe(true);
    expect(pointInCircle({ x: 6, y: 0 }, circle)).toBe(false);
  });

  test('should handle rectangle operations', () => {
    const createRectangle = (x, y, width, height) => ({ x, y, width, height });
    
    const rectangleArea = (rect) => rect.width * rect.height;
    const rectanglePerimeter = (rect) => 2 * (rect.width + rect.height);
    
    const pointInRectangle = (point, rect) => {
      return point.x >= rect.x && 
             point.x <= rect.x + rect.width &&
             point.y >= rect.y && 
             point.y <= rect.y + rect.height;
    };
    
    const rectanglesIntersect = (rect1, rect2) => {
      return rect1.x < rect2.x + rect2.width &&
             rect1.x + rect1.width > rect2.x &&
             rect1.y < rect2.y + rect2.height &&
             rect1.y + rect1.height > rect2.y;
    };
    
    const rect = createRectangle(0, 0, 10, 5);
    
    expect(rectangleArea(rect)).toBe(50);
    expect(rectanglePerimeter(rect)).toBe(30);
    expect(pointInRectangle({ x: 5, y: 2 }, rect)).toBe(true);
    expect(pointInRectangle({ x: 15, y: 2 }, rect)).toBe(false);
    
    const rect2 = createRectangle(5, 2, 8, 6);
    expect(rectanglesIntersect(rect, rect2)).toBe(true);
  });

  test('should handle triangle operations', () => {
    const createTriangle = (p1, p2, p3) => ({ p1, p2, p3 });
    
    const triangleArea = (triangle) => {
      const { p1, p2, p3 } = triangle;
      return Math.abs((p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2);
    };
    
    const trianglePerimeter = (triangle) => {
      const { p1, p2, p3 } = triangle;
      const distance = (pa, pb) => Math.sqrt((pb.x - pa.x) ** 2 + (pb.y - pa.y) ** 2);
      return distance(p1, p2) + distance(p2, p3) + distance(p3, p1);
    };
    
    const pointInTriangle = (point, triangle) => {
      const { p1, p2, p3 } = triangle;
      
      const sign = (pa, pb, pc) => (pa.x - pc.x) * (pb.y - pc.y) - (pb.x - pc.x) * (pa.y - pc.y);
      
      const d1 = sign(point, p1, p2);
      const d2 = sign(point, p2, p3);
      const d3 = sign(point, p3, p1);
      
      const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
      const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
      
      return !(hasNeg && hasPos);
    };
    
    const triangle = createTriangle(
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 2, y: 3 }
    );
    
    expect(triangleArea(triangle)).toBe(6);
    expect(trianglePerimeter(triangle)).toBeCloseTo(10.47, 2);
    expect(pointInTriangle({ x: 2, y: 1 }, triangle)).toBe(true);
    expect(pointInTriangle({ x: 5, y: 1 }, triangle)).toBe(false);
  });

  test('should handle line operations', () => {
    const createLine = (p1, p2) => ({ p1, p2 });
    
    const lineLength = (line) => {
      const dx = line.p2.x - line.p1.x;
      const dy = line.p2.y - line.p1.y;
      return Math.sqrt(dx * dx + dy * dy);
    };
    
    const lineSlope = (line) => {
      const dx = line.p2.x - line.p1.x;
      const dy = line.p2.y - line.p1.y;
      return dx === 0 ? Infinity : dy / dx;
    };
    
    const linesIntersect = (line1, line2) => {
      const { p1: a, p2: b } = line1;
      const { p1: c, p2: d } = line2;
      
      const denominator = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x);
      
      if (denominator === 0) return null; // Parallel lines
      
      const t = ((a.x - c.x) * (c.y - d.y) - (a.y - c.y) * (c.x - d.x)) / denominator;
      const u = -((a.x - b.x) * (a.y - c.y) - (a.y - b.y) * (a.x - c.x)) / denominator;
      
      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return {
          x: a.x + t * (b.x - a.x),
          y: a.y + t * (b.y - a.y)
        };
      }
      
      return null;
    };
    
    const line1 = createLine({ x: 0, y: 0 }, { x: 4, y: 0 });
    const line2 = createLine({ x: 2, y: -2 }, { x: 2, y: 2 });
    
    expect(lineLength(line1)).toBe(4);
    expect(lineSlope(line1)).toBe(0);
    expect(lineSlope(line2)).toBe(Infinity);
    
    const intersection = linesIntersect(line1, line2);
    expect(intersection).toEqual({ x: 2, y: 0 });
  });

  test('should handle polygon operations', () => {
    const createPolygon = (points) => ({ points });
    
    const polygonArea = (polygon) => {
      const points = polygon.points;
      let area = 0;
      
      for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
      }
      
      return Math.abs(area) / 2;
    };
    
    const polygonPerimeter = (polygon) => {
      const points = polygon.points;
      let perimeter = 0;
      
      for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        const dx = points[j].x - points[i].x;
        const dy = points[j].y - points[i].y;
        perimeter += Math.sqrt(dx * dx + dy * dy);
      }
      
      return perimeter;
    };
    
    const pointInPolygon = (point, polygon) => {
      const points = polygon.points;
      let inside = false;
      
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        if (((points[i].y > point.y) !== (points[j].y > point.y)) &&
            (point.x < (points[j].x - points[i].x) * (point.y - points[i].y) / (points[j].y - points[i].y) + points[i].x)) {
          inside = !inside;
        }
      }
      
      return inside;
    };
    
    // Square polygon
    const square = createPolygon([
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 }
    ]);
    
    expect(polygonArea(square)).toBe(16);
    expect(polygonPerimeter(square)).toBe(16);
    expect(pointInPolygon({ x: 2, y: 2 }, square)).toBe(true);
    expect(pointInPolygon({ x: 5, y: 2 }, square)).toBe(false);
  });

  test('should handle angle operations', () => {
    const degreesToRadians = (degrees) => degrees * (Math.PI / 180);
    const radiansToDegrees = (radians) => radians * (180 / Math.PI);
    
    const angleBetweenPoints = (p1, p2, p3) => {
      const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
      const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
      
      const dot = v1.x * v2.x + v1.y * v2.y;
      const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
      const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
      
      const cosAngle = dot / (mag1 * mag2);
      return Math.acos(Math.max(-1, Math.min(1, cosAngle)));
    };
    
    const rotatePoint = (point, center, angle) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      
      return {
        x: center.x + dx * cos - dy * sin,
        y: center.y + dx * sin + dy * cos
      };
    };
    
    expect(degreesToRadians(180)).toBeCloseTo(Math.PI, 5);
    expect(radiansToDegrees(Math.PI)).toBeCloseTo(180, 5);
    
    const angle = angleBetweenPoints(
      { x: 1, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 1 }
    );
    expect(radiansToDegrees(angle)).toBeCloseTo(90, 5);
    
    const rotated = rotatePoint({ x: 1, y: 0 }, { x: 0, y: 0 }, Math.PI / 2);
    expect(rotated.x).toBeCloseTo(0, 5);
    expect(rotated.y).toBeCloseTo(1, 5);
  });
});
