/**
 * Audio Utilities Unit Tests
 */

describe('Audio Utilities', () => {
  test('should handle audio format calculations', () => {
    const calculateBitrate = (sampleRate, bitDepth, channels) => {
      return sampleRate * bitDepth * channels;
    };
    
    const calculateDuration = (fileSize, bitrate) => {
      return (fileSize * 8) / bitrate;
    };
    
    const calculateFileSize = (duration, bitrate) => {
      return (duration * bitrate) / 8;
    };
    
    const convertSampleRate = (samples, originalRate, targetRate) => {
      const ratio = targetRate / originalRate;
      const newLength = Math.floor(samples.length * ratio);
      const resampled = new Array(newLength);
      
      for (let i = 0; i < newLength; i++) {
        const originalIndex = i / ratio;
        const index = Math.floor(originalIndex);
        const fraction = originalIndex - index;
        
        if (index + 1 < samples.length) {
          resampled[i] = samples[index] * (1 - fraction) + samples[index + 1] * fraction;
        } else {
          resampled[i] = samples[index] || 0;
        }
      }
      
      return resampled;
    };

    expect(calculateBitrate(44100, 16, 2)).toBe(1411200);
    expect(calculateDuration(1411200, 1411200)).toBe(8);
    expect(calculateFileSize(60, 128000)).toBe(960000);
    
    const samples = [0, 0.5, 1, 0.5, 0];
    const resampled = convertSampleRate(samples, 5, 10);
    expect(resampled).toHaveLength(10);
  });

  test('should handle audio wave generation', () => {
    const generateSineWave = (frequency, sampleRate, duration, amplitude = 1) => {
      const samples = Math.floor(sampleRate * duration);
      const wave = new Array(samples);
      
      for (let i = 0; i < samples; i++) {
        const time = i / sampleRate;
        wave[i] = amplitude * Math.sin(2 * Math.PI * frequency * time);
      }
      
      return wave;
    };
    
    const generateSquareWave = (frequency, sampleRate, duration, amplitude = 1) => {
      const samples = Math.floor(sampleRate * duration);
      const wave = new Array(samples);
      
      for (let i = 0; i < samples; i++) {
        const time = i / sampleRate;
        const sineValue = Math.sin(2 * Math.PI * frequency * time);
        wave[i] = amplitude * (sineValue >= 0 ? 1 : -1);
      }
      
      return wave;
    };
    
    const generateSawtoothWave = (frequency, sampleRate, duration, amplitude = 1) => {
      const samples = Math.floor(sampleRate * duration);
      const wave = new Array(samples);
      
      for (let i = 0; i < samples; i++) {
        const time = i / sampleRate;
        const phase = (frequency * time) % 1;
        wave[i] = amplitude * (2 * phase - 1);
      }
      
      return wave;
    };
    
    const generateWhiteNoise = (sampleRate, duration, amplitude = 1) => {
      const samples = Math.floor(sampleRate * duration);
      const noise = new Array(samples);
      
      for (let i = 0; i < samples; i++) {
        noise[i] = amplitude * (Math.random() * 2 - 1);
      }
      
      return noise;
    };

    const sine = generateSineWave(440, 1000, 0.01);
    expect(sine).toHaveLength(10);
    expect(sine[0]).toBe(0);
    expect(Math.abs(sine[2])).toBeCloseTo(Math.sin(2 * Math.PI * 440 * 0.002), 5);
    
    const square = generateSquareWave(440, 1000, 0.01);
    expect(square[0]).toBe(1);
    expect(Math.abs(square[1])).toBe(1);
    
    const sawtooth = generateSawtoothWave(440, 1000, 0.01);
    expect(sawtooth).toHaveLength(10);
    
    const noise = generateWhiteNoise(1000, 0.01);
    expect(noise).toHaveLength(10);
    expect(noise.every(sample => sample >= -1 && sample <= 1)).toBe(true);
  });

  test('should handle audio effects and processing', () => {
    const applyGain = (samples, gainDb) => {
      const gainLinear = Math.pow(10, gainDb / 20);
      return samples.map(sample => sample * gainLinear);
    };
    
    const normalize = (samples) => {
      const maxAbsValue = Math.max(...samples.map(Math.abs));
      if (maxAbsValue === 0) return samples;
      
      const scaleFactor = 1 / maxAbsValue;
      return samples.map(sample => sample * scaleFactor);
    };
    
    const applyFade = (samples, fadeInSamples, fadeOutSamples) => {
      const result = [...samples];
      
      // Fade in
      for (let i = 0; i < Math.min(fadeInSamples, samples.length); i++) {
        const factor = i / fadeInSamples;
        result[i] *= factor;
      }
      
      // Fade out
      const fadeOutStart = samples.length - fadeOutSamples;
      for (let i = Math.max(0, fadeOutStart); i < samples.length; i++) {
        const factor = (samples.length - i) / fadeOutSamples;
        result[i] *= factor;
      }
      
      return result;
    };
    
    const mixSamples = (samples1, samples2, ratio = 0.5) => {
      const maxLength = Math.max(samples1.length, samples2.length);
      const mixed = new Array(maxLength);
      
      for (let i = 0; i < maxLength; i++) {
        const sample1 = i < samples1.length ? samples1[i] : 0;
        const sample2 = i < samples2.length ? samples2[i] : 0;
        mixed[i] = sample1 * (1 - ratio) + sample2 * ratio;
      }
      
      return mixed;
    };

    const samples = [0.5, -0.8, 0.3, -0.2];
    
    const gained = applyGain(samples, 6);
    expect(gained[0]).toBeCloseTo(0.996, 3);
    
    const normalized = normalize(samples);
    expect(Math.max(...normalized.map(Math.abs))).toBeCloseTo(1, 5);
    
    const faded = applyFade(samples, 2, 2);
    expect(faded[0]).toBe(0);
    expect(faded[faded.length - 1]).toBe(0);
    
    const mixed = mixSamples([1, 0], [0, 1]);
    expect(mixed).toEqual([0.5, 0.5]);
  });

  test('should handle frequency analysis', () => {
    const calculateRMS = (samples) => {
      const sumSquares = samples.reduce((sum, sample) => sum + sample * sample, 0);
      return Math.sqrt(sumSquares / samples.length);
    };
    
    const findPeaks = (samples, threshold = 0.5) => {
      const peaks = [];
      
      for (let i = 1; i < samples.length - 1; i++) {
        if (samples[i] > samples[i - 1] && 
            samples[i] > samples[i + 1] && 
            Math.abs(samples[i]) > threshold) {
          peaks.push({ index: i, value: samples[i] });
        }
      }
      
      return peaks;
    };
    
    const calculateZeroCrossings = (samples) => {
      let crossings = 0;
      
      for (let i = 1; i < samples.length; i++) {
        if ((samples[i - 1] >= 0 && samples[i] < 0) ||
            (samples[i - 1] < 0 && samples[i] >= 0)) {
          crossings++;
        }
      }
      
      return crossings;
    };
    
    const estimateFundamentalFrequency = (samples, sampleRate) => {
      // Simple autocorrelation-based pitch detection
      const minPeriod = Math.floor(sampleRate / 800); // 800 Hz max
      const maxPeriod = Math.floor(sampleRate / 80);  // 80 Hz min
      
      let bestPeriod = minPeriod;
      let maxCorrelation = 0;
      
      for (let period = minPeriod; period <= maxPeriod; period++) {
        let correlation = 0;
        let count = 0;
        
        for (let i = 0; i < samples.length - period; i++) {
          correlation += samples[i] * samples[i + period];
          count++;
        }
        
        correlation /= count;
        
        if (correlation > maxCorrelation) {
          maxCorrelation = correlation;
          bestPeriod = period;
        }
      }
      
      return sampleRate / bestPeriod;
    };

    const samples = [0, 0.7, 0, -0.8, 0, 0.6, 0];
    
    expect(calculateRMS(samples)).toBeCloseTo(0.46, 2);
    
    const peaks = findPeaks(samples, 0.5);
    expect(peaks).toHaveLength(2);
    expect(peaks[0].index).toBe(1);
    
    expect(calculateZeroCrossings(samples)).toBe(6);
    
    const sineWave = [];
    for (let i = 0; i < 1000; i++) {
      sineWave.push(Math.sin(2 * Math.PI * 440 * i / 44100));
    }
    const frequency = estimateFundamentalFrequency(sineWave, 44100);
    expect(frequency).toBeCloseTo(440, -1);
  });

  test('should handle audio filtering', () => {
    const simpleHighPass = (samples, cutoffRatio = 0.1) => {
      const filtered = new Array(samples.length);
      let previousInput = 0;
      let previousOutput = 0;
      
      const alpha = cutoffRatio / (cutoffRatio + 1);
      
      for (let i = 0; i < samples.length; i++) {
        filtered[i] = alpha * (previousOutput + samples[i] - previousInput);
        previousInput = samples[i];
        previousOutput = filtered[i];
      }
      
      return filtered;
    };
    
    const simpleLowPass = (samples, cutoffRatio = 0.1) => {
      const filtered = new Array(samples.length);
      let previousOutput = 0;
      
      const alpha = cutoffRatio;
      
      for (let i = 0; i < samples.length; i++) {
        filtered[i] = alpha * samples[i] + (1 - alpha) * previousOutput;
        previousOutput = filtered[i];
      }
      
      return filtered;
    };
    
    const applyDelay = (samples, delaySamples, feedback = 0.3, mix = 0.5) => {
      const delayed = new Array(samples.length + delaySamples).fill(0);
      
      for (let i = 0; i < samples.length; i++) {
        delayed[i] += samples[i];
        
        if (i + delaySamples < delayed.length) {
          delayed[i + delaySamples] += samples[i] * feedback;
        }
      }
      
      const result = new Array(samples.length);
      for (let i = 0; i < samples.length; i++) {
        result[i] = samples[i] * (1 - mix) + delayed[i] * mix;
      }
      
      return result;
    };

    const testSignal = [1, -1, 1, -1, 1, -1];
    
    const highPassed = simpleHighPass(testSignal);
    expect(highPassed).toHaveLength(testSignal.length);
    
    const lowPassed = simpleLowPass(testSignal);
    expect(lowPassed).toHaveLength(testSignal.length);
    expect(Math.abs(lowPassed[lowPassed.length - 1])).toBeLessThan(1);
    
    const withDelay = applyDelay([1, 0, 0, 0], 2);
    expect(withDelay).toHaveLength(4);
    expect(withDelay[2]).toBeGreaterThan(0);
  });

  test('should handle audio encoding simulation', () => {
    const simulatePCMEncoding = (samples, bitDepth) => {
      const maxValue = Math.pow(2, bitDepth - 1) - 1;
      const minValue = -Math.pow(2, bitDepth - 1);
      
      return samples.map(sample => {
        const scaled = Math.round(sample * maxValue);
        return Math.max(minValue, Math.min(maxValue, scaled));
      });
    };
    
    const calculateSNR = (original, encoded, bitDepth) => {
      const maxValue = Math.pow(2, bitDepth - 1) - 1;
      
      let signalPower = 0;
      let noisePower = 0;
      
      for (let i = 0; i < original.length; i++) {
        const originalScaled = original[i] * maxValue;
        const noise = encoded[i] - originalScaled;
        
        signalPower += originalScaled * originalScaled;
        noisePower += noise * noise;
      }
      
      if (noisePower === 0) return Infinity;
      return 10 * Math.log10(signalPower / noisePower);
    };
    
    const simulateCompression = (samples, compressionRatio) => {
      // Simple simulation: quantize more aggressively
      const levels = Math.floor(256 / compressionRatio);
      const step = 2 / levels;
      
      return samples.map(sample => {
        const quantized = Math.round(sample / step) * step;
        return Math.max(-1, Math.min(1, quantized));
      });
    };

    const samples = [0.1, 0.5, -0.3, 0.8, -0.9];
    
    const encoded16bit = simulatePCMEncoding(samples, 16);
    expect(encoded16bit[1]).toBe(16383);
    expect(encoded16bit[4]).toBe(-29491);
    
    const snr = calculateSNR(samples, encoded16bit, 16);
    expect(snr).toBeGreaterThan(90);
    
    const compressed = simulateCompression(samples, 4);
    expect(compressed).toHaveLength(samples.length);
    expect(Math.abs(compressed[0])).toBeLessThanOrEqual(1);
  });
});
