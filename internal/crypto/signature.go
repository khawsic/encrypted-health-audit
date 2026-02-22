package crypto

import (
	"crypto/ed25519"
	"encoding/hex"
	"errors"
)

// LoadPrivateKey decodes a hex-encoded Ed25519 private key
func LoadPrivateKey(hexKey string) (ed25519.PrivateKey, error) {
	bytes, err := hex.DecodeString(hexKey)
	if err != nil {
		return nil, errors.New("invalid private key format")
	}
	if len(bytes) != ed25519.PrivateKeySize {
		return nil, errors.New("invalid private key length")
	}
	return ed25519.PrivateKey(bytes), nil
}

// LoadPublicKey decodes a hex-encoded Ed25519 public key
func LoadPublicKey(hexKey string) (ed25519.PublicKey, error) {
	bytes, err := hex.DecodeString(hexKey)
	if err != nil {
		return nil, errors.New("invalid public key format")
	}
	if len(bytes) != ed25519.PublicKeySize {
		return nil, errors.New("invalid public key length")
	}
	return ed25519.PublicKey(bytes), nil
}

// SignData signs data with private key
func SignData(priv ed25519.PrivateKey, message []byte) (string, error) {
	if priv == nil {
		return "", errors.New("private key is nil")
	}
	signature := ed25519.Sign(priv, message)
	return hex.EncodeToString(signature), nil
}

// VerifySignature verifies a hex-encoded signature
func VerifySignature(pub ed25519.PublicKey, message []byte, hexSignature string) (bool, error) {
	sigBytes, err := hex.DecodeString(hexSignature)
	if err != nil {
		return false, errors.New("invalid signature format")
	}
	return ed25519.Verify(pub, message, sigBytes), nil
}