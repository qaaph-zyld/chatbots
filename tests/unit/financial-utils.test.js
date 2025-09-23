/**
 * Financial Utilities Unit Tests
 */

describe('Financial Utilities', () => {
  test('should handle basic interest calculations', () => {
    const simpleInterest = (principal, rate, time) => {
      return principal * rate * time;
    };
    
    const compoundInterest = (principal, rate, time, compoundingFrequency = 1) => {
      return principal * Math.pow(1 + rate / compoundingFrequency, compoundingFrequency * time) - principal;
    };
    
    const futureValue = (principal, rate, time, compoundingFrequency = 1) => {
      return principal * Math.pow(1 + rate / compoundingFrequency, compoundingFrequency * time);
    };
    
    const presentValue = (futureValue, rate, time, compoundingFrequency = 1) => {
      return futureValue / Math.pow(1 + rate / compoundingFrequency, compoundingFrequency * time);
    };

    expect(simpleInterest(1000, 0.05, 2)).toBe(100);
    expect(compoundInterest(1000, 0.05, 2)).toBeCloseTo(102.5, 2);
    expect(futureValue(1000, 0.05, 2)).toBeCloseTo(1102.5, 2);
    expect(presentValue(1102.5, 0.05, 2)).toBeCloseTo(1000, 2);
  });

  test('should handle annuity calculations', () => {
    const futureValueAnnuity = (payment, rate, periods) => {
      return payment * ((Math.pow(1 + rate, periods) - 1) / rate);
    };
    
    const presentValueAnnuity = (payment, rate, periods) => {
      return payment * ((1 - Math.pow(1 + rate, -periods)) / rate);
    };
    
    const annuityPayment = (presentValue, rate, periods) => {
      return presentValue * (rate / (1 - Math.pow(1 + rate, -periods)));
    };
    
    const perpetuity = (payment, rate) => {
      return payment / rate;
    };

    expect(futureValueAnnuity(100, 0.05, 10)).toBeCloseTo(1257.79, 2);
    expect(presentValueAnnuity(100, 0.05, 10)).toBeCloseTo(772.17, 2);
    expect(annuityPayment(772.17, 0.05, 10)).toBeCloseTo(100, 2);
    expect(perpetuity(100, 0.05)).toBe(2000);
  });

  test('should handle loan calculations', () => {
    const monthlyPayment = (principal, annualRate, years) => {
      const monthlyRate = annualRate / 12;
      const numPayments = years * 12;
      
      if (annualRate === 0) return principal / numPayments;
      
      return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
             (Math.pow(1 + monthlyRate, numPayments) - 1);
    };
    
    const totalInterest = (principal, annualRate, years) => {
      const payment = monthlyPayment(principal, annualRate, years);
      return (payment * years * 12) - principal;
    };
    
    const remainingBalance = (principal, annualRate, years, paymentsMade) => {
      const monthlyRate = annualRate / 12;
      const numPayments = years * 12;
      const payment = monthlyPayment(principal, annualRate, years);
      
      return principal * Math.pow(1 + monthlyRate, paymentsMade) - 
             payment * ((Math.pow(1 + monthlyRate, paymentsMade) - 1) / monthlyRate);
    };

    expect(monthlyPayment(200000, 0.04, 30)).toBeCloseTo(954.83, 2);
    expect(totalInterest(200000, 0.04, 30)).toBeCloseTo(143738.8, 1);
    expect(remainingBalance(200000, 0.04, 30, 60)).toBeCloseTo(186108.47, 2);
  });

  test('should handle investment analysis', () => {
    const netPresentValue = (cashFlows, discountRate) => {
      return cashFlows.reduce((npv, cashFlow, period) => {
        return npv + cashFlow / Math.pow(1 + discountRate, period);
      }, 0);
    };
    
    const internalRateOfReturn = (cashFlows, guess = 0.1) => {
      // Newton-Raphson method approximation
      let rate = guess;
      
      for (let i = 0; i < 100; i++) {
        let npv = 0;
        let derivative = 0;
        
        cashFlows.forEach((cashFlow, period) => {
          npv += cashFlow / Math.pow(1 + rate, period);
          derivative -= period * cashFlow / Math.pow(1 + rate, period + 1);
        });
        
        if (Math.abs(npv) < 0.0001) break;
        rate = rate - npv / derivative;
      }
      
      return rate;
    };
    
    const paybackPeriod = (initialInvestment, annualCashFlow) => {
      return Math.abs(initialInvestment) / annualCashFlow;
    };
    
    const returnOnInvestment = (gain, cost) => {
      return (gain - cost) / cost;
    };

    const cashFlows = [-1000, 300, 400, 500, 600];
    expect(netPresentValue(cashFlows, 0.1)).toBeCloseTo(317.49, 2);
    expect(internalRateOfReturn(cashFlows)).toBeCloseTo(0.28, 2);
    expect(paybackPeriod(1000, 400)).toBe(2.5);
    expect(returnOnInvestment(1200, 1000)).toBe(0.2);
  });

  test('should handle bond calculations', () => {
    const bondPrice = (faceValue, couponRate, marketRate, years) => {
      const couponPayment = faceValue * couponRate;
      let price = 0;
      
      // Present value of coupon payments
      for (let i = 1; i <= years; i++) {
        price += couponPayment / Math.pow(1 + marketRate, i);
      }
      
      // Present value of face value
      price += faceValue / Math.pow(1 + marketRate, years);
      
      return price;
    };
    
    const currentYield = (annualCoupon, currentPrice) => {
      return annualCoupon / currentPrice;
    };
    
    const yieldToMaturity = (faceValue, currentPrice, couponRate, years) => {
      // Approximation formula
      const annualCoupon = faceValue * couponRate;
      const numerator = annualCoupon + (faceValue - currentPrice) / years;
      const denominator = (faceValue + currentPrice) / 2;
      return numerator / denominator;
    };
    
    const duration = (cashFlows, yieldRate) => {
      let weightedTime = 0;
      let totalPV = 0;
      
      cashFlows.forEach((cashFlow, period) => {
        const pv = cashFlow / Math.pow(1 + yieldRate, period);
        weightedTime += period * pv;
        totalPV += pv;
      });
      
      return weightedTime / totalPV;
    };

    expect(bondPrice(1000, 0.05, 0.06, 10)).toBeCloseTo(926.40, 2);
    expect(currentYield(50, 950)).toBeCloseTo(0.0526, 4);
    expect(yieldToMaturity(1000, 950, 0.05, 10)).toBeCloseTo(0.0564, 4);
    
    const bondCashFlows = [0, 50, 50, 50, 1050]; // 3-year bond
    expect(duration(bondCashFlows, 0.05)).toBeCloseTo(2.86, 2);
  });

  test('should handle stock valuation', () => {
    const dividendDiscountModel = (dividend, growthRate, requiredReturn) => {
      return dividend / (requiredReturn - growthRate);
    };
    
    const priceEarningsRatio = (stockPrice, earningsPerShare) => {
      return stockPrice / earningsPerShare;
    };
    
    const earningsYield = (earningsPerShare, stockPrice) => {
      return earningsPerShare / stockPrice;
    };
    
    const dividendYield = (annualDividend, stockPrice) => {
      return annualDividend / stockPrice;
    };
    
    const bookValuePerShare = (totalEquity, sharesOutstanding) => {
      return totalEquity / sharesOutstanding;
    };
    
    const priceToBookRatio = (stockPrice, bookValuePerShare) => {
      return stockPrice / bookValuePerShare;
    };

    expect(dividendDiscountModel(2, 0.03, 0.08)).toBe(40);
    expect(priceEarningsRatio(50, 2.5)).toBe(20);
    expect(earningsYield(2.5, 50)).toBe(0.05);
    expect(dividendYield(2, 50)).toBe(0.04);
    expect(bookValuePerShare(1000000, 100000)).toBe(10);
    expect(priceToBookRatio(50, 10)).toBe(5);
  });

  test('should handle risk and return calculations', () => {
    const expectedReturn = (returns, probabilities) => {
      return returns.reduce((expected, ret, i) => expected + ret * probabilities[i], 0);
    };
    
    const variance = (returns, probabilities, expectedReturn) => {
      return returns.reduce((variance, ret, i) => {
        return variance + probabilities[i] * Math.pow(ret - expectedReturn, 2);
      }, 0);
    };
    
    const standardDeviation = (variance) => Math.sqrt(variance);
    
    const sharpeRatio = (portfolioReturn, riskFreeRate, portfolioStdDev) => {
      return (portfolioReturn - riskFreeRate) / portfolioStdDev;
    };
    
    const beta = (assetReturns, marketReturns) => {
      const n = assetReturns.length;
      const assetMean = assetReturns.reduce((sum, ret) => sum + ret, 0) / n;
      const marketMean = marketReturns.reduce((sum, ret) => sum + ret, 0) / n;
      
      let covariance = 0;
      let marketVariance = 0;
      
      for (let i = 0; i < n; i++) {
        covariance += (assetReturns[i] - assetMean) * (marketReturns[i] - marketMean);
        marketVariance += Math.pow(marketReturns[i] - marketMean, 2);
      }
      
      return covariance / marketVariance;
    };

    const returns = [0.1, 0.05, -0.02];
    const probabilities = [0.3, 0.5, 0.2];
    const expectedRet = expectedReturn(returns, probabilities);
    
    expect(expectedRet).toBeCloseTo(0.051, 3);
    
    const var1 = variance(returns, probabilities, expectedRet);
    expect(standardDeviation(var1)).toBeCloseTo(0.0459, 4);
    
    expect(sharpeRatio(0.12, 0.03, 0.15)).toBe(0.6);
    
    const assetReturns = [0.1, 0.15, -0.05, 0.08];
    const marketReturns = [0.08, 0.12, -0.03, 0.06];
    expect(beta(assetReturns, marketReturns)).toBeCloseTo(1.25, 2);
  });

  test('should handle portfolio optimization', () => {
    const portfolioReturn = (weights, returns) => {
      return weights.reduce((total, weight, i) => total + weight * returns[i], 0);
    };
    
    const portfolioVariance = (weights, covariances) => {
      let variance = 0;
      
      for (let i = 0; i < weights.length; i++) {
        for (let j = 0; j < weights.length; j++) {
          variance += weights[i] * weights[j] * covariances[i][j];
        }
      }
      
      return variance;
    };
    
    const correlationToCovariance = (correlation, stdDev1, stdDev2) => {
      return correlation * stdDev1 * stdDev2;
    };
    
    const diversificationRatio = (portfolioStdDev, weightedAvgStdDev) => {
      return weightedAvgStdDev / portfolioStdDev;
    };

    const weights = [0.6, 0.4];
    const returns = [0.08, 0.12];
    
    expect(portfolioReturn(weights, returns)).toBe(0.096);
    
    const covariances = [[0.04, 0.02], [0.02, 0.09]];
    expect(portfolioVariance(weights, covariances)).toBe(0.0388);
    
    expect(correlationToCovariance(0.5, 0.2, 0.3)).toBe(0.03);
    expect(diversificationRatio(0.15, 0.20)).toBeCloseTo(1.33, 2);
  });

  test('should handle options pricing basics', () => {
    const intrinsicValue = (spotPrice, strikePrice, optionType) => {
      if (optionType === 'call') {
        return Math.max(0, spotPrice - strikePrice);
      } else if (optionType === 'put') {
        return Math.max(0, strikePrice - spotPrice);
      }
      return 0;
    };
    
    const timeValue = (optionPrice, intrinsicValue) => {
      return optionPrice - intrinsicValue;
    };
    
    const moneyness = (spotPrice, strikePrice) => {
      return spotPrice / strikePrice;
    };
    
    const delta = (optionPrice, spotPrice, priceChange = 1) => {
      // Simplified delta calculation
      return priceChange / priceChange; // This would need actual option pricing model
    };

    expect(intrinsicValue(105, 100, 'call')).toBe(5);
    expect(intrinsicValue(95, 100, 'call')).toBe(0);
    expect(intrinsicValue(95, 100, 'put')).toBe(5);
    expect(timeValue(8, 5)).toBe(3);
    expect(moneyness(105, 100)).toBe(1.05);
  });
});
