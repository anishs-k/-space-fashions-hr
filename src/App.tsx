import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Shell } from '@/components/layout/Shell';
import { Dashboard } from '@/components/Dashboard';
import { EmployeeList } from '@/components/employees/EmployeeList';
import { EmployeeForm } from '@/components/employees/EmployeeForm';
import { EditEmployee } from '@/components/employees/EditEmployee';
import { AIExtractor } from '@/components/employees/AIExtractor';
import { ManualAddHub } from '@/components/manualAdd/ManualAddHub';
import { EditNonEmployee } from '@/components/nonEmployees/EditNonEmployee';
import { LoginPage, SESSION_KEY } from '@/components/auth/LoginPage';
// import { supabase, signInWithGoogle } from '@/lib/supabase';
// import type { User } from '@supabase/supabase-js';
// import { Button } from '@/components/ui/button';
// import { Database, LogIn } from 'lucide-react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(
    () => sessionStorage.getItem(SESSION_KEY) === 'true'
  );

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  // ===== ORIGINAL SUPABASE/GOOGLE AUTH (commented out for now) =====
  // Wapas chalu karna ho to upar wale LoginPage block ko hatao aur
  // neeche ka code + upar ke commented imports uncomment kar do.
  //
  // const [user, setUser] = React.useState<User | null>(null);
  // const [loading, setLoading] = React.useState(true);
  //
  // React.useEffect(() => {
  //   supabase.auth.getSession().then(({ data: { session } }) => {
  //     setUser(session?.user ?? null);
  //     setLoading(false);
  //   });
  //
  //   const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
  //     setUser(session?.user ?? null);
  //     setLoading(false);
  //   });
  //
  //   return () => subscription.unsubscribe();
  // }, []);
  //
  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center font-mono text-xs opacity-50">
  //       LOADING_SATELLITE_CONNECTION...
  //     </div>
  //   );
  // }
  //
  // if (!user) {
  //   return (
  //     <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-6">
  //       <div className="max-w-md w-full space-y-8 text-center">
  //         <div className="mx-auto w-16 h-16 bg-[#141414] rounded flex items-center justify-center text-[#E4E3E0]">
  //           <Database className="w-8 h-8" />
  //         </div>
  //         <div>
  //           <h1 className="font-serif italic text-4xl tracking-tight">Space Fashions</h1>
  //           <p className="font-mono text-xs uppercase font-bold opacity-50 mt-2">Centralized HR Systems</p>
  //         </div>
  //
  //         <div className="p-8 border border-[#141414]/10 bg-[#141414]/5 space-y-6">
  //           <p className="font-mono text-[10px] opacity-60 leading-relaxed uppercase">
  //             Access restricted to authorized personnel only. Please verify your credentials via Google authentication.
  //           </p>
  //           <Button
  //             onClick={signInWithGoogle}
  //             className="w-full rounded-none bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 font-mono text-xs h-12 gap-3"
  //           >
  //             <LogIn className="w-4 h-4" />
  //             AUTHENTICATE_WITH_GOOGLE
  //           </Button>
  //         </div>
  //
  //         <div className="font-mono text-[8px] opacity-30 uppercase tracking-widest">
  //           Protocol v4.0.1 // Secured by Antigravity Ops
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }
  // ===== END ORIGINAL SUPABASE/GOOGLE AUTH =====

  return (
    <Router>
      <Shell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/employees" element={<EmployeeList />} />
          <Route path="/non-employees" element={<Navigate to="/employees?tab=queries" replace />} />
          <Route path="/edit/:id" element={<EditEmployee />} />
          <Route path="/edit-non-employee/:id" element={<EditNonEmployee />} />
          <Route path="/add" element={<ManualAddHub />} />
          <Route path="/scan" element={<AIExtractor />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Shell>
      <Toaster position="bottom-right" richColors />
    </Router>
  );
}
