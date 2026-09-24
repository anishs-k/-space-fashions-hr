import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { NonEmployee } from '@/types';
import { NonEmployeeForm } from './NonEmployeeForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { nonEmployeeSeedData } from '@/lib/seed';

export function EditNonEmployee() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = React.useState<NonEmployee | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const { data: row, error } = await supabase.from('non_employees').select('id, data').eq('id', id).single();
        if (row && !error) {
          setCandidate({ id: row.id, ...row.data } as NonEmployee);
        } else {
          const localMatch = nonEmployeeSeedData.find(c => c.id === id || c.srNo === id);
          if (localMatch) {
            setCandidate(localMatch as unknown as NonEmployee);
          } else {
            toast.error('RECORD_NOT_FOUND');
            navigate('/employees?tab=queries');
          }
        }
      } catch (err) {
        const localMatch = nonEmployeeSeedData.find(c => c.id === id || c.srNo === id);
        if (localMatch) {
          setCandidate(localMatch as unknown as NonEmployee);
        } else {
          console.error(err);
          toast.error('ERROR_LOADING_RECORD');
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, navigate]);

  const handleConvertToEmployee = (candidateData: NonEmployee) => {
    // Navigate to /add with state prefilled
    navigate('/add?type=employee', { state: { prefillCandidate: candidateData } });
  };

  if (loading) {
    return (
      <div className="p-12 text-center font-mono text-xs opacity-50">
        LOADING_NON_EMPLOYEE_RECORD...
      </div>
    );
  }

  if (!candidate) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#141414]/10 pb-4">
        <Button
          variant="outline"
          onClick={() => navigate('/employees?tab=queries')}
          className="rounded-none border-[#141414]/20 font-mono text-xs gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK_TO_QUERIES
        </Button>
        <span className="font-mono text-xs font-bold opacity-60">
          EDITING_RECORD: {candidate.srNo || candidate.id}
        </span>
      </div>

      <NonEmployeeForm
        initialData={candidate}
        onSuccess={() => navigate('/employees?tab=queries')}
        onConvertToEmployee={handleConvertToEmployee}
      />
    </div>
  );
}
