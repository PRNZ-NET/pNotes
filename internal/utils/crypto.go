package utils

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"io"

	"golang.org/x/crypto/pbkdf2"
)

const (
	saltSize   = 16
	nonceSize  = 12
	keySize    = 32
	iterations = 100000
)


type CryptoService struct{}

func NewCryptoService() *CryptoService {
	return &CryptoService{}
}

func (c *CryptoService) deriveKey(password string, salt []byte) []byte {
	return pbkdf2.Key([]byte(password), salt, iterations, keySize, sha256.New)
}

func (c *CryptoService) Encrypt(plaintext, password string) (string, error) {
	if password == "" {
		return "", errors.New("password cannot be empty")
	}

	salt := make([]byte, saltSize)
	if _, err := io.ReadFull(rand.Reader, salt); err != nil {
		return "", err
	}

	key := c.deriveKey(password, salt)

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, nonceSize)
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	plaintextBytes := []byte(plaintext)
	ciphertext := aesgcm.Seal(nil, nonce, plaintextBytes, nil)

	resultLen := saltSize + nonceSize + len(ciphertext)
	result := make([]byte, resultLen)

	copy(result[0:saltSize], salt)
	copy(result[saltSize:saltSize+nonceSize], nonce)
	copy(result[saltSize+nonceSize:], ciphertext)

	return base64.StdEncoding.EncodeToString(result), nil
}

func (c *CryptoService) Decrypt(ciphertext, password string) (string, error) {
	if password == "" {
		return "", errors.New("password cannot be empty")
	}

	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", err
	}

	if len(data) < saltSize+nonceSize {
		return "", errors.New("ciphertext too short")
	}

	salt := data[0:saltSize]
	nonce := data[saltSize : saltSize+nonceSize]
	encryptedData := data[saltSize+nonceSize:]

	key := c.deriveKey(password, salt)

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	plaintext, err := aesgcm.Open(nil, nonce, encryptedData, nil)
	if err != nil {
		return "", errors.New("decryption failed: wrong password or corrupted data")
	}

	return string(plaintext), nil
}

func Encrypt(plaintext, password string) (string, error) {
	crypto := NewCryptoService()
	return crypto.Encrypt(plaintext, password)
}

func Decrypt(ciphertext, password string) (string, error) {
	crypto := NewCryptoService()
	return crypto.Decrypt(ciphertext, password)
}

