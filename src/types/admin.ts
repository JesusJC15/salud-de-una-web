import {
  DoctorStatus,
  ProgramType,
  RethusState,
  Specialty,
  TitleObtainingOrigin,
  UserRole,
} from "./enums";
import { EntityId, IsoDateString } from "./common";

export interface Admin {
  id?: EntityId;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: IsoDateString | null;
  updatedAt?: IsoDateString | null;
}

export interface ListDoctorsForReviewDto {
  status?: DoctorStatus;
  specialty?: Specialty;
  search?: string;
  page?: number;
  limit?: number;
}

export interface RethusVerifyDto {
  programType: ProgramType;
  titleObtainingOrigin: TitleObtainingOrigin;
  professionOccupation: string;
  startDate: IsoDateString;
  rethusState: RethusState;
  administrativeAct: string;
  reportingEntity: string;
  evidenceUrl?: string;
  notes?: string;
}

export interface DoctorsForReviewSummary {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
}

export interface DoctorsForReviewPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DoctorReviewLatestVerification {
  checkedAt: IsoDateString;
  checkedBy: string;
  rethusState: RethusState;
  reportingEntity: string;
  notes?: string;
}

export interface DoctorReviewItem {
  id: EntityId;
  firstName: string;
  lastName: string;
  email: string;
  specialty: Specialty;
  doctorStatus: DoctorStatus;
  professionalLicense?: string;
  personalId: string;
  phoneNumber: string;
  createdAt: IsoDateString | null;
  updatedAt: IsoDateString | null;
  latestVerification: DoctorReviewLatestVerification | null;
}

export interface ListDoctorsForReviewResponse {
  summary: DoctorsForReviewSummary;
  pagination: DoctorsForReviewPagination;
  items: DoctorReviewItem[];
}

export interface VerifyDoctorResponseDto {
  doctorId: EntityId;
  doctorStatus: DoctorStatus;
  checkedAt: IsoDateString;
  verification: {
    programType: ProgramType;
    titleObtainingOrigin: TitleObtainingOrigin;
    professionOccupation: string;
    startDate: IsoDateString;
    rethusState: RethusState;
    administrativeAct: string;
    reportingEntity: string;
    checkedBy: string;
    evidenceUrl?: string;
    notes?: string;
  };
}