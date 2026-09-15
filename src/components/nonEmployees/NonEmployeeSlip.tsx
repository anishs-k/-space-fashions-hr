import React from 'react';
import { NonEmployee } from '@/types';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';

interface NonEmployeeSlipProps {
  data: NonEmployee;
  onBack?: () => void;
}

export function NonEmployeeSlip({ data, onBack }: NonEmployeeSlipProps) {
  const handlePrint = () => {
    window.print();
  };

  const sal = data.salaryDetails;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between print:hidden border-b border-[#141414]/10 pb-4">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="rounded-none border-[#141414]/20 font-mono text-xs gap-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            BACK_TO_LIST
          </Button>
        )}
        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} className="rounded-none bg-[#141414] text-[#E4E3E0] font-mono text-xs gap-2">
            <Printer className="w-3.5 h-3.5" />
            PRINT_QUERY_SHEET
          </Button>
        </div>
      </div>

      {/* Printable Sheet Container */}
      <div className="bg-white text-black p-8 border-2 border-black font-mono text-xs space-y-6 shadow-sm">
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 space-y-1">
          <h1 className="font-serif italic text-2xl font-bold uppercase tracking-wider">SPACE FASHIONS</h1>
          <h2 className="text-sm font-bold uppercase tracking-wide">
            Category Employee query/ Non-employee data base
          </h2>
          <p className="text-[10px] opacity-70">
            RECORD REF: <span className="font-bold">{data.srNo || data.id}</span> | REGISTERED: {data.dateOfApplication || 'N/A'}
          </p>
        </div>

        {/* Section 1: Initial Application Details (1 to 16) */}
        <div className="border border-black">
          <div className="bg-black text-white px-3 py-1 font-bold text-[11px] uppercase tracking-wider">
            Applicant Bio-Data & Query Information (Items 1 to 16)
          </div>

          <div className="grid grid-cols-2 divide-x divide-y divide-black">
            <div className="p-2.5 flex justify-between">
              <span className="font-bold">1. Sr:</span>
              <span>{data.srNo || '-'}</span>
            </div>
            <div className="p-2.5 flex justify-between">
              <span className="font-bold">2. Category:</span>
              <span className="font-bold uppercase">{data.category || 'Staff'}</span>
            </div>

            <div className="p-2.5 flex justify-between col-span-2">
              <span className="font-bold">3. Name:</span>
              <span className="font-bold text-sm uppercase">{data.name}</span>
            </div>

            <div className="p-2.5 flex justify-between">
              <span className="font-bold">4. Father Name:</span>
              <span>{data.fatherName || '-'}</span>
            </div>
            <div className="p-2.5 flex justify-between">
              <span className="font-bold">5. Contact number:</span>
              <span>{data.contactNumber || '-'}</span>
            </div>

            <div className="p-2.5 flex justify-between">
              <span className="font-bold">6. Alternative contact:-</span>
              <span>{data.alternateContact || '-'}</span>
            </div>
            <div className="p-2.5 flex justify-between">
              <span className="font-bold">7. Reference:-</span>
              <span>{data.reference || '-'}</span>
            </div>

            <div className="p-2.5 flex justify-between">
              <span className="font-bold">8. Post applied for:</span>
              <span className="font-bold">{data.postAppliedFor || '-'}</span>
            </div>
            <div className="p-2.5 flex justify-between">
              <span className="font-bold">9. Date of application:</span>
              <span>{data.dateOfApplication || '-'}</span>
            </div>

            <div className="p-2.5 flex justify-between">
              <span className="font-bold">10. Qualification:</span>
              <span>{data.qualification || '-'}</span>
            </div>
            <div className="p-2.5 flex justify-between">
              <span className="font-bold">11. Any special skills:</span>
              <span>{data.specialSkills || '-'}</span>
            </div>

            <div className="p-2.5 flex justify-between">
              <span className="font-bold">12. Computer knowledge:</span>
              <span>{data.computerKnowledge || '-'}</span>
            </div>
            <div className="p-2.5 flex justify-between">
              <span className="font-bold">13. Experience:</span>
              <span>{data.experience || '-'}</span>
            </div>

            <div className="p-2.5 flex justify-between">
              <span className="font-bold">14. Current salary:</span>
              <span>{data.currentSalary ? `₹${data.currentSalary.toLocaleString()}` : '-'}</span>
            </div>
            <div className="p-2.5 flex justify-between">
              <span className="font-bold">15. Other perks:</span>
              <span>{data.otherPerks || '-'}</span>
            </div>

            <div className="p-2.5 flex justify-between col-span-2 bg-gray-100 font-bold">
              <span>16. Called for interview:- yes/no</span>
              <span className={`px-2 py-0.5 border ${data.calledForInterview ? 'bg-black text-white' : 'bg-white text-black'}`}>
                {data.calledForInterview ? 'YES' : 'NO'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Interview Evaluation (17 to 23) */}
        {data.calledForInterview && (
          <div className="border border-black">
            <div className="bg-black text-white px-3 py-1 font-bold text-[11px] uppercase tracking-wider">
              17. If yes then fill below:- (Interview Evaluation)
            </div>

            <div className="grid grid-cols-2 divide-x divide-y divide-black">
              <div className="p-2.5 flex justify-between">
                <span className="font-bold">18. Interview date:</span>
                <span>{data.interviewDate || '-'}</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="font-bold">19. Interview taken by:</span>
                <span>{data.interviewTakenBy || '-'}</span>
              </div>

              <div className="p-2.5 flex justify-between">
                <span className="font-bold">20. Result of interview:-</span>
                <span className="font-bold">{data.resultOfInterview || '-'}</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="font-bold">21. remarks:</span>
                <span>{data.remarks || '-'}</span>
              </div>

              <div className="p-2.5 flex justify-between col-span-2 bg-gray-100 font-bold">
                <span>22. If pass then &rarr; 23. Offered to join. Yes/no</span>
                <span className={`px-2 py-0.5 border ${data.offeredToJoin ? 'bg-black text-white' : 'bg-white text-black'}`}>
                  {data.offeredToJoin ? 'YES' : 'NO'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Statutory & Compensation Breakdown (24 to 31) */}
        {data.calledForInterview && data.offeredToJoin && sal && (
          <div className="border-2 border-black">
            <div className="bg-black text-white px-3 py-1 font-bold text-[11px] uppercase tracking-wider flex justify-between">
              <span>Finalized Compensation & Statutory Breakdown (Items 24 to 31)</span>
              <span className="text-[10px]">SPACE FASHIONS HR BIO-DATA FORMAT</span>
            </div>

            <div className="grid grid-cols-2 divide-x divide-y divide-black">
              <div className="p-3 flex justify-between bg-gray-50 col-span-2">
                <span className="font-bold text-sm">24. Final salary:</span>
                <span className="font-bold text-sm">₹{sal.finalSalary?.toLocaleString() || 0}</span>
              </div>

              <div className="p-2.5 flex justify-between">
                <span className="font-bold">25. Esi:</span>
                <span>
                  EMP (0.75%): ₹{sal.esi || 0} | EMPR (3.25%): ₹{sal.esiEmployer || 0}
                </span>
              </div>

              <div className="p-2.5 flex justify-between">
                <span className="font-bold">26. Pf:</span>
                <span>
                  EMP (12%): ₹{sal.pf || 0} | EMPR (12%): ₹{sal.pfEmployer || 0}
                </span>
              </div>

              <div className="p-2.5 flex justify-between">
                <span className="font-bold">27. Prof tax:</span>
                <span>₹{sal.profTax || 0}</span>
              </div>

              <div className="p-2.5 flex justify-between">
                <span className="font-bold">28. Lww:</span>
                <span>₹{sal.lww || 0}</span>
              </div>

              <div className="p-2.5 flex justify-between col-span-2">
                <span className="font-bold">29. Lwf:</span>
                <span>
                  Employee: ₹{sal.lwf || 0} | Employer: ₹{sal.lwfEmployer || 0}
                </span>
              </div>

              <div className="p-3 flex justify-between bg-black text-white font-bold col-span-2 text-sm">
                <span>30. Ctc (Cost to Company - Head 2):</span>
                <span>₹{sal.ctc?.toLocaleString() || 0}</span>
              </div>

              <div className="p-3 flex justify-between bg-gray-200 text-black font-bold col-span-2 text-sm border-t-2 border-black">
                <span>31. Net cash Take home (Head 1):</span>
                <span className="text-base">₹{sal.netCashTakeHome?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-6 pt-12 text-center text-[10px] font-bold">
          <div className="border-t border-black pt-2">Candidate Signature</div>
          <div className="border-t border-black pt-2">Interviewer / HR Signature</div>
          <div className="border-t border-black pt-2">Authorized Signatory</div>
        </div>
      </div>
    </div>
  );
}
