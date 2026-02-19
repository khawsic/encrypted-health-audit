package keyshare

import (
    "github.com/codahale/sss"
)

// SplitSecret splits secret into n shares with threshold t
func SplitSecret(secret []byte, n, t int) (map[byte][]byte, error) {
    shares, err := sss.Split(byte(t), byte(n), secret)
    if err != nil {
        return nil, err
    }
    return shares, nil
}

// RecoverSecret reconstructs secret from shares
func RecoverSecret(shares map[byte][]byte) []byte {
    return sss.Combine(shares)
}
