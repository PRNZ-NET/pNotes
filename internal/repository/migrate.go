package repository

import (
	"encoding/json"
	"os"
	"path/filepath"
	"pnotes/internal/models"
)

func migrateFromJSON(repo *SQLiteRepository) error {
	homeDir, _ := os.UserHomeDir()
	jsonPath := filepath.Join(homeDir, ".pnotes", "notes.json")

	if _, err := os.Stat(jsonPath); os.IsNotExist(err) {
		return nil
	}

	existingNotes, err := repo.GetAll()
	if err == nil && len(existingNotes) > 0 {
		return nil
	}

	data, err := os.ReadFile(jsonPath)
	if err != nil {
		return err
	}

	if len(data) == 0 {
		return nil
	}

	var notes []models.Note
	if err := json.Unmarshal(data, &notes); err != nil {
		return err
	}

	if len(notes) == 0 {
		return nil
	}

	for _, note := range notes {
		_ = repo.Create(&note)
	}

	backupPath := jsonPath + ".backup"
	_ = os.Rename(jsonPath, backupPath)

	return nil
}

