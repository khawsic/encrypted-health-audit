package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type HealthHandler struct {
	db        *gorm.DB
	startTime time.Time
}

func NewHealthHandler(db *gorm.DB) *HealthHandler {
	return &HealthHandler{
		db:        db,
		startTime: time.Now(),
	}
}

// =========================
// HEALTH CHECK
// =========================
func (h *HealthHandler) Check(c *gin.Context) {

	// Check database connectivity
	dbStatus := "ok"
	sqlDB, err := h.db.DB()
	if err != nil || sqlDB.Ping() != nil {
		dbStatus = "unreachable"
	}

	// Calculate uptime
	uptime := time.Since(h.startTime).Round(time.Second).String()

	status := http.StatusOK
	if dbStatus != "ok" {
		status = http.StatusServiceUnavailable
	}

	c.JSON(status, gin.H{
		"status":   "ok",
		"uptime":   uptime,
		"database": dbStatus,
		"version":  "1.0.0",
		"time":     time.Now().UTC(),
	})
}