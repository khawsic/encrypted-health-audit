package app

import (
	"log"

	"github.com/khawsic/health/internal/audit"
	"github.com/khawsic/health/internal/auth"
	"github.com/khawsic/health/internal/config"
	"github.com/khawsic/health/internal/crypto"
	record "github.com/khawsic/health/internal/records"
	"github.com/khawsic/health/pkg/database"
	"gorm.io/gorm"
)

type App struct {
	Config        *config.Config
	DB            *gorm.DB
	AuthService   *auth.Service
	RecordService *record.Service
	AuditService  *audit.Service
}

func New() *App {

	// 1️⃣ Load configuration
	cfg := config.Load()

	// 2️⃣ Validate critical configs
	if cfg.DBUrl == "" {
		log.Fatal("❌ DB_URL is required")
	}
	if cfg.JWTSecret == "" {
		log.Fatal("❌ JWT_SECRET is required")
	}
	if len(cfg.EncryptionKey) != 32 {
		log.Fatal("❌ ENCRYPTION_KEY must be exactly 32 characters for AES-256")
	}
	if cfg.ED25519PrivateKey == "" {
		log.Fatal("❌ ED25519_PRIVATE_KEY is required")
	}
	if cfg.ED25519PublicKey == "" {
		log.Fatal("❌ ED25519_PUBLIC_KEY is required")
	}

	// 3️⃣ Load Ed25519 keys
	privateKey, err := crypto.LoadPrivateKey(cfg.ED25519PrivateKey)
	if err != nil {
		log.Fatal("❌ Failed to load ED25519 private key:", err)
	}

	publicKey, err := crypto.LoadPublicKey(cfg.ED25519PublicKey)
	if err != nil {
		log.Fatal("❌ Failed to load ED25519 public key:", err)
	}

	log.Println("✅ Ed25519 keys loaded successfully")

	// 4️⃣ Connect to database
	db := database.Connect(cfg.DBUrl)

	// 5️⃣ Verify DB connection
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatal("❌ Failed to get sqlDB:", err)
	}

	if err := sqlDB.Ping(); err != nil {
		log.Fatal("❌ Database not reachable:", err)
	}

	log.Println("✅ Database connection verified")

	// 6️⃣ Run migrations
	auth.Migrate(db)
	record.Migrate(db)

	// 7️⃣ Initialize services
	authService := auth.NewService(db, cfg.JWTSecret)

	auditService := audit.NewService(db, privateKey, publicKey)
	if err := auditService.Migrate(); err != nil {
		log.Fatal("❌ Audit migration failed:", err)
	}

	recordService := record.NewService(db, cfg.EncryptionKey, auditService)

	log.Println("✅ Services initialized successfully")

	// 8️⃣ Return App container
	return &App{
		Config:        cfg,
		DB:            db,
		AuthService:   authService,
		RecordService: recordService,
		AuditService:  auditService,
	}
}