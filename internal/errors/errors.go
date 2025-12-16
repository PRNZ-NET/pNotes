package errors

import "errors"

var (
	ErrNoteNotFound      = errors.New("note not found")
	ErrInvalidPassword   = errors.New("invalid password")
	ErrEmptyPassword     = errors.New("password cannot be empty")
	ErrEmptyTitle        = errors.New("title cannot be empty")
	ErrInvalidID         = errors.New("invalid note id")
	ErrDecryptionFailed  = errors.New("decryption failed")
	ErrEncryptionFailed  = errors.New("encryption failed")
	ErrRepositoryError   = errors.New("repository error")
)

