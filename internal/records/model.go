package record

import (
	"time"

	"gorm.io/gorm"
)

type MedicalRecord struct {
	ID        uint           `gorm:"primaryKey"`
	PatientID uint           `gorm:"not null;index"`
	DoctorID  uint           `gorm:"not null"`
	Diagnosis string         `gorm:"not null"` // AES-256 encrypted
	Treatment string         `gorm:"not null"` // AES-256 encrypted
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}