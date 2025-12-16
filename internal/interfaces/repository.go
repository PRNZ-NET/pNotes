package interfaces

import "pnotes/internal/models"

type NoteRepository interface {
	GetAll() ([]models.Note, error)
	GetByID(id string) (*models.Note, error)
	Create(note *models.Note) error
	Update(note *models.Note) error
	Delete(id string) error
	Close() error
}

