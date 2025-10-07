/**
 * Physics Utilities Unit Tests
 */

describe('Physics Utilities', () => {
  test('should handle basic kinematics', () => {
    const velocity = (distance, time) => distance / time;
    const acceleration = (velocityChange, time) => velocityChange / time;
    
    const distanceWithConstantVelocity = (velocity, time) => velocity * time;
    const distanceWithConstantAcceleration = (initialVelocity, acceleration, time) => {
      return initialVelocity * time + 0.5 * acceleration * time * time;
    };
    
    const finalVelocity = (initialVelocity, acceleration, time) => {
      return initialVelocity + acceleration * time;
    };

    expect(velocity(100, 10)).toBe(10);
    expect(acceleration(20, 4)).toBe(5);
    expect(distanceWithConstantVelocity(15, 3)).toBe(45);
    expect(distanceWithConstantAcceleration(0, 9.8, 2)).toBe(19.6);
    expect(finalVelocity(10, 5, 3)).toBe(25);
  });

  test('should handle force and momentum', () => {
    const force = (mass, acceleration) => mass * acceleration;
    const momentum = (mass, velocity) => mass * velocity;
    const impulse = (force, time) => force * time;
    
    const kineticEnergy = (mass, velocity) => 0.5 * mass * velocity * velocity;
    const potentialEnergy = (mass, height, gravity = 9.8) => mass * gravity * height;
    
    const workDone = (force, distance, angle = 0) => {
      return force * distance * Math.cos(angle);
    };

    expect(force(10, 9.8)).toBe(98);
    expect(momentum(5, 20)).toBe(100);
    expect(impulse(50, 2)).toBe(100);
    expect(kineticEnergy(2, 10)).toBe(100);
    expect(potentialEnergy(1, 10)).toBe(98);
    expect(workDone(10, 5)).toBe(50);
  });

  test('should handle wave physics', () => {
    const waveSpeed = (frequency, wavelength) => frequency * wavelength;
    const wavePeriod = (frequency) => 1 / frequency;
    const waveFrequency = (period) => 1 / period;
    
    const doppler = (sourceFreq, sourceVel, observerVel, waveSpeed) => {
      return sourceFreq * (waveSpeed + observerVel) / (waveSpeed + sourceVel);
    };
    
    const decibels = (intensity, referenceIntensity = 1e-12) => {
      return 10 * Math.log10(intensity / referenceIntensity);
    };

    expect(waveSpeed(440, 0.77)).toBeCloseTo(338.8, 1);
    expect(wavePeriod(50)).toBe(0.02);
    expect(waveFrequency(0.1)).toBe(10);
    expect(doppler(1000, 0, 0, 343)).toBe(1000);
    expect(decibels(1e-10)).toBeCloseTo(20, 1);
  });

  test('should handle thermodynamics', () => {
    const celsiusToKelvin = (celsius) => celsius + 273.15;
    const kelvinToCelsius = (kelvin) => kelvin - 273.15;
    const celsiusToFahrenheit = (celsius) => (celsius * 9/5) + 32;
    const fahrenheitToCelsius = (fahrenheit) => (fahrenheit - 32) * 5/9;
    
    const idealGasLaw = (pressure, volume, moles, gasConstant = 8.314) => {
      // PV = nRT, solve for T
      return (pressure * volume) / (moles * gasConstant);
    };
    
    const heatCapacity = (mass, specificHeat, temperatureChange) => {
      return mass * specificHeat * temperatureChange;
    };

    expect(celsiusToKelvin(0)).toBe(273.15);
    expect(kelvinToCelsius(273.15)).toBe(0);
    expect(celsiusToFahrenheit(0)).toBe(32);
    expect(fahrenheitToCelsius(32)).toBe(0);
    expect(idealGasLaw(101325, 0.0224, 1)).toBeCloseTo(273, 0);
    expect(heatCapacity(1, 4186, 10)).toBe(41860);
  });

  test('should handle electricity and magnetism', () => {
    const ohmsLaw = {
      voltage: (current, resistance) => current * resistance,
      current: (voltage, resistance) => voltage / resistance,
      resistance: (voltage, current) => voltage / current
    };
    
    const power = {
      fromVI: (voltage, current) => voltage * current,
      fromVR: (voltage, resistance) => (voltage * voltage) / resistance,
      fromIR: (current, resistance) => current * current * resistance
    };
    
    const capacitance = (charge, voltage) => charge / voltage;
    const energy = (capacitance, voltage) => 0.5 * capacitance * voltage * voltage;
    
    const magneticForce = (charge, velocity, magneticField, angle = Math.PI/2) => {
      return charge * velocity * magneticField * Math.sin(angle);
    };

    expect(ohmsLaw.voltage(2, 10)).toBe(20);
    expect(ohmsLaw.current(12, 4)).toBe(3);
    expect(ohmsLaw.resistance(15, 3)).toBe(5);
    expect(power.fromVI(12, 2)).toBe(24);
    expect(power.fromVR(10, 5)).toBe(20);
    expect(power.fromIR(3, 4)).toBe(36);
    expect(capacitance(0.001, 10)).toBe(0.0001);
    expect(energy(0.001, 100)).toBe(5);
    expect(magneticForce(1.6e-19, 1e6, 0.1)).toBeCloseTo(1.6e-14, 20);
  });

  test('should handle optics', () => {
    const snellsLaw = (n1, theta1, n2) => {
      // n1 * sin(theta1) = n2 * sin(theta2)
      const sinTheta2 = (n1 * Math.sin(theta1)) / n2;
      return Math.asin(sinTheta2);
    };
    
    const lensEquation = (focalLength, objectDistance) => {
      // 1/f = 1/do + 1/di
      return 1 / (1/focalLength - 1/objectDistance);
    };
    
    const magnification = (imageDistance, objectDistance) => {
      return -imageDistance / objectDistance;
    };
    
    const criticalAngle = (n1, n2) => {
      if (n1 <= n2) return null; // Total internal reflection not possible
      return Math.asin(n2 / n1);
    };

    const theta1 = Math.PI / 6; // 30 degrees
    const theta2 = snellsLaw(1.0, theta1, 1.33); // Air to water
    expect(theta2).toBeCloseTo(0.361, 3);
    
    expect(lensEquation(10, 20)).toBeCloseTo(20, 5);
    expect(magnification(15, 30)).toBe(-0.5);
    
    const critical = criticalAngle(1.5, 1.0);
    expect(critical).toBeCloseTo(0.7297, 4);
  });

  test('should handle quantum mechanics basics', () => {
    const planckEnergy = (frequency, planckConstant = 6.626e-34) => {
      return planckConstant * frequency;
    };
    
    const deBroglieWavelength = (momentum, planckConstant = 6.626e-34) => {
      return planckConstant / momentum;
    };
    
    const photoelectricEffect = (frequency, workFunction, planckConstant = 6.626e-34) => {
      const photonEnergy = planckConstant * frequency;
      return Math.max(0, photonEnergy - workFunction);
    };
    
    const bohrRadius = (n, bohrConstant = 5.29e-11) => {
      return n * n * bohrConstant;
    };
    
    const rydbergEnergy = (n1, n2, rydbergConstant = 13.6) => {
      return rydbergConstant * (1/(n1*n1) - 1/(n2*n2));
    };

    expect(planckEnergy(1e15)).toBeCloseTo(6.626e-19, 25);
    expect(deBroglieWavelength(1e-24)).toBeCloseTo(6.626e-10, 15);
    expect(photoelectricEffect(1e15, 3e-19)).toBeCloseTo(3.626e-19, 25);
    expect(bohrRadius(2)).toBeCloseTo(2.116e-10, 15);
    expect(rydbergEnergy(1, 2)).toBeCloseTo(10.2, 1);
  });

  test('should handle relativity', () => {
    const lorentzFactor = (velocity, speedOfLight = 3e8) => {
      const beta = velocity / speedOfLight;
      return 1 / Math.sqrt(1 - beta * beta);
    };
    
    const timeDilation = (properTime, velocity, speedOfLight = 3e8) => {
      return properTime * lorentzFactor(velocity, speedOfLight);
    };
    
    const lengthContraction = (properLength, velocity, speedOfLight = 3e8) => {
      return properLength / lorentzFactor(velocity, speedOfLight);
    };
    
    const relativisticMomentum = (mass, velocity, speedOfLight = 3e8) => {
      return mass * velocity * lorentzFactor(velocity, speedOfLight);
    };
    
    const massEnergyEquivalence = (mass, speedOfLight = 3e8) => {
      return mass * speedOfLight * speedOfLight;
    };

    const gamma = lorentzFactor(1.5e8); // 0.5c
    expect(gamma).toBeCloseTo(1.155, 3);
    
    expect(timeDilation(1, 1.5e8)).toBeCloseTo(1.155, 3);
    expect(lengthContraction(10, 1.5e8)).toBeCloseTo(8.66, 2);
    expect(relativisticMomentum(1, 1.5e8)).toBeCloseTo(1.73e8, -6);
    expect(massEnergyEquivalence(1)).toBe(9e16);
  });

  test('should handle fluid mechanics', () => {
    const density = (mass, volume) => mass / volume;
    const pressure = (force, area) => force / area;
    const hydrostaticPressure = (density, height, gravity = 9.8) => {
      return density * gravity * height;
    };
    
    const buoyantForce = (fluidDensity, volume, gravity = 9.8) => {
      return fluidDensity * volume * gravity;
    };
    
    const continuityEquation = (area1, velocity1, area2) => {
      // A1*v1 = A2*v2
      return (area1 * velocity1) / area2;
    };
    
    const bernoulliEquation = (pressure1, velocity1, height1, pressure2, velocity2, height2, density = 1000, gravity = 9.8) => {
      // P1 + 0.5*ρ*v1² + ρ*g*h1 = P2 + 0.5*ρ*v2² + ρ*g*h2
      const term1 = pressure1 + 0.5 * density * velocity1 * velocity1 + density * gravity * height1;
      const term2 = pressure2 + 0.5 * density * velocity2 * velocity2 + density * gravity * height2;
      return Math.abs(term1 - term2) < 1e-6; // Check if equation is satisfied
    };

    expect(density(1000, 1)).toBe(1000);
    expect(pressure(100, 0.01)).toBe(10000);
    expect(hydrostaticPressure(1000, 10)).toBe(98000);
    expect(buoyantForce(1000, 0.1)).toBe(980);
    expect(continuityEquation(0.01, 10, 0.005)).toBe(20);
    expect(bernoulliEquation(101325, 0, 0, 101325, 0, 0)).toBe(true);
  });
});
