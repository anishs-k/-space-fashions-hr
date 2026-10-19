import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Employee } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Printer, UserPlus, UserMinus } from 'lucide-react';
import { formatDateDisplay, normalizeDate } from '@/lib/utils';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface JoinLeftReportProps {
  employees: Employee[];
  loading: boolean;
}

// Joining date may still sit under the older imported key
const joiningDateOf = (emp: Employee) => normalizeDate(emp.dateOfJoining || (emp as any).date_of_joining);
const leavingDateOf = (emp: Employee) => normalizeDate(emp.dateOfLeaving);

// "YYYY-MM" prefix of an ISO date, for matching against the selected month
const monthKey = (year: number, month: number) => `${year}-${String(month + 1).padStart(2, '0')}`;

export function JoinLeftReport({ employees, loading }: JoinLeftReportProps) {
  const navigate = useNavigate();
  const today = new Date();
  const [month, setMonth] = React.useState(today.getMonth());
  const [year, setYear] = React.useState(today.getFullYear());

  // Years that actually appear in the data, plus the current year
  const years = React.useMemo(() => {
    const set = new Set<number>([today.getFullYear()]);
    employees.forEach(emp => {
      [joiningDateOf(emp), leavingDateOf(emp)].forEach(iso => {
        if (iso) set.add(Number(iso.slice(0, 4)));
      });
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [employees]);

  const key = monthKey(year, month);
  const byDate = (getDate: (e: Employee) => string) => (a: Employee, b: Employee) => getDate(a).localeCompare(getDate(b));

  const joined = employees
    .filter(emp => joiningDateOf(emp).startsWith(key))
    .sort(byDate(joiningDateOf));

  const left = employees
    .filter(emp => emp.status === 'inactive' && leavingDateOf(emp).startsWith(key))
    .sort(byDate(leavingDateOf));

  const periodLabel = `${MONTHS[month]} ${year}`;
  const selectClass = "h-9 rounded-none bg-transparent border border-[#141414]/20 font-mono text-xs px-3 focus:outline-none focus:ring-1 focus:ring-[#141414]";

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-end justify-between border-b border-[#141414]/10 pb-6 print:hidden">
        <div>
          <h2 className="font-serif italic text-2xl tracking-tight">Monthly Join / Left Report</h2>
          <p className="text-[10px] opacity-50 uppercase mt-1">
            {periodLabel}: {joined.length} joined, {left.length} left
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label className="font-mono text-[10px] opacity-50">MONTH</Label>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={`${selectClass} w-36`}>
              {MONTHS.map((name, i) => (
                <option key={name} value={i}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="font-mono text-[10px] opacity-50">YEAR</Label>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={`${selectClass} w-24`}>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <Button
            onClick={() => window.print()}
            className="rounded-none bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 text-xs h-9 gap-2 font-bold"
          >
            <Printer className="w-3.5 h-3.5" />
            PRINT_REPORT
          </Button>
        </div>
      </div>

      <div id="print-sheet" className="space-y-8 print:px-[12mm] print:py-[10mm] print:box-decoration-clone">
        {/* Print-only header */}
        <div className="hidden print:block text-center border-b-2 border-black pb-3 space-y-1">
          <h1 className="font-serif italic text-2xl font-bold uppercase tracking-wider">SPACE FASHIONS LIMITED</h1>
          <p className="text-[10px] tracking-wide">E-439-440, Focal Point, Phase-6, Ludhiana-141010.</p>
          <h2 className="text-sm font-bold uppercase tracking-wide">Join / Left Report: {periodLabel}</h2>
        </div>

        <ReportTable
          title="Joined Employees"
          icon={<UserPlus className="w-4 h-4 opacity-50" />}
          dateLabel="Joining Date"
          rows={joined}
          getDate={joiningDateOf}
          loading={loading}
          emptyText={`No employee joined in ${periodLabel}`}
          onRowClick={(emp) => navigate(`/edit/${emp.id}`)}
        />

        <ReportTable
          title="Left / Resigned Employees"
          icon={<UserMinus className="w-4 h-4 opacity-50" />}
          dateLabel="Leaving Date"
          rows={left}
          getDate={leavingDateOf}
          loading={loading}
          emptyText={`No employee left in ${periodLabel}`}
          onRowClick={(emp) => navigate(`/edit/${emp.id}`)}
          highlightDate
        />
      </div>
    </div>
  );
}

interface ReportTableProps {
  title: string;
  icon: React.ReactNode;
  dateLabel: string;
  rows: Employee[];
  getDate: (emp: Employee) => string;
  loading: boolean;
  emptyText: string;
  onRowClick: (emp: Employee) => void;
  highlightDate?: boolean;
}

function ReportTable({ title, icon, dateLabel, rows, getDate, loading, emptyText, onRowClick, highlightDate }: ReportTableProps) {
  const th = "text-left font-serif italic text-[10px] uppercase opacity-60 font-normal py-2 px-3";

  return (
    <section>
      <div className="flex items-center gap-2 border-b border-[#141414]/20 pb-1.5 mb-3">
        {icon}
        <h3 className="font-mono text-[11px] uppercase font-bold tracking-widest opacity-80">
          {title} ({rows.length})
        </h3>
      </div>

      <div className="border border-[#141414]/10 overflow-x-auto bg-white/40 print:bg-white">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-[#141414]/5 border-b border-[#141414]/10">
            <tr>
              <th className={`${th} w-10`}>#</th>
              <th className={th}>Emp Code</th>
              <th className={th}>Name</th>
              <th className={th}>Department</th>
              <th className={th}>Post</th>
              <th className={th}>Category</th>
              <th className={th}>{dateLabel}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#141414]/5">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 opacity-30">INITIALIZING_DATA_STREAM...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 opacity-40 italic">{emptyText}</td></tr>
            ) : (
              rows.map((emp, i) => (
                <tr
                  key={emp.id}
                  onClick={() => onRowClick(emp)}
                  className="cursor-pointer hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors print:hover:bg-transparent print:hover:text-inherit"
                >
                  <td className="py-2 px-3 opacity-50">{i + 1}</td>
                  <td className="py-2 px-3">{emp.employeeCode || emp.id.slice(0, 8)}</td>
                  <td className="py-2 px-3 font-bold">{emp.name || 'N/A'}</td>
                  <td className="py-2 px-3">{emp.department || 'N/A'}</td>
                  <td className="py-2 px-3">{emp.postAppliedFor || 'N/A'}</td>
                  <td className="py-2 px-3">{emp.category || 'N/A'}</td>
                  <td className={`py-2 px-3 font-bold whitespace-nowrap ${highlightDate ? 'text-red-700' : ''}`}>
                    {formatDateDisplay(getDate(emp))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
