package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBUrl         string
	JWTSecret     string
	Port          string
	EncryptionKey string
}

func Load() *Config {
	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found")
	}

	return &Config{
		DBUrl:         getEnv("DB_URL", ""),
		JWTSecret:     getEnv("JWT_SECRET", "defaultsecret"),
		Port:          getEnv("PORT", "8080"),
		EncryptionKey: getEnv("ENCRYPTION_KEY", "12345678901234567890123456789012"), // 32 chars for AES-256
	}
}

// Helper to read environment variable or fallback
func getEnv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
