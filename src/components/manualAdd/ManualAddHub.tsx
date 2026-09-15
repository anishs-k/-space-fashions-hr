import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { EmployeeForm } from '@/components/employees/EmployeeForm';
import { NonEmployeeForm } from '@/components/nonEmployees/NonEmployeeForm';
import { UserPlus, ClipboardList, Users, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NonEmployee } from '@/types';

export function ManualAddHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeType = searchParams.get('type') === 'non-employee' ? 'non-employee' : 'employee';

  const handleTypeChange = (type: 'employee' | 'non-employee') => {
    setSearchParams({ type });
  };

  const handleConvertToEmployee = (candidateData: NonEmployee) => {
    // Switch to employee tab and prefill
    navigate('/add?type=employee', { state: { prefillCandidate: candidateData } });
  };

  return (
    <div className="space-y-6">
      {/* Top Selector Banner */}
      <div className="bg-[#141414]/5 border border-[#141414]/15 p-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Option 1: Employee Registration */}
          <button
            type="button"
            onClick={() => handleTypeChange('employee')}
            className={`flex items-center gap-3.5 p-3.5 text-left transition-all font-mono ${
              activeType === 'employee'
                ? 'bg-[#141414] text-[#E4E3E0] shadow-sm'
                : 'bg-transparent text-[#141414] hover:bg-[#141414]/10 opacity-70 hover:opacity-100'
            }`}
          >
            <div className={`p-2 rounded ${activeType === 'employee' ? 'bg-[#E4E3E0] text-[#141414]' : 'bg-[#141414]/10 text-[#141414]'}`}>
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                1. Employee Registration
                {activeType === 'employee' && (
                  <span className="text-[9px] bg-green-500 text-white px-1.5 py-0.2 rounded font-bold">ACTIVE</span>
                )}
              </div>
              <p className="text-[10px] opacity-70 mt-0.5 leading-tight">
                Full 3-page Bio-Data, Statutory Deductions, Nominee & Family Details
              </p>
            </div>
          </button>

          {/* Option 2: Non-Employee Database */}
          <button
            type="button"
            onClick={() => handleTypeChange('non-employee')}
            className={`flex items-center gap-3.5 p-3.5 text-left transition-all font-mono ${
              activeType === 'non-employee'
                ? 'bg-[#141414] text-[#E4E3E0] shadow-sm'
                : 'bg-transparent text-[#141414] hover:bg-[#141414]/10 opacity-70 hover:opacity-100'
            }`}
          >
            <div className={`p-2 rounded ${activeType === 'non-employee' ? 'bg-[#E4E3E0] text-[#141414]' : 'bg-[#141414]/10 text-[#141414]'}`}>
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                2. Non-Employee Database
                {activeType === 'non-employee' && (
                  <span className="text-[9px] bg-amber-400 text-black px-1.5 py-0.2 rounded font-bold">ACTIVE</span>
                )}
              </div>
              <p className="text-[10px] opacity-70 mt-0.5 leading-tight">
                Items 1-31: Queries, Conditional Interview Gates (17-23) & Offers (24-31)
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Render Selected Form */}
      <div>
        <AnimatePresence mode="wait">
          {activeType === 'employee' ? (
            <motion.div
              key="employee-form"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <EmployeeForm />
            </motion.div>
          ) : (
            <motion.div
              key="non-employee-form"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <NonEmployeeForm onConvertToEmployee={handleConvertToEmployee} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
