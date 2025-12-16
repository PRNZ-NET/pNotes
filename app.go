package main

import (
	"context"
	"pnotes/internal/interfaces"
	"pnotes/internal/models"
	"pnotes/internal/repository"
	"pnotes/internal/services"
)

type App struct {
	ctx         context.Context
	noteService interfaces.NoteService
	repo        interfaces.NoteRepository
}

func NewApp() *App {
	repo := repository.NewNoteRepository()
	noteService := services.NewNoteService(repo)

	return &App{
		noteService: noteService,
		repo:        repo,
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) shutdown(ctx context.Context) {
	if a.repo != nil {
		_ = a.repo.Close()
	}
}

func (a *App) GetAllNotes() ([]models.Note, error) {
	return a.noteService.GetAllNotes()
}

func (a *App) GetNoteByID(id string) (*models.Note, error) {
	return a.noteService.GetNoteByID(id)
}

func (a *App) CreateNote(title, content string, tags []string) (*models.Note, error) {
	return a.noteService.CreateNote(title, content, tags)
}

func (a *App) UpdateNote(id, title, content string, tags []string) (*models.Note, error) {
	return a.noteService.UpdateNote(id, title, content, tags)
}

func (a *App) DeleteNote(id string) error {
	return a.noteService.DeleteNote(id)
}

func (a *App) CreateEncryptedNote(title, content, password string, tags []string) (*models.Note, error) {
	return a.noteService.CreateEncryptedNote(title, content, password, tags)
}

func (a *App) UpdateEncryptedNote(id, title, content, password string, tags []string) (*models.Note, error) {
	return a.noteService.UpdateEncryptedNote(id, title, content, password, tags)
}

func (a *App) DecryptNote(id, password string) (*models.Note, error) {
	return a.noteService.DecryptNote(id, password)
}
