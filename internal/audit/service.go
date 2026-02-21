package audit

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type AuditLog struct {
	ID        uint           `gorm:"primaryKey"`
	UserID    uint           `gorm:"not null"`
	Action    string         `gorm:"not null"`
	RecordID  *uint
	Timestamp time.Time      `gorm:"not null"`
	PrevHash  string         `gorm:"not null"`
	Hash      string         `gorm:"not null;uniqueIndex"`
}

type Service struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

func (s *Service) Migrate() error {
	return s.db.AutoMigrate(&AuditLog{})
}

// Log adds a new tamper-proof entry to the audit chain
func (s *Service) Log(userID uint, action string, recordID *uint) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		var last AuditLog
		var prevHash string

		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Order("id DESC").
			Limit(1).
			Find(&last).Error

		if err == nil && last.ID != 0 {
			prevHash = last.Hash
		}

		timestamp := time.Now().UTC()

		data := fmt.Sprintf("%d|%s|%v|%s|%s",
			userID,
			action,
			recordID,
			timestamp.String(),
			prevHash,
		)

		hash := sha256.Sum256([]byte(data))

		logEntry := AuditLog{
			UserID:    userID,
			Action:    action,
			RecordID:  recordID,
			Timestamp: timestamp,
			PrevHash:  prevHash,
			Hash:      hex.EncodeToString(hash[:]),
		}

		return tx.Create(&logEntry).Error
	})
}

// GetLogs returns all audit log entries ordered by time
func (s *Service) GetLogs() ([]AuditLog, error) {
	var logs []AuditLog
	if err := s.db.Order("id ASC").Find(&logs).Error; err != nil {
		return nil, err
	}
	return logs, nil
}

// VerifyChain walks every audit entry and confirms the hash chain is unbroken
func (s *Service) VerifyChain() (bool, error) {
	var logs []AuditLog
	if err := s.db.Order("id ASC").Find(&logs).Error; err != nil {
		return false, err
	}

	for i, entry := range logs {
		data := fmt.Sprintf("%d|%s|%v|%s|%s",
			entry.UserID,
			entry.Action,
			entry.RecordID,
			entry.Timestamp.UTC().String(),
			entry.PrevHash,
		)

		hash := sha256.Sum256([]byte(data))
		expected := hex.EncodeToString(hash[:])

		if expected != entry.Hash {
			return false, fmt.Errorf("⚠️  chain broken at entry ID %d (index %d)", entry.ID, i)
		}

		if i > 0 && entry.PrevHash != logs[i-1].Hash {
			return false, fmt.Errorf("⚠️  chain link broken between entry %d and %d", logs[i-1].ID, entry.ID)
		}
	}

	return true, nil
}