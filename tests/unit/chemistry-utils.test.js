/**
 * Chemistry Utilities Unit Tests
 */

describe('Chemistry Utilities', () => {
  test('should handle atomic structure calculations', () => {
    const atomicMass = (protons, neutrons) => protons + neutrons;
    const atomicNumber = (protons) => protons;
    const massNumber = (protons, neutrons) => protons + neutrons;
    
    const electronsInNeutralAtom = (protons) => protons;
    const ionCharge = (protons, electrons) => protons - electrons;
    
    const isotope = (element, massNumber) => `${element}-${massNumber}`;

    expect(atomicMass(6, 6)).toBe(12); // Carbon-12
    expect(atomicNumber(1)).toBe(1); // Hydrogen
    expect(massNumber(8, 8)).toBe(16); // Oxygen-16
    expect(electronsInNeutralAtom(11)).toBe(11); // Sodium
    expect(ionCharge(11, 10)).toBe(1); // Na+
    expect(isotope('C', 14)).toBe('C-14');
  });

  test('should handle mole calculations', () => {
    const avogadroNumber = 6.022e23;
    
    const molesFromMass = (mass, molarMass) => mass / molarMass;
    const massFromMoles = (moles, molarMass) => moles * molarMass;
    const particlesFromMoles = (moles) => moles * avogadroNumber;
    const molesFromParticles = (particles) => particles / avogadroNumber;
    
    const molarity = (moles, volumeLiters) => moles / volumeLiters;
    const moles = (molarity, volumeLiters) => molarity * volumeLiters;

    expect(molesFromMass(18, 18)).toBe(1); // 1 mole of water
    expect(massFromMoles(2, 16)).toBe(32); // 2 moles of oxygen
    expect(particlesFromMoles(1)).toBe(6.022e23);
    expect(molesFromParticles(1.2044e24)).toBe(2);
    expect(molarity(0.5, 2)).toBe(0.25);
    expect(moles(0.1, 0.5)).toBe(0.05);
  });

  test('should handle gas law calculations', () => {
    const idealGasLaw = (pressure, volume, moles, temperature, gasConstant = 0.0821) => {
      // PV = nRT, solve for missing variable
      return {
        pressure: () => (moles * gasConstant * temperature) / volume,
        volume: () => (moles * gasConstant * temperature) / pressure,
        moles: () => (pressure * volume) / (gasConstant * temperature),
        temperature: () => (pressure * volume) / (moles * gasConstant)
      };
    };
    
    const combinedGasLaw = (p1, v1, t1, p2, v2, t2) => {
      // P1V1/T1 = P2V2/T2
      const constant = (p1 * v1) / t1;
      const constant2 = (p2 * v2) / t2;
      return Math.abs(constant - constant2) < 0.01;
    };
    
    const stp = { pressure: 1, temperature: 273.15 }; // 1 atm, 0°C
    const molarVolumeAtSTP = 22.4; // L/mol

    const gas = idealGasLaw(1, 22.4, 1, 273.15);
    expect(gas.pressure()).toBeCloseTo(1, 2);
    expect(gas.volume()).toBeCloseTo(22.4, 1);
    
    expect(combinedGasLaw(1, 22.4, 273.15, 2, 11.2, 273.15)).toBe(true);
    expect(molarVolumeAtSTP).toBe(22.4);
  });

  test('should handle chemical equations and stoichiometry', () => {
    const balanceEquation = (reactants, products) => {
      // Simplified balancing for common reactions
      // This is a basic implementation for demonstration
      return {
        reactants: reactants.map(r => ({ ...r, coefficient: 1 })),
        products: products.map(p => ({ ...p, coefficient: 1 }))
      };
    };
    
    const stoichiometry = (knownMoles, knownCoeff, unknownCoeff) => {
      return (knownMoles * unknownCoeff) / knownCoeff;
    };
    
    const limitingReagent = (reactants) => {
      // Find which reactant produces the least product
      let limiting = reactants[0];
      let minProduct = reactants[0].moles / reactants[0].coefficient;
      
      reactants.forEach(reactant => {
        const product = reactant.moles / reactant.coefficient;
        if (product < minProduct) {
          minProduct = product;
          limiting = reactant;
        }
      });
      
      return limiting;
    };

    expect(stoichiometry(2, 1, 2)).toBe(4); // 2 moles A → 4 moles B
    
    const reactants = [
      { name: 'H2', moles: 3, coefficient: 2 },
      { name: 'O2', moles: 1, coefficient: 1 }
    ];
    
    const limiting = limitingReagent(reactants);
    expect(limiting.name).toBe('O2');
  });

  test('should handle acid-base chemistry', () => {
    const pH = (hydrogenConcentration) => -Math.log10(hydrogenConcentration);
    const pOH = (hydroxideConcentration) => -Math.log10(hydroxideConcentration);
    const pHFrompOH = (pOH) => 14 - pOH;
    const pOHFrompH = (pH) => 14 - pH;
    
    const hydrogenFrompH = (pH) => Math.pow(10, -pH);
    const hydroxideFrompOH = (pOH) => Math.pow(10, -pOH);
    
    const bufferCapacity = (concentration, pKa, pH) => {
      const ratio = Math.pow(10, pH - pKa);
      return 2.3 * concentration * ratio / Math.pow(1 + ratio, 2);
    };

    expect(pH(1e-7)).toBeCloseTo(7, 5); // Neutral water
    expect(pOH(1e-7)).toBeCloseTo(7, 5);
    expect(pHFrompOH(3)).toBe(11);
    expect(pOHFrompH(2)).toBe(12);
    expect(hydrogenFrompH(3)).toBeCloseTo(1e-3, 8);
    expect(hydroxideFrompOH(4)).toBeCloseTo(1e-4, 9);
    expect(bufferCapacity(0.1, 4.76, 4.76)).toBeCloseTo(0.0575, 4);
  });

  test('should handle thermochemistry', () => {
    const enthalpyChange = (bondsFormed, bondsBroken) => {
      const energyReleased = bondsFormed.reduce((sum, bond) => sum + bond.energy, 0);
      const energyRequired = bondsBroken.reduce((sum, bond) => sum + bond.energy, 0);
      return energyRequired - energyReleased; // ΔH
    };
    
    const hessLaw = (reactions) => {
      return reactions.reduce((sum, reaction) => sum + reaction.enthalpy, 0);
    };
    
    const gibbsFreeEnergy = (enthalpy, temperature, entropy) => {
      return enthalpy - temperature * entropy; // ΔG = ΔH - TΔS
    };
    
    const equilibriumConstant = (gibbsFreeEnergy, temperature, gasConstant = 8.314) => {
      return Math.exp(-gibbsFreeEnergy / (gasConstant * temperature));
    };

    const bondsFormed = [{ type: 'H-H', energy: 436 }];
    const bondsBroken = [{ type: 'Cl-Cl', energy: 243 }];
    
    expect(enthalpyChange(bondsFormed, bondsBroken)).toBe(-193);
    
    const reactions = [
      { enthalpy: -285 },
      { enthalpy: 142 }
    ];
    expect(hessLaw(reactions)).toBe(-143);
    
    expect(gibbsFreeEnergy(-100, 298, 0.1)).toBeCloseTo(-129.8, 1);
    expect(equilibriumConstant(-5000, 298)).toBeCloseTo(7.4, 1);
  });

  test('should handle electrochemistry', () => {
    const nernstEquation = (standardPotential, temperature, electrons, concentration, gasConstant = 8.314, faraday = 96485) => {
      const rt_nf = (gasConstant * temperature) / (electrons * faraday);
      return standardPotential - rt_nf * Math.log(concentration);
    };
    
    const cellPotential = (cathode, anode) => cathode - anode;
    
    const faradaysLaw = (current, time, electrons, faraday = 96485) => {
      const charge = current * time;
      return charge / (electrons * faraday); // moles of substance
    };
    
    const electrolyticCell = (voltage, resistance) => voltage / resistance; // Current

    expect(nernstEquation(0.34, 298, 2, 0.1)).toBeCloseTo(0.31, 2);
    expect(cellPotential(0.80, -0.76)).toBe(1.56);
    expect(faradaysLaw(2, 3600, 2)).toBeCloseTo(0.0373, 4);
    expect(electrolyticCell(12, 4)).toBe(3);
  });

  test('should handle organic chemistry basics', () => {
    const molecularFormula = (empiricalFormula, molarMass, empiricalMass) => {
      const multiplier = Math.round(molarMass / empiricalMass);
      return `(${empiricalFormula})${multiplier}`;
    };
    
    const degreeOfUnsaturation = (carbons, hydrogens, nitrogens = 0, halogens = 0) => {
      const maxHydrogens = 2 * carbons + 2 + nitrogens - halogens;
      return (maxHydrogens - hydrogens) / 2;
    };
    
    const isomerCount = (carbons) => {
      // Simplified calculation for alkanes
      if (carbons <= 3) return 1;
      if (carbons === 4) return 2;
      if (carbons === 5) return 3;
      return Math.pow(2, carbons - 3); // Approximation
    };
    
    const functionalGroups = {
      alcohol: (carbons) => `C${carbons}H${2*carbons + 2}O`,
      aldehyde: (carbons) => `C${carbons}H${2*carbons}O`,
      ketone: (carbons) => `C${carbons}H${2*carbons}O`,
      carboxylicAcid: (carbons) => `C${carbons}H${2*carbons}O2`
    };

    expect(molecularFormula('CH2O', 180, 30)).toBe('(CH2O)6');
    expect(degreeOfUnsaturation(6, 12)).toBe(1); // Benzene
    expect(degreeOfUnsaturation(2, 4)).toBe(1); // Ethene
    expect(isomerCount(4)).toBe(2); // Butane isomers
    expect(functionalGroups.alcohol(2)).toBe('C2H6O');
    expect(functionalGroups.carboxylicAcid(2)).toBe('C2H4O2');
  });

  test('should handle reaction kinetics', () => {
    const rateConstant = (rateConstantRef, temperature, temperatureRef, activationEnergy, gasConstant = 8.314) => {
      const exponent = (activationEnergy / gasConstant) * (1/temperatureRef - 1/temperature);
      return rateConstantRef * Math.exp(exponent);
    };
    
    const halfLife = (rateConstant, order = 1, initialConcentration = 1) => {
      if (order === 1) {
        return Math.log(2) / rateConstant;
      } else if (order === 2) {
        return 1 / (rateConstant * initialConcentration);
      }
      return null;
    };
    
    const concentrationVsTime = (initialConc, rateConstant, time, order = 1) => {
      if (order === 1) {
        return initialConc * Math.exp(-rateConstant * time);
      } else if (order === 2) {
        return initialConc / (1 + rateConstant * initialConc * time);
      }
      return null;
    };

    expect(rateConstant(0.1, 310, 298, 50000)).toBeCloseTo(0.21, 2);
    expect(halfLife(0.693)).toBeCloseTo(1, 2);
    expect(halfLife(0.1, 2, 1)).toBe(10);
    expect(concentrationVsTime(1, 0.693, 1)).toBeCloseTo(0.5, 2);
  });
});
