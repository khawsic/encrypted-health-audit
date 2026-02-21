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
		log.Println("⚠️  No .env file found — expecting environment variables to be set")
	}

	return &Config{
		DBUrl:         getEnv("DB_URL", ""),
		JWTSecret:     getEnv("JWT_SECRET", ""),
		Port:          getEnv("PORT", "8080"),
		EncryptionKey: getEnv("ENCRYPTION_KEY", ""),
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