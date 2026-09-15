export type EmployeeStatus = 'active' | 'inactive';
export type EmployeeCategory = 'Staff' | 'Worker' | 'PC Rate';

export interface OfficeUseDetails {
  basicPay: number;
  esiEmployee: number;
  pfEmployee: number;
  esiEmployer: number;
  pfEmployer: number;
  bonus: number;
  lwwAllowed: number;
  lwwAmount: number;
  lwfEmployer: number;
  lwfEmployee: number;
  applyEsi: boolean;
  applyPf: boolean;
  applyLwf: boolean;
  applyLww: boolean;
  ctc: number;
  netCash: number;
  remarks: string;
}

export interface NomineeDetails {
  name: string;
  age: number;
  dob: string;
  relation: string;
}

export interface FamilyMember {
  name: string;
  age: number;
  dob: string;
  relation: string;
  mobileNumber?: string;
}

export interface LanguageSkill {
  read: boolean;
  write: boolean;
  speak: boolean;
}

export interface Languages {
  hindi: LanguageSkill;
  english: LanguageSkill;
  punjabi: LanguageSkill;
  other?: {
    name: string;
    skill: LanguageSkill;
  };
}

export interface Employee {
  id: string;
  name: string;
  postAppliedFor: string;
  jobProcessAssigned?: string;
  department: string;
  fatherHusbandName: string;
  dob: string;
  age: number;
  qualification: string;
  technicalQualification: string;
  permanentAddress: string;
  localAddress: string;
  reference: string;
  languages: Languages;
  esi: string;
  pf: string;
  uan: string;
  nominee: NomineeDetails;
  family: FamilyMember[];
  contactNo: string;
  alternateContactNo?: string;
  employeeCode?: string;
  experience?: string;
  category?: EmployeeCategory;
  dateOfJoining: string;
  dateOfLeaving?: string;
  dutyTime?: string;
  dutyHours?: string;
  shiftTime?: string;
  teaTimeAllowed?: string;
  teaBreak1?: string;
  teaBreak2?: string;
  lunchBreak?: string;
  shiftHours?: '8' | '9' | '10' | '12' | '13';
  overtimeAllowed?: boolean;
  overtimeHours?: string;
  officeUse: OfficeUseDetails;
  photoUrl: string;
  status: EmployeeStatus;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export type InterviewResult = 'Passed' | 'Selected' | 'Failed' | 'Under Consideration' | 'Other';

export interface NonEmployeeSalary {
  finalSalary: number;
  esi: number;
  esiEmployer: number;
  pf: number;
  pfEmployer: number;
  profTax: number;
  lww: number;
  lwf: number;
  lwfEmployer: number;
  applyEsi: boolean;
  applyPf: boolean;
  applyLwf: boolean;
  ctc: number;
  netCashTakeHome: number;
}

export interface NonEmployee {
  id: string;
  srNo: string; // 1. Sr
  category: EmployeeCategory; // 2. Category:- staff/worker/pc rate
  name: string; // 3. Name
  fatherName: string; // 4. Father Name
  contactNumber: string; // 5. Contact number
  alternateContact?: string; // 6. Alternative contact:-
  reference?: string; // 7. Reference:-
  postAppliedFor: string; // 8. Post applied for
  dateOfApplication: string; // 9. Date of application
  qualification: string; // 10. Qualification
  specialSkills?: string; // 11. Any special skills
  computerKnowledge?: string; // 12. Computer knowledge
  experience?: string; // 13. Experience
  currentSalary?: number; // 14. Current salary
  otherPerks?: string; // 15. Other perks
  calledForInterview: boolean; // 16. Called for interview:- yes/no
  
  // Section 17-23 (Condition 1: If 17/Called for Interview is YES)
  interviewDate?: string; // 18. Interview date
  interviewTakenBy?: string; // 19. Interview taken by
  resultOfInterview?: InterviewResult | string; // 20. Result of interview:- failed, passed, selected, under consideration or any other (mention)
  remarks?: string; // 21. remarks
  offeredToJoin?: boolean; // 23. Offered to join. Yes/no

  // Section 24-31 (Condition 2: If 23/Offered to join is YES)
  salaryDetails?: NonEmployeeSalary; // 24-31 Final salary, ESI, PF, Prof Tax, LWW, LWF, CTC, Net Cash
  
  status?: 'Query' | 'Interviewed' | 'Selected' | 'Rejected' | 'Joined';
  createdAt: any;
  updatedAt: any;
}
