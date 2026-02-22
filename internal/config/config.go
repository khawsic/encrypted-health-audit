package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBUrl            string
	JWTSecret        string
	Port             string
	EncryptionKey    string
	ED25519PrivateKey string
	ED25519PublicKey  string
}

func Load() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("⚠️  No .env file found — expecting environment variables to be set")
	}

	return &Config{
		DBUrl:            getEnv("DB_URL", ""),
		JWTSecret:        getEnv("JWT_SECRET", ""),
		Port:             getEnv("PORT", "8080"),
		EncryptionKey:    getEnv("ENCRYPTION_KEY", ""),
		ED25519PrivateKey: getEnv("ED25519_PRIVATE_KEY", ""),
		ED25519PublicKey:  getEnv("ED25519_PUBLIC_KEY", ""),
	}
}

func getEnv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}