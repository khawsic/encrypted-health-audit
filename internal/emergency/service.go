package emergency

import (
	"fmt"
	"time"
)

// EmergencyMessage represents an emergency alert
type EmergencyMessage struct {
	ID        int
	Message   string
	Timestamp time.Time
}

// EmergencyService handles emergencies
type EmergencyService struct {
	messages []EmergencyMessage
	counter  int
}

// NewService creates a new EmergencyService
func NewService() *EmergencyService {
	return &EmergencyService{
		messages: []EmergencyMessage{},
		counter:  0,
	}
}

// SendAlert adds a new emergency message
func (s *EmergencyService) SendAlert(msg string) EmergencyMessage {
	s.counter++
	em := EmergencyMessage{
		ID:        s.counter,
		Message:   msg,
		Timestamp: time.Now(),
	}
	s.messages = append(s.messages, em)

	// Simulate sending notification
	fmt.Printf("EMERGENCY ALERT: %s\n", msg)

	return em
}

// GetAllAlerts returns all emergency messages
func (s *EmergencyService) GetAllAlerts() []EmergencyMessage {
	return s.messages
}
