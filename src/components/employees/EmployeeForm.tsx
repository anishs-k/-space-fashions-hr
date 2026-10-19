import React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import { Employee, EmployeeStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DateInput } from '@/components/ui/date-input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { Save, User, Briefcase, MapPin, Phone, ClipboardCheck, Users, Clock, Plus, Trash2, Languages as LanguagesIcon, Calculator, RefreshCw } from 'lucide-react';
import { normalizeDate, calculateAge, splitTime, normalizeClock, calculateDutyHours, calculatePayableDutyHours, halfBreakTime, Meridiem } from '@/lib/utils';

const emptyDefaultValues = {
  status: 'active' as EmployeeStatus,
  family: [
    { name: '', relation: '', age: 0, dob: '', mobileNumber: '' }
  ],
  languages: {
    hindi: { read: false, write: false, speak: false },
    english: { read: false, write: false, speak: false },
    punjabi: { read: false, write: false, speak: false },
    other: { name: '', skill: { read: false, write: false, speak: false } }
  },
  officeUse: {
    basicPay: 0,
    lwwAllowed: 0,
    lwwAmount: 0,
    bonus: 0,
    lwfEmployee: 5,
    lwfEmployer: 20,
    applyEsi: true,
    applyPf: true,
    applyLwf: true,
    applyLww: true,
    esiEmployee: 0,
    pfEmployee: 0,
    esiEmployer: 0,
    pfEmployer: 0,
    ctc: 0,
    netCash: 0,
    remarks: ''
  }
};

// Shared layout for the NAME | GENDER | RELATION row of nominee and family members
const nameGenderRelationGrid = 'grid grid-cols-1 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2';
const smallSelectClass = 'w-full h-8 rounded-none border border-[#141414]/20 font-mono text-[10px] px-2 focus:outline-none focus:ring-1 focus:ring-[#141414]';
const genderOptions = (
  <>
    <option value="">SELECT</option>
    <option value="Male">Male</option>
    <option value="Female">Female</option>
    <option value="Other">Other</option>
  </>
);

// Maps older free-text shift values ("day", "DAY SHIFT", "night", ...) to the dropdown options
const normalizeShift = (raw: any): string => {
  const str = String(raw ?? '').toLowerCase();
  if (str.includes('night')) return 'Night';
  if (str.includes('day')) return 'Day';
  return '';
};

const getFormDefaults = (initial?: Partial<Employee>): Partial<Employee> => {
  if (!initial) return emptyDefaultValues;
  
  // Normalize date fields from DD-MM-YYYY or other formats to YYYY-MM-DD for HTML date inputs
  const initAny = initial as any;
  const normalizedDob = normalizeDate(initial.dob || initAny.dob);
  const normalizedDateOfJoining = normalizeDate(initial.dateOfJoining || initAny.date_of_joining);
  const normalizedDateOfLeaving = normalizeDate(initial.dateOfLeaving);
  
  return {
    ...emptyDefaultValues,
    ...initial,
    dob: normalizedDob,
    age: initial.age || calculateAge(normalizedDob),
    shiftTime: normalizeShift(initial.shiftTime),
    dateOfJoining: normalizedDateOfJoining,
    dateOfLeaving: normalizedDateOfLeaving,
    languages: {
      hindi: { ...emptyDefaultValues.languages.hindi, ...(initial.languages?.hindi || {}) },
      english: { ...emptyDefaultValues.languages.english, ...(initial.languages?.english || {}) },
      punjabi: { ...emptyDefaultValues.languages.punjabi, ...(initial.languages?.punjabi || {}) },
      other: {
        name: initial.languages?.other?.name || '',
        skill: { ...emptyDefaultValues.languages.other.skill, ...(initial.languages?.other?.skill || {}) }
      }
    },
    officeUse: {
      ...emptyDefaultValues.officeUse,
      ...(initial.officeUse || {})
    },
    family: initial.family && initial.family.length > 0
      ? initial.family
      : emptyDefaultValues.family,
    nominee: initial.nominee
      ? {
          ...initial.nominee,
          dob: normalizeDate(initial.nominee.dob)
        }
      : { name: '', gender: '', age: 0, dob: '', relation: '' }
  };
};

export function EmployeeForm({ initialData }: { initialData?: Partial<Employee> }) {
  const location = useLocation();
  const prefillCandidate = location.state?.prefillCandidate;

  const mergedInitial: Partial<Employee> = React.useMemo(() => {
    if (initialData) return initialData;
    if (prefillCandidate) {
      return {
        name: prefillCandidate.name || '',
        fatherHusbandName: prefillCandidate.fatherName || '',
        contactNo: prefillCandidate.contactNumber || '',
        alternateContactNo: prefillCandidate.alternateContact || '',
        reference: prefillCandidate.reference || '',
        postAppliedFor: prefillCandidate.postAppliedFor || '',
        qualification: prefillCandidate.qualification || '',
        category: prefillCandidate.category || 'Staff',
        experience: prefillCandidate.experience || '',
        department: 'Production',
        officeUse: {
          ...emptyDefaultValues.officeUse,
          basicPay: prefillCandidate.salaryDetails?.finalSalary || prefillCandidate.currentSalary || 0,
          esiEmployee: prefillCandidate.salaryDetails?.esi || 0,
          esiEmployer: prefillCandidate.salaryDetails?.esiEmployer || 0,
          pfEmployee: prefillCandidate.salaryDetails?.pf || 0,
          pfEmployer: prefillCandidate.salaryDetails?.pfEmployer || 0,
          lwfEmployee: prefillCandidate.salaryDetails?.lwf || 5,
          lwfEmployer: prefillCandidate.salaryDetails?.lwfEmployer || 20,
          lwwAmount: prefillCandidate.salaryDetails?.lww || 0,
          netCash: prefillCandidate.salaryDetails?.netCashTakeHome || 0,
          ctc: prefillCandidate.salaryDetails?.ctc || 0,
          remarks: prefillCandidate.remarks || `Transferred from Candidate Query ${prefillCandidate.srNo || ''}`,
        }
      };
    }
    return {};
  }, [initialData, prefillCandidate]);

  const { register, handleSubmit, watch, setValue, getValues, trigger, control, formState: { isSubmitting, errors } } = useForm<Partial<Employee>>({
    defaultValues: getFormDefaults(mergedInitial)
  });
  const navigate = useNavigate();

  const basicPay = watch('officeUse.basicPay');
  const lwwAmount = watch('officeUse.lwwAmount');
  const bonus = watch('officeUse.bonus');
  const applyEsi = watch('officeUse.applyEsi');
  const applyPf = watch('officeUse.applyPf');
  const applyLwf = watch('officeUse.applyLwf');
  const applyLww = watch('officeUse.applyLww');
  const dateOfJoining = watch('dateOfJoining');

  const updateDutyHours = (inTime?: string, outTime?: string) => {
    const hours = calculateDutyHours(inTime, outTime);
    if (hours) setValue('dutyHours', hours, { shouldDirty: true });
  };

  // Payable duty hours = duty hours − (tea time + lunch break), recalculated on any change
  const dutyHours = watch('dutyHours');
  const teaTimeAllowed = watch('teaTimeAllowed');
  const teaBreak1 = watch('teaBreak1');
  const teaBreak2 = watch('teaBreak2');
  const lunchBreak = watch('lunchBreak');

  React.useEffect(() => {
    const payable = calculatePayableDutyHours(dutyHours, teaTimeAllowed, lunchBreak, teaBreak1, teaBreak2);
    if (payable !== (getValues('payableDutyHours') || '')) {
      setValue('payableDutyHours', payable, { shouldDirty: true });
    }
  }, [dutyHours, teaTimeAllowed, teaBreak1, teaBreak2, lunchBreak, setValue, getValues]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "family"
  });

  const runCalculations = React.useCallback(() => {
    const bp = Number(basicPay) || 0;
    const isEsiActive = applyEsi !== false;
    const isPfActive = applyPf !== false;
    const isLwfActive = applyLwf !== false;
    const isLwwActive = applyLww !== false;
    const lwwAmt = Number(lwwAmount) || 0;
    const bonusAmt = Number(bonus) || 0;

    if (bp > 0) {
      // ESI Employee Logic: 0.75% of basic up to 21000. If basic > 21000 or applyEsi is false -> 0
      const esiEmp = (!isEsiActive || bp > 21000) ? 0 : Math.round(bp * 0.0075);
      
      // PF Employee Logic: 12% of basic if <= 25000; fixed 3000 if > 25000; 0 if applyPf is false
      const pfEmp = !isPfActive ? 0 : (bp > 25000 ? 3000 : Math.round(bp * 0.12));
      
      // LWF Employee: 5 if active, 0 if false
      const lwfEmp = isLwfActive ? 5 : 0;
      
      // Head 1 Net Cash in Hand:
      const net = bp - (esiEmp + pfEmp + lwfEmp);

      // ESI Employer Logic (Head 2): 3.25% ESI up to 21000; 0 if > 21000 or applyEsi is false
      const esiEmpr = (!isEsiActive || bp > 21000) ? 0 : Math.round(bp * 0.0325);
      
      // PF Employer Logic: 12% if <= 25000; fixed 3000 if > 25000; 0 if applyPf is false
      const pfEmpr = !isPfActive ? 0 : (bp > 25000 ? 3000 : Math.round(bp * 0.12));
      
      // LWF Employer: 20 if active, 0 if false
      const lwfEmpr = isLwfActive ? 20 : 0;
      
      const currentLww = isLwwActive ? lwwAmt : 0;
      const currentBonus = bonusAmt;
      
      const totalCTC = bp + esiEmpr + pfEmpr + lwfEmpr + currentLww + currentBonus;

      setValue('officeUse.esiEmployee', esiEmp, { shouldValidate: true, shouldDirty: true });
      setValue('officeUse.pfEmployee', pfEmp, { shouldValidate: true, shouldDirty: true });
      setValue('officeUse.lwfEmployee', lwfEmp, { shouldValidate: true, shouldDirty: true });
      setValue('officeUse.netCash', net, { shouldValidate: true, shouldDirty: true });
      
      setValue('officeUse.esiEmployer', esiEmpr, { shouldValidate: true, shouldDirty: true });
      setValue('officeUse.pfEmployer', pfEmpr, { shouldValidate: true, shouldDirty: true });
      setValue('officeUse.lwfEmployer', lwfEmpr, { shouldValidate: true, shouldDirty: true });
      setValue('officeUse.ctc', totalCTC, { shouldValidate: true, shouldDirty: true });
    } else {
      setValue('officeUse.esiEmployee', 0, { shouldValidate: true, shouldDirty: true });
      setValue('officeUse.pfEmployee', 0, { shouldValidate: true, shouldDirty: true });
      setValue('officeUse.lwfEmployee', 0, { shouldValidate: true, shouldDirty: true });
      setValue('officeUse.netCash', 0, { shouldValidate: true, shouldDirty: true });
      setValue('officeUse.esiEmployer', 0, { shouldValidate: true, shouldDirty: true });
      setValue('officeUse.pfEmployer', 0, { shouldValidate: true, shouldDirty: true });
      setValue('officeUse.lwfEmployer', 0, { shouldValidate: true, shouldDirty: true });
      setValue('officeUse.ctc', 0, { shouldValidate: true, shouldDirty: true });
    }
  }, [basicPay, lwwAmount, bonus, applyEsi, applyPf, applyLwf, applyLww, setValue]);

  React.useEffect(() => {
    runCalculations();
  }, [runCalculations]);

  const onSubmit = async (data: Partial<Employee>) => {
    try {
      const id = data.id || `EMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const isNew = !data.id;
      const now = new Date().toISOString();

      const { id: _drop, ...rest } = data as any;
      let mergedData: any = {
        ...rest,
        updatedAt: now,
        // An employee with a leaving date is always saved as inactive
        status: data.dateOfLeaving ? 'inactive' : (data.status || 'active'),
      };

      if (isNew) {
        mergedData.createdAt = now;
      } else {
        const { data: existing } = await supabase.from('employees').select('data').eq('id', id).single();
        mergedData = { ...(existing?.data || {}), ...mergedData };
      }

      const { error } = await supabase.from('employees').upsert({ id, data: mergedData });
      if (error) throw error;

      toast.success('EMPLOYEE_RECORD_SYNCHRONIZED_SUCCESSFULLY');
      navigate('/employees');
    } catch (error) {
      console.error(error);
      toast.error('FAILED_TO_COMMIT_TRANSACTION');
    }
  };

  const onInvalid = (formErrors: typeof errors) => {
    if (formErrors.dateOfLeaving) {
      toast.error('Invalid Date: Leaving date cannot be earlier than joining date');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="border-b border-[#141414]/10 pb-6 flex items-center justify-between">
        <div className="flex gap-4">
          <select 
            {...register('status')}
            className="font-mono text-[10px] uppercase border border-[#141414]/20 bg-transparent px-2 h-10 rounded-none focus:outline-none"
          >
            <option value="active">STATUS_ACTIVE</option>
            <option value="inactive">STATUS_INACTIVE</option>
          </select>
          <div>
            <h2 className="font-serif italic text-2xl tracking-tight">Data Registration</h2>
            <p className="font-mono text-[10px] opacity-50 uppercase mt-1">Manual entry protocol 4.1</p>
          </div>
        </div>
        <Button 
          type="submit" 
          form="employee-form" 
          disabled={isSubmitting}
          className="rounded-none bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 font-mono text-xs gap-2 h-10 px-6"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? 'COMMITTING...' : 'COMMIT_RECORDS'}
        </Button>
      </div>

      <form id="employee-form" onSubmit={handleSubmit(onSubmit, onInvalid)} className="form-readable space-y-6">
        <input type="hidden" {...register('id')} />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Identity */}
          <Section label="IDENTITY_METRICS" icon={User}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-mono text-[10px] opacity-50">EMPLOYEE_CODE</Label>
                  <Input {...register('employeeCode')} className="rounded-none font-mono text-xs border-[#141414]/20" />
                </div>
                <div>
                  <Label className="font-mono text-[10px] opacity-50">CATEGORY</Label>
                  <select 
                    {...register('category')} 
                    className="w-full h-9 rounded-none bg-transparent border border-[#141414]/20 font-mono text-xs px-3 focus:outline-none focus:ring-1 focus:ring-[#141414]"
                  >
                    <option value="">SELECT_CATEGORY</option>
                    <option value="Staff">Staff</option>
                    <option value="Worker">Worker</option>
                    <option value="PC Rate">PC Rate</option>
                  </select>
                </div>
              </div>
              <div>
                <Label className="font-mono text-[10px] opacity-50">FULL_NAME</Label>
                <Input {...register('name', { required: true })} className="rounded-none font-mono text-xs border-[#141414]/20" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,1fr)] gap-4">
                <div>
                  <Label className="font-mono text-[10px] opacity-50">DATE_OF_BIRTH</Label>
                  <Controller
                    name="dob"
                    control={control}
                    render={({ field }) => (
                      <DateInput
                        value={field.value}
                        onChange={(iso) => {
                          field.onChange(iso);
                          setValue('age', calculateAge(iso), { shouldDirty: true });
                        }}
                        onBlur={field.onBlur}
                        className="rounded-none font-mono text-xs border-[#141414]/20"
                      />
                    )}
                  />
                </div>
                <div>
                  <Label className="font-mono text-[10px] opacity-50">AGE</Label>
                  <Input type="number" {...register('age', { valueAsNumber: true })} className="rounded-none font-mono text-xs border-[#141414]/20" />
                </div>
                <div>
                  <Label className="font-mono text-[10px] opacity-50">GENDER</Label>
                  <select
                    {...register('gender')}
                    className="w-full h-9 rounded-none bg-transparent border border-[#141414]/20 font-mono text-xs px-3 focus:outline-none focus:ring-1 focus:ring-[#141414]"
                  >
                    <option value="">SELECT_GENDER</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
              <div>
                <Label className="font-mono text-[10px] opacity-50">FATHER_OR_HUSBAND_NAME</Label>
                <Input {...register('fatherHusbandName')} className="rounded-none font-mono text-xs border-[#141414]/20" />
              </div>
            </div>
          </Section>

          {/* Placement */}
          <Section label="PLACEMENT_DATA" icon={Briefcase}>
            <div className="space-y-4">
              <div>
                <Label className="font-mono text-[10px] opacity-50">DEPARTMENT</Label>
                <Input {...register('department', { required: true })} className="rounded-none font-mono text-xs border-[#141414]/20" />
              </div>
              <div>
                <Label className="font-mono text-[10px] opacity-50">POST_DESIGNATION</Label>
                <Input {...register('postAppliedFor', { required: true })} className="rounded-none font-mono text-xs border-[#141414]/20" />
              </div>
              <div>
                <Label className="font-mono text-[10px] opacity-50">JOB_OR_PROCESS_ASSIGNED</Label>
                <Input {...register('jobProcessAssigned')} placeholder="e.g. Overlock / Cutting / Quality Checking / Packaging" className="rounded-none font-mono text-xs border-[#141414]/20" />
              </div>
              <div>
                <Label className="font-mono text-[10px] opacity-50">EXPERIENCE</Label>
                <Input {...register('experience')} placeholder="e.g. 5 Years" className="rounded-none font-mono text-xs border-[#141414]/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-mono text-[10px] opacity-50">QUALIFICATION</Label>
                  <Input {...register('qualification')} className="rounded-none font-mono text-xs border-[#141414]/20" />
                </div>
                <div>
                  <Label className="font-mono text-[10px] opacity-50">TECH_QUAL</Label>
                  <Input {...register('technicalQualification')} className="rounded-none font-mono text-xs border-[#141414]/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-mono text-[10px] opacity-50">JOINING_DATE</Label>
                  <Controller
                    name="dateOfJoining"
                    control={control}
                    render={({ field }) => (
                      <DateInput
                        value={field.value}
                        onChange={(iso) => {
                          field.onChange(iso);
                          // Re-check the leaving date whenever the joining date changes
                          if (getValues('dateOfLeaving')) trigger('dateOfLeaving');
                        }}
                        onBlur={field.onBlur}
                        className="rounded-none font-mono text-xs border-[#141414]/20"
                      />
                    )}
                  />
                </div>
                <div>
                  <Label className="font-mono text-[10px] opacity-50">LEAVING_DATE</Label>
                  <Controller
                    name="dateOfLeaving"
                    control={control}
                    rules={{
                      validate: (value) => {
                        const joining = getValues('dateOfJoining');
                        // ISO YYYY-MM-DD strings compare correctly as text
                        return !value || !joining || value >= joining || 'Invalid Date';
                      }
                    }}
                    render={({ field }) => (
                      <DateInput
                        value={field.value}
                        min={dateOfJoining || undefined}
                        onChange={(iso) => {
                          field.onChange(iso);
                          // Leaving date marks the employee as having left
                          if (iso) {
                            setValue('status', 'inactive', { shouldDirty: true });
                          }
                          trigger('dateOfLeaving');
                        }}
                        onBlur={field.onBlur}
                        aria-invalid={!!errors.dateOfLeaving}
                        className={`rounded-none font-mono text-xs ${errors.dateOfLeaving ? 'border-red-600' : 'border-[#141414]/20'}`}
                      />
                    )}
                  />
                  {errors.dateOfLeaving && (
                    <p className="font-mono text-[10px] font-bold text-red-600 mt-1">
                      {errors.dateOfLeaving.message || 'Invalid Date'}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label className="font-mono text-[10px] opacity-50">REFERENCE</Label>
                <Input {...register('reference')} className="rounded-none font-mono text-xs border-[#141414]/20" />
              </div>
            </div>
          </Section>

          {/* Languages */}
          <Section label="LANGUAGES_PROFICIENCY" icon={LanguagesIcon}>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2 border-b border-[#141414]/10 pb-1 mb-2">
                <div className="field-caption font-mono text-[10px] opacity-40">LANGUAGE</div>
                <div className="field-caption font-mono text-[10px] opacity-40 text-center">READ</div>
                <div className="field-caption font-mono text-[10px] opacity-40 text-center">WRITE</div>
                <div className="field-caption font-mono text-[10px] opacity-40 text-center">SPEAK</div>
              </div>

              {['hindi', 'english', 'punjabi'].map((lang) => (
                <div key={lang} className="grid grid-cols-4 gap-2 items-center">
                  <div className="field-caption font-mono text-xs uppercase">{lang}</div>
                  <div className="flex justify-center">
                    <input type="checkbox" {...register(`languages.${lang}.read` as any)} className="w-4 h-4 rounded-none border-[#141414]/20 accent-[#141414]" />
                  </div>
                  <div className="flex justify-center">
                    <input type="checkbox" {...register(`languages.${lang}.write` as any)} className="w-4 h-4 rounded-none border-[#141414]/20 accent-[#141414]" />
                  </div>
                  <div className="flex justify-center">
                    <input type="checkbox" {...register(`languages.${lang}.speak` as any)} className="w-4 h-4 rounded-none border-[#141414]/20 accent-[#141414]" />
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-[#141414]/10">
                <div className="grid grid-cols-4 gap-2 items-center">
                  <div className="flex flex-col gap-1">
                    <Label className="font-mono text-[8px] opacity-40 uppercase">OTHER_SPECIFY</Label>
                    <Input {...register('languages.other.name')} placeholder="Language" className="rounded-none font-mono text-[10px] h-8 border-[#141414]/20" />
                  </div>
                  <div className="flex justify-center pt-4">
                    <input type="checkbox" {...register('languages.other.skill.read' as any)} className="w-4 h-4 rounded-none border-[#141414]/20 accent-[#141414]" />
                  </div>
                  <div className="flex justify-center pt-4">
                    <input type="checkbox" {...register('languages.other.skill.write' as any)} className="w-4 h-4 rounded-none border-[#141414]/20 accent-[#141414]" />
                  </div>
                  <div className="flex justify-center pt-4">
                    <input type="checkbox" {...register('languages.other.skill.speak' as any)} className="w-4 h-4 rounded-none border-[#141414]/20 accent-[#141414]" />
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Duty & Shift */}
          <Section label="DUTY_SPECIFICATIONS" icon={Clock}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-mono text-[10px] opacity-50">DUTY_IN_TIME</Label>
                  <Controller
                    name="dutyTime"
                    control={control}
                    render={({ field }) => (
                      <TimeAmPmInput
                        value={field.value || ''}
                        onChange={(val) => {
                          field.onChange(val);
                          updateDutyHours(val, watch('dutyOutTime'));
                        }}
                      />
                    )}
                  />
                </div>
                <div>
                  <Label className="font-mono text-[10px] opacity-50">DUTY_OUT_TIME</Label>
                  <Controller
                    name="dutyOutTime"
                    control={control}
                    render={({ field }) => (
                      <TimeAmPmInput
                        value={field.value || ''}
                        onChange={(val) => {
                          field.onChange(val);
                          updateDutyHours(watch('dutyTime'), val);
                        }}
                      />
                    )}
                  />
                </div>
              </div>
              <div>
                <Label className="font-mono text-[10px] opacity-50">DUTY_HOURS (AUTO)</Label>
                <Input {...register('dutyHours')} placeholder="Fills from In/Out time" className="rounded-none font-mono text-xs border-[#141414]/20 bg-[#141414]/5" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-mono text-[10px] opacity-50">SHIFT_TIME</Label>
                  <select
                    {...register('shiftTime')}
                    className="w-full h-9 rounded-none bg-transparent border border-[#141414]/20 font-mono text-xs px-3 focus:outline-none focus:ring-1 focus:ring-[#141414]"
                  >
                    <option value="">SELECT_SHIFT</option>
                    <option value="Day">Day</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
                <div>
                  <Label className="font-mono text-[10px] opacity-50">TEA_TIME_ALLOWED</Label>
                  <Input
                    {...register('teaTimeAllowed', {
                      onChange: (e) => {
                        const half = halfBreakTime(e.target.value);
                        setValue('teaBreak1', half, { shouldDirty: true });
                        setValue('teaBreak2', half, { shouldDirty: true });
                      }
                    })}
                    placeholder="e.g. 30 mins"
                    className="rounded-none font-mono text-xs border-[#141414]/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="font-mono text-[10px] opacity-50">TEA_BREAK_1</Label>
                  <Input {...register('teaBreak1')} placeholder="Time" className="rounded-none font-mono text-xs border-[#141414]/20" />
                </div>
                <div>
                  <Label className="font-mono text-[10px] opacity-50">TEA_BREAK_2</Label>
                  <Input {...register('teaBreak2')} placeholder="Time" className="rounded-none font-mono text-xs border-[#141414]/20" />
                </div>
                <div>
                  <Label className="font-mono text-[10px] opacity-50">LUNCH_BREAK</Label>
                  <Input {...register('lunchBreak')} placeholder="Time" className="rounded-none font-mono text-xs border-[#141414]/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-mono text-[10px] opacity-50">OVERTIME_ALLOWED?</Label>
                  <select 
                    {...register('overtimeAllowed', { setValueAs: (v) => v === 'true' })} 
                    className="w-full h-9 rounded-none bg-transparent border border-[#141414]/20 font-mono text-xs px-3 focus:outline-none focus:ring-1 focus:ring-[#141414]"
                  >
                    <option value="false">NO</option>
                    <option value="true">YES</option>
                  </select>
                </div>
                <div>
                  <Label className="font-mono text-[10px] opacity-50">PAYABLE DUTY HOURS</Label>
                  <Input {...register('payableDutyHours')} readOnly placeholder="Duty hours − tea − lunch" className="rounded-none font-mono text-xs border-[#141414]/20 bg-[#141414]/5" />
                </div>
              </div>
            </div>
          </Section>

          {/* Contact & Address */}
          <Section label="LOCATION_AND_COMMS" icon={MapPin}>
            <div className="space-y-4">
              <div>
                <Label className="font-mono text-[10px] opacity-50">CONTACT_NUMBER</Label>
                <div className="flex gap-2">
                  <div className="flex items-center justify-center bg-[#141414] text-[#E4E3E0] px-3 border border-[#141414]">
                    <Phone className="w-3 h-3" />
                  </div>
                  <Input {...register('contactNo')} className="rounded-none font-mono text-xs border-[#141414]/20" />
                </div>
              </div>
              <div>
                <Label className="font-mono text-[10px] opacity-50">ALTERNATE_CONTACT</Label>
                <Input {...register('alternateContactNo')} className="rounded-none font-mono text-xs border-[#141414]/20" />
              </div>
              <div>
                <Label className="font-mono text-[10px] opacity-50">PERMANENT_ADDRESS</Label>
                <Input {...register('permanentAddress')} className="rounded-none font-mono text-xs border-[#141414]/20" />
              </div>
              <div>
                <Label className="font-mono text-[10px] opacity-50">LOCAL_ADDRESS</Label>
                <Input {...register('localAddress')} className="rounded-none font-mono text-xs border-[#141414]/20" />
              </div>
            </div>
          </Section>

          {/* Dependents */}
          <Section label="DEPENDENTS_AND_NOMINEES" icon={Users}>
            <div className="space-y-4">
              <div>
                <Label className="font-mono text-[10px] opacity-55 font-bold">NOMINEE_DETAILS</Label>
                <div className={`${nameGenderRelationGrid} mt-2`}>
                  <div>
                    <Label className="font-mono text-[8px] opacity-40">NAME</Label>
                    <Input {...register('nominee.name')} className="rounded-none font-mono text-[10px] h-8 border-[#141414]/20" />
                  </div>
                  <div>
                    <Label className="font-mono text-[8px] opacity-40">GENDER</Label>
                    <select {...register('nominee.gender')} className={`${smallSelectClass} bg-transparent`}>
                      {genderOptions}
                    </select>
                  </div>
                  <div>
                    <Label className="font-mono text-[8px] opacity-40">RELATION</Label>
                    <Input {...register('nominee.relation')} className="rounded-none font-mono text-[10px] h-8 border-[#141414]/20" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label className="font-mono text-[8px] opacity-40">DOB</Label>
                    <Controller
                      name="nominee.dob"
                      control={control}
                      render={({ field }) => (
                        <DateInput
                          value={field.value}
                          onChange={(iso) => {
                            field.onChange(iso);
                            setValue('nominee.age', calculateAge(iso), { shouldDirty: true });
                          }}
                          onBlur={field.onBlur}
                          className="rounded-none font-mono text-[10px] h-8 border-[#141414]/20"
                        />
                      )}
                    />
                  </div>
                  <div>
                    <Label className="font-mono text-[8px] opacity-40">AGE</Label>
                    <Input type="number" {...register('nominee.age', { valueAsNumber: true })} className="rounded-none font-mono text-[10px] h-8 border-[#141414]/20" />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-[#141414]/10">
                <div className="flex items-center justify-between mb-4">
                  <Label className="font-mono text-[10px] opacity-55 font-bold">FAMILY_MEMBERS</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => append({ name: '', gender: '', relation: '', age: 0, dob: '', mobileNumber: '' })}
                    className="h-6 rounded-none font-mono text-[8px] gap-1 px-2 border-[#141414]/20"
                  >
                    <Plus className="w-2 h-2" />
                    ADD_MEMBER
                  </Button>
                </div>
                
                <div className="space-y-6">
                  {fields.map((field, index) => (
                    <div key={field.id} className="relative bg-[#141414]/5 p-3 border border-[#141414]/10 space-y-3">
                      {fields.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => remove(index)}
                          className="absolute top-2 right-2 text-red-500/40 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                      
                      <div className={`${nameGenderRelationGrid} pr-4`}>
                        <div>
                          <Label className="font-mono text-[8px] opacity-40 uppercase">NAME</Label>
                          <Input {...register(`family.${index}.name` as const)} className="rounded-none font-mono text-[10px] h-8 border-[#141414]/20 bg-white/50" />
                        </div>
                        <div>
                          <Label className="font-mono text-[8px] opacity-40 uppercase">GENDER</Label>
                          <select {...register(`family.${index}.gender` as const)} className={`${smallSelectClass} bg-white/50`}>
                            {genderOptions}
                          </select>
                        </div>
                        <div>
                          <Label className="font-mono text-[8px] opacity-40 uppercase">RELATION</Label>
                          <Input {...register(`family.${index}.relation` as const)} className="rounded-none font-mono text-[10px] h-8 border-[#141414]/20 bg-white/50" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="font-mono text-[8px] opacity-40 uppercase">DOB</Label>
                          <Controller
                            name={`family.${index}.dob` as const}
                            control={control}
                            render={({ field }) => (
                              <DateInput
                                value={field.value}
                                onChange={(iso) => {
                                  field.onChange(iso);
                                  setValue(`family.${index}.age` as const, calculateAge(iso), { shouldDirty: true });
                                }}
                                onBlur={field.onBlur}
                                className="rounded-none font-mono text-[10px] h-8 border-[#141414]/20 bg-white/50"
                              />
                            )}
                          />
                        </div>
                        <div>
                          <Label className="font-mono text-[8px] opacity-40 uppercase">AGE</Label>
                          <Input type="number" {...register(`family.${index}.age` as const, { valueAsNumber: true })} className="rounded-none font-mono text-[10px] h-8 border-[#141414]/20 bg-white/50" />
                        </div>
                        <div>
                          <Label className="font-mono text-[8px] opacity-40 uppercase">MOBILE_NO</Label>
                          <Input {...register(`family.${index}.mobileNumber` as const)} className="rounded-none font-mono text-[10px] h-8 border-[#141414]/20 bg-white/50" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* Office Use Only */}
          <div className="xl:col-span-2 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => runCalculations()}
              className="rounded-none border-[#141414]/30 font-mono text-xs gap-2 h-9 px-4 hover:bg-[#141414] hover:text-[#E4E3E0]"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>RECALCULATE_SALARY_HEADS</span>
            </Button>
          </div>

          <Section label="HEAD_1 (EMPLOYEE_SHARE_HEAD_1 - CASH_IN_HAND)" icon={ClipboardCheck}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-mono text-[10px] opacity-50">BASIC_PAY (MONTHLY)</Label>
                  <Input 
                    type="number" 
                    {...register('officeUse.basicPay', { valueAsNumber: true })} 
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setValue('officeUse.basicPay', val, { shouldValidate: true, shouldDirty: true });
                    }}
                    className="rounded-none font-mono text-xs border-[#141414]/20" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="font-mono text-[10px] opacity-50">ESI_APPLY (≤ ₹21,000)</Label>
                    <select 
                      value={applyEsi !== false ? 'true' : 'false'}
                      onChange={(e) => {
                        const val = e.target.value === 'true';
                        setValue('officeUse.applyEsi', val, { shouldValidate: true, shouldDirty: true });
                      }}
                      className="w-full h-9 rounded-none bg-transparent border border-[#141414]/20 font-mono text-[10px] px-2 focus:outline-none"
                    >
                      <option value="true">YES</option>
                      <option value="false">NO</option>
                    </select>
                  </div>
                  <div>
                    <Label className="font-mono text-[10px] opacity-50">PF_APPLY</Label>
                    <select 
                      value={applyPf !== false ? 'true' : 'false'}
                      onChange={(e) => {
                        const val = e.target.value === 'true';
                        setValue('officeUse.applyPf', val, { shouldValidate: true, shouldDirty: true });
                      }}
                      className="w-full h-9 rounded-none bg-transparent border border-[#141414]/20 font-mono text-[10px] px-2 focus:outline-none"
                    >
                      <option value="true">YES</option>
                      <option value="false">NO</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <Label className="font-mono text-[10px] opacity-50">ESI_EMPLOYEE (0.75%)</Label>
                    <span className="font-mono text-[8px] opacity-40">0% if Basic &gt; 21k</span>
                  </div>
                  <Input 
                    type="number" 
                    {...register('officeUse.esiEmployee', { valueAsNumber: true })} 
                    className="rounded-none font-mono text-xs border-[#141414]/20 bg-[#141414]/5" 
                  />
                </div>
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <Label className="font-mono text-[10px] opacity-50">PF_EMPLOYEE (12%)</Label>
                    <span className="font-mono text-[8px] opacity-40">Max ₹3000 if &gt; 25k</span>
                  </div>
                  <Input 
                    type="number" 
                    {...register('officeUse.pfEmployee', { valueAsNumber: true })} 
                    className="rounded-none font-mono text-xs border-[#141414]/20 bg-[#141414]/5" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="font-mono text-[10px] opacity-50">LWF_EMPLOYEE (₹5)</Label>
                    <Input 
                      type="number" 
                      {...register('officeUse.lwfEmployee', { valueAsNumber: true })} 
                      className="rounded-none font-mono text-xs border-[#141414]/20 bg-[#141414]/5" 
                    />
                  </div>
                  <div className="w-16">
                    <Label className="font-mono text-[10px] opacity-50">YES/NO</Label>
                    <select 
                      value={applyLwf !== false ? 'true' : 'false'}
                      onChange={(e) => {
                        const val = e.target.value === 'true';
                        setValue('officeUse.applyLwf', val, { shouldValidate: true, shouldDirty: true });
                      }}
                      className="w-full h-9 rounded-none bg-transparent border border-[#141414]/20 font-mono text-[10px] px-2 focus:outline-none"
                    >
                      <option value="true">YES</option>
                      <option value="false">NO</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label className="font-mono text-[10px] opacity-50 font-bold text-[#141414]">NET_CASH_IN_HAND (HEAD 1)</Label>
                  <Input 
                    type="number" 
                    {...register('officeUse.netCash', { valueAsNumber: true })} 
                    className="rounded-none font-mono text-xs border-[#141414] font-bold bg-[#141414]/10" 
                  />
                </div>
              </div>
              <div>
                <Label className="font-mono text-[10px] opacity-50">BONUS</Label>
                <Input 
                  type="number" 
                  {...register('officeUse.bonus', { valueAsNumber: true })} 
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setValue('officeUse.bonus', val, { shouldValidate: true, shouldDirty: true });
                  }}
                  className="rounded-none font-mono text-xs border-[#141414]/20" 
                />
              </div>
            </div>
          </Section>

          <Section label="HEAD_2 (EMPLOYER_SHARE_HEAD_2 - TOTAL_CTC)" icon={ClipboardCheck}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <Label className="font-mono text-[10px] opacity-50">ESI_EMPLOYER (3.25%)</Label>
                    <span className="font-mono text-[8px] opacity-40">0% if Basic &gt; 21k</span>
                  </div>
                  <Input 
                    type="number" 
                    {...register('officeUse.esiEmployer', { valueAsNumber: true })} 
                    className="rounded-none font-mono text-xs border-[#141414]/20 bg-[#141414]/5" 
                  />
                </div>
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <Label className="font-mono text-[10px] opacity-50">PF_EMPLOYER (12%)</Label>
                    <span className="font-mono text-[8px] opacity-40">Max ₹3000 if &gt; 25k</span>
                  </div>
                  <Input 
                    type="number" 
                    {...register('officeUse.pfEmployer', { valueAsNumber: true })} 
                    className="rounded-none font-mono text-xs border-[#141414]/20 bg-[#141414]/5" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-mono text-[10px] opacity-50">LWF_EMPLOYER (₹20)</Label>
                  <Input 
                    type="number" 
                    {...register('officeUse.lwfEmployer', { valueAsNumber: true })} 
                    className="rounded-none font-mono text-xs border-[#141414]/20 bg-[#141414]/5" 
                  />
                </div>
                <div>
                  <Label className="font-mono text-[10px] opacity-50 font-bold text-[#141414]">TOTAL_CTC (HEAD 2)</Label>
                  <Input 
                    type="number" 
                    {...register('officeUse.ctc', { valueAsNumber: true })} 
                    className="rounded-none font-mono text-xs border-[#141414] font-bold bg-[#141414]/10" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-mono text-[10px] opacity-50">LWW_ALLOWED (LEAVE_W_WAGE)</Label>
                  <Input type="number" {...register('officeUse.lwwAllowed', { valueAsNumber: true })} placeholder="Month leaves" className="rounded-none font-mono text-xs border-[#141414]/20" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="w-full">
                    <Label className="font-mono text-[10px] opacity-50">LWW_AMOUNT</Label>
                    <Input 
                      type="number" 
                      {...register('officeUse.lwwAmount', { valueAsNumber: true })} 
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setValue('officeUse.lwwAmount', val, { shouldValidate: true, shouldDirty: true });
                      }}
                      className="rounded-none font-mono text-xs border-[#141414]/20" 
                    />
                  </div>
                  <div>
                    <Label className="font-mono text-[10px] opacity-50">APPLY_LWW</Label>
                    <select 
                      value={applyLww !== false ? 'true' : 'false'}
                      onChange={(e) => {
                        const val = e.target.value === 'true';
                        setValue('officeUse.applyLww', val, { shouldValidate: true, shouldDirty: true });
                      }}
                      className="w-full h-9 rounded-none bg-transparent border border-[#141414]/20 font-mono text-[10px] px-2 focus:outline-none"
                    >
                      <option value="true">YES</option>
                      <option value="false">NO</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="font-mono text-[10px] opacity-50">OLD_ESI</Label>
                  <Input {...register('esi')} className="rounded-none font-mono text-xs border-[#141414]/20 text-[10px]" />
                </div>
                <div>
                  <Label className="font-mono text-[10px] opacity-50">OLD_PF</Label>
                  <Input {...register('pf')} className="rounded-none font-mono text-xs border-[#141414]/20 text-[10px]" />
                </div>
                <div>
                  <Label className="font-mono text-[10px] opacity-50">OLD_UAN</Label>
                  <Input {...register('uan')} className="rounded-none font-mono text-xs border-[#141414]/20 text-[10px]" />
                </div>
              </div>
              <div>
                <Label className="font-mono text-[10px] opacity-50">REMARKS</Label>
                <Input {...register('officeUse.remarks')} className="rounded-none font-mono text-xs border-[#141414]/20" />
              </div>
            </div>
          </Section>
        </div>
      </form>
    </div>
  );
}

// Clock text box (hh:mm) with AM/PM buttons that appear once a time is typed.
// Stored as a single string, e.g. "09:30 AM".
function TimeAmPmInput({ value, onChange }: { value: string, onChange: (value: string) => void }) {
  const { time, period } = splitTime(value);

  const emit = (t: string, p: Meridiem) => onChange(t ? (p ? `${t} ${p}` : t) : '');

  const handleBlur = () => {
    if (!time) return;
    const normalized = normalizeClock(time, period);
    emit(normalized.time, normalized.period);
  };

  return (
    <div className="flex gap-1">
      <Input
        value={time}
        onChange={(e) => emit(e.target.value.replace(/[^\d:.]/g, '').slice(0, 5), period)}
        onBlur={handleBlur}
        placeholder="hh:mm"
        inputMode="numeric"
        className="rounded-none font-mono text-xs border-[#141414]/20"
      />
      {time && (
        <div className={`flex border ${period ? 'border-[#141414]/20' : 'border-amber-500 animate-pulse'}`}>
          {(['AM', 'PM'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => emit(normalizeClock(time, p).time, p)}
              className={`px-2 font-mono text-[10px] font-bold transition-colors ${
                period === p ? 'bg-[#141414] text-[#E4E3E0]' : 'bg-transparent text-[#141414] hover:bg-[#141414]/10'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ label, icon: Icon, children }: { label: string, icon: any, children: React.ReactNode }) {
  return (
    <div className="bg-[#141414]/5 border border-[#141414]/10 p-6 space-y-6">
      <div className="flex items-center gap-3 border-b border-[#141414]/10 pb-4">
        <Icon className="w-4 h-4 opacity-50" />
        <h3 className="font-serif italic text-sm tracking-tight">{label}</h3>
      </div>
      {children}
    </div>
  );
}
