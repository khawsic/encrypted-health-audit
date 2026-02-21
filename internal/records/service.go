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

// NewService requires encryption key and audit service
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
	}

	if err := s.db.Create(&record).Error; err != nil {
		return err
	}

	// Log the creation in audit
	if s.auditService != nil {
		if err := s.auditService.Log(doctorID, "CREATE_RECORD", &record.ID); err != nil {
			log.Printf("⚠️  Audit log failed for CREATE_RECORD: %v", err)
		}
	}

	return nil
}

// GetByPatient decrypts records and logs the read action
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

	// Log the read in audit
	if s.auditService != nil {
		if err := s.auditService.Log(patientID, "READ_RECORDS", nil); err != nil {
			log.Printf("⚠️  Audit log failed for READ_RECORDS: %v", err)
		}
	}

	return records, nil
}

// EmergencyAccess decrypts a record using the master key with elevated audit logging
func (s *Service) EmergencyAccess(recordID uint, userID uint) (*MedicalRecord, error) {
	var record MedicalRecord
	if err := s.db.First(&record, recordID).Error; err != nil {
		return nil, errors.New("record not found")
	}

	// Decrypt using the master key — emergency access is tracked via audit log
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

	// Log emergency access — this is the critical audit trail for emergency events
	if s.auditService != nil {
		if err := s.auditService.Log(userID, "EMERGENCY_ACCESS", &record.ID); err != nil {
			log.Printf("⚠️  Audit log failed for EMERGENCY_ACCESS: %v", err)
		}
	}

	return &record, nil
}

// GetAll decrypts all records (admin view)
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