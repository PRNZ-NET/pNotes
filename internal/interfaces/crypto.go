package interfaces

type CryptoService interface {
	Encrypt(plaintext, password string) (string, error)
	Decrypt(ciphertext, password string) (string, error)
}

