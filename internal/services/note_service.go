package services

import (
	"pnotes/internal/errors"
	"pnotes/internal/interfaces"
	"pnotes/internal/models"
	"pnotes/internal/utils"
	"strings"
	"time"

	"github.com/google/uuid"
)

type NoteService struct {
	repo   interfaces.NoteRepository
	crypto *utils.CryptoService
}

func NewNoteService(repo interfaces.NoteRepository) interfaces.NoteService {
	return &NoteService{
		repo:   repo,
		crypto: utils.NewCryptoService(),
	}
}

func (s *NoteService) GetAllNotes() ([]models.Note, error) {
	return s.repo.GetAll()
}

func (s *NoteService) GetNoteByID(id string) (*models.Note, error) {
	return s.repo.GetByID(id)
}

func (s *NoteService) CreateNote(title, content string, tags []string) (*models.Note, error) {
	title = strings.TrimSpace(title)
	content = strings.TrimSpace(content)

	if title == "" && content == "" {
		return nil, errors.ErrEmptyTitle
	}

	normalizedTags := s.normalizeTags(tags)
	now := time.Now()

	note := &models.Note{
		ID:        uuid.New().String(),
		Title:     title,
		Content:   content,
		Encrypted: false,
		Tags:      normalizedTags,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := s.repo.Create(note); err != nil {
		return nil, errors.ErrRepositoryError
	}

	return note, nil
}

func (s *NoteService) normalizeTags(tags []string) []string {
	if len(tags) == 0 {
		return nil
	}

	seen := make(map[string]bool, len(tags))
	result := make([]string, 0, len(tags))

	for _, tag := range tags {
		normalized := strings.ToLower(strings.TrimSpace(tag))
		if normalized != "" && !seen[normalized] {
			seen[normalized] = true
			result = append(result, normalized)
		}
	}

	return result
}

func (s *NoteService) CreateEncryptedNote(title, content, password string, tags []string) (*models.Note, error) {
	if password == "" {
		return nil, errors.ErrEmptyPassword
	}

	title = strings.TrimSpace(title)
	content = strings.TrimSpace(content)

	if title == "" && content == "" {
		return nil, errors.ErrEmptyTitle
	}

	encryptedContent, err := s.crypto.Encrypt(content, password)
	if err != nil {
		return nil, errors.ErrEncryptionFailed
	}

	encryptedTitle, err := s.crypto.Encrypt(title, password)
	if err != nil {
		return nil, errors.ErrEncryptionFailed
	}

	normalizedTags := s.normalizeTags(tags)
	now := time.Now()

	note := &models.Note{
		ID:        uuid.New().String(),
		Title:     encryptedTitle,
		Content:   encryptedContent,
		Encrypted: true,
		Tags:      normalizedTags,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := s.repo.Create(note); err != nil {
		return nil, errors.ErrRepositoryError
	}

	return note, nil
}

func (s *NoteService) UpdateNote(id, title, content string, tags []string) (*models.Note, error) {
	if id == "" {
		return nil, errors.ErrInvalidID
	}

	note, err := s.repo.GetByID(id)
	if err != nil {
		return nil, errors.ErrRepositoryError
	}

	if note == nil {
		return nil, errors.ErrNoteNotFound
	}

	title = strings.TrimSpace(title)
	content = strings.TrimSpace(content)

	if title == "" && content == "" {
		return nil, errors.ErrEmptyTitle
	}

	note.Title = title
	note.Content = content
	note.Tags = s.normalizeTags(tags)
	note.UpdatedAt = time.Now()

	if err := s.repo.Update(note); err != nil {
		return nil, errors.ErrRepositoryError
	}

	return note, nil
}

func (s *NoteService) UpdateEncryptedNote(id, title, content, password string, tags []string) (*models.Note, error) {
	if id == "" {
		return nil, errors.ErrInvalidID
	}

	if password == "" {
		return nil, errors.ErrEmptyPassword
	}

	note, err := s.repo.GetByID(id)
	if err != nil {
		return nil, errors.ErrRepositoryError
	}

	if note == nil {
		return nil, errors.ErrNoteNotFound
	}

	title = strings.TrimSpace(title)
	content = strings.TrimSpace(content)

	if title == "" && content == "" {
		return nil, errors.ErrEmptyTitle
	}

	encryptedContent, err := s.crypto.Encrypt(content, password)
	if err != nil {
		return nil, errors.ErrEncryptionFailed
	}

	encryptedTitle, err := s.crypto.Encrypt(title, password)
	if err != nil {
		return nil, errors.ErrEncryptionFailed
	}

	note.Title = encryptedTitle
	note.Content = encryptedContent
	note.Encrypted = true
	note.Tags = s.normalizeTags(tags)
	note.UpdatedAt = time.Now()

	if err := s.repo.Update(note); err != nil {
		return nil, errors.ErrRepositoryError
	}

	return note, nil
}

func (s *NoteService) DecryptNote(id, password string) (*models.Note, error) {
	if id == "" {
		return nil, errors.ErrInvalidID
	}

	if password == "" {
		return nil, errors.ErrEmptyPassword
	}

	note, err := s.repo.GetByID(id)
	if err != nil {
		return nil, errors.ErrRepositoryError
	}

	if note == nil {
		return nil, errors.ErrNoteNotFound
	}

	if !note.Encrypted {
		return note, nil
	}

	decryptedTitle, err := s.crypto.Decrypt(note.Title, password)
	if err != nil {
		return nil, errors.ErrDecryptionFailed
	}

	decryptedContent, err := s.crypto.Decrypt(note.Content, password)
	if err != nil {
		return nil, errors.ErrDecryptionFailed
	}

	decryptedNote := &models.Note{
		ID:        note.ID,
		Title:     decryptedTitle,
		Content:   decryptedContent,
		Encrypted: true,
		Tags:      note.Tags,
		CreatedAt: note.CreatedAt,
		UpdatedAt: note.UpdatedAt,
	}

	return decryptedNote, nil
}

func (s *NoteService) DeleteNote(id string) error {
	if id == "" {
		return errors.ErrInvalidID
	}

	if err := s.repo.Delete(id); err != nil {
		return errors.ErrRepositoryError
	}

	return nil
}

