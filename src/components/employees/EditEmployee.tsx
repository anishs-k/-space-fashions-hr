import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Employee } from '@/types';
import { EmployeeForm } from './EmployeeForm';
import { EmployeeBioData } from './EmployeeBioData';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function EditEmployee() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = React.useState<Employee | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<'edit' | 'bio-data'>('edit');

  React.useEffect(() => {
    async function fetchEmployee() {
      if (!id) return;
      
      try {
        const { data: row, error } = await supabase.from('employees').select('id, data').eq('id', id).single();

        if (row && !error) {
          setEmployee({ id: row.id, ...row.data } as Employee);
        } else {
          toast.error('EMPLOYEE_NOT_FOUND');
          navigate('/employees');
        }
      } catch (error) {
        console.error(error);
        toast.error('FAILED_TO_LOAD_EMPLOYEE_DATA');
      } finally {
        setLoading(false);
      }
    }

    fetchEmployee();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin opacity-20" />
        <p className="font-mono text-[10px] opacity-30 uppercase tracking-widest">Retrieving_Data_From_Archive...</p>
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="space-y-6">
      {/* Header - Hidden during print */}
      <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/employees')}
            className="rounded-none hover:bg-[#141414] hover:text-[#E4E3E0]"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="font-serif italic text-2xl tracking-tight">Personnel Dossier</h2>
            <p className="font-mono text-[10px] opacity-50 uppercase mt-1">Modifying record: {employee.employeeCode || employee.id}</p>
          </div>
        </div>

        {/* View Switcher Toggles */}
        <div className="flex border border-[#141414]/15 bg-[#141414]/5 p-1 w-full sm:w-80">
          <button 
            type="button"
            onClick={() => setViewMode('edit')}
            className={`flex-1 text-center py-1.5 font-mono text-[9px] uppercase transition-colors rounded-none ${viewMode === 'edit' ? 'bg-[#141414] text-[#E4E3E0]' : 'text-[#141414] hover:bg-[#141414]/5'}`}
          >
            [EDIT_PROFILE_FORM]
          </button>
          <button 
            type="button"
            onClick={() => setViewMode('bio-data')}
            className={`flex-1 text-center py-1.5 font-mono text-[9px] uppercase transition-colors rounded-none ${viewMode === 'bio-data' ? 'bg-[#141414] text-[#E4E3E0]' : 'text-[#141414] hover:bg-[#141414]/5'}`}
          >
            [PRINT_BIO_DATA]
          </button>
        </div>
      </div>
      
      {/* Active Component */}
      {viewMode === 'edit' ? (
        <EmployeeForm initialData={employee} />
      ) : (
        <EmployeeBioData employee={employee} />
      )}
    </div>
  );
}
