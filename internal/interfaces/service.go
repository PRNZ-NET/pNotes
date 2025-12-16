package interfaces

import "pnotes/internal/models"

type NoteService interface {
	GetAllNotes() ([]models.Note, error)
	GetNoteByID(id string) (*models.Note, error)
	CreateNote(title, content string, tags []string) (*models.Note, error)
	CreateEncryptedNote(title, content, password string, tags []string) (*models.Note, error)
	UpdateNote(id, title, content string, tags []string) (*models.Note, error)
	UpdateEncryptedNote(id, title, content, password string, tags []string) (*models.Note, error)
	DecryptNote(id, password string) (*models.Note, error)
	DeleteNote(id string) error
}

