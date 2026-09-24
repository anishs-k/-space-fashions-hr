import React from 'react';
import { supabase, fetchAllRows } from '@/lib/supabase';
import { Employee, NonEmployee } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, TrendingUp, AlertCircle, Database, ClipboardList, UserPlus, ArrowRight, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { seedDatabase, pdfSeedData, nonEmployeeSeedData } from '@/lib/seed';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const navigate = useNavigate();
  const [isSeeding, setIsSeeding] = React.useState(false);
  const [stats, setStats] = React.useState({
    total: 0,
    active: 0,
    departments: 0,
    recentCount: 0,
    totalQueries: 0,
    interviewedQueries: 0,
    offeredQueries: 0,
  });

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedDatabase();
      toast.success('SAMPLE_DATA_SUCCESSFULLY_DIGITIZED_FROM_PDF');
    } catch (error) {
      toast.error('FAILED_TO_SEED_DATA');
    } finally {
      setIsSeeding(false);
    }
  };

  React.useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      let employees: Employee[] = [];
      let candidates: NonEmployee[] = [];

      try {
        const empRows = await fetchAllRows('employees', 'id, data');
        if (!mounted) return;

        if (empRows && empRows.length > 0) {
          employees = empRows.map((r: any) => ({ id: r.id, ...(r.data || {}) })) as Employee[];
        } else {
          employees = [];
        }

        const nonEmpRows = await fetchAllRows('non_employees', 'id, data');
        if (!mounted) return;

        if (nonEmpRows && nonEmpRows.length > 0) {
          candidates = nonEmpRows.map((r: any) => ({ id: r.id, ...(r.data || {}) })) as NonEmployee[];
        } else {
          candidates = [];
        }
      } catch (err) {
        console.error('Dashboard stats fetch error:', err);
        if (!mounted) return;
        employees = [];
        candidates = [];
      }

      if (!mounted) return;

      const depts = new Set(employees.map(e => e.department).filter(Boolean));
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      setStats({
        total: employees.length,
        active: employees.filter(e => (e.status || 'active') === 'active').length,
        departments: depts.size,
        recentCount: employees.filter(e => e.createdAt && new Date(e.createdAt as any) > weekAgo).length,
        totalQueries: candidates.length,
        interviewedQueries: candidates.filter(c => c.calledForInterview).length,
        offeredQueries: candidates.filter(c => c.offeredToJoin).length,
      });
    };

    fetchStats();

    const channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'non_employees' }, fetchStats)
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const statCards = [
    { label: 'TOTAL_PERSONNEL', value: stats.total, icon: Users, color: 'text-blue-600' },
    { label: 'ACTIVE_ENTITIES', value: stats.active, icon: TrendingUp, color: 'text-green-600' },
    { label: 'CANDIDATE_QUERIES', value: stats.totalQueries, icon: ClipboardList, color: 'text-amber-600' },
    { label: 'OFFERED_TO_JOIN', value: stats.offeredQueries, icon: UserCheck, color: 'text-purple-600' }
  ];

  return (
    <div className="space-y-8 font-mono">
      <div className="border-b border-[#141414]/10 pb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="font-serif italic text-3xl tracking-tight">Executive Summary</h2>
            <p className="text-[10px] opacity-50 uppercase mt-1">Real-time database & candidate query metrics</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleSeed} 
            disabled={isSeeding || (stats.total > 0 && stats.totalQueries > 0)}
            className="rounded-none border-[#141414] text-xs gap-2"
          >
            <Database className="w-3 h-3" />
            {isSeeding ? 'DIGITIZING...' : (stats.total > 0 && stats.totalQueries > 0) ? 'SYSTEM_POPULATED' : 'SEED_DEMO_RECORDS'}
          </Button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="rounded-none border-[#141414]/10 bg-transparent shadow-none hover:border-[#141414]/30 active:scale-[0.98] transition-all cursor-default">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] tracking-widest opacity-50">{stat.label}</CardTitle>
                <stat.icon className={stat.color + " w-4 h-4 opacity-50"} />
              </CardHeader>
              <CardContent>
                <div className="font-serif italic text-4xl">{stat.value}</div>
                <div className="text-[8px] opacity-30 uppercase mt-1">Live_Sync_Active</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Manual Add Quick Actions (Employee vs Non-Employee) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          onClick={() => navigate('/add?type=employee')}
          className="p-6 border border-[#141414]/20 bg-[#141414]/5 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#141414] text-[#E4E3E0] group-hover:bg-[#E4E3E0] group-hover:text-[#141414] transition-colors">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif italic text-base font-bold">Manual Add: Employee</h3>
                <p className="text-[10px] opacity-60 mt-0.5">3-Page Bio-Data & Statutory Formulation</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        <div 
          onClick={() => navigate('/add?type=non-employee')}
          className="p-6 border border-[#141414]/20 bg-[#141414]/5 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#141414] text-[#E4E3E0] group-hover:bg-[#E4E3E0] group-hover:text-[#141414] transition-colors">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif italic text-base font-bold">Manual Add: Non-Employee</h3>
                <p className="text-[10px] opacity-60 mt-0.5">Items 1-31: Query, Interview & Offer Breakdown</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-none border-[#141414]/10 bg-[#141414]/5 shadow-none p-6">
          <h3 className="font-serif italic text-sm mb-4 border-b border-[#141414]/10 pb-2">SYSTEM_LOGS_ACTIVE</h3>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 text-[10px]">
                <span className="opacity-30">[{new Date().toLocaleTimeString()}]</span>
                <span className="text-green-600 underline">AUTH_SUCCESS</span>
                <span className="opacity-50">User session synchronized with Space Fashions DB</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-none border-[#141414]/10 bg-[#141414]/5 shadow-none p-6 relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] opacity-5 pointer-events-none transform rotate-12">
            <Users className="w-64 h-64" />
          </div>
          <h3 className="font-serif italic text-sm mb-4 border-b border-[#141414]/10 pb-2">NON_EMPLOYEE_WORKFLOW</h3>
          <p className="text-[10px] leading-relaxed opacity-60">
            Candidate query records automatically support the 17-23 Interview Gate and 24-31 Compensation Gate. Candidates offered to join can be directly converted into registered employee records in one click.
          </p>
        </Card>
      </div>
    </div>
  );
}

