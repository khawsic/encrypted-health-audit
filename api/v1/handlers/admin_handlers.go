package handlers

import (
	"net/http"
	"strconv"
	"time"

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
// GET AUDIT LOGS — paginated (Admin)
// =========================
func (h *AdminHandler) GetAuditLogs(c *gin.Context) {

	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if err != nil || pageSize < 1 {
		pageSize = 20
	}

	logs, total, err := h.auditService.GetLogs(page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch audit logs",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      logs,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
		"pages":     (int(total) + pageSize - 1) / pageSize,
	})
}

// =========================
// FILTER AUDIT LOGS (Admin)
// =========================
func (h *AdminHandler) FilterAuditLogs(c *gin.Context) {

	opts := audit.FilterOptions{}

	// Parse page
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	opts.Page = page

	// Parse page size
	pageSize, err := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if err != nil || pageSize < 1 {
		pageSize = 20
	}
	opts.PageSize = pageSize

	// Parse optional user_id filter
	if userIDStr := c.Query("user_id"); userIDStr != "" {
		userIDUint, err := strconv.ParseUint(userIDStr, 10, 64)
		if err == nil {
			userID := uint(userIDUint)
			opts.UserID = &userID
		}
	}

	// Parse optional action filter
	if action := c.Query("action"); action != "" {
		opts.Action = action
	}

	// Parse optional from_date filter
	if fromStr := c.Query("from_date"); fromStr != "" {
		from, err := time.Parse("2006-01-02", fromStr)
		if err == nil {
			opts.FromDate = &from
		}
	}

	// Parse optional to_date filter
	if toStr := c.Query("to_date"); toStr != "" {
		to, err := time.Parse("2006-01-02", toStr)
		if err == nil {
			// Set to end of day
			to = to.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
			opts.ToDate = &to
		}
	}

	logs, total, err := h.auditService.FilterLogs(opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to filter audit logs",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      logs,
		"total":     total,
		"page":      opts.Page,
		"page_size": opts.PageSize,
		"pages":     (int(total) + opts.PageSize - 1) / opts.PageSize,
	})
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