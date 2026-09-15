import React from 'react';
import { Employee } from '@/types';
import { Printer, Check, X, ShieldAlert, Award, CreditCard, Users2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmployeeBioDataProps {
  employee: Employee;
}

export function EmployeeBioData({ employee }: EmployeeBioDataProps) {
  const handlePrint = () => {
    window.print();
  };

  const renderCheckValue = (checked: boolean) => {
    return checked ? (
      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-green-700 bg-green-50 px-1 border border-green-200">
        <Check className="w-2.5 h-2.5" /> YES
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 font-mono text-[10px] opacity-40 text-red-700 bg-red-50/20 px-1 border border-red-100">
        <X className="w-2.5 h-2.5" /> NO
      </span>
    );
  };

  // Safe checks for nested fields
  const l = employee.languages || {
    hindi: { read: false, write: false, speak: false },
    english: { read: false, write: false, speak: false },
    punjabi: { read: false, write: false, speak: false },
    other: { name: '', skill: { read: false, write: false, speak: false } }
  };

  const o = employee.officeUse || {
    basicPay: 0,
    esiEmployee: 0,
    pfEmployee: 0,
    esiEmployer: 0,
    pfEmployer: 0,
    bonus: 0,
    lwfEmployer: 20,
    lwfEmployee: 5,
    ctc: 0,
    netCash: 0,
    lwwAllowed: 0,
    lwwAmount: 0,
    applyEsi: true,
    applyPf: true,
    applyLwf: true,
    applyLww: true,
    remarks: ''
  };

  const nominee = employee.nominee || { name: 'NOT_RECORDED', relation: 'N/A', age: 0, dob: '' };
  const family = employee.family || [];

  return (
    <div className="space-y-6">
      {/* Print Trigger - Hidden during printing */}
      <div className="print:hidden flex justify-end">
        <Button 
          onClick={handlePrint}
          className="rounded-none bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 font-mono text-xs gap-2 h-10 px-6"
        >
          <Printer className="w-4 h-4" />
          PRINT_OFFICIAL_RECORD
        </Button>
      </div>

      {/* Printable Sheet Container */}
      <div id="print-sheet" className="bg-white text-[#141414] border-2 border-double border-[#141414] p-8 md:p-12 font-serif max-w-4xl mx-auto shadow-sm relative overflow-hidden print:border-none print:p-0 print:shadow-none">
        
        {/* Aesthetic Background Stamp for Official Quality */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.015] pointer-events-none transform -rotate-12 select-none">
          <Award className="w-[500px] h-[500px] text-[#141414]" />
        </div>

        {/* Form Header */}
        <div className="text-center border-b-2 border-dashed border-[#141414] pb-6 mb-8 space-y-2">
          <h1 className="text-3xl tracking-wide uppercase font-bold text-center">Space Fashions Limited</h1>
          <p className="font-mono text-xs uppercase tracking-widest opacity-60">Personnel Registry & Professional Bio-Data Form</p>
          <div className="flex justify-between items-center pt-4 font-mono text-[9px] opacity-50 uppercase">
            <span>Doc Code: SFL/HR/REC/{employee.employeeCode || employee.id.slice(0, 8)}</span>
            <span>Ref protocol: ERP-4.1.2</span>
            <span>Date Generated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Two-Column Primary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (Personal particulars) */}
          <div className="md:col-span-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 border-b border-[#141414]/20 pb-1.5 mb-3">
                <Users2 className="w-4 h-4 opacity-50" />
                <h3 className="font-mono text-[10px] uppercase font-bold tracking-widest opacity-70">01. Personal Particulars</h3>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 font-serif text-sm">
                <div>
                  <span className="block font-mono text-[9px] uppercase opacity-40">Employee Code</span>
                  <span className="font-bold font-mono text-xs">{employee.employeeCode || 'NOT_ASSIGNED'}</span>
                </div>
                <div>
                  <span className="block font-mono text-[9px] uppercase opacity-40">Department</span>
                  <span className="font-bold">{employee.department || 'N/A'}</span>
                </div>
                <div>
                  <span className="block font-mono text-[9px] uppercase opacity-40">Post Applied For</span>
                  <span className="font-bold italic">{employee.postAppliedFor || 'N/A'}</span>
                </div>
                <div>
                  <span className="block font-mono text-[9px] uppercase opacity-40">Job / Process Assigned</span>
                  <span className="font-semibold text-xs text-[#141414]">{employee.jobProcessAssigned || 'N/A'}</span>
                </div>
                <div className="col-span-2 border-t border-dotted border-[#141414]/10 pt-2">
                  <span className="block font-mono text-[9px] uppercase opacity-40">Full Name</span>
                  <span className="text-base font-bold tracking-tight">{employee.name}</span>
                </div>
                <div className="col-span-2 border-t border-dotted border-[#141414]/10 pt-2">
                  <span className="block font-mono text-[9px] uppercase opacity-40">Father / Husband Name</span>
                  <span>{employee.fatherHusbandName || 'N/A'}</span>
                </div>
                <div className="border-t border-dotted border-[#141414]/10 pt-2">
                  <span className="block font-mono text-[9px] uppercase opacity-40">Date of Birth</span>
                  <span>{employee.dob || 'N/A'}</span>
                </div>
                <div className="border-t border-dotted border-[#141414]/10 pt-2">
                  <span className="block font-mono text-[9px] uppercase opacity-40">Current Age</span>
                  <span>{employee.age ? `${employee.age} Years` : 'N/A'}</span>
                </div>
                <div className="border-t border-dotted border-[#141414]/10 pt-2 col-span-2">
                  <span className="block font-mono text-[9px] uppercase opacity-40">Contact Numbers</span>
                  <span className="font-mono text-xs">
                    {employee.contactNo} {employee.alternateContactNo ? ` / ${employee.alternateContactNo}` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Address Info */}
            <div>
              <div className="flex items-center gap-2 border-b border-[#141414]/20 pb-1.5 mb-3">
                <h3 className="font-mono text-[10px] uppercase font-bold tracking-widest opacity-70">02. Residential Locations</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="block font-mono text-[9px] uppercase opacity-40">Permanent Address</span>
                  <p className="italic leading-relaxed">{employee.permanentAddress || 'N/A'}</p>
                </div>
                <div className="border-t border-dotted border-[#141414]/10 pt-2">
                  <span className="block font-mono text-[9px] uppercase opacity-40">Local Address</span>
                  <p className="italic leading-relaxed">{employee.localAddress || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Background Details */}
            <div>
              <div className="flex items-center gap-2 border-b border-[#141414]/20 pb-1.5 mb-3">
                <h3 className="font-mono text-[10px] uppercase font-bold tracking-widest opacity-70">03. Education & Credentials</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block font-mono text-[9px] uppercase opacity-40">Primary Qualification</span>
                  <span>{employee.qualification || 'NOT_SPECIFIED'}</span>
                </div>
                <div>
                  <span className="block font-mono text-[9px] uppercase opacity-40">Technical Qualification</span>
                  <span>{employee.technicalQualification || 'N/A'}</span>
                </div>
                <div className="col-span-2 border-t border-dotted border-[#141414]/10 pt-2">
                  <span className="block font-mono text-[9px] uppercase opacity-40">Prior Experience Summary</span>
                  <span>{employee.experience || 'Fresher / No documented remarks'}</span>
                </div>
                <div className="col-span-2 border-t border-dotted border-[#141414]/10 pt-2">
                  <span className="block font-mono text-[9px] uppercase opacity-40">Referenced By</span>
                  <span className="italic">{employee.reference || 'Personal recruitment / Walk-in'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Photo placeholder, category, dates) */}
          <div className="md:col-span-4 space-y-6">
            {/* Visual Photo Frame */}
            <div className="flex flex-col items-center">
              <div className="w-32 h-36 border-2 border-dashed border-[#141414]/30 flex flex-col items-center justify-center p-1 bg-[#141414]/5 relative overflow-hidden">
                {employee.photoUrl ? (
                  <img src={employee.photoUrl} alt={employee.name} referrerPolicy="no-referrer" className="w-full h-full object-cover grayscale contrast-125" />
                ) : (
                  <div className="text-center p-3">
                    <span className="font-mono text-[8px] uppercase opacity-35 leading-none block">Candidate Photo</span>
                    <span className="font-mono text-[8px] uppercase opacity-35 leading-none block mt-1">3.5cm x 4.5cm</span>
                  </div>
                )}
              </div>
              <span className="inline-flex items-center justify-center rounded-none font-mono text-[8.5px] uppercase border border-[#141414] bg-white text-[#141414] mt-3 h-6 px-3">
                CATEGORY: {employee.category || 'WORKER'}
              </span>
            </div>

            {/* Official Registration dates */}
            <div className="bg-[#141414]/5 p-3 border border-[#141414]/10 space-y-2 text-xs">
              <div>
                <span className="block font-mono text-[8px] uppercase opacity-50">Date of Joining</span>
                <span className="font-mono font-bold text-[#141414]">{employee.dateOfJoining || 'PROBATION_PENDING'}</span>
              </div>
              {employee.dateOfLeaving && (
                <div className="border-t border-[#141414]/10 pt-2">
                  <span className="block font-mono text-[8px] uppercase opacity-50 text-red-700">Date of Leaving</span>
                  <span className="font-mono font-bold text-red-700">{employee.dateOfLeaving}</span>
                </div>
              )}
              <div className="border-t border-[#141414]/10 pt-2 flex justify-between items-center">
                <span className="font-mono text-[8px] uppercase opacity-50">System Status</span>
                <span className={`font-mono text-[9px] uppercase font-bold ${employee.status === 'active' ? 'text-green-700' : 'text-red-700'}`}>
                  {employee.status || 'active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider Line */}
        <hr className="my-8 border-t-2 border-[#141414]" />

        {/* Languages & Breaks Segmented Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Languages Proficiency Card */}
          <div>
            <div className="flex items-center gap-2 border-b border-[#141414]/20 pb-1.5 mb-3">
              <h3 className="font-mono text-[10px] uppercase font-bold tracking-widest opacity-70">04. Languages Literacy</h3>
            </div>
            <div className="border border-[#141414]/10 bg-white overflow-hidden rounded-none">
              <table className="w-full text-center font-mono text-[10px] border-collapse bg-white">
                <thead>
                  <tr className="bg-[#141414]/5 border-b border-[#141414]/15">
                    <th className="text-left py-2 px-3 opacity-60 font-serif italic text-[10px]">LANGUAGE</th>
                    <th className="py-2 px-1 opacity-60">READ</th>
                    <th className="py-2 px-1 opacity-60">WRITE</th>
                    <th className="py-2 px-1 opacity-60">SPEAK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141414]/10">
                  {['hindi', 'english', 'punjabi'].map((langKey) => {
                    const skill = l[langKey as keyof typeof l] as any || { read: false, write: false, speak: false };
                    return (
                      <tr key={langKey}>
                        <td className="text-left py-2 px-3 font-semibold uppercase text-xs">{langKey}</td>
                        <td className="py-2">{renderCheckValue(skill.read)}</td>
                        <td className="py-2">{renderCheckValue(skill.write)}</td>
                        <td className="py-2">{renderCheckValue(skill.speak)}</td>
                      </tr>
                    );
                  })}
                  {l.other && l.other.name && (
                    <tr className="bg-amber-50/20">
                      <td className="text-left py-2 px-3 font-semibold uppercase text-xs text-amber-900 truncate max-w-[100px]">
                        {l.other.name}
                      </td>
                      <td className="py-2">{renderCheckValue(l.other.skill?.read)}</td>
                      <td className="py-2">{renderCheckValue(l.other.skill?.write)}</td>
                      <td className="py-2">{renderCheckValue(l.other.skill?.speak)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Duty Specifications & Breaks Card */}
          <div>
            <div className="flex items-center gap-2 border-b border-[#141414]/20 pb-1.5 mb-3">
              <Clock className="w-4 h-4 opacity-50" />
              <h3 className="font-mono text-[10px] uppercase font-bold tracking-widest opacity-70">05. Duty Specifications</h3>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block font-mono text-[9px] uppercase opacity-40">Duty Timings</span>
                  <span>{employee.dutyTime || 'N/A'}</span>
                </div>
                <div>
                  <span className="block font-mono text-[9px] uppercase opacity-40">Duty Hours</span>
                  <span>{employee.dutyHours ? `${employee.dutyHours} Hours` : 'N/A'}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-t border-dotted border-[#141414]/10 pt-2">
                <div>
                  <span className="block font-mono text-[9px] uppercase opacity-40 font-bold">Lunch Break</span>
                  <span>{employee.lunchBreak || 'N/A'}</span>
                </div>
                <div>
                  <span className="block font-mono text-[9px] uppercase opacity-40">Tea Break 1</span>
                  <span>{employee.teaBreak1 || 'N/A'}</span>
                </div>
                <div>
                  <span className="block font-mono text-[9px] uppercase opacity-40">Tea Break 2</span>
                  <span>{employee.teaBreak2 || 'N/A'}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-dotted border-[#141414]/10 pt-2">
                <div>
                  <span className="block font-mono text-[9px] uppercase opacity-40">Overtime Allowed</span>
                  <span className="font-mono text-xs">{renderCheckValue(!!employee.overtimeAllowed)}</span>
                </div>
                {employee.overtimeAllowed && (
                  <div>
                    <span className="block font-mono text-[9px] uppercase opacity-40">Overtime Details</span>
                    <span className="italic">{employee.overtimeHours || 'N/A'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Family particulars Section */}
        <div className="mt-8">
          <div className="flex items-center gap-2 border-b border-[#141414]/20 pb-1.5 mb-3">
            <h3 className="font-mono text-[10px] uppercase font-bold tracking-widest opacity-70">06. Nominee & Family particulars</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm mb-4">
            <div className="md:col-span-1 bg-[#141414]/5 p-3 border border-[#141414]/15">
              <span className="block font-mono text-[8px] uppercase opacity-55 font-bold mb-1">Declared Nominee</span>
              <p className="font-bold">{nominee.name}</p>
              <div className="flex justify-between items-center mt-2 text-xs font-mono opacity-60">
                <span>Relation: {nominee.relation}</span>
                <span>Age: {nominee.age || 'N/A'}</span>
              </div>
            </div>

            <div className="md:col-span-2">
              {family.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-[#141414]/15 italic text-xs text-[#141414]/40">
                  No registered family members listed in official bio-data.
                </div>
              ) : (
                <div className="border border-[#141414]/10 rounded-none overflow-hidden bg-white">
                  <table className="w-full text-center font-mono text-[9.5px] border-collapse bg-white">
                    <thead>
                      <tr className="bg-[#141414]/5 border-b border-[#141414]/15">
                        <th className="text-left py-1.5 px-3 opacity-60">MEMBERS</th>
                        <th className="py-1.5 px-1 opacity-60">RELATION</th>
                        <th className="py-1.5 px-1 opacity-60">AGE</th>
                        <th className="py-1.5 px-1 opacity-60">MOBILE NO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#141414]/10">
                      {family.map((member, fIdx) => (
                        <tr key={fIdx}>
                          <td className="text-left py-1.5 px-3 font-semibold font-serif text-[#141414]">{member.name || 'N/A'}</td>
                          <td className="py-1.5 uppercase text-[9px]">{member.relation || 'N/A'}</td>
                          <td className="py-1.5 font-mono">{member.age || 'N/A'}</td>
                          <td className="py-1.5 font-mono">{member.mobileNumber || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Divider Line */}
        <hr className="my-8 border-t-2 border-[#141414]" />

        {/* Office Use and Compensation details */}
        <div>
          <div className="flex items-center gap-2 border-b border-[#141414]/20 pb-1.5 mb-4">
            <CreditCard className="w-4 h-4 opacity-50" />
            <h3 className="font-mono text-[10px] uppercase font-bold tracking-widest opacity-70">07. Statutory Registry & Compensation Detail</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Statutory identifiers */}
            <div className="md:col-span-5 space-y-4">
              <div className="bg-[#141414]/5 p-3 border border-[#141414]/10 space-y-2.5 text-xs">
                <span className="block font-mono text-[8px] uppercase font-bold opacity-60 border-b border-[#141414]/15 pb-1">Statutory IDs</span>
                <div className="flex justify-between font-mono">
                  <span className="opacity-40">OLD ESI</span>
                  <span className="font-bold">{employee.esi || 'N/A'}</span>
                </div>
                <div className="flex justify-between font-mono border-t border-dotted border-[#141414]/10 pt-1.5">
                  <span className="opacity-40">OLD PF</span>
                  <span className="font-bold">{employee.pf || 'N/A'}</span>
                </div>
                <div className="flex justify-between font-mono border-t border-dotted border-[#141414]/10 pt-1.5">
                  <span className="opacity-40">OLD UAN</span>
                  <span className="font-bold">{employee.uan || 'N/A'}</span>
                </div>
              </div>

              {o.remarks && (
                <div className="p-3 border border-dashed border-[#141414]/20 text-xs italic bg-amber-50/10">
                  <span className="block font-mono text-[8px] uppercase font-bold opacity-40 not-italic mb-1 text-amber-900">REMARKS / NOTES</span>
                  <p>{o.remarks}</p>
                </div>
              )}
            </div>

            {/* Financial Ledger Calculation Sheet */}
            <div className="md:col-span-7 border border-[#141414] bg-[#141414]/[0.02] p-4 text-xs font-mono space-y-3">
              <div className="flex justify-between items-center border-b border-[#141414] pb-2">
                <span className="font-bold">COMPENSATION BREAKDOWN</span>
                <span className="inline-flex items-center justify-center rounded-none text-[8px] border border-[#141414]/30 px-1.5 py-0.5 font-bold">OFFICE ONLY</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-[11px]">
                  <span className="opacity-70">HEAD 1: EMPLOYEE SHARE (CASH FOCUS)</span>
                  <span>Rs. {(o.basicPay || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-[10px] text-red-700">
                  <span>- ESI EMPLOYEE SHARE (0.75% upto ₹21,000)</span>
                  <span>Rs. {(o.esiEmployee || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-[10px] text-red-700">
                  <span>- PF EMPLOYEE SHARE (12% / max ₹1,800)</span>
                  <span>Rs. {(o.pfEmployee || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-[10px] text-red-700">
                  <span>- LWF EMPLOYEE FUND</span>
                  <span>Rs. {(o.lwfEmployee || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center border-t border-dotted border-[#141414]/20 pt-1.5 font-bold">
                  <span>NET ESTIMATED PAYABLE CASH IN HAND</span>
                  <span className="text-sm underline underline-offset-2">Rs. {(o.netCash || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[#141414]/20">
                <div className="flex justify-between font-bold text-[11px]">
                  <span className="opacity-70">HEAD 2: EMPLOYER SHARE (CTC FOCUS)</span>
                  <span></span>
                </div>

                <div className="flex justify-between text-[10px]">
                  <span className="opacity-60">+ ESI EMPLOYER SHARE (3.25% upto ₹21,000)</span>
                  <span>Rs. {(o.esiEmployer || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-[10px]">
                  <span className="opacity-60">+ PF EMPLOYER SHARE (12% / max ₹1,800)</span>
                  <span>Rs. {(o.pfEmployer || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-[10px]">
                  <span className="opacity-60">+ LWF EMPLOYER RETIREMENT FUND</span>
                  <span>Rs. {(o.lwfEmployer || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-[10px]">
                  <span className="opacity-60">+ ALLOWED MONTH LEAVE CONVERSION (LWW)</span>
                  <span>Rs. {(o.lwwAmount || 0).toLocaleString()} (Leaves: {o.lwwAllowed || 0})</span>
                </div>

                <div className="flex justify-between text-[10px]">
                  <span className="opacity-60">+ INCENTIVE BONUS</span>
                  <span>Rs. {(o.bonus || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center border-t-2 border-double border-[#141414] pt-2 font-black text-sm text-[#141414]">
                  <span>TOTAL ESTIMATED C.T.C. TO COMPLIANCE</span>
                  <span className="underline underline-offset-4 decoration-2">Rs. {(o.ctc || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Footers - Signature pads */}
        <div className="mt-16 pt-12 border-t border-[#141414]/30 grid grid-cols-2 gap-12 font-mono text-[10px] uppercase text-center">
          <div className="space-y-12">
            <div className="border-b border-[#141414]/40 pb-1 h-8"></div>
            <span>Signature of Candidate / Executing Worker</span>
          </div>
          <div className="space-y-12">
            <div className="border-b border-[#141414]/40 pb-1 h-8 flex items-end justify-center text-[8px] font-bold text-green-700">
              [APPROVED_BY_ERP_VERIFY]
            </div>
            <span>Authorized HR & Compliance Officer Signature</span>
          </div>
        </div>

        {/* Safety watermark */}
        <div className="mt-12 text-center text-[8.5px] font-mono opacity-30 uppercase tracking-widest border-t border-dotted border-[#141414]/10 pt-4 flex items-center justify-center gap-1">
          <ShieldAlert className="w-3 h-3 text-red-700 shrink-0" />
          This document is protected under state labor compliance. Standard digital audit trials apply.
        </div>
      </div>
    </div>
  );
}
