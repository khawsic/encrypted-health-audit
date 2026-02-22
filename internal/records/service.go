package record

import (
	"errors"
	"log"

	"github.com/khawsic/health/internal/audit"
	"github.com/khawsic/health/internal/security"
	"gorm.io/gorm"
)

type Service struct {
	db           *gorm.DB
	key          string
	auditService *audit.Service
}

func NewService(db *gorm.DB, key string, auditService *audit.Service) *Service {
	return &Service{
		db:           db,
		key:          key,
		auditService: auditService,
	}
}

// Create encrypts Diagnosis & Treatment and logs the action
func (s *Service) Create(patientID, doctorID uint, diagnosis, treatment string) error {
	encDiagnosis, err := security.Encrypt(s.key, diagnosis)
	if err != nil {
		return err
	}

	encTreatment, err := security.Encrypt(s.key, treatment)
	if err != nil {
		return err
	}

	record := MedicalRecord{
		PatientID: patientID,
		DoctorID:  doctorID,
		Diagnosis: encDiagnosis,
		Treatment: encTreatment,
		Version:   1,
	}

	if err := s.db.Create(&record).Error; err != nil {
		return err
	}

	if s.auditService != nil {
		if err := s.auditService.Log(doctorID, "CREATE_RECORD", &record.ID); err != nil {
			log.Printf("⚠️  Audit log failed for CREATE_RECORD: %v", err)
		}
	}

	return nil
}

// Update saves old version to history then updates the record
func (s *Service) Update(recordID, doctorID uint, diagnosis, treatment string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {

		var existing MedicalRecord
		if err := tx.First(&existing, recordID).Error; err != nil {
			return errors.New("record not found")
		}

		// Save current version to history before overwriting
		version := RecordVersion{
			RecordID:  existing.ID,
			PatientID: existing.PatientID,
			DoctorID:  existing.DoctorID,
			Diagnosis: existing.Diagnosis,
			Treatment: existing.Treatment,
			Version:   existing.Version,
		}

		if err := tx.Create(&version).Error; err != nil {
			return err
		}

		encDiagnosis, err := security.Encrypt(s.key, diagnosis)
		if err != nil {
			return err
		}

		encTreatment, err := security.Encrypt(s.key, treatment)
		if err != nil {
			return err
		}

		existing.Diagnosis = encDiagnosis
		existing.Treatment = encTreatment
		existing.Version = existing.Version + 1
		existing.DoctorID = doctorID

		if err := tx.Save(&existing).Error; err != nil {
			return err
		}

		if s.auditService != nil {
			if err := s.auditService.Log(doctorID, "UPDATE_RECORD", &existing.ID); err != nil {
				log.Printf("⚠️  Audit log failed for UPDATE_RECORD: %v", err)
			}
		}

		return nil
	})
}

// GetVersionHistory returns all previous versions of a record
func (s *Service) GetVersionHistory(recordID uint) ([]RecordVersion, error) {
	var versions []RecordVersion
	if err := s.db.Where("record_id = ?", recordID).
		Order("version ASC").
		Find(&versions).Error; err != nil {
		return nil, err
	}

	for i := range versions {
		decDiag, err := security.Decrypt(s.key, versions[i].Diagnosis)
		if err != nil {
			return nil, errors.New("failed to decrypt diagnosis history")
		}
		decTreat, err := security.Decrypt(s.key, versions[i].Treatment)
		if err != nil {
			return nil, errors.New("failed to decrypt treatment history")
		}
		versions[i].Diagnosis = decDiag
		versions[i].Treatment = decTreat
	}

	return versions, nil
}

// GetByPatient decrypts records for patient view
func (s *Service) GetByPatient(patientID uint) ([]MedicalRecord, error) {
	var records []MedicalRecord
	if err := s.db.Where("patient_id = ?", patientID).Find(&records).Error; err != nil {
		return nil, err
	}

	for i := range records {
		decDiag, err := security.Decrypt(s.key, records[i].Diagnosis)
		if err != nil {
			return nil, errors.New("failed to decrypt diagnosis")
		}
		decTreat, err := security.Decrypt(s.key, records[i].Treatment)
		if err != nil {
			return nil, errors.New("failed to decrypt treatment")
		}
		records[i].Diagnosis = decDiag
		records[i].Treatment = decTreat
	}

	if s.auditService != nil {
		if err := s.auditService.Log(patientID, "READ_RECORDS", nil); err != nil {
			log.Printf("⚠️  Audit log failed for READ_RECORDS: %v", err)
		}
	}

	return records, nil
}

// SearchByPatient allows doctor to search records by patient ID
func (s *Service) SearchByPatient(patientID, doctorID uint) ([]MedicalRecord, error) {
	var records []MedicalRecord
	if err := s.db.Where("patient_id = ?", patientID).Find(&records).Error; err != nil {
		return nil, err
	}

	if len(records) == 0 {
		return nil, errors.New("no records found for this patient")
	}

	for i := range records {
		decDiag, err := security.Decrypt(s.key, records[i].Diagnosis)
		if err != nil {
			return nil, errors.New("failed to decrypt diagnosis")
		}
		decTreat, err := security.Decrypt(s.key, records[i].Treatment)
		if err != nil {
			return nil, errors.New("failed to decrypt treatment")
		}
		records[i].Diagnosis = decDiag
		records[i].Treatment = decTreat
	}

	if s.auditService != nil {
		if err := s.auditService.Log(doctorID, "SEARCH_PATIENT_RECORDS", nil); err != nil {
			log.Printf("⚠️  Audit log failed for SEARCH_PATIENT_RECORDS: %v", err)
		}
	}

	return records, nil
}

// SoftDelete marks a record as deleted without removing it
func (s *Service) SoftDelete(recordID, doctorID uint) error {
	var record MedicalRecord
	if err := s.db.First(&record, recordID).Error; err != nil {
		return errors.New("record not found")
	}

	if err := s.db.Delete(&record).Error; err != nil {
		return err
	}

	if s.auditService != nil {
		if err := s.auditService.Log(doctorID, "DELETE_RECORD", &record.ID); err != nil {
			log.Printf("⚠️  Audit log failed for DELETE_RECORD: %v", err)
		}
	}

	return nil
}

// EmergencyAccess decrypts a record using the master key with elevated audit logging
func (s *Service) EmergencyAccess(recordID uint, userID uint) (*MedicalRecord, error) {
	var record MedicalRecord
	if err := s.db.First(&record, recordID).Error; err != nil {
		return nil, errors.New("record not found")
	}

	decDiag, err := security.Decrypt(s.key, record.Diagnosis)
	if err != nil {
		return nil, errors.New("failed to decrypt diagnosis")
	}

	decTreat, err := security.Decrypt(s.key, record.Treatment)
	if err != nil {
		return nil, errors.New("failed to decrypt treatment")
	}

	record.Diagnosis = decDiag
	record.Treatment = decTreat

	if s.auditService != nil {
		if err := s.auditService.Log(userID, "EMERGENCY_ACCESS", &record.ID); err != nil {
			log.Printf("⚠️  Audit log failed for EMERGENCY_ACCESS: %v", err)
		}
	}

	return &record, nil
}

// GetAll decrypts all records for admin view
func (s *Service) GetAll() ([]MedicalRecord, error) {
	var records []MedicalRecord
	if err := s.db.Find(&records).Error; err != nil {
		return nil, err
	}

	for i := range records {
		decDiag, err := security.Decrypt(s.key, records[i].Diagnosis)
		if err != nil {
			return nil, errors.New("failed to decrypt diagnosis for record")
		}
		decTreat, err := security.Decrypt(s.key, records[i].Treatment)
		if err != nil {
			return nil, errors.New("failed to decrypt treatment for record")
		}
		records[i].Diagnosis = decDiag
		records[i].Treatment = decTreat
	}

	return records, nil
}