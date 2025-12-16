import { Note } from '../types/Note';
import { useTranslation } from '../hooks/useTranslation';
import './NoteList.css';

interface NoteListProps {
  notes: Note[];
  onSelectNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
}

export function NoteList({ notes, onSelectNote, onDeleteNote }: NoteListProps) {
  const { t, locale } = useTranslation();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const localeString = locale === 'ru' ? 'ru-RU' : 'en-US';
    return date.toLocaleDateString(localeString, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="note-list">
      <div className="note-list-header">
        <h2>{t('notes.title')}</h2>
        <span className="note-count">{notes.length}</span>
      </div>
      <div className="note-list-content">
        {notes.length === 0 ? (
          <div className="empty-state">
            <p>{t('notes.empty')}</p>
            <span>{t('notes.emptySubtitle')}</span>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="note-item"
              onClick={() => onSelectNote(note)}
            >
              <div className="note-item-header">
                <div className="note-item-title-wrapper">
                  <h3 className="note-item-title">
                    {note.encrypted ? '🔒 ' : ''}
                    {note.encrypted ? t('editor.encrypted') : (note.title || t('notes.noTitle'))}
                  </h3>
                </div>
                <button
                  className="note-item-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNote(note.id);
                  }}
                >
                  ×
                </button>
              </div>
              <p className="note-item-preview">
                {note.encrypted ? (
                  <span className="note-item-encrypted-preview">{t('editor.encrypted')}</span>
                ) : (
                  note.content.length > 100
                    ? note.content.substring(0, 100) + '...'
                    : note.content || t('notes.emptyNote')
                )}
              </p>
              {note.tags && note.tags.length > 0 && (
                <div className="note-item-tags">
                  {note.tags.map((tag) => (
                    <span key={tag} className="note-item-tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <span className="note-item-date">{formatDate(note.updatedAt)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

