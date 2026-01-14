'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard'); 
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-md rounded-3xl bg-zinc-900/70 border border-zinc-800 p-8 backdrop-blur-xl shadow-2xl">
        
        <h1 className="text-3xl font-bold text-center">Welcome back</h1>
        <p className="text-center text-zinc-400 mt-2">Sign in to your dashboard</p>

        <form className="mt-8 space-y-5" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-black border border-zinc-800 focus:border-violet-500 outline-none transition"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-black border border-zinc-800 focus:border-violet-500 outline-none transition"
          />

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-500">
          Don’t have an account?{" "}
          <span className="text-violet-400 hover:underline cursor-pointer">
            Sign up
          </span>
        </div>
      </div>
    </main>
  );
}