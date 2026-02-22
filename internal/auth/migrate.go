package auth

import (
	"log"

	"gorm.io/gorm"
)

func Migrate(db *gorm.DB) {
	// Use raw SQL to ensure tables exist without GORM constraint conflicts
	err := db.Exec(`
		CREATE TABLE IF NOT EXISTS refresh_tokens (
			id SERIAL PRIMARY KEY,
			user_id INT NOT NULL,
			token TEXT NOT NULL UNIQUE,
			expires_at TIMESTAMP NOT NULL,
			revoked BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`).Error
	if err != nil {
		log.Fatal("❌ Failed to migrate refresh_tokens table:", err)
	}

	err = db.Exec(`
		CREATE TABLE IF NOT EXISTS password_reset_tokens (
			id SERIAL PRIMARY KEY,
			user_id INT NOT NULL,
			token TEXT NOT NULL UNIQUE,
			expires_at TIMESTAMP NOT NULL,
			used BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`).Error
	if err != nil {
		log.Fatal("❌ Failed to migrate password_reset_tokens table:", err)
	}

	log.Println("✅ Auth tables migrated")
}