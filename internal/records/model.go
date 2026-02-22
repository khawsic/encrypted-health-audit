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
	Version   int            `gorm:"default:1"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

type RecordVersion struct {
	ID        uint      `gorm:"primaryKey"`
	RecordID  uint      `gorm:"not null;index"`
	PatientID uint      `gorm:"not null"`
	DoctorID  uint      `gorm:"not null"`
	Diagnosis string    `gorm:"not null"` // AES-256 encrypted
	Treatment string    `gorm:"not null"` // AES-256 encrypted
	Version   int       `gorm:"not null"`
	CreatedAt time.Time
}