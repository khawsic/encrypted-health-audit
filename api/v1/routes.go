package v1

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/khawsic/health/api/v1/handlers"
	"github.com/khawsic/health/internal/app"
	"github.com/khawsic/health/internal/middleware"
	"github.com/ulule/limiter/v3"
	ginlimiter "github.com/ulule/limiter/v3/drivers/middleware/gin"
	"github.com/ulule/limiter/v3/drivers/store/memory"
)

func RegisterRoutes(r *gin.Engine, application *app.App) {

	authHandler := handlers.NewAuthHandler(application.AuthService)
	recordHandler := handlers.NewRecordHandler(application.RecordService)
	adminHandler := handlers.NewAdminHandler(application.AuditService, application.RecordService)
	healthHandler := handlers.NewHealthHandler(application.DB)

	// =========================
	// Rate Limiter Setup
	// =========================
	rate := limiter.Rate{
		Period: 1 * time.Minute,
		Limit:  10,
	}
	store := memory.NewStore()
	instance := limiter.New(store, rate)
	rateLimitMiddleware := ginlimiter.NewMiddleware(instance)

	v1Group := r.Group("/api/v1")

	// =========================
	// HEALTH CHECK
	// =========================
	v1Group.GET("/health", healthHandler.Check)

	// =========================
	// PUBLIC ROUTES — rate limited
	// =========================
	public := v1Group.Group("/")
	public.Use(rateLimitMiddleware)

	public.POST("/register", authHandler.Register)
	public.POST("/login", authHandler.Login)
	public.POST("/refresh", authHandler.Refresh)
	public.POST("/logout", authHandler.Logout)
	public.POST("/password-reset/request", authHandler.RequestPasswordReset)
	public.POST("/password-reset/confirm", authHandler.ResetPassword)

	// =========================
	// PROTECTED ROUTES
	// =========================
	protected := v1Group.Group("/")
	protected.Use(middleware.AuthMiddleware(application.Config.JWTSecret))

	// -------------------------
	// ADMIN ROUTES
	// -------------------------
	admin := protected.Group("/admin")
	admin.Use(middleware.RoleMiddleware("admin"))

	admin.GET("/records", adminHandler.GetAllRecords)
	admin.GET("/audit-logs", adminHandler.GetAuditLogs)
	admin.GET("/audit-logs/filter", adminHandler.FilterAuditLogs)
	admin.GET("/audit-logs/verify", adminHandler.VerifyAuditChain)

	// -------------------------
	// DOCTOR ROUTES
	// -------------------------
	doctor := protected.Group("/doctor")
	doctor.Use(middleware.RoleMiddleware("doctor"))

	doctor.GET("/dashboard", recordHandler.DoctorDashboard)
	doctor.POST("/records", recordHandler.CreateRecord)
	doctor.PUT("/records/:record_id", recordHandler.UpdateRecord)
	doctor.DELETE("/records/:record_id", recordHandler.DeleteRecord)
	doctor.GET("/records/:record_id/history", recordHandler.GetVersionHistory)
	doctor.GET("/patients/:patient_id/records", recordHandler.SearchPatientRecords)
	doctor.POST("/records/emergency/:record_id", recordHandler.EmergencyAccess)

	// -------------------------
	// PATIENT ROUTES
	// -------------------------
	patient := protected.Group("/patient")
	patient.Use(middleware.RoleMiddleware("patient"))

	patient.GET("/dashboard", recordHandler.PatientDashboard)
	patient.GET("/records", recordHandler.GetPatientRecords)
}