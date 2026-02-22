package main

import (
	"log"

	"github.com/khawsic/health/internal/config"
	"github.com/khawsic/health/pkg/database"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type User struct {
	ID             uint   `gorm:"primaryKey"`
	Name           string `gorm:"not null"`
	Email          string `gorm:"uniqueIndex;not null"`
	Password       string `gorm:"not null"`
	Role           string `gorm:"not null"`
	FailedAttempts int    `gorm:"default:0"`
}

func hashPassword(password string) string {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		log.Fatal("Failed to hash password:", err)
	}
	return string(hash)
}

func seedUser(db *gorm.DB, name, email, password, role string) {
	var existing User
	result := db.Where("email = ?", email).First(&existing)

	if result.Error == nil {
		log.Printf("⚠️  User already exists: %s — skipping", email)
		return
	}

	user := User{
		Name:     name,
		Email:    email,
		Password: hashPassword(password),
		Role:     role,
	}

	if err := db.Create(&user).Error; err != nil {
		log.Printf("❌ Failed to seed user %s: %v", email, err)
		return
	}

	log.Printf("✅ Seeded %s: %s (password: %s)", role, email, password)
}

func test() {
	cfg := config.Load()

	if cfg.DBUrl == "" {
		log.Fatal("❌ DB_URL is required")
	}

	db := database.Connect(cfg.DBUrl)

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatal("❌ Failed to get sqlDB:", err)
	}

	if err := sqlDB.Ping(); err != nil {
		log.Fatal("❌ Database not reachable:", err)
	}

	log.Println("🌱 Starting database seed...")
	log.Println("================================")

	// Seed Admin — role bypasses registration whitelist
	seedUser(db, "System Admin", "admin@healthvault.com", "Admin@123", "admin")

	// Seed Doctors
	seedUser(db, "Dr. Sarah Smith", "doctor1@healthvault.com", "Doctor@123", "doctor")
	seedUser(db, "Dr. James Wilson", "doctor2@healthvault.com", "Doctor@123", "doctor")

	// Seed Patients
	seedUser(db, "John Patient", "patient1@healthvault.com", "Patient@123", "patient")
	seedUser(db, "Mary Johnson", "patient2@healthvault.com", "Patient@123", "patient")

	log.Println("================================")
	log.Println("🎉 Seed complete!")
	log.Println("")
	log.Println("📋 Login credentials:")
	log.Println("  Admin:    admin@healthvault.com     / Admin@123")
	log.Println("  Doctor 1: doctor1@healthvault.com   / Doctor@123")
	log.Println("  Doctor 2: doctor2@healthvault.com   / Doctor@123")
	log.Println("  Patient 1: patient1@healthvault.com / Patient@123")
	log.Println("  Patient 2: patient2@healthvault.com / Patient@123")
}