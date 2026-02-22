package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/khawsic/health/api/v1"
	"github.com/khawsic/health/internal/app"
	"github.com/khawsic/health/internal/middleware"
)

func main() {

	application := app.New()

	r := gin.New()

	// =========================
	// Global Middleware
	// =========================
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.RequestIDMiddleware())

	// CORS — allow frontend to talk to backend
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "http://localhost:5174")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, X-Request-ID")
		c.Header("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	v1.RegisterRoutes(r, application)

	log.Println("🚀 Server running on port", application.Config.Port)
	if err := r.Run(":" + application.Config.Port); err != nil {
		log.Fatal("❌ Failed to start server:", err)
	}
}