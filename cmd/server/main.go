package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/khawsic/health/internal/audit"
	"github.com/khawsic/health/internal/auth"
	"github.com/khawsic/health/internal/config"
	"github.com/khawsic/health/internal/middleware"
	"github.com/khawsic/health/internal/records"
	"github.com/khawsic/health/pkg/database"
)

func main() {
	// 🔧 Load configuration
	cfg := config.Load()

	// 🗄 Connect to database
	db := database.Connect(cfg.DBUrl)

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatal(err)
	}

	if err := sqlDB.Ping(); err != nil {
		log.Fatal("Database not reachable:", err)
	}

	log.Println("✅ Database is reachable")

	// 🔄 Run migrations
	auth.Migrate(db)
	record.Migrate(db)

	// 🔐 Create services
	authService := auth.NewService(db, cfg.JWTSecret)
	auditService := audit.NewService(db)
	auditService.Migrate()
	recordService := record.NewService(db, cfg.EncryptionKey, auditService)

	// 🚀 Initialize Gin
	r := gin.Default()

	// =========================
	// 🔓 PUBLIC ROUTES
	// =========================
	r.POST("/register", func(c *gin.Context) {
		var req struct {
			Name     string `json:"name"`
			Email    string `json:"email"`
			Password string `json:"password"`
			Role     string `json:"role"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
			return
		}

		if err := authService.Register(req.Name, req.Email, req.Password, req.Role); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "User registered successfully"})
	})

	r.POST("/login", func(c *gin.Context) {
		var req struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
			return
		}

		token, err := authService.Login(req.Email, req.Password)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"token": token})
	})

	// =========================
	// 🔐 PROTECTED ROUTES
	// =========================
	protected := r.Group("/protected")
	protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))

	// 👨‍⚕️ DOCTOR ROUTES
	doctor := protected.Group("/doctor")
	doctor.Use(middleware.RoleMiddleware("doctor"))

	doctor.GET("/dashboard", func(c *gin.Context) {
		userID := getUserID(c)
		c.JSON(http.StatusOK, gin.H{
			"user_id": userID,
			"message": "Welcome Doctor",
		})
	})

	// Create Medical Record
	doctor.POST("/records", func(c *gin.Context) {
		var req struct {
			PatientID uint   `json:"patient_id"`
			Diagnosis string `json:"diagnosis"`
			Treatment string `json:"treatment"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
			return
		}

		doctorID := getUserID(c)

		if err := recordService.Create(req.PatientID, doctorID, req.Diagnosis, req.Treatment); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create record"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Medical record created"})
	})

	// Emergency Access
	doctor.POST("/records/emergency/:record_id", func(c *gin.Context) {
		recordIDParam := c.Param("record_id")
		tempKey := c.GetHeader("X-Temp-Key")
		if tempKey == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Temporary key required"})
			return
		}

		doctorID := getUserID(c)

		recordID, err := parseUint(recordIDParam)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid record ID"})
			return
		}

		record, err := recordService.EmergencyAccess(recordID, tempKey, doctorID)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, record)
	})

	// 🧑‍🤝‍🧑 PATIENT ROUTES
	patient := protected.Group("/patient")
	patient.Use(middleware.RoleMiddleware("patient"))

	patient.GET("/dashboard", func(c *gin.Context) {
		userID := getUserID(c)
		c.JSON(http.StatusOK, gin.H{
			"user_id": userID,
			"message": "Welcome Patient",
		})
	})

	// View Own Medical Records
	patient.GET("/records", func(c *gin.Context) {
		patientID := getUserID(c)
		records, err := recordService.GetByPatient(patientID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch records"})
			return
		}
		c.JSON(http.StatusOK, records)
	})

	// 🚀 Run server
	r.Run(":" + cfg.Port)
}

// Helper to get uint user ID from context
func getUserID(c *gin.Context) uint {
	raw, _ := c.Get("user_id")
	switch id := raw.(type) {
	case float64:
		return uint(id)
	case int:
		return uint(id)
	case uint:
		return id
	default:
		return 0
	}
}

// Parse string to uint
func parseUint(s string) (uint, error) {
	var id uint
	_, err := fmt.Sscan(s, &id)
	return id, err
}
