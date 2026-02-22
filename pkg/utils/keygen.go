package main

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/hex"
	"fmt"
)

func main() {
	pub, priv, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		panic(err)
	}
	fmt.Println("ED25519_PRIVATE_KEY=" + hex.EncodeToString(priv))
	fmt.Println("ED25519_PUBLIC_KEY=" + hex.EncodeToString(pub))
}