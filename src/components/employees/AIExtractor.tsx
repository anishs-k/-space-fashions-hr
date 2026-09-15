import React from 'react';
import { extractEmployeeData } from '@/lib/gemini';
import { EmployeeForm } from './EmployeeForm';
import { Button } from '@/components/ui/button';
import { FileUp, Loader2, Camera, Wand2, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export function AIExtractor() {
  const [pendingEmployees, setPendingEmployees] = React.useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState<number | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const mimeType = file.type;
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setPreviewUrl(reader.result as string);
      
      setIsProcessing(true);
      try {
        const result = await extractEmployeeData(base64, mimeType);
        const employees = result.employees || [];
        setPendingEmployees(employees);
        if (employees.length > 0) {
          toast.success(`EXTRACTED_${employees.length}_RECORDS_FOR_REVIEW`);
        } else {
          toast.error('NO_RECORDS_FOUND_IN_DOCUMENT');
        }
      } catch (error) {
        console.error(error);
        toast.error('AI_EXTRACTION_FAILED_UNABLE_TO_PARSE_DOCUMENT');
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
    <div className="space-y-8">
      {pendingEmployees.length === 0 ? (
        <div className="max-w-xl mx-auto py-20">
          <div className="border-2 border-dashed border-[#141414]/20 p-12 text-center space-y-6 bg-[#141414]/5">
            <div className="w-16 h-16 bg-[#141414] rounded-full flex items-center justify-center mx-auto text-[#E4E3E0]">
              {isProcessing ? <Loader2 className="w-8 h-8 animate-spin" /> : <Camera className="w-8 h-8" />}
            </div>
            
            <div>
              <h2 className="font-serif italic text-xl">Batch Data Acquisition</h2>
              <p className="font-mono text-[10px] opacity-50 uppercase mt-2">Upload multi-page PDF or image for complete personnel extraction</p>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                className="rounded-none border-[#141414] font-mono text-xs h-12 gap-2 relative overflow-hidden group"
                disabled={isProcessing}
              >
                <FileUp className="w-4 h-4" />
                {isProcessing ? 'SCANNING_BATCH...' : 'SELECT_BATCH_FILE'}
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                />
              </Button>
              <p className="font-mono text-[8px] opacity-30 text-center uppercase tracking-widest">Supports Multi-page PDF, JPEG, PNG</p>
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
          <div className="flex items-center justify-between border-b border-[#141414]/10 pb-6">
            <div>
              <h2 className="font-serif italic text-2xl tracking-tight">Extraction Results</h2>
              <p className="font-mono text-[10px] opacity-50 uppercase mt-1">Pending verification for {pendingEmployees.length} entities</p>
            </div>
            <Button variant="ghost" onClick={handleReset} className="font-mono text-[10px] uppercase underline">Discard Batch</Button>
          </div>

          <div className="h-[500px] overflow-y-auto px-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingEmployees.map((emp, idx) => (
                <Card key={idx} className="rounded-none border-[#141414]/10 shadow-none hover:border-[#141414] transition-all group overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4 flex items-center justify-between bg-[#141414]/5 border-b border-[#141414]/10">
                      <span className="font-mono text-[10px] opacity-50">RECORD_HASH_{Math.abs((emp.name || '').length * 1234).toString(16)}</span>
                      <Badge variant="outline" className="rounded-none text-[8px] uppercase border-[#141414]/20">Pending_Review</Badge>
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
                        className="rounded-none h-12 w-12 p-0 bg-[#141414] text-[#E4E3E0] hover:scale-105 transition-transform"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 text-amber-800">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="font-mono text-[10px] leading-relaxed uppercase">
              Notice: AI extraction is probabilistic. You must verify and commit each record individually to ensure database integrity.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
