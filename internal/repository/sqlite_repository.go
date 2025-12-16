package repository

import (
	"database/sql"
	"encoding/json"
	"os"
	"path/filepath"
	"pnotes/internal/interfaces"
	"pnotes/internal/models"
	"sync"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

type SQLiteRepository struct {
	db     *sql.DB
	dbPath string
	mu     sync.RWMutex
}

func NewNoteRepository() interfaces.NoteRepository {
	homeDir, _ := os.UserHomeDir()
	dataDir := filepath.Join(homeDir, ".pnotes")
	_ = os.MkdirAll(dataDir, 0755)
	dbPath := filepath.Join(dataDir, "notes.db")

	db, err := sql.Open("sqlite3", dbPath+"?_journal_mode=WAL&_synchronous=NORMAL&_cache_size=10000&_busy_timeout=5000")
	if err != nil {
		panic("failed to open database: " + err.Error())
	}

	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)

	repo := &SQLiteRepository{
		db:     db,
		dbPath: dbPath,
	}

	if err := repo.initDB(); err != nil {
		panic("failed to initialize database: " + err.Error())
	}

	if err := migrateFromJSON(repo); err != nil {
		panic("failed to migrate from JSON: " + err.Error())
	}

	return repo
}

func (r *SQLiteRepository) initDB() error {
	query := `
	CREATE TABLE IF NOT EXISTS notes (
		id TEXT PRIMARY KEY,
		title TEXT NOT NULL,
		content TEXT NOT NULL,
		encrypted INTEGER NOT NULL DEFAULT 0,
		tags TEXT,
		created_at DATETIME NOT NULL,
		updated_at DATETIME NOT NULL
	);
	
	CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
	CREATE INDEX IF NOT EXISTS idx_notes_encrypted ON notes(encrypted);
	`

	_, err := r.db.Exec(query)
	return err
}

func (r *SQLiteRepository) GetAll() ([]models.Note, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	query := `SELECT id, title, content, encrypted, tags, created_at, updated_at FROM notes ORDER BY updated_at DESC`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notes []models.Note
	for rows.Next() {
		var note models.Note
		var tagsJSON string
		var createdAt, updatedAt string

		err := rows.Scan(
			&note.ID,
			&note.Title,
			&note.Content,
			&note.Encrypted,
			&tagsJSON,
			&createdAt,
			&updatedAt,
		)
		if err != nil {
			continue
		}

		if tagsJSON != "" {
			_ = json.Unmarshal([]byte(tagsJSON), &note.Tags)
		}

		note.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
		note.UpdatedAt, _ = time.Parse(time.RFC3339, updatedAt)

		notes = append(notes, note)
	}

	return notes, rows.Err()
}

func (r *SQLiteRepository) GetByID(id string) (*models.Note, error) {
	if id == "" {
		return nil, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	query := `SELECT id, title, content, encrypted, tags, created_at, updated_at FROM notes WHERE id = ?`
	row := r.db.QueryRow(query, id)

	var note models.Note
	var tagsJSON string
	var createdAt, updatedAt string

	err := row.Scan(
		&note.ID,
		&note.Title,
		&note.Content,
		&note.Encrypted,
		&tagsJSON,
		&createdAt,
		&updatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	if tagsJSON != "" {
		_ = json.Unmarshal([]byte(tagsJSON), &note.Tags)
	}

	note.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
	note.UpdatedAt, _ = time.Parse(time.RFC3339, updatedAt)

	return &note, nil
}

func (r *SQLiteRepository) Create(note *models.Note) error {
	if note == nil {
		return nil
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	tagsJSON, _ := json.Marshal(note.Tags)
	query := `INSERT INTO notes (id, title, content, encrypted, tags, created_at, updated_at) 
	          VALUES (?, ?, ?, ?, ?, ?, ?)`

	_, err := r.db.Exec(
		query,
		note.ID,
		note.Title,
		note.Content,
		note.Encrypted,
		string(tagsJSON),
		note.CreatedAt.Format(time.RFC3339),
		note.UpdatedAt.Format(time.RFC3339),
	)

	return err
}

func (r *SQLiteRepository) Update(note *models.Note) error {
	if note == nil {
		return nil
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	tagsJSON, _ := json.Marshal(note.Tags)
	query := `UPDATE notes SET title = ?, content = ?, encrypted = ?, tags = ?, updated_at = ? WHERE id = ?`

	_, err := r.db.Exec(
		query,
		note.Title,
		note.Content,
		note.Encrypted,
		string(tagsJSON),
		note.UpdatedAt.Format(time.RFC3339),
		note.ID,
	)

	return err
}

func (r *SQLiteRepository) Delete(id string) error {
	if id == "" {
		return nil
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	query := `DELETE FROM notes WHERE id = ?`
	_, err := r.db.Exec(query, id)
	return err
}

func (r *SQLiteRepository) Close() error {
	return r.db.Close()
}

