package record

import (
	"log"

	"gorm.io/gorm"
)

func Migrate(db *gorm.DB) {
	err := db.AutoMigrate(&MedicalRecord{}, &RecordVersion{})
	if err != nil {
		log.Fatal("❌ Record migration failed:", err)
	}
	log.Println("✅ Record tables migrated")
}