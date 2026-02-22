package audit

import (
	"crypto/ed25519"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/khawsic/health/internal/crypto"
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
	Signature string         `gorm:"not null"`
}

// FilterOptions holds all possible audit log filters
type FilterOptions struct {
	UserID    *uint
	Action    string
	FromDate  *time.Time
	ToDate    *time.Time
	Page      int
	PageSize  int
}

type Service struct {
	db         *gorm.DB
	privateKey ed25519.PrivateKey
	publicKey  ed25519.PublicKey
}

func NewService(db *gorm.DB, privateKey ed25519.PrivateKey, publicKey ed25519.PublicKey) *Service {
	return &Service{
		db:         db,
		privateKey: privateKey,
		publicKey:  publicKey,
	}
}

func (s *Service) Migrate() error {
	return s.db.AutoMigrate(&AuditLog{})
}

// Log adds a new tamper-proof signed entry to the audit chain
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
		hashHex := hex.EncodeToString(hash[:])

		signature, err := crypto.SignData(s.privateKey, []byte(hashHex))
		if err != nil {
			return fmt.Errorf("failed to sign audit entry: %w", err)
		}

		logEntry := AuditLog{
			UserID:    userID,
			Action:    action,
			RecordID:  recordID,
			Timestamp: timestamp,
			PrevHash:  prevHash,
			Hash:      hashHex,
			Signature: signature,
		}

		return tx.Create(&logEntry).Error
	})
}

// GetLogs returns paginated audit log entries
func (s *Service) GetLogs(page, pageSize int) ([]AuditLog, int64, error) {
	var logs []AuditLog
	var total int64

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize

	if err := s.db.Model(&AuditLog{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := s.db.Order("id ASC").
		Limit(pageSize).
		Offset(offset).
		Find(&logs).Error; err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}

// FilterLogs returns filtered and paginated audit log entries
func (s *Service) FilterLogs(opts FilterOptions) ([]AuditLog, int64, error) {
	var logs []AuditLog
	var total int64

	if opts.Page < 1 {
		opts.Page = 1
	}
	if opts.PageSize < 1 || opts.PageSize > 100 {
		opts.PageSize = 20
	}

	offset := (opts.Page - 1) * opts.PageSize

	// Build query dynamically based on filters
	query := s.db.Model(&AuditLog{})

	if opts.UserID != nil {
		query = query.Where("user_id = ?", *opts.UserID)
	}

	if opts.Action != "" {
		query = query.Where("action = ?", opts.Action)
	}

	if opts.FromDate != nil {
		query = query.Where("timestamp >= ?", *opts.FromDate)
	}

	if opts.ToDate != nil {
		query = query.Where("timestamp <= ?", *opts.ToDate)
	}

	// Get total count with filters applied
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get filtered paginated results
	if err := query.Order("id ASC").
		Limit(opts.PageSize).
		Offset(offset).
		Find(&logs).Error; err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}

// VerifyChain walks every entry and verifies both hash chain and Ed25519 signatures
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
			return false, fmt.Errorf("⚠️  hash chain broken at entry ID %d", entry.ID)
		}

		if i > 0 && entry.PrevHash != logs[i-1].Hash {
			return false, fmt.Errorf("⚠️  chain link broken between entry %d and %d", logs[i-1].ID, entry.ID)
		}

		valid, err := crypto.VerifySignature(s.publicKey, []byte(entry.Hash), entry.Signature)
		if err != nil || !valid {
			return false, fmt.Errorf("⚠️  invalid signature at entry ID %d", entry.ID)
		}
	}

	return true, nil
}