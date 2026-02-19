package audit

import (
	"crypto/sha256"
	"encoding/hex"
	"strconv"
	"time"

	"gorm.io/gorm"
)

type AuditLog struct {
	ID        uint `gorm:"primaryKey"`
	UserID    uint
	Action    string
	RecordID  *uint
	Timestamp time.Time
	PrevHash  string
	Hash      string
}

type Service struct {
	db *gorm.DB
}

// Create a new audit service
func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

// Auto-migrate the audit log table
func (s *Service) Migrate() error {
	return s.db.AutoMigrate(&AuditLog{})
}

// Add a new log entry
func (s *Service) Log(userID uint, action string, recordID *uint) error {
	var prevHash string

	// Get the last log's hash
	var last AuditLog
	err := s.db.Order("id DESC").Limit(1).Find(&last).Error
	if err == nil && last.ID != 0 {
		prevHash = last.Hash
	}

	timestamp := time.Now().UTC()

	// Convert uints to string properly
	data := strconv.FormatUint(uint64(userID), 10) + action
	if recordID != nil {
		data += strconv.FormatUint(uint64(*recordID), 10)
	}
	data += timestamp.String() + prevHash

	// Compute SHA-256 hash
	hash := sha256.Sum256([]byte(data))

	logEntry := AuditLog{
		UserID:    userID,
		Action:    action,
		RecordID:  recordID,
		Timestamp: timestamp,
		PrevHash:  prevHash,
		Hash:      hex.EncodeToString(hash[:]),
	}

	// Save the log entry to the database
	return s.db.Create(&logEntry).Error
}
