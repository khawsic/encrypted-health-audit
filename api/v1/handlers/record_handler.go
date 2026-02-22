package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	record "github.com/khawsic/health/internal/records"
)

type RecordHandler struct {
	recordService *record.Service
}

func NewRecordHandler(recordService *record.Service) *RecordHandler {
	return &RecordHandler{
		recordService: recordService,
	}
}

// =========================
// DOCTOR DASHBOARD
// =========================
func (h *RecordHandler) DoctorDashboard(c *gin.Context) {
	userID := getUserID(c)
	c.JSON(http.StatusOK, gin.H{
		"user_id": userID,
		"message": "Welcome Doctor",
	})
}

// =========================
// PATIENT DASHBOARD
// =========================
func (h *RecordHandler) PatientDashboard(c *gin.Context) {
	userID := getUserID(c)
	c.JSON(http.StatusOK, gin.H{
		"user_id": userID,
		"message": "Welcome Patient",
	})
}

// =========================
// CREATE MEDICAL RECORD (Doctor)
// =========================
func (h *RecordHandler) CreateRecord(c *gin.Context) {

	var req struct {
		PatientID uint   `json:"patient_id" binding:"required"`
		Diagnosis string `json:"diagnosis" binding:"required"`
		Treatment string `json:"treatment" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	doctorID := getUserID(c)
	if doctorID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid session"})
		return
	}

	err := h.recordService.Create(req.PatientID, doctorID, req.Diagnosis, req.Treatment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create record"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Medical record created successfully"})
}

// =========================
// UPDATE MEDICAL RECORD (Doctor)
// =========================
func (h *RecordHandler) UpdateRecord(c *gin.Context) {

	recordIDParam := c.Param("record_id")
	recordIDUint, err := strconv.ParseUint(recordIDParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid record ID"})
		return
	}

	var req struct {
		Diagnosis string `json:"diagnosis" binding:"required"`
		Treatment string `json:"treatment" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	doctorID := getUserID(c)
	if doctorID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid session"})
		return
	}

	err = h.recordService.Update(uint(recordIDUint), doctorID, req.Diagnosis, req.Treatment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Medical record updated successfully"})
}

// =========================
// GET VERSION HISTORY (Doctor)
// =========================
func (h *RecordHandler) GetVersionHistory(c *gin.Context) {

	recordIDParam := c.Param("record_id")
	recordIDUint, err := strconv.ParseUint(recordIDParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid record ID"})
		return
	}

	versions, err := h.recordService.GetVersionHistory(uint(recordIDUint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch version history"})
		return
	}

	c.JSON(http.StatusOK, versions)
}

// =========================
// SEARCH PATIENT RECORDS (Doctor)
// =========================
func (h *RecordHandler) SearchPatientRecords(c *gin.Context) {

	patientIDParam := c.Param("patient_id")
	patientIDUint, err := strconv.ParseUint(patientIDParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	doctorID := getUserID(c)
	if doctorID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid session"})
		return
	}

	records, err := h.recordService.SearchByPatient(uint(patientIDUint), doctorID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, records)
}

// =========================
// SOFT DELETE RECORD (Doctor)
// =========================
func (h *RecordHandler) DeleteRecord(c *gin.Context) {

	recordIDParam := c.Param("record_id")
	recordIDUint, err := strconv.ParseUint(recordIDParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid record ID"})
		return
	}

	doctorID := getUserID(c)
	if doctorID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid session"})
		return
	}

	err = h.recordService.SoftDelete(uint(recordIDUint), doctorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Record deleted successfully"})
}

// =========================
// GET PATIENT RECORDS (Patient)
// =========================
func (h *RecordHandler) GetPatientRecords(c *gin.Context) {

	patientID := getUserID(c)
	if patientID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid session"})
		return
	}

	records, err := h.recordService.GetByPatient(patientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch records"})
		return
	}

	c.JSON(http.StatusOK, records)
}

// =========================
// EMERGENCY ACCESS (Doctor)
// =========================
func (h *RecordHandler) EmergencyAccess(c *gin.Context) {

	recordIDParam := c.Param("record_id")
	recordIDUint, err := strconv.ParseUint(recordIDParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid record ID"})
		return
	}

	userID := getUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid session"})
		return
	}

	recordData, err := h.recordService.EmergencyAccess(uint(recordIDUint), userID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, recordData)
}

// =========================
// Helper: Extract user ID
// =========================
func getUserID(c *gin.Context) uint {
	raw, exists := c.Get("user_id")
	if !exists {
		return 0
	}

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