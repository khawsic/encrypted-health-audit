package middleware

import (
	"crypto/rand"
	"encoding/hex"

	"github.com/gin-gonic/gin"
)

// GenerateRequestID creates a cryptographically secure unique request ID
func generateRequestID() string {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "unknown"
	}
	return hex.EncodeToString(bytes)
}

// RequestIDMiddleware attaches a unique ID to every request
func RequestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Use existing request ID from header if present
		// otherwise generate a new one
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = generateRequestID()
		}

		// Attach to context for use in handlers and logs
		c.Set("request_id", requestID)

		// Send it back in response header so client can trace it
		c.Header("X-Request-ID", requestID)

		c.Next()
	}
}