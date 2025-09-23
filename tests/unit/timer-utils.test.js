/**
 * Timer Utilities Unit Tests
 */

describe('Timer Utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should handle setTimeout', () => {
    const callback = jest.fn();
    setTimeout(callback, 1000);
    
    expect(callback).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalled();
  });

  test('should handle setInterval', () => {
    const callback = jest.fn();
    setInterval(callback, 500);
    
    expect(callback).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);
    
    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  test('should handle clearTimeout', () => {
    const callback = jest.fn();
    const timeoutId = setTimeout(callback, 1000);
    
    clearTimeout(timeoutId);
    jest.advanceTimersByTime(1000);
    
    expect(callback).not.toHaveBeenCalled();
  });

  test('should handle clearInterval', () => {
    const callback = jest.fn();
    const intervalId = setInterval(callback, 500);
    
    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);
    
    clearInterval(intervalId);
    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('should handle multiple timers', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    
    setTimeout(callback1, 100);
    setTimeout(callback2, 200);
    
    jest.advanceTimersByTime(100);
    expect(callback1).toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(100);
    expect(callback2).toHaveBeenCalled();
  });
});
