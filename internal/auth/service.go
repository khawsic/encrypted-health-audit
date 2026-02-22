package auth

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const (
	maxFailedAttempts  = 5
	lockoutDuration    = 15 * time.Minute
	accessTokenExpiry  = 15 * time.Minute
	refreshTokenExpiry = 7 * 24 * time.Hour
	resetTokenExpiry   = 30 * time.Minute
)

type Service struct {
	DB        *gorm.DB
	JWTSecret string
}

func NewService(db *gorm.DB, secret string) *Service {
	return &Service{
		DB:        db,
		JWTSecret: secret,
	}
}

// 🔐 Register User
func (s *Service) Register(name, email, password, role string) error {

	validRoles := map[string]bool{"doctor": true, "patient": true}
	if !validRoles[role] {
		return errors.New("invalid role: must be 'doctor' or 'patient'")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return err
	}

	user := User{
		Name:     name,
		Email:    email,
		Password: string(hashedPassword),
		Role:     role,
	}

	return s.DB.Create(&user).Error
}

// 🔑 Login User — returns access token + refresh token
func (s *Service) Login(email, password string) (string, string, error) {
	var user User

	err := s.DB.Where("email = ?", email).First(&user).Error
	if err != nil {
		return "", "", errors.New("invalid email or password")
	}

	// Check if account is locked
	if user.LockedUntil != nil && time.Now().Before(*user.LockedUntil) {
		remaining := time.Until(*user.LockedUntil).Round(time.Second)
		return "", "", errors.New("account locked — try again in " + remaining.String())
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		user.FailedAttempts++
		if user.FailedAttempts >= maxFailedAttempts {
			lockUntil := time.Now().Add(lockoutDuration)
			user.LockedUntil = &lockUntil
			user.FailedAttempts = 0
		}
		s.DB.Save(&user)
		return "", "", errors.New("invalid email or password")
	}

	// Reset failed attempts on successful login
	user.FailedAttempts = 0
	user.LockedUntil = nil
	s.DB.Save(&user)

	// Generate access token
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,
		"exp":     time.Now().Add(accessTokenExpiry).Unix(),
	})

	accessTokenString, err := accessToken.SignedString([]byte(s.JWTSecret))
	if err != nil {
		return "", "", err
	}

	// Generate refresh token
	refreshTokenString, err := generateRandomToken()
	if err != nil {
		return "", "", err
	}

	refreshToken := RefreshToken{
		UserID:    user.ID,
		Token:     refreshTokenString,
		ExpiresAt: time.Now().Add(refreshTokenExpiry),
		Revoked:   false,
	}

	if err := s.DB.Create(&refreshToken).Error; err != nil {
		return "", "", err
	}

	return accessTokenString, refreshTokenString, nil
}

// 🔄 Refresh — exchange refresh token for new access token
func (s *Service) Refresh(refreshTokenString string) (string, error) {
	var token RefreshToken

	err := s.DB.Where("token = ? AND revoked = false", refreshTokenString).First(&token).Error
	if err != nil {
		return "", errors.New("invalid or expired refresh token")
	}

	if time.Now().After(token.ExpiresAt) {
		return "", errors.New("refresh token expired")
	}

	var user User
	if err := s.DB.First(&user, token.UserID).Error; err != nil {
		return "", errors.New("user not found")
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,
		"exp":     time.Now().Add(accessTokenExpiry).Unix(),
	})

	accessTokenString, err := accessToken.SignedString([]byte(s.JWTSecret))
	if err != nil {
		return "", err
	}

	return accessTokenString, nil
}

// 🚪 Logout — revoke refresh token
func (s *Service) Logout(refreshTokenString string) error {
	result := s.DB.Model(&RefreshToken{}).
		Where("token = ?", refreshTokenString).
		Update("revoked", true)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return errors.New("token not found")
	}

	return nil
}

// 🔁 RequestPasswordReset — generates a reset token for the user
func (s *Service) RequestPasswordReset(email string) (string, error) {
	var user User

	err := s.DB.Where("email = ?", email).First(&user).Error
	if err != nil {
		// Return success even if email not found — prevents user enumeration
		return "", nil
	}

	// Revoke any existing reset tokens for this user
	s.DB.Model(&PasswordResetToken{}).
		Where("user_id = ? AND used = false", user.ID).
		Update("used", true)

	// Generate reset token
	resetToken, err := generateRandomToken()
	if err != nil {
		return "", err
	}

	token := PasswordResetToken{
		UserID:    user.ID,
		Token:     resetToken,
		ExpiresAt: time.Now().Add(resetTokenExpiry),
		Used:      false,
	}

	if err := s.DB.Create(&token).Error; err != nil {
		return "", err
	}

	// In production this would be emailed — for now return token directly
	return resetToken, nil
}

// 🔁 ResetPassword — validates token and sets new password
func (s *Service) ResetPassword(token, newPassword string) error {
	var resetToken PasswordResetToken

	err := s.DB.Where("token = ? AND used = false", token).First(&resetToken).Error
	if err != nil {
		return errors.New("invalid or expired reset token")
	}

	// Check expiry
	if time.Now().After(resetToken.ExpiresAt) {
		return errors.New("reset token has expired")
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), 12)
	if err != nil {
		return err
	}

	// Update password
	if err := s.DB.Model(&User{}).
		Where("id = ?", resetToken.UserID).
		Update("password", string(hashedPassword)).Error; err != nil {
		return err
	}

	// Mark token as used
	s.DB.Model(&resetToken).Update("used", true)

	// Revoke all refresh tokens for security
	s.DB.Model(&RefreshToken{}).
		Where("user_id = ?", resetToken.UserID).
		Update("revoked", true)

	return nil
}

// Helper — generate cryptographically secure random token
func generateRandomToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}