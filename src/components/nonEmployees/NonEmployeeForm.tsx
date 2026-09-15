import React from 'react';
import { useForm } from 'react-hook-form';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { NonEmployee, EmployeeCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Save, 
  RotateCcw, 
  Printer, 
  Calculator, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  ClipboardList,
  UserCheck,
  Building2,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NonEmployeeFormProps {
  initialData?: NonEmployee;
  onSuccess?: () => void;
  onConvertToEmployee?: (data: NonEmployee) => void;
}

export function NonEmployeeForm({ initialData, onSuccess, onConvertToEmployee }: NonEmployeeFormProps) {
  const navigate = useNavigate();
  const isEditing = !!initialData;

  const defaultValues: Partial<NonEmployee> = initialData || {
    srNo: `QRY-${Math.floor(1000 + Math.random() * 9000)}`,
    category: 'Staff',
    name: '',
    fatherName: '',
    contactNumber: '',
    alternateContact: '',
    reference: '',
    postAppliedFor: '',
    dateOfApplication: new Date().toISOString().split('T')[0],
    qualification: '',
    specialSkills: '',
    computerKnowledge: '',
    experience: '',
    currentSalary: 0,
    otherPerks: '',
    calledForInterview: false,
    interviewDate: '',
    interviewTakenBy: '',
    resultOfInterview: 'Under Consideration',
    remarks: '',
    offeredToJoin: false,
    salaryDetails: {
      finalSalary: 0,
      esi: 0,
      esiEmployer: 0,
      pf: 0,
      pfEmployer: 0,
      profTax: 0,
      lww: 0,
      lwf: 5,
      lwfEmployer: 20,
      applyEsi: true,
      applyPf: true,
      applyLwf: true,
      ctc: 0,
      netCashTakeHome: 0,
    }
  };

  const { register, handleSubmit, watch, setValue, reset, formState: { isSubmitting } } = useForm<NonEmployee>({
    defaultValues: defaultValues as NonEmployee
  });

  const calledForInterview = watch('calledForInterview');
  const offeredToJoin = watch('offeredToJoin');
  const finalSalary = watch('salaryDetails.finalSalary');
  const applyEsi = watch('salaryDetails.applyEsi');
  const applyPf = watch('salaryDetails.applyPf');
  const applyLwf = watch('salaryDetails.applyLwf');
  const profTax = watch('salaryDetails.profTax');
  const lww = watch('salaryDetails.lww');

  // Real-time Space Fashions Statutory Calculations
  const calculateSalaryBreakdown = React.useCallback(() => {
    const salary = Number(finalSalary) || 0;
    const isEsi = applyEsi !== false;
    const isPf = applyPf !== false;
    const isLwf = applyLwf !== false;
    const pt = Number(profTax) || 0;
    const lwwAmt = Number(lww) || 0;

    // ESI Rules: Employee 0.75%, Employer 3.25% if salary <= 21000; 0 if salary > 21000
    let esiEmp = 0;
    let esiEmpr = 0;
    if (isEsi && salary > 0 && salary <= 21000) {
      esiEmp = Math.round(salary * 0.0075);
      esiEmpr = Math.round(salary * 0.0325);
    }

    // PF Rules: Employee 12% (max 1800 if salary > 15000), Employer 12% (max 1800)
    let pfEmp = 0;
    let pfEmpr = 0;
    if (isPf && salary > 0) {
      if (salary <= 15000) {
        pfEmp = Math.round(salary * 0.12);
        pfEmpr = Math.round(salary * 0.12);
      } else {
        pfEmp = 1800;
        pfEmpr = 1800;
      }
    }

    // LWF Rules: Employee 5, Employer 20
    const lwfEmp = isLwf && salary > 0 ? 5 : 0;
    const lwfEmpr = isLwf && salary > 0 ? 20 : 0;

    // Net Cash Take Home = Final Salary - ESI - PF - LWF - Prof Tax
    const netCash = salary > 0 ? Math.max(0, salary - (esiEmp + pfEmp + lwfEmp + pt)) : 0;

    // CTC = Final Salary + Employer ESI + Employer PF + Employer LWF + LWW
    const totalCtc = salary > 0 ? (salary + esiEmpr + pfEmpr + lwfEmpr + lwwAmt) : 0;

    setValue('salaryDetails.esi', esiEmp, { shouldDirty: true });
    setValue('salaryDetails.esiEmployer', esiEmpr, { shouldDirty: true });
    setValue('salaryDetails.pf', pfEmp, { shouldDirty: true });
    setValue('salaryDetails.pfEmployer', pfEmpr, { shouldDirty: true });
    setValue('salaryDetails.lwf', lwfEmp, { shouldDirty: true });
    setValue('salaryDetails.lwfEmployer', lwfEmpr, { shouldDirty: true });
    setValue('salaryDetails.netCashTakeHome', netCash, { shouldDirty: true });
    setValue('salaryDetails.ctc', totalCtc, { shouldDirty: true });
  }, [finalSalary, applyEsi, applyPf, applyLwf, profTax, lww, setValue]);

  React.useEffect(() => {
    if (offeredToJoin) {
      calculateSalaryBreakdown();
    }
  }, [offeredToJoin, finalSalary, applyEsi, applyPf, applyLwf, profTax, lww, calculateSalaryBreakdown]);

  const onSubmit = async (data: NonEmployee) => {
    try {
      // Determine overall status
      let derivedStatus: NonEmployee['status'] = 'Query';
      if (data.offeredToJoin) {
        derivedStatus = 'Selected';
      } else if (data.calledForInterview) {
        if (data.resultOfInterview === 'Failed') {
          derivedStatus = 'Rejected';
        } else if (data.resultOfInterview === 'Passed' || data.resultOfInterview === 'Selected') {
          derivedStatus = 'Selected';
        } else {
          derivedStatus = 'Interviewed';
        }
      }

      const payload = {
        ...data,
        status: derivedStatus,
        updatedAt: serverTimestamp()
      };

      if (isEditing && initialData?.id) {
        await updateDoc(doc(db, 'non_employees', initialData.id), payload);
        toast.success('NON_EMPLOYEE_RECORD_UPDATED_SUCCESSFULLY');
      } else {
        await addDoc(collection(db, 'non_employees'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        toast.success('NON_EMPLOYEE_QUERY_REGISTERED_SUCCESSFULLY');
        reset();
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/employees?tab=queries');
      }
    } catch (error) {
      console.error(error);
      toast.error('FAILED_TO_SAVE_NON_EMPLOYEE_RECORD');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto pb-12 font-mono">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#141414]/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#141414]" />
            <h2 className="font-serif italic text-2xl font-bold tracking-tight">
              Category Employee query/ Non-employee data base
            </h2>
          </div>
          <p className="text-[11px] opacity-60 mt-1">
            Official Non-Employee & Candidate Query Register // Space Fashions
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrint}
            className="rounded-none border-[#141414]/20 text-xs h-9 gap-2"
          >
            <Printer className="w-3.5 h-3.5" />
            PRINT_FORM
          </Button>

          {isEditing && onConvertToEmployee && (
            <Button
              type="button"
              onClick={() => onConvertToEmployee(watch())}
              className="rounded-none bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 text-xs h-9 gap-2"
            >
              <UserCheck className="w-3.5 h-3.5" />
              CONVERT_TO_EMPLOYEE
            </Button>
          )}
        </div>
      </div>

      {/* SECTION 1: ITEMS 1 TO 16 (Always Visible) */}
      <Card className="rounded-none border-[#141414]/20 bg-transparent shadow-none">
        <CardHeader className="bg-[#141414]/5 border-b border-[#141414]/10 py-3 px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="font-mono text-xs uppercase font-bold tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 bg-[#141414] inline-block" />
              Initial Application Details (Items 1 - 16)
            </CardTitle>
            <span className="text-[10px] opacity-50 font-normal">MANDATORY_INITIAL_QUERY</span>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Row 1: Sr, Category, Name */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3 space-y-1">
              <Label className="text-[11px] opacity-70 font-bold">1. Sr (Serial No)</Label>
              <Input
                {...register('srNo')}
                placeholder="e.g. QRY-1001"
                className="rounded-none border-[#141414]/20 text-xs font-mono bg-[#141414]/5"
              />
            </div>

            <div className="md:col-span-3 space-y-1">
              <Label className="text-[11px] opacity-70 font-bold">2. Category</Label>
              <select
                {...register('category')}
                className="w-full h-9 rounded-none bg-transparent border border-[#141414]/20 text-xs font-mono px-3 focus:outline-none focus:border-[#141414]"
              >
                <option value="Staff">Staff</option>
                <option value="Worker">Worker</option>
                <option value="PC Rate">PC Rate</option>
              </select>
            </div>

            <div className="md:col-span-6 space-y-1">
              <Label className="text-[11px] opacity-70 font-bold">3. Name *</Label>
              <Input
                {...register('name', { required: true })}
                placeholder="Candidate Full Name"
                className="rounded-none border-[#141414]/20 text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* Row 2: Father Name, Contact Number, Alternative Contact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-[11px] opacity-70 font-bold">4. Father Name</Label>
              <Input
                {...register('fatherName')}
                placeholder="Father's Name"
                className="rounded-none border-[#141414]/20 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] opacity-70 font-bold">5. Contact number</Label>
              <Input
                {...register('contactNumber')}
                placeholder="Primary Mobile No."
                className="rounded-none border-[#141414]/20 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] opacity-70 font-bold">6. Alternative contact:-</Label>
              <Input
                {...register('alternateContact')}
                placeholder="Alternative Phone No."
                className="rounded-none border-[#141414]/20 text-xs font-mono"
              />
            </div>
          </div>

          {/* Row 3: Reference, Post applied for, Date of application */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-[11px] opacity-70 font-bold">7. Reference:-</Label>
              <Input
                {...register('reference')}
                placeholder="Referred by / Source"
                className="rounded-none border-[#141414]/20 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] opacity-70 font-bold">8. Post applied for *</Label>
              <Input
                {...register('postAppliedFor', { required: true })}
                placeholder="e.g. Helper, Checker, Tailor"
                className="rounded-none border-[#141414]/20 text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] opacity-70 font-bold">9. Date of application</Label>
              <Input
                type="date"
                {...register('dateOfApplication')}
                className="rounded-none border-[#141414]/20 text-xs font-mono"
              />
            </div>
          </div>

          {/* Row 4: Qualification, Any special skills, Computer knowledge */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-[11px] opacity-70 font-bold">10. Qualification</Label>
              <Input
                {...register('qualification')}
                placeholder="e.g. 10th, 12th, Graduate, ITI"
                className="rounded-none border-[#141414]/20 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] opacity-70 font-bold">11. Any special skills</Label>
              <Input
                {...register('specialSkills')}
                placeholder="e.g. Overlock, Flatlock, Cutting"
                className="rounded-none border-[#141414]/20 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] opacity-70 font-bold">12. Computer knowledge</Label>
              <Input
                {...register('computerKnowledge')}
                placeholder="e.g. Basic, Excel, Tally, None"
                className="rounded-none border-[#141414]/20 text-xs font-mono"
              />
            </div>
          </div>

          {/* Row 5: Experience, Current salary, Other perks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-[11px] opacity-70 font-bold">13. Experience</Label>
              <Input
                {...register('experience')}
                placeholder="e.g. 2 Years at XYZ / Fresher"
                className="rounded-none border-[#141414]/20 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] opacity-70 font-bold">14. Current salary (₹)</Label>
              <Input
                type="number"
                {...register('currentSalary', { valueAsNumber: true })}
                placeholder="Current Monthly Pay"
                className="rounded-none border-[#141414]/20 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] opacity-70 font-bold">15. Other perks</Label>
              <Input
                {...register('otherPerks')}
                placeholder="e.g. Room, Food, Conveyance"
                className="rounded-none border-[#141414]/20 text-xs font-mono"
              />
            </div>
          </div>

          {/* Item 16: Called for interview:- yes/no (The Gate to Items 17-23) */}
          <div className="p-4 border border-[#141414]/20 bg-[#141414]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Label className="text-xs font-bold font-mono uppercase text-[#141414] flex items-center gap-2">
                16. Called for interview:- yes/no
              </Label>
              <p className="text-[10px] opacity-60 mt-0.5">
                Selecting YES unlocks Item 17 through Item 23 (Interview Evaluation)
              </p>
            </div>

            <div className="w-48">
              <select
                value={calledForInterview ? 'true' : 'false'}
                onChange={(e) => {
                  const val = e.target.value === 'true';
                  setValue('calledForInterview', val, { shouldValidate: true, shouldDirty: true });
                }}
                className="w-full h-10 rounded-none bg-[#E4E3E0] border-2 border-[#141414] font-mono text-xs font-bold px-3 focus:outline-none cursor-pointer"
              >
                <option value="false">NO (Query Only)</option>
                <option value="true">YES (Interview Called)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: ITEMS 17 TO 23 (Displayed ONLY if Item 16/17 says YES) */}
      {calledForInterview ? (
        <Card className="rounded-none border-2 border-[#141414] bg-[#141414]/[0.02] shadow-none">
          <CardHeader className="bg-[#141414] text-[#E4E3E0] py-3 px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono text-xs uppercase font-bold tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                17. If yes then fill below:- (Items 17 to 23)
              </CardTitle>
              <span className="text-[10px] opacity-70 font-mono">INTERVIEW_GATE_ACTIVE</span>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Row 1: Interview date, Interview taken by, Result of interview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-[11px] opacity-70 font-bold">18. Interview date</Label>
                <Input
                  type="date"
                  {...register('interviewDate')}
                  className="rounded-none border-[#141414]/20 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] opacity-70 font-bold">19. Interview taken by</Label>
                <Input
                  {...register('interviewTakenBy')}
                  placeholder="Interviewer / Panel Name"
                  className="rounded-none border-[#141414]/20 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] opacity-70 font-bold">
                  20. Result of interview:-
                </Label>
                <select
                  {...register('resultOfInterview')}
                  className="w-full h-9 rounded-none bg-transparent border border-[#141414]/20 text-xs font-mono px-3 focus:outline-none focus:border-[#141414]"
                >
                  <option value="Passed">Passed</option>
                  <option value="Selected">Selected</option>
                  <option value="Under Consideration">Under Consideration</option>
                  <option value="Failed">Failed</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Row 2: Remarks */}
            <div className="space-y-1">
              <Label className="text-[11px] opacity-70 font-bold">21. remarks</Label>
              <Input
                {...register('remarks')}
                placeholder="Evaluation notes, technical feedback, candidate strengths"
                className="rounded-none border-[#141414]/20 text-xs font-mono"
              />
            </div>

            {/* Item 22 & 23: If pass then Offered to join. Yes/no (Gate to Items 24-31) */}
            <div className="p-4 border border-[#141414]/30 bg-[#141414]/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#141414]">
                <ArrowRight className="w-4 h-4" />
                22. If pass then
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                <div>
                  <Label className="text-xs font-bold font-mono uppercase text-[#141414]">
                    23. Offered to join. Yes/no
                  </Label>
                  <p className="text-[10px] opacity-60 mt-0.5">
                    Selecting YES unlocks Items 24 to 31 (Final Salary & Statutory Bio-Data Breakdown)
                  </p>
                </div>

                <div className="w-48">
                  <select
                    value={offeredToJoin ? 'true' : 'false'}
                    onChange={(e) => {
                      const val = e.target.value === 'true';
                      setValue('offeredToJoin', val, { shouldValidate: true, shouldDirty: true });
                    }}
                    className="w-full h-10 rounded-none bg-[#E4E3E0] border-2 border-[#141414] font-mono text-xs font-bold px-3 focus:outline-none cursor-pointer"
                  >
                    <option value="false">NO (Not Offered)</option>
                    <option value="true">YES (Offer Made / Finalized)</option>
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="p-4 border border-dashed border-[#141414]/20 text-center font-mono text-xs opacity-50 bg-[#141414]/[0.02]">
          [ Items 17 to 23 are hidden. Select "YES" on Item 16 (Called for interview) to reveal Interview Evaluation ]
        </div>
      )}

      {/* SECTION 3: ITEMS 24 TO 31 (Displayed ONLY if Item 23 says YES) */}
      {calledForInterview && offeredToJoin ? (
        <Card className="rounded-none border-2 border-[#141414] bg-transparent shadow-none">
          <CardHeader className="bg-[#141414] text-[#E4E3E0] py-3 px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="font-mono text-xs uppercase font-bold tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                Compensation & Statutory Breakdown (Items 24 to 31)
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-[#E4E3E0] text-[#141414] px-2 py-0.5 font-bold">
                  BIO-DATA STATUTORY ENGINE
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={calculateSalaryBreakdown}
                  className="rounded-none text-[10px] h-6 px-2 bg-transparent text-[#E4E3E0] border-[#E4E3E0]/30 hover:bg-[#E4E3E0] hover:text-[#141414] gap-1"
                >
                  <Calculator className="w-3 h-3" />
                  RECALCULATE
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Row 1: 24. Final Salary, 25. ESI, 26. PF */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 24. Final Salary */}
              <div className="space-y-2 p-3 border border-[#141414]/20 bg-[#141414]/5">
                <div className="flex justify-between items-baseline">
                  <Label className="text-xs font-bold font-mono">24. Final salary (₹)</Label>
                  <span className="text-[9px] opacity-50">BASIC_RATE</span>
                </div>
                <Input
                  type="number"
                  {...register('salaryDetails.finalSalary', { valueAsNumber: true })}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setValue('salaryDetails.finalSalary', val, { shouldValidate: true, shouldDirty: true });
                  }}
                  placeholder="e.g. 18000"
                  className="rounded-none border-[#141414] text-sm font-bold font-mono bg-[#E4E3E0]"
                />
                <p className="text-[9px] opacity-60">Base for statutory percentages & deductions</p>
              </div>

              {/* 25. ESI */}
              <div className="space-y-2 p-3 border border-[#141414]/20 bg-[#141414]/5">
                <div className="flex justify-between items-baseline">
                  <Label className="text-xs font-bold font-mono">25. Esi (0.75% / 3.25%)</Label>
                  <span className="text-[9px] opacity-50">≤ ₹21,000</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px] opacity-60">EMP (0.75%)</span>
                    <Input
                      type="number"
                      {...register('salaryDetails.esi', { valueAsNumber: true })}
                      className="rounded-none border-[#141414]/20 text-xs font-mono bg-[#141414]/5"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] opacity-60">EMPR (3.25%)</span>
                    <Input
                      type="number"
                      {...register('salaryDetails.esiEmployer', { valueAsNumber: true })}
                      className="rounded-none border-[#141414]/20 text-xs font-mono bg-[#141414]/5"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[9px] opacity-60">Apply ESI:</span>
                  <select
                    value={applyEsi !== false ? 'true' : 'false'}
                    onChange={(e) => {
                      const val = e.target.value === 'true';
                      setValue('salaryDetails.applyEsi', val, { shouldValidate: true, shouldDirty: true });
                    }}
                    className="h-6 rounded-none bg-transparent border border-[#141414]/30 text-[10px] px-1 font-mono"
                  >
                    <option value="true">YES</option>
                    <option value="false">NO</option>
                  </select>
                </div>
              </div>

              {/* 26. PF */}
              <div className="space-y-2 p-3 border border-[#141414]/20 bg-[#141414]/5">
                <div className="flex justify-between items-baseline">
                  <Label className="text-xs font-bold font-mono">26. Pf (12% max 1800)</Label>
                  <span className="text-[9px] opacity-50">12% / Capped</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px] opacity-60">EMP (12%)</span>
                    <Input
                      type="number"
                      {...register('salaryDetails.pf', { valueAsNumber: true })}
                      className="rounded-none border-[#141414]/20 text-xs font-mono bg-[#141414]/5"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] opacity-60">EMPR (12%)</span>
                    <Input
                      type="number"
                      {...register('salaryDetails.pfEmployer', { valueAsNumber: true })}
                      className="rounded-none border-[#141414]/20 text-xs font-mono bg-[#141414]/5"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[9px] opacity-60">Apply PF:</span>
                  <select
                    value={applyPf !== false ? 'true' : 'false'}
                    onChange={(e) => {
                      const val = e.target.value === 'true';
                      setValue('salaryDetails.applyPf', val, { shouldValidate: true, shouldDirty: true });
                    }}
                    className="h-6 rounded-none bg-transparent border border-[#141414]/30 text-[10px] px-1 font-mono"
                  >
                    <option value="true">YES</option>
                    <option value="false">NO</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Row 2: 27. Prof tax, 28. Lww, 29. Lwf */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 27. Prof Tax */}
              <div className="space-y-2 p-3 border border-[#141414]/20 bg-[#141414]/5">
                <Label className="text-xs font-bold font-mono">27. Prof tax (₹)</Label>
                <Input
                  type="number"
                  {...register('salaryDetails.profTax', { valueAsNumber: true })}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setValue('salaryDetails.profTax', val, { shouldValidate: true, shouldDirty: true });
                  }}
                  placeholder="e.g. 0 or 200"
                  className="rounded-none border-[#141414]/20 text-xs font-mono"
                />
                <p className="text-[9px] opacity-50">Professional Tax Deduction</p>
              </div>

              {/* 28. Lww */}
              <div className="space-y-2 p-3 border border-[#141414]/20 bg-[#141414]/5">
                <Label className="text-xs font-bold font-mono">28. Lww (Leave With Wages ₹)</Label>
                <Input
                  type="number"
                  {...register('salaryDetails.lww', { valueAsNumber: true })}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setValue('salaryDetails.lww', val, { shouldValidate: true, shouldDirty: true });
                  }}
                  placeholder="LWW Amount"
                  className="rounded-none border-[#141414]/20 text-xs font-mono"
                />
                <p className="text-[9px] opacity-50">Leave encashment / allowance</p>
              </div>

              {/* 29. Lwf */}
              <div className="space-y-2 p-3 border border-[#141414]/20 bg-[#141414]/5">
                <div className="flex justify-between items-baseline">
                  <Label className="text-xs font-bold font-mono">29. Lwf (₹5 / ₹20)</Label>
                  <span className="text-[9px] opacity-50">WELFARE_FUND</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px] opacity-60">EMP (₹5)</span>
                    <Input
                      type="number"
                      {...register('salaryDetails.lwf', { valueAsNumber: true })}
                      className="rounded-none border-[#141414]/20 text-xs font-mono bg-[#141414]/5"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] opacity-60">EMPR (₹20)</span>
                    <Input
                      type="number"
                      {...register('salaryDetails.lwfEmployer', { valueAsNumber: true })}
                      className="rounded-none border-[#141414]/20 text-xs font-mono bg-[#141414]/5"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[9px] opacity-60">Apply LWF:</span>
                  <select
                    value={applyLwf !== false ? 'true' : 'false'}
                    onChange={(e) => {
                      const val = e.target.value === 'true';
                      setValue('salaryDetails.applyLwf', val, { shouldValidate: true, shouldDirty: true });
                    }}
                    className="h-6 rounded-none bg-transparent border border-[#141414]/30 text-[10px] px-1 font-mono"
                  >
                    <option value="true">YES</option>
                    <option value="false">NO</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Row 3: 30. Ctc & 31. Net cash Take home (Final Totals) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* 30. CTC */}
              <div className="p-4 border-2 border-[#141414] bg-[#141414]/5 space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold uppercase tracking-wider text-[#141414]">
                    30. Ctc (Cost to Company)
                  </Label>
                  <span className="text-[10px] font-mono bg-[#141414] text-[#E4E3E0] px-2 py-0.5">
                    HEAD 2
                  </span>
                </div>
                <Input
                  type="number"
                  {...register('salaryDetails.ctc', { valueAsNumber: true })}
                  className="rounded-none border-[#141414] text-lg font-bold font-mono bg-[#141414]/10 h-11"
                />
                <p className="text-[10px] opacity-60">
                  Formula: Final Salary + Employer ESI + Employer PF + Employer LWF + LWW
                </p>
              </div>

              {/* 31. Net cash Take home */}
              <div className="p-4 border-2 border-[#141414] bg-[#141414]/10 space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold uppercase tracking-wider text-[#141414]">
                    31. Net cash Take home
                  </Label>
                  <span className="text-[10px] font-mono bg-green-700 text-white px-2 py-0.5 font-bold">
                    HEAD 1
                  </span>
                </div>
                <Input
                  type="number"
                  {...register('salaryDetails.netCashTakeHome', { valueAsNumber: true })}
                  className="rounded-none border-2 border-[#141414] text-lg font-bold font-mono bg-white h-11 text-green-900"
                />
                <p className="text-[10px] opacity-60">
                  Formula: Final Salary - (Employee ESI + Employee PF + Employee LWF + Prof Tax)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : calledForInterview && !offeredToJoin ? (
        <div className="p-4 border border-dashed border-[#141414]/20 text-center font-mono text-xs opacity-50 bg-[#141414]/[0.02]">
          [ Items 24 to 31 are hidden. Select "YES" on Item 23 (Offered to join) to reveal Salary & Statutory Breakdown ]
        </div>
      ) : null}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#141414]/20 print:hidden">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          className="rounded-none border-[#141414]/20 font-mono text-xs w-full sm:w-auto gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          RESET_FORM
        </Button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-none bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 font-mono text-xs h-11 px-8 w-full sm:w-auto gap-2 font-bold"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'SAVING...' : isEditing ? 'UPDATE_NON_EMPLOYEE_RECORD' : 'SAVE_NON_EMPLOYEE_QUERY'}
          </Button>
        </div>
      </div>
    </form>
  );
}
