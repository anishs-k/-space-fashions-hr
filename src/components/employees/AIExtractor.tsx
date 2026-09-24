import React from 'react';
import { extractEmployeeData } from '@/lib/gemini';
import { EmployeeForm } from './EmployeeForm';
import { Button } from '@/components/ui/button';
import { FileUp, Loader2, Camera, Wand2, CheckCircle2, UserCheck, AlertCircle, Database, Save, FileSpreadsheet, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { supabase, fetchAllRows, upsertInBatches } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export function AIExtractor() {
  const navigate = useNavigate();
  const [pendingEmployees, setPendingEmployees] = React.useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState<number | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isSavingAll, setIsSavingAll] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const computeOfficeUse = (officeUse: any) => {
    const bp = Number(officeUse?.basicPay || 0);
    const applyEsi = officeUse?.applyEsi !== false;
    const applyPf = officeUse?.applyPf !== false;
    const applyLwf = officeUse?.applyLwf !== false;
    const lwwAmt = Number(officeUse?.lwwAmount || 0);
    const bonusAmt = Number(officeUse?.bonus || 0);

    if (bp > 0) {
      const esiEmp = (!applyEsi || bp > 21000) ? 0 : Math.round(bp * 0.0075);
      const pfEmp = !applyPf ? 0 : (bp > 15000 ? 1800 : Math.round(bp * 0.12));
      const lwfEmp = applyLwf ? 5 : 0;
      const netCash = bp - (esiEmp + pfEmp + lwfEmp);

      const esiEmployer = (!applyEsi || bp > 21000) ? 0 : Math.round(bp * 0.0325);
      const pfEmployer = !applyPf ? 0 : (bp > 15000 ? 1800 : Math.round(bp * 0.12));
      const lwfEmployer = applyLwf ? 20 : 0;
      const ctc = bp + esiEmployer + pfEmployer + lwfEmployer + lwwAmt + bonusAmt;

      return {
        ...officeUse,
        basicPay: bp,
        esiEmployee: esiEmp,
        pfEmployee: pfEmp,
        lwfEmployee: lwfEmp,
        netCash: officeUse?.netCash || netCash,
        esiEmployer: esiEmployer,
        pfEmployer: pfEmployer,
        lwfEmployer: lwfEmployer,
        ctc: officeUse?.ctc || ctc,
        lwwAmount: lwwAmt,
        bonus: bonusAmt
      };
    }
    return officeUse;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');

    setIsProcessing(true);

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const buffer = evt.target?.result;
          const workbook = XLSX.read(buffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet);

          if (rawRows.length === 0) {
            toast.error('EXCEL_FILE_IS_EMPTY');
            setIsProcessing(false);
            return;
          }

          const parsedEmployees = rawRows.map((r, i) => {
            const codeRaw = String(r.code_serial || r['code_serial'] || r.employeeCode || r['Employee Code'] || r['Code'] || r['Emp Code'] || (5380 + i)).replace(/\.0$/, '').trim();
            const bp = Number(r.basic_pay || r['Basic Pay'] || r.basicPay || 0) || 0;
            const ctcVal = Number(r.ctc || r['CTC'] || 0) || 0;
            const netCashVal = Number(r.net_in_hand || r['Net Cash'] || r.netCash || 0) || 0;

            const langReadStr = String(r.lang_read || '').toLowerCase();
            const langWriteStr = String(r.lang_write || '').toLowerCase();
            const langSpeakStr = String(r.lang_speak || '').toLowerCase();

            const familyRaw = String(r.family_particulars || '');
            const familyList = familyRaw ? familyRaw.split(';').map(f => {
              const parts = f.split('/').map(p => p.trim());
              return {
                name: parts[0] || '',
                age: Number(parts[1]) || 0,
                relation: parts[2] || '',
                dob: '',
                mobileNumber: ''
              };
            }).filter(f => f.name) : [];

            return {
              id: `EMP-${codeRaw}`,
              employeeCode: codeRaw,
              name: String(r.name || r['Name'] || r['Full Name'] || `Employee ${codeRaw}`).trim(),
              postAppliedFor: String(r.post_applied_for || r.postAppliedFor || r['Post'] || 'HELPER').trim(),
              jobProcessAssigned: String(r.skills_machine || r.jobProcessAssigned || '').trim(),
              department: String(r.department || r['Department'] || 'Production').trim(),
              fatherHusbandName: String(r.father_husband_name || r.fatherHusbandName || '').trim(),
              dob: String(r.dob || '').trim(),
              age: Number(r.age) || 0,
              qualification: String(r.qualification || '').trim(),
              technicalQualification: String(r.technical_qualification || '').trim(),
              permanentAddress: String(r.permanent_address || '').trim(),
              localAddress: String(r.local_address || '').trim(),
              reference: String(r.reference || '').trim(),
              contactNo: String(r.contact_no || r.contactNo || '').replace(/\.0$/, '').trim(),
              alternateContactNo: '',
              dateOfJoining: String(r.date_of_joining || '').trim(),
              category: 'Worker',
              status: 'active',
              languages: {
                hindi: {
                  read: langReadStr.includes('hindi') || true,
                  write: langWriteStr.includes('hindi') || true,
                  speak: langSpeakStr.includes('hindi') || true
                },
                english: {
                  read: langReadStr.includes('english'),
                  write: langWriteStr.includes('english'),
                  speak: langSpeakStr.includes('english')
                },
                punjabi: {
                  read: langReadStr.includes('punjabi'),
                  write: langWriteStr.includes('punjabi'),
                  speak: langSpeakStr.includes('punjabi')
                },
                other: { name: '', skill: { read: false, write: false, speak: false } }
              },
              nominee: {
                name: String(r.nominee_name || '').trim(),
                age: Number(r.nominee_age) || 0,
                dob: String(r.nominee_dob || '').trim(),
                relation: String(r.nominee_relation || '').trim()
              },
              family: familyList,
              officeUse: computeOfficeUse({
                basicPay: bp,
                ctc: ctcVal,
                netCash: netCashVal,
                esiEmployee: 0,
                pfEmployee: 0,
                esiEmployer: 0,
                pfEmployer: 0,
                lwfEmployee: 5,
                lwfEmployer: 20,
                applyEsi: true,
                applyPf: true,
                applyLwf: true,
                applyLww: false,
                lwwAmount: 0,
                lwwAllowed: 0,
                bonus: 0,
                remarks: r.file ? `Imported from ${r.file}` : 'Imported via Excel'
              })
            };
          });

          // Fetch existing employees to prevent duplicate records (all records via pagination)
          const existingRecords = await fetchAllRows('employees');
          const existingList = existingRecords || [];

          // Compute max numerical employee code currently in DB
          let currentMaxCode = 6063;
          existingList.forEach(r => {
            const num = parseInt(String(r.data?.employeeCode || r.id).replace(/\D/g, ''), 10);
            if (!isNaN(num) && num > currentMaxCode) currentMaxCode = num;
          });

          const now = new Date().toISOString();
          const seenBatchIds = new Set<string>();

          const rows = parsedEmployees.map(emp => {
            let assignedCode = String(emp.employeeCode || '').replace(/\.0$/, '').trim();
            let assignedId = emp.id || '';

            // Check if already exists in DB by ID or Code
            const existingMatch = existingList.find(r => 
              (assignedCode && (r.id === `EMP-${assignedCode}` || r.data?.employeeCode === assignedCode)) ||
              (assignedId && r.id === assignedId) ||
              (r.data?.contactNo && emp.contactNo && r.data.contactNo.length >= 10 && r.data.contactNo === emp.contactNo)
            );

            if (existingMatch) {
              assignedId = existingMatch.id;
              assignedCode = existingMatch.data?.employeeCode || assignedId.replace('EMP-', '');
            } else if (!assignedCode || assignedCode === 'undefined' || assignedCode === 'null') {
              currentMaxCode += 1;
              assignedCode = String(currentMaxCode);
              assignedId = `EMP-${assignedCode}`;
            } else {
              assignedId = assignedId || (assignedCode.startsWith('EMP-') ? assignedCode : `EMP-${assignedCode}`);
            }

            // Ensure unique ID within current batch
            while (seenBatchIds.has(assignedId)) {
              currentMaxCode += 1;
              assignedCode = String(currentMaxCode);
              assignedId = `EMP-${assignedCode}`;
            }
            seenBatchIds.add(assignedId);

            return {
              id: assignedId,
              data: {
                ...(existingMatch?.data || {}),
                ...emp,
                id: assignedId,
                employeeCode: assignedCode,
                status: emp.status || existingMatch?.data?.status || 'active',
                createdAt: existingMatch?.data?.createdAt || now,
                updatedAt: now
              }
            };
          });

          await upsertInBatches('employees', rows, 100);
          toast.success(`SCANNED_&_SAVED_${rows.length}_EMPLOYEES_TO_DATABASE`);
          setPendingEmployees(rows.map(r => r.data));
        } catch (err: any) {
          console.error(err);
          toast.error(`FAILED_TO_PARSE_EXCEL_FILE: ${err?.message || ''}`);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    const reader = new FileReader();
    const mimeType = file.type;
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setPreviewUrl(reader.result as string);
      
      try {
        const result = await extractEmployeeData(base64, mimeType);
        const employees = result.employees || [];
        
        if (employees.length > 0) {
          // Fetch existing employees to prevent duplicate rows (full pagination)
          const existingRecords = await fetchAllRows('employees');
          const existingList = existingRecords || [];

          let currentMaxCode = 6063;
          existingList.forEach(r => {
            const num = parseInt(String(r.data?.employeeCode || r.id).replace(/\D/g, ''), 10);
            if (!isNaN(num) && num > currentMaxCode) currentMaxCode = num;
          });

          const now = new Date().toISOString();
          const seenAiBatchIds = new Set<string>();

          const rows = employees.map((emp: any) => {
            const cleanPhone = String(emp.contactNo || '').replace(/\D/g, '');
            const cleanName = String(emp.name || '').trim().toLowerCase();
            const cleanFather = String(emp.fatherHusbandName || '').trim().toLowerCase();

            // Check if record already exists by Code, Mobile, or Name+FatherName
            const existingMatch = existingList.find(r => {
              if (emp.employeeCode && (r.id === `EMP-${emp.employeeCode}` || r.data?.employeeCode === String(emp.employeeCode))) {
                return true;
              }
              const rPhone = String(r.data?.contactNo || '').replace(/\D/g, '');
              if (cleanPhone.length >= 10 && rPhone === cleanPhone) {
                return true;
              }
              const rName = String(r.data?.name || '').trim().toLowerCase();
              const rFather = String(r.data?.fatherHusbandName || '').trim().toLowerCase();
              if (cleanName && cleanFather && rName === cleanName && rFather === cleanFather) {
                return true;
              }
              return false;
            });

            let assignedId = '';
            let assignedCode = '';

            if (existingMatch) {
              assignedId = existingMatch.id;
              assignedCode = existingMatch.data?.employeeCode || assignedId.replace('EMP-', '');
            } else if (emp.employeeCode && emp.employeeCode !== 'undefined') {
              assignedCode = String(emp.employeeCode).replace('EMP-', '').trim();
              assignedId = `EMP-${assignedCode}`;
            } else {
              currentMaxCode += 1;
              assignedCode = String(currentMaxCode);
              assignedId = `EMP-${assignedCode}`;
            }

            // Ensure unique ID within this AI scan batch
            while (seenAiBatchIds.has(assignedId)) {
              currentMaxCode += 1;
              assignedCode = String(currentMaxCode);
              assignedId = `EMP-${assignedCode}`;
            }
            seenAiBatchIds.add(assignedId);

            const computedOfficeUse = computeOfficeUse(emp.officeUse || {});

            return {
              id: assignedId,
              data: {
                ...(existingMatch?.data || {}),
                ...emp,
                id: assignedId,
                employeeCode: assignedCode,
                officeUse: computedOfficeUse,
                status: emp.status || existingMatch?.data?.status || 'active',
                createdAt: existingMatch?.data?.createdAt || now,
                updatedAt: now
              }
            };
          });

          // Upsert to Supabase in safe batches
          await upsertInBatches('employees', rows, 100);
          toast.success(`SCANNED_&_SAVED_${rows.length}_EMPLOYEES_TO_DATABASE`);
          setPendingEmployees(rows.map(r => r.data));
        } else {
          setPendingEmployees([]);
          toast.error('NO_RECORDS_FOUND_IN_DOCUMENT');
        }
      } catch (error: any) {
        console.error(error);
        toast.error(`AI_EXTRACTION_FAILED: ${error?.message || 'UNABLE_TO_PARSE_DOCUMENT'}`);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setPendingEmployees([]);
    setCurrentIndex(null);
    setPreviewUrl(null);
  };

  const handleSaveAll = async () => {
    if (pendingEmployees.length === 0) return;
    setIsSavingAll(true);
    try {
      const now = new Date().toISOString();
      const rows = pendingEmployees.map(emp => {
        const code = emp.employeeCode || `${Math.floor(1000 + Math.random() * 9000)}`;
        const id = emp.id || (code.startsWith('EMP-') ? code : `EMP-${code}`);
        return {
          id,
          data: {
            ...emp,
            employeeCode: emp.employeeCode || code.replace('EMP-', ''),
            officeUse: computeOfficeUse(emp.officeUse || {}),
            status: emp.status || 'active',
            createdAt: now,
            updatedAt: now
          }
        };
      });

      await upsertInBatches('employees', rows, 300);
      toast.success(`SUCCESSFULLY_STORED_${rows.length}_EMPLOYEES_IN_DATABASE`);
      navigate('/employees');
    } catch (err: any) {
      console.error(err);
      toast.error(`FAILED_TO_SAVE_RECORDS: ${err.message || 'Database error'}`);
    } finally {
      setIsSavingAll(false);
    }
  };

  if (currentIndex !== null && pendingEmployees[currentIndex]) {
    return (
      <div className="space-y-6">
        <div className="bg-[#141414] text-[#E4E3E0] p-4 font-mono text-xs flex justify-between items-center">
          <div className="flex items-center gap-3">
            <UserCheck className="w-4 h-4 text-green-500" />
            <span>REVIEWING_RECORD_{currentIndex + 1}_OF_{pendingEmployees.length}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-[#141414] rounded-none h-7 bg-[#E4E3E0] hover:bg-[#E4E3E0]/90"
            onClick={() => setCurrentIndex(null)}
          >
            BACK_TO_BATCH_LIST
          </Button>
        </div>
        <EmployeeForm initialData={pendingEmployees[currentIndex]} />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-mono">
      {pendingEmployees.length === 0 ? (
        <div className="max-w-xl mx-auto py-20">
          <div className="border-2 border-dashed border-[#141414]/20 p-12 text-center space-y-6 bg-[#141414]/5">
            <div className="w-16 h-16 bg-[#141414] rounded-full flex items-center justify-center mx-auto text-[#E4E3E0]">
              {isProcessing ? <Loader2 className="w-8 h-8 animate-spin" /> : <Camera className="w-8 h-8" />}
            </div>
            
            <div>
              <h2 className="font-serif italic text-xl">Batch Data Acquisition</h2>
              <p className="font-mono text-[10px] opacity-50 uppercase mt-2">Upload multi-page PDF, image, or Excel for automatic database extraction & storage</p>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                className="rounded-none border-[#141414] font-mono text-xs h-12 gap-2 relative overflow-hidden group"
                disabled={isProcessing}
              >
                <FileUp className="w-4 h-4" />
                {isProcessing ? 'SCANNING_&_SAVING_TO_DB...' : 'SELECT_BATCH_FILE'}
                <input 
                  type="file" 
                  accept="image/*,application/pdf,.xlsx,.xls,.csv" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                />
              </Button>
              <p className="font-mono text-[8px] opacity-30 text-center uppercase tracking-widest">Supports Multi-page PDF, JPEG, PNG, Excel XLSX/XLS</p>
            </div>
          </div>

          {previewUrl && (
            <div className="mt-8 border border-[#141414]/10 p-2 bg-[#141414]/5">
              <img src={previewUrl} alt="Preview" className="w-full grayscale opacity-50 contrast-125" />
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#141414]/10 pb-6">
            <div>
              <h2 className="font-serif italic text-2xl tracking-tight">Acquisition & Storage Status</h2>
              <p className="text-[10px] opacity-70 text-emerald-600 font-bold uppercase mt-1">
                ✓ {pendingEmployees.length} entities scanned and saved directly to Supabase Database
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleReset} 
                className="rounded-none border-[#141414]/20 text-xs h-9"
              >
                Scan Another File
              </Button>

              <Button
                onClick={() => navigate('/employees')}
                className="rounded-none bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 text-xs h-9 gap-2 font-bold"
              >
                <ExternalLink className="w-3.5 h-3.5 text-green-400" />
                VIEW_IN_DATABASE_LIST
              </Button>
            </div>
          </div>

          <div className="h-[500px] overflow-y-auto px-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingEmployees.map((emp, idx) => (
                <Card key={idx} className="rounded-none border-[#141414]/10 shadow-none hover:border-[#141414] transition-all group overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4 flex items-center justify-between bg-emerald-500/10 border-b border-emerald-500/20">
                      <span className="font-mono text-[10px] font-bold text-emerald-700">{emp.id || `EMP-${emp.employeeCode}`}</span>
                      <Badge variant="outline" className="rounded-none text-[8px] uppercase border-emerald-600 text-emerald-700 font-bold bg-white">
                        ✓ STORED_IN_SUPABASE
                      </Badge>
                    </div>
                    <div className="p-5 flex items-center justify-between">
                      <div>
                        <h4 className="font-serif italic text-lg">{emp.name || 'UNLABELED_ENTITY'}</h4>
                        <div className="flex gap-4 mt-2">
                          <div className="space-y-1">
                            <p className="font-mono text-[8px] opacity-40 uppercase">Post</p>
                            <p className="font-mono text-[10px]">{emp.postAppliedFor || 'N/A'}</p>
                          </div>
                          {emp.jobProcessAssigned && (
                            <div className="space-y-1">
                              <p className="font-mono text-[8px] opacity-40 uppercase">Job/Process</p>
                              <p className="font-mono text-[10px] truncate max-w-[120px]">{emp.jobProcessAssigned}</p>
                            </div>
                          )}
                          <div className="space-y-1">
                            <p className="font-mono text-[8px] opacity-40 uppercase">Dept</p>
                            <p className="font-mono text-[10px]">{emp.department || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      <Button 
                        onClick={() => setCurrentIndex(idx)}
                        title="Edit / Review Record"
                        className="rounded-none h-12 w-12 p-0 bg-[#141414] text-[#E4E3E0] hover:scale-105 transition-transform"
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
            <p className="font-mono text-[10px] leading-relaxed uppercase">
              Confirmed: All extracted records have been automatically committed to the Supabase PostgreSQL database. You can click on any card to edit details or click "VIEW IN DATABASE LIST" to see all records.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
