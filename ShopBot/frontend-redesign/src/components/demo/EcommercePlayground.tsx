'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';

// Product interface
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  stock: number;
}

// Sample products data
const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Premium Wireless Headphones',
    price: 199.99,
    image: 'https://via.placeholder.com/150',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
    category: 'Electronics',
    stock: 15,
  },
  {
    id: 'p2',
    name: 'Organic Cotton T-Shirt',
    price: 29.99,
    image: 'https://via.placeholder.com/150',
    description: 'Soft, comfortable t-shirt made from 100% organic cotton.',
    category: 'Apparel',
    stock: 50,
  },
  {
    id: 'p3',
    name: 'Stainless Steel Water Bottle',
    price: 24.99,
    image: 'https://via.placeholder.com/150',
    description: 'Eco-friendly, double-walled insulated water bottle that keeps drinks cold for 24 hours.',
    category: 'Home',
    stock: 30,
  },
  {
    id: 'p4',
    name: 'Smart Fitness Tracker',
    price: 89.99,
    image: 'https://via.placeholder.com/150',
    description: 'Track your steps, heart rate, sleep, and more with this advanced fitness wearable.',
    category: 'Electronics',
    stock: 20,
  },
  {
    id: 'p5',
    name: 'Leather Wallet',
    price: 49.99,
    image: 'https://via.placeholder.com/150',
    description: 'Handcrafted genuine leather wallet with RFID protection.',
    category: 'Accessories',
    stock: 25,
  },
  {
    id: 'p6',
    name: 'Ceramic Coffee Mug',
    price: 14.99,
    image: 'https://via.placeholder.com/150',
    description: 'Elegant ceramic mug perfect for your morning coffee or tea.',
    category: 'Home',
    stock: 40,
  },
];

// Cart item interface
interface CartItem extends Product {
  quantity: number;
}

// Categories
const CATEGORIES = ['All', 'Electronics', 'Apparel', 'Home', 'Accessories'];

export interface EcommercePlaygroundProps {
  className?: string;
}

export const EcommercePlayground: React.FC<EcommercePlaygroundProps> = ({ className }) => {
  const [products] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showCart, setShowCart] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter products by category and search query
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Add product to cart
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        // Update quantity if item already in cart
        return prevCart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        // Add new item to cart
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  // Update item quantity in cart
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Check if new quantity exceeds available stock
    if (newQuantity > product.stock) return;
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity } 
          : item
      )
    );
  };

  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // Calculate total items in cart
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Demo Store</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button 
            onClick={() => setShowCart(!showCart)}
            className="relative"
            variant={showCart ? "default" : "outline"}
          >
            {showCart ? 'View Products' : 'View Cart'}
            {!showCart && cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {!showCart ? (
        <>
          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {CATEGORIES.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="text-sm"
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="max-h-full object-contain"
                  />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <span className="font-bold">${product.price.toFixed(2)}</span>
                  </div>
                  <p className="text-gray-600 text-sm mt-2 line-clamp-2">{product.description}</p>
                  <div className="flex justify-between items-center mt-4">
                    <span className={`text-sm ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </span>
                    <Button 
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                      size="sm"
                    >
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No products found matching your criteria.</p>
            </div>
          )}
        </>
      ) : (
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Shopping Cart</h3>
          
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Your cart is empty.</p>
              <Button 
                onClick={() => setShowCart(false)}
                className="mt-4"
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {cart.map(item => (
                  <div key={item.id} className="py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="max-h-full object-contain"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-gray-600 text-sm">${item.price.toFixed(2)} each</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center border border-gray-300 rounded-md">
                        <button 
                          className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          -
                        </button>
                        <span className="px-4 py-1">{item.quantity}</span>
                        <button 
                          className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="text-right min-w-[80px]">
                        <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                
                <div className="mt-6 flex justify-between">
                  <Button 
                    variant="outline"
                    onClick={() => setShowCart(false)}
                  >
                    Continue Shopping
                  </Button>
                  
                  <Button>
                    Checkout
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default EcommercePlayground;
