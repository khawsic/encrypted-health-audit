package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
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

	// Whitelist valid roles — admin must be seeded directly, never registered
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

// 🔑 Login User
func (s *Service) Login(email, password string) (string, error) {
	var user User

	err := s.DB.Where("email = ?", email).First(&user).Error
	if err != nil {
		return "", errors.New("invalid email or password")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return "", errors.New("invalid email or password")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString([]byte(s.JWTSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}
