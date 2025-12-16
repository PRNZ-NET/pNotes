import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Note } from '../types/Note';
import { PasswordModal } from './PasswordModal';
import { useTranslation } from '../hooks/useTranslation';
import './NoteEditor.css';

interface NoteEditorProps {
  note: Note | null;
  isEncrypted?: boolean;
  onSave: (id: string | null, title: string, content: string, tags: string[], password?: string, shouldEncrypt?: boolean) => void;
  onCancel: () => void;
}

export function NoteEditor({ note, isEncrypted = false, onSave, onCancel }: NoteEditorProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const [shouldEncrypt, setShouldEncrypt] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags || []);
      setShouldEncrypt(note.encrypted);
    } else {
      setTitle('');
      setContent('');
      setTags([]);
      setShouldEncrypt(false);
    }
  }, [note]);

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = () => {
    if (title.trim() || content.trim()) {
      if (isEncrypted || shouldEncrypt) {
        setPasswordModalOpen(true);
        setPasswordError('');
      } else {
        onSave(note?.id || null, title.trim() || t('notes.noTitle'), content.trim(), tags, undefined, false);
        if (!note) {
          setTitle('');
          setContent('');
          setTags([]);
        }
      }
    }
  };

  const handlePasswordConfirm = (password: string) => {
    setPasswordModalOpen(false);
    onSave(note?.id || null, title.trim() || t('notes.noTitle'), content.trim(), tags, password, shouldEncrypt);
    if (!note) {
      setTitle('');
      setContent('');
      setTags([]);
    }
  };

  const handlePasswordCancel = () => {
    setPasswordModalOpen(false);
    setPasswordError('');
  };

  return (
    <div className="note-editor">
      <div className="note-editor-header">
        <div className="note-editor-title-wrapper">
          <input
            type="text"
            className="note-editor-title-input"
            placeholder={t('editor.titlePlaceholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {(isEncrypted || shouldEncrypt) && (
            <span className="note-editor-encrypted-badge" title={t('editor.encrypted')}>
              🔒
            </span>
          )}
        </div>
        <div className="note-editor-view-controls">
          <button
            className={`view-btn ${viewMode === 'edit' ? 'active' : ''}`}
            onClick={() => setViewMode('edit')}
            title={t('editor.edit')}
          >
            {t('editor.edit')}
          </button>
          <button
            className={`view-btn ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
            title={t('editor.split')}
          >
            {t('editor.split')}
          </button>
          <button
            className={`view-btn ${viewMode === 'preview' ? 'active' : ''}`}
            onClick={() => setViewMode('preview')}
            title={t('editor.preview')}
          >
            {t('editor.preview')}
          </button>
        </div>
      </div>
      <div className="note-editor-body">
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`note-editor-edit ${viewMode === 'split' ? 'split-view' : ''}`}>
            <textarea
              className="note-editor-content"
              placeholder={t('editor.contentPlaceholder')}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        )}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`note-editor-preview ${viewMode === 'split' ? 'split-view' : ''}`}>
            {content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="markdown-content">
                {content}
              </ReactMarkdown>
            ) : (
              <div className="preview-empty">
                <p>{t('editor.previewEmpty')}</p>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="note-editor-tags-section">
        <div className="note-editor-tags-header">
          <span className="note-editor-tags-label">{t('editor.tags')}</span>
        </div>
        <div className="note-editor-tags-input-wrapper">
          <input
            type="text"
            className="note-editor-tags-input"
            placeholder={t('editor.tagsPlaceholder')}
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={handleTagKeyPress}
          />
          <button className="note-editor-tags-add-btn" onClick={handleAddTag} disabled={!newTag.trim()}>
            {t('editor.addTag')}
          </button>
        </div>
        {tags.length > 0 && (
          <div className="note-editor-tags-list">
            {tags.map((tag) => (
              <span key={tag} className="note-editor-tag">
                #{tag}
                <button
                  className="note-editor-tag-remove"
                  onClick={() => handleRemoveTag(tag)}
                  title="Удалить тег"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="note-editor-footer">
        <div className="note-editor-footer-options">
          {!isEncrypted && (
            <label className="note-editor-encrypt-toggle">
              <input
                type="checkbox"
                className="encrypt-toggle-input"
                checked={shouldEncrypt}
                onChange={(e) => setShouldEncrypt(e.target.checked)}
              />
              <span className="encrypt-toggle-slider"></span>
              <span className="encrypt-toggle-label">🔒 {t('editor.encryptNote')}</span>
            </label>
          )}
        </div>
        <div className="note-editor-footer-actions">
          <button className="btn-cancel" onClick={onCancel}>
            {t('editor.cancel')}
          </button>
          <button className="btn-save" onClick={handleSave} disabled={!title.trim() && !content.trim()}>
            {t('editor.save')}
          </button>
        </div>
      </div>
      <PasswordModal
        isOpen={passwordModalOpen}
        isCreate={shouldEncrypt && !note}
        onConfirm={handlePasswordConfirm}
        onCancel={handlePasswordCancel}
        error={passwordError}
      />
    </div>
  );
}

