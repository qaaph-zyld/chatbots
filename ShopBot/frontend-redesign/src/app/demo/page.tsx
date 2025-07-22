import React from 'react';
import { DemoEnvironment } from '@/components/demo';

export const metadata = {
  title: 'ShopBot Demo | Interactive Experience',
  description: 'Experience the power of ShopBot with our interactive demo environment. Test real-world scenarios, explore e-commerce integration, and analyze performance metrics.',
};

export default function DemoPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Experience ShopBot in Action
        </h1>
        <p className="text-xl text-gray-600">
          Explore our interactive demo environment to see how ShopBot transforms customer support
          and enhances e-commerce operations in real-time.
        </p>
      </div>
      
      <DemoEnvironment />
      
      <div className="max-w-2xl mx-auto mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to transform your customer experience?</h2>
        <p className="text-gray-600 mb-6">
          ShopBot integrates seamlessly with your existing e-commerce platform, providing
          immediate value with minimal setup time.
        </p>
        <div className="flex justify-center gap-4">
          <a 
            href="/pricing" 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Pricing
          </a>
          <a 
            href="/contact" 
            className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Contact Sales
          </a>
        </div>
      </div>
    </main>
  );
}
