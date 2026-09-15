import React from 'react';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { NonEmployee } from '@/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Plus, 
  Printer, 
  UserCheck, 
  Trash2, 
  Eye, 
  Edit3,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { NonEmployeeSlip } from './NonEmployeeSlip';

interface NonEmployeeListProps {
  onSelectCandidate?: (candidate: NonEmployee) => void;
  onConvertToEmployee?: (candidate: NonEmployee) => void;
}

export function NonEmployeeList({ onSelectCandidate, onConvertToEmployee }: NonEmployeeListProps) {
  const navigate = useNavigate();
  const [candidates, setCandidates] = React.useState<NonEmployee[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<'ALL' | 'INTERVIEWED' | 'SELECTED' | 'OFFERED' | 'QUERY'>('ALL');
  const [viewingCandidate, setViewingCandidate] = React.useState<NonEmployee | null>(null);

  React.useEffect(() => {
    const q = query(collection(db, 'non_employees'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NonEmployee));
      setCandidates(docs);
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete candidate query record for ${name}?`)) return;

    try {
      await deleteDoc(doc(db, 'non_employees', id));
      toast.success('CANDIDATE_RECORD_DELETED');
    } catch (err) {
      toast.error('FAILED_TO_DELETE_RECORD');
    }
  };

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.postAppliedFor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.srNo && c.srNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.contactNumber && c.contactNumber.includes(searchTerm));

    if (!matchesSearch) return false;

    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'INTERVIEWED') return c.calledForInterview;
    if (filterStatus === 'SELECTED') return c.resultOfInterview === 'Selected' || c.resultOfInterview === 'Passed';
    if (filterStatus === 'OFFERED') return c.offeredToJoin;
    if (filterStatus === 'QUERY') return !c.calledForInterview;
    return true;
  });

  if (viewingCandidate) {
    return (
      <NonEmployeeSlip
        data={viewingCandidate}
        onBack={() => setViewingCandidate(null)}
      />
    );
  }

  return (
    <div className="space-y-6 font-mono">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-[#141414]/10 pb-6">
        <div>
          <h2 className="font-serif italic text-2xl tracking-tight font-bold">
            Non-Employee & Candidate Query Register
          </h2>
          <p className="text-[10px] opacity-50 uppercase mt-1">
            Found {filteredCandidates.length} query records // Items 1 to 31 Database
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-30 text-[#141414]" />
            <Input
              placeholder="SEARCH_BY_NAME_POST_PHONE..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs bg-transparent border-[#141414]/20 focus-visible:ring-[#141414] rounded-none h-9"
            />
          </div>

          <Button
            onClick={() => navigate('/add?type=non-employee')}
            className="rounded-none bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 text-xs h-9 gap-2 font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            NEW_NON_EMPLOYEE
          </Button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 text-xs">
        {[
          { key: 'ALL', label: 'ALL_QUERIES', count: candidates.length },
          { key: 'INTERVIEWED', label: 'INTERVIEWED (17-23)', count: candidates.filter(c => c.calledForInterview).length },
          { key: 'SELECTED', label: 'PASSED / SELECTED', count: candidates.filter(c => c.resultOfInterview === 'Selected' || c.resultOfInterview === 'Passed').length },
          { key: 'OFFERED', label: 'OFFERED TO JOIN (24-31)', count: candidates.filter(c => c.offeredToJoin).length },
          { key: 'QUERY', label: 'RAW_QUERIES (1-16)', count: candidates.filter(c => !c.calledForInterview).length }
        ].map(filter => (
          <button
            key={filter.key}
            onClick={() => setFilterStatus(filter.key as any)}
            className={`px-3 py-1.5 text-[10px] border transition-colors ${
              filterStatus === filter.key
                ? 'bg-[#141414] text-[#E4E3E0] border-[#141414] font-bold'
                : 'border-[#141414]/20 hover:bg-[#141414]/5 text-[#141414]'
            }`}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border border-[#141414]/10 overflow-x-auto bg-white/40">
        <Table className="text-xs">
          <TableHeader className="bg-[#141414]/5 border-b border-[#141414]/10">
            <TableRow>
              <TableHead className="font-serif italic text-[10px] uppercase opacity-50 h-10 w-24">1. SR</TableHead>
              <TableHead className="font-serif italic text-[10px] uppercase opacity-50 h-10">3. Candidate Name</TableHead>
              <TableHead className="font-serif italic text-[10px] uppercase opacity-50 h-10">2. Category</TableHead>
              <TableHead className="font-serif italic text-[10px] uppercase opacity-50 h-10">8. Post Applied</TableHead>
              <TableHead className="font-serif italic text-[10px] uppercase opacity-50 h-10">5. Contact</TableHead>
              <TableHead className="font-serif italic text-[10px] uppercase opacity-50 h-10">16. Interview</TableHead>
              <TableHead className="font-serif italic text-[10px] uppercase opacity-50 h-10">23. Offered</TableHead>
              <TableHead className="font-serif italic text-[10px] uppercase opacity-50 h-10">30. CTC / Pay</TableHead>
              <TableHead className="font-serif italic text-[10px] uppercase opacity-50 h-10 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-20 opacity-30">
                  FETCHING_NON_EMPLOYEE_STREAM...
                </TableCell>
              </TableRow>
            ) : filteredCandidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-20 opacity-30">
                  NO_NON_EMPLOYEE_RECORDS_FOUND
                </TableCell>
              </TableRow>
            ) : (
              filteredCandidates.map((cand) => (
                <TableRow
                  key={cand.id}
                  className="group hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors border-b border-[#141414]/5 cursor-pointer"
                  onClick={() => setViewingCandidate(cand)}
                >
                  <TableCell className="opacity-60 font-bold">{cand.srNo || cand.id.slice(0, 6)}</TableCell>
                  <TableCell>
                    <div className="font-bold flex items-center gap-1.5">
                      {cand.name}
                    </div>
                    {cand.fatherName && (
                      <div className="text-[9px] opacity-60">S/o {cand.fatherName}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-none text-[8px] h-4 border-[#141414]/20 text-inherit">
                      {cand.category || 'Staff'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>{cand.postAppliedFor}</div>
                    <div className="text-[9px] opacity-50">{cand.experience || 'Fresher'}</div>
                  </TableCell>
                  <TableCell>{cand.contactNumber || '-'}</TableCell>
                  <TableCell>
                    {cand.calledForInterview ? (
                      <Badge className="rounded-none text-[9px] h-5 bg-blue-900 text-white font-bold">
                        YES ({cand.resultOfInterview || 'Pending'})
                      </Badge>
                    ) : (
                      <span className="text-[10px] opacity-40">NO</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {cand.offeredToJoin ? (
                      <Badge className="rounded-none text-[9px] h-5 bg-green-800 text-white font-bold">
                        YES (OFFERED)
                      </Badge>
                    ) : (
                      <span className="text-[10px] opacity-40">NO</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {cand.offeredToJoin && cand.salaryDetails?.finalSalary ? (
                      <div>
                        <div className="font-bold">₹{cand.salaryDetails.finalSalary.toLocaleString()}</div>
                        <div className="text-[9px] opacity-60">CTC: ₹{cand.salaryDetails.ctc?.toLocaleString() || 0}</div>
                      </div>
                    ) : (
                      <span className="text-[10px] opacity-40">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setViewingCandidate(cand)}
                        title="View Print Slip"
                        className="h-7 w-7 p-0 rounded-none hover:bg-white/20 text-inherit"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/edit-non-employee/${cand.id}`)}
                        title="Edit Query Record"
                        className="h-7 w-7 p-0 rounded-none hover:bg-white/20 text-inherit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>

                      {onConvertToEmployee && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onConvertToEmployee(cand)}
                          title="Convert to Employee Bio-Data"
                          className="h-7 w-7 p-0 rounded-none hover:bg-green-700 hover:text-white text-inherit"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDelete(cand.id, cand.name, e)}
                        title="Delete Record"
                        className="h-7 w-7 p-0 rounded-none hover:bg-red-700 hover:text-white text-inherit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
