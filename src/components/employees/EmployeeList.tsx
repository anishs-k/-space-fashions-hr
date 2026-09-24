import React from 'react';
import { supabase, fetchAllRows } from '@/lib/supabase';
import { Employee, NonEmployee } from '@/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, ArrowUpRight, Users, ClipboardList, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { pdfSeedData, seedDatabase } from '@/lib/seed';
import { NonEmployeeList } from '@/components/nonEmployees/NonEmployeeList';

export function EmployeeList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'queries' ? 'queries' : 'employees';

  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    let mounted = true;

    const fetchEmployees = async () => {
      try {
        const data = await fetchAllRows('employees');
        if (!mounted) return;
        
        if (data && data.length > 0) {
          const list = data.map((row: any) => ({ id: row.id, ...row.data })) as Employee[];
          list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setEmployees(list);
        } else {
          setEmployees([]);
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
        if (!mounted) return;
        setEmployees([]);
      }
      setLoading(false);
    };

    fetchEmployees();

    const channel = supabase
      .channel('employees-list-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, fetchEmployees)
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const handleTabChange = (tab: 'employees' | 'queries') => {
    setSearchParams({ tab });
  };

  const handleConvertToEmployee = (candidate: NonEmployee) => {
    navigate('/add?type=employee', { state: { prefillCandidate: candidate } });
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.postAppliedFor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.jobProcessAssigned && emp.jobProcessAssigned.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 font-mono">
      {/* Segmented Tab Switcher */}
      <div className="flex border-b border-[#141414]/15 gap-4">
        <button
          onClick={() => handleTabChange('employees')}
          className={`flex items-center gap-2.5 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'employees'
              ? 'border-[#141414] text-[#141414] bg-[#141414]/5'
              : 'border-transparent text-[#141414]/50 hover:text-[#141414] hover:bg-[#141414]/5'
          }`}
        >
          <Users className="w-4 h-4" />
          Registered Employees ({employees.length})
        </button>

        <button
          onClick={() => handleTabChange('queries')}
          className={`flex items-center gap-2.5 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'queries'
              ? 'border-[#141414] text-[#141414] bg-[#141414]/5'
              : 'border-transparent text-[#141414]/50 hover:text-[#141414] hover:bg-[#141414]/5'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Non-Employee & Queries (Items 1-31)
        </button>
      </div>

      {activeTab === 'queries' ? (
        <NonEmployeeList onConvertToEmployee={handleConvertToEmployee} />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-[#141414]/10 pb-6">
            <div>
              <h2 className="font-serif italic text-2xl tracking-tight">Personnel Directory</h2>
              <p className="text-[10px] opacity-50 uppercase mt-1">Found {filteredEmployees.length} registered entities</p>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 opacity-30 text-[#141414]" />
                <Input 
                  placeholder="SEARCH_BY_NAME_OR_DEPT..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-xs bg-transparent border-[#141414]/20 focus-visible:ring-[#141414] rounded-none h-9"
                />
              </div>

              <Button
                onClick={() => navigate('/add?type=employee')}
                className="rounded-none bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 text-xs h-9 gap-2 font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                ADD_EMPLOYEE
              </Button>
            </div>
          </div>

          <div className="border border-[#141414]/10 overflow-hidden bg-white/40">
            <Table className="text-xs">
              <TableHeader className="bg-[#141414]/5 border-b border-[#141414]/10">
                <TableRow>
                  <TableHead className="font-serif italic text-[10px] uppercase opacity-50 h-10">EMP_CODE</TableHead>
                  <TableHead className="font-serif italic text-[10px] uppercase opacity-50 h-10">Name</TableHead>
                  <TableHead className="font-serif italic text-[10px] uppercase opacity-50 h-10">Category</TableHead>
                  <TableHead className="font-serif italic text-[10px] uppercase opacity-50 h-10">Post</TableHead>
                  <TableHead className="font-serif italic text-[10px] uppercase opacity-50 h-10">Department</TableHead>
                  <TableHead className="font-serif italic text-[10px] uppercase opacity-50 h-10 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 opacity-30">INITIALIZING_DATA_STREAM...</TableCell>
                  </TableRow>
                ) : filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 opacity-30">NO_RECORDS_MATCH_CRITERIA</TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((emp) => (
                    <TableRow 
                      key={emp.id} 
                      className="group hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors cursor-pointer border-b border-[#141414]/5"
                      onClick={() => navigate(`/edit/${emp.id}`)}
                    >
                      <TableCell className="opacity-40">{emp.employeeCode || emp.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-bold flex items-center gap-2">
                        {emp.name}
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-none text-[8px] h-4 border-[#141414]/20 text-inherit">
                          {emp.category || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>{emp.postAppliedFor}</div>
                        {emp.jobProcessAssigned && (
                          <div className="text-[9px] opacity-60 italic">{emp.jobProcessAssigned}</div>
                        )}
                      </TableCell>
                      <TableCell>{emp.department}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={emp.status === 'active' ? 'default' : 'secondary'} className="rounded-none text-[10px] h-5 bg-transparent border-[#141414]/30 text-inherit">
                          {emp.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

