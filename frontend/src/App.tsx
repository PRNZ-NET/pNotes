import { useState, useEffect, useMemo } from 'react';
import { Note } from './types/Note';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { NoteFilters } from './components/NoteFilters';
import { PasswordModal } from './components/PasswordModal';
import { useTranslation } from './hooks/useTranslation';
import {
  GetAllNotes,
  CreateNote,
  CreateEncryptedNote,
  UpdateNote,
  UpdateEncryptedNote,
  DeleteNote,
  DecryptNote,
} from '../wailsjs/go/main/App';
import './App.css';

function App() {
  const { t, locale, changeLocale } = useTranslation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordModalMode, setPasswordModalMode] = useState<'create' | 'unlock'>('unlock');
  const [passwordError, setPasswordError] = useState('');
  const [decryptedNote, setDecryptedNote] = useState<Note | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterEncrypted, setFilterEncrypted] = useState<'all' | 'encrypted' | 'unencrypted'>('all');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const allNotes = await GetAllNotes();
      setNotes(allNotes || []);
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  const handleSelectNote = async (note: Note) => {
    if (note.encrypted) {
      setSelectedNote(note);
      setDecryptedNote(null);
      setPasswordModalMode('unlock');
      setPasswordModalOpen(true);
      setPasswordError('');
    } else {
      setSelectedNote(note);
      setDecryptedNote(note);
      setIsCreating(false);
    }
  };

  const handleCreateNote = () => {
    setSelectedNote(null);
    setDecryptedNote(null);
    setIsCreating(true);
  };

  const handleSaveNote = async (id: string | null, title: string, content: string, tags: string[], password?: string, shouldEncrypt?: boolean) => {
    try {
      if (id) {
        const note = notes.find(n => n.id === id);
        if (note?.encrypted && password) {
          await UpdateEncryptedNote(id, title, content, password, tags);
        } else if (shouldEncrypt && password) {
          await UpdateEncryptedNote(id, title, content, password, tags);
        } else {
          await UpdateNote(id, title, content, tags);
        }
      } else {
        if (shouldEncrypt && password) {
          await CreateEncryptedNote(title, content, password, tags);
        } else {
          await CreateNote(title, content, tags);
        }
      }
      await loadNotes();
      setSelectedNote(null);
      setDecryptedNote(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  const availableTags = useMemo(() => {
    const allTags = new Set<string>();
    notes.forEach(note => {
      if (note.tags) {
        note.tags.forEach(tag => allTags.add(tag));
      }
    });
    return Array.from(allTags).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    let filtered = [...notes];

    if (filterEncrypted === 'encrypted') {
      filtered = filtered.filter(note => note.encrypted);
    } else if (filterEncrypted === 'unencrypted') {
      filtered = filtered.filter(note => !note.encrypted);
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(note => {
        if (!note.tags || note.tags.length === 0) return false;
        return selectedTags.some(tag => note.tags.includes(tag));
      });
    }

    return filtered;
  }, [notes, filterEncrypted, selectedTags]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleClearFilters = () => {
    setSelectedTags([]);
    setFilterEncrypted('all');
  };

  const handlePasswordConfirm = async (password: string) => {
    try {
      if (passwordModalMode === 'create') {
        setPasswordModalOpen(false);
        return;
      }

      if (selectedNote && selectedNote.encrypted) {
        const decrypted = await DecryptNote(selectedNote.id, password);
        if (decrypted) {
          setDecryptedNote(decrypted);
          setPasswordModalOpen(false);
          setPasswordError('');
        } else {
          setPasswordError(t('password.error'));
        }
      }
    } catch (error) {
      setPasswordError(t('password.error'));
    }
  };

  const handlePasswordCancel = () => {
    setPasswordModalOpen(false);
    setPasswordError('');
    if (passwordModalMode === 'unlock') {
      setSelectedNote(null);
      setDecryptedNote(null);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await DeleteNote(id);
      if (selectedNote?.id === id) {
        setSelectedNote(null);
        setIsCreating(false);
      }
      await loadNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleCancel = () => {
    setSelectedNote(null);
    setDecryptedNote(null);
    setIsCreating(false);
  };

  const showEditor = (selectedNote !== null && decryptedNote !== null) || isCreating;

  return (
    <div className="app">
      <div className="app-sidebar">
        <div className="app-sidebar-header">
          <button className="btn-create" onClick={handleCreateNote}>
            + {t('notes.newNote')}
          </button>
          <div className="language-switcher">
            <button
              className={`lang-btn ${locale === 'ru' ? 'active' : ''}`}
              onClick={() => changeLocale('ru')}
              title="Русский"
            >
              RU
            </button>
            <button
              className={`lang-btn ${locale === 'en' ? 'active' : ''}`}
              onClick={() => changeLocale('en')}
              title="English"
            >
              EN
            </button>
          </div>
        </div>
        <NoteFilters
          selectedTags={selectedTags}
          availableTags={availableTags}
          filterEncrypted={filterEncrypted}
          onTagToggle={handleTagToggle}
          onEncryptedFilterChange={setFilterEncrypted}
          onClearFilters={handleClearFilters}
        />
        <NoteList
          notes={filteredNotes}
          onSelectNote={handleSelectNote}
          onDeleteNote={handleDeleteNote}
        />
      </div>
      <div className="app-main">
        {showEditor ? (
          <NoteEditor
            note={decryptedNote || selectedNote}
            isEncrypted={selectedNote?.encrypted || false}
            onSave={handleSaveNote}
            onCancel={handleCancel}
          />
        ) : (
          <div className="app-empty">
            <h1>{t('notes.selectOrCreate')}</h1>
          </div>
        )}
      </div>
      <PasswordModal
        isOpen={passwordModalOpen}
        isCreate={passwordModalMode === 'create'}
        onConfirm={handlePasswordConfirm}
        onCancel={handlePasswordCancel}
        error={passwordError}
      />
    </div>
  );
}

export default App;
