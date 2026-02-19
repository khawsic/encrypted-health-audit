package crypto

import (
	"crypto/ed25519"
)

// GenerateKeys generates a public/private key pair
func GenerateKeys() (ed25519.PublicKey, ed25519.PrivateKey) {
	pub, priv, _ := ed25519.GenerateKey(nil)
	return pub, priv
}

// SignData signs data with private key
func SignData(priv ed25519.PrivateKey, message []byte) []byte {
	return ed25519.Sign(priv, message)
}

// VerifySignature verifies a signature
func VerifySignature(pub ed25519.PublicKey, message, signature []byte) bool {
	return ed25519.Verify(pub, message, signature)
}
