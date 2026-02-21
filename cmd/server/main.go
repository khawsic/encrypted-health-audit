package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/khawsic/health/internal/app"
	"github.com/khawsic/health/api/v1"
)

func main() {

	// Initialize full application (DB + Services)
	application := app.New()

	// Create Gin engine (production style)
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// Register API routes
	v1.RegisterRoutes(r, application)

	// Start server
	log.Println("🚀 Server running on port", application.Config.Port)
	if err := r.Run(":" + application.Config.Port); err != nil {
		log.Fatal("❌ Failed to start server:", err)
	}
}
