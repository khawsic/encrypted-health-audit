package record

import "time"

type MedicalRecord struct {
	ID        uint      `gorm:"primaryKey"`
	PatientID uint      `json:"patient_id"`
	DoctorID  uint      `json:"doctor_id"`
	Diagnosis string    `json:"diagnosis"`
	Treatment string    `json:"treatment"`
	CreatedAt time.Time
}
