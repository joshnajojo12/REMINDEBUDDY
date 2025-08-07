
'use client';

import { useState } from 'react';

interface AuthPageProps {
  onLogin: (email: string, password: string, gender?: 'male' | 'female') => void;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email, password, isSignUp ? gender : undefined);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-12 w-full max-w-lg">
        {/* Simple Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <i className="ri-heart-pulse-fill text-4xl text-white"></i>
          </div>
          <h1 className="text-5xl font-bold text-gray-800 mb-4">Medicine Buddy</h1>
          <p className="text-2xl text-gray-600">
            {isSignUp ? 'Create Your Account' : 'Welcome Back'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-gray-700 text-2xl font-bold mb-4">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-2xl font-bold mb-4">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none"
              placeholder="Enter your password"
              required
            />
          </div>

          {isSignUp && (
            <div>
              <label className="block text-gray-700 text-2xl font-bold mb-6">I am...</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`p-6 rounded-2xl text-xl font-bold transition-all ${
                    gender === 'male'
                      ? 'bg-blue-500 text-white shadow-xl'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="text-4xl mb-2">👨</div>
                  Grandpa
                </button>
                
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`p-6 rounded-2xl text-xl font-bold transition-all ${
                    gender === 'female'
                      ? 'bg-pink-500 text-white shadow-xl'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="text-4xl mb-2">👵</div>
                  Grandma
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-500 text-white text-2xl font-bold py-6 rounded-2xl hover:bg-blue-600 transition-colors shadow-lg cursor-pointer whitespace-nowrap"
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-8">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-600 text-xl font-bold hover:text-blue-800 cursor-pointer"
          >
            {isSignUp 
              ? 'Already have an account? Sign in' 
              : "Don't have an account? Sign up"
            }
          </button>
        </div>

        {/* Simple Benefits */}
        <div className="mt-10 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-600 text-xl font-bold mb-6">What you'll get:</p>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-gray-700 text-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📞</span>
              </div>
              <span>Phone calls to remind you</span>
            </div>
            <div className="flex items-center gap-4 text-gray-700 text-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">💊</span>
              </div>
              <span>Easy medicine tracking</span>
            </div>
            <div className="flex items-center gap-4 text-gray-700 text-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">👨‍⚕️</span>
              </div>
              <span>Family can help you</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
