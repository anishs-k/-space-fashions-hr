import React from 'react';
import { Database, LogIn, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ===== TEMPORARY SITE-WIDE CREDENTIALS =====
// Google/Supabase auth ko filhaal bypass kiya gaya hai.
// Ye credentials client-side hain — sirf casual access-gate ke liye,
// real security nahi. Google auth wapas aane par ye file hata dena.
const SITE_USERNAME = 'admin';
const SITE_PASSWORD = 'spacefashions@2026';

export const SESSION_KEY = 'sf_hr_logged_in';
export const SESSION_USER_KEY = 'sf_hr_user';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (username.trim() === SITE_USERNAME && password === SITE_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      sessionStorage.setItem(SESSION_USER_KEY, username.trim());
      onLoginSuccess();
      return;
    }

    setError('ACCESS_DENIED // INVALID_CREDENTIALS');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="mx-auto w-16 h-16 bg-[#141414] rounded flex items-center justify-center text-[#E4E3E0]">
          <Database className="w-8 h-8" />
        </div>
        <div>
          <h1 className="font-serif italic text-4xl tracking-tight">Space Fashions</h1>
          <p className="font-mono text-xs uppercase font-bold opacity-50 mt-2">Centralized HR Systems</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 border border-[#141414]/10 bg-[#141414]/5 space-y-6 text-left">
          <p className="font-mono text-[10px] opacity-60 leading-relaxed uppercase text-center">
            Access restricted to authorized personnel only. Enter your site credentials to continue.
          </p>

          <div className="space-y-2">
            <Label htmlFor="username" className="font-mono text-[10px] uppercase font-bold opacity-60">
              Username
            </Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-none font-mono text-xs h-11 bg-[#E4E3E0] border-[#141414]/20"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-mono text-[10px] uppercase font-bold opacity-60">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-none font-mono text-xs h-11 bg-[#E4E3E0] border-[#141414]/20"
              required
            />
          </div>

          {error && (
            <p className="font-mono text-[10px] uppercase font-bold text-red-600 flex items-center gap-2">
              <Lock className="w-3 h-3" />
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full rounded-none bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 font-mono text-xs h-12 gap-3"
          >
            <LogIn className="w-4 h-4" />
            AUTHENTICATE
          </Button>
        </form>

        <div className="font-mono text-[8px] opacity-30 uppercase tracking-widest">
          Protocol v4.0.1 // Secured by Antigravity Ops
        </div>
      </div>
    </div>
  );
}
