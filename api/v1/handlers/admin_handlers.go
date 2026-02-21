package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/khawsic/health/internal/audit"
	record "github.com/khawsic/health/internal/records"
)

type AdminHandler struct {
	auditService  *audit.Service
	recordService *record.Service
}

func NewAdminHandler(auditService *audit.Service, recordService *record.Service) *AdminHandler {
	return &AdminHandler{
		auditService:  auditService,
		recordService: recordService,
	}
}

// =========================
// GET ALL RECORDS (Admin)
// =========================
func (h *AdminHandler) GetAllRecords(c *gin.Context) {
	records, err := h.recordService.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch records",
		})
		return
	}

	c.JSON(http.StatusOK, records)
}

// =========================
// GET AUDIT LOGS (Admin)
// =========================
func (h *AdminHandler) GetAuditLogs(c *gin.Context) {
	logs, err := h.auditService.GetLogs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch audit logs",
		})
		return
	}

	c.JSON(http.StatusOK, logs)
}

// =========================
// VERIFY AUDIT CHAIN (Admin)
// =========================
func (h *AdminHandler) VerifyAuditChain(c *gin.Context) {
	valid, err := h.auditService.VerifyChain()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"verified": false,
			"error":    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"verified": valid,
		"message":  "Audit chain integrity verified successfully",
	})
}