package auth

import (
	"log"

	"gorm.io/gorm"
)

func Migrate(db *gorm.DB) {
	err := db.AutoMigrate(&User{})
	if err != nil {
		log.Fatal("Failed to migrate User table:", err)
	}

	log.Println("✅ User table migrated")
}
