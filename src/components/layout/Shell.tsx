import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  FileText, 
  LayoutDashboard, 
  LogOut,
  Menu,
  X,
  Database
} from 'lucide-react';
import { supabase, signOut } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
  }, []);
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Personnel & Queries', href: '/employees', icon: Users },
    { name: 'AI Scanner', href: '/scan', icon: FileText },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const NavContent = () => (
    <div className="flex flex-col h-full bg-[#E4E3E0] border-r border-[#141414]/10">
      <div className="p-6 flex items-center gap-3 border-b border-[#141414]/10">
        <div className="p-2 bg-[#141414] rounded">
          <Database className="w-5 h-5 text-[#E4E3E0]" />
        </div>
        <div>
          <h1 className="font-serif italic text-sm opacity-50 uppercase tracking-widest">Space Fashions</h1>
          <p className="font-mono text-xs font-bold leading-none">HR DATABASE</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavLink
          to="/"
          onClick={() => setIsOpen(false)}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-4 py-3 text-sm font-mono transition-all border-b border-transparent hover:bg-[#141414] hover:text-[#E4E3E0]",
              isActive ? "bg-[#141414] text-[#E4E3E0] border-[#141414]" : "text-[#141414]"
            )
          }
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </NavLink>

        <NavLink
          to="/employees"
          onClick={() => setIsOpen(false)}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-4 py-3 text-sm font-mono transition-all border-b border-transparent hover:bg-[#141414] hover:text-[#E4E3E0]",
              isActive ? "bg-[#141414] text-[#E4E3E0] border-[#141414]" : "text-[#141414]"
            )
          }
        >
          <Users className="w-4 h-4" />
          Directory & Queries
        </NavLink>

        {/* Manual Add Section with 2 options */}
        <div className="pt-3 pb-1">
          <div className="px-4 py-1 text-[10px] uppercase font-mono font-bold opacity-40 tracking-wider">
            MANUAL ADD OPTIONS
          </div>

          <div className="pl-2 space-y-1 mt-1">
            <NavLink
              to="/add?type=employee"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => {
                const isMatch = window.location.pathname === '/add' && (!window.location.search || window.location.search.includes('type=employee'));
                return cn(
                  "flex items-center gap-2.5 px-3 py-2 text-xs font-mono transition-all hover:bg-[#141414] hover:text-[#E4E3E0]",
                  isMatch ? "bg-[#141414] text-[#E4E3E0] font-bold" : "text-[#141414] opacity-80"
                );
              }}
            >
              <UserPlus className="w-3.5 h-3.5" />
              1. Employee (Bio-Data)
            </NavLink>

            <NavLink
              to="/add?type=non-employee"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => {
                const isMatch = window.location.pathname === '/add' && window.location.search.includes('type=non-employee');
                return cn(
                  "flex items-center gap-2.5 px-3 py-2 text-xs font-mono transition-all hover:bg-[#141414] hover:text-[#E4E3E0]",
                  isMatch ? "bg-[#141414] text-[#E4E3E0] font-bold" : "text-[#141414] opacity-80"
                );
              }}
            >
              <span className="w-3.5 h-3.5 flex items-center justify-center font-bold text-[10px] border border-current">
                31
              </span>
              2. Non-Employee (Query)
            </NavLink>
          </div>
        </div>

        <NavLink
          to="/scan"
          onClick={() => setIsOpen(false)}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-4 py-3 text-sm font-mono transition-all border-b border-transparent hover:bg-[#141414] hover:text-[#E4E3E0]",
              isActive ? "bg-[#141414] text-[#E4E3E0] border-[#141414]" : "text-[#141414]"
            )
          }
        >
          <FileText className="w-4 h-4" />
          AI Scanner
        </NavLink>
      </nav>

      <div className="p-4 border-t border-[#141414]/10">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 font-mono hover:bg-destructive hover:text-destructive-foreground"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#E4E3E0] text-[#141414]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 print:hidden">
        <NavContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:pl-64 flex flex-col print:pl-0">
        {/* Header */}
        <header className="h-16 border-b border-[#141414]/10 bg-[#E4E3E0]/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-6 print:hidden">
          <div className="flex items-center gap-4">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger
                render={
                  <button className="md:hidden cursor-pointer p-2 hover:bg-[#141414]/5 transition-colors border-none bg-transparent">
                    <Menu className="w-5 h-5" />
                  </button>
                }
              />
              <SheetContent side="left" className="p-0 w-64">
                <NavContent />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <span className="font-serif italic text-xs opacity-50 uppercase tracking-tighter">Current Section //</span>
              <span className="font-mono text-xs uppercase font-bold">
                {navItems.find(i => window.location.pathname === i.href)?.name || 'Overview'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="font-mono text-[10px] leading-tight opacity-50">SYSTEM_STATUS</p>
              <p className="font-mono text-[10px] leading-tight font-bold text-green-600 underline underline-offset-2">CONNECTED_SUPABASE</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#141414] flex items-center justify-center text-[#E4E3E0] font-mono text-xs">
              {userEmail?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto print:p-0">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
