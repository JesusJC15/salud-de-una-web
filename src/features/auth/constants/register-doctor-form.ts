import type { RegisterDoctorDto } from '@/types'
import { Specialty } from '@/types/enums'

export const INITIAL_REGISTER_DOCTOR_FORM: RegisterDoctorDto = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  specialty: Specialty.GENERAL_MEDICINE,
  personalId: '',
  phoneNumber: '',
  professionalLicense: '',
}
