import { useState, useMemo } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import './NoteFilters.css';

interface NoteFiltersProps {
  selectedTags: string[];
  availableTags: string[];
  filterEncrypted: 'all' | 'encrypted' | 'unencrypted';
  onTagToggle: (tag: string) => void;
  onEncryptedFilterChange: (filter: 'all' | 'encrypted' | 'unencrypted') => void;
  onClearFilters: () => void;
}

export function NoteFilters({
  selectedTags,
  availableTags,
  filterEncrypted,
  onTagToggle,
  onEncryptedFilterChange,
  onClearFilters,
}: NoteFiltersProps) {
  const { t } = useTranslation();
  const [tagSearch, setTagSearch] = useState('');

  const filteredTags = useMemo(() => {
    if (!tagSearch.trim()) {
      return availableTags;
    }
    const searchLower = tagSearch.toLowerCase();
    return availableTags.filter(tag => tag.toLowerCase().includes(searchLower));
  }, [availableTags, tagSearch]);

  return (
    <div className="note-filters">
      <div className="note-filters-header">
        <h3>{t('filters.title')}</h3>
        {(selectedTags.length > 0 || filterEncrypted !== 'all') && (
          <button className="filter-clear-btn" onClick={onClearFilters}>
            {t('filters.clear')}
          </button>
        )}
      </div>
      
      <div className="filter-section">
        <div className="filter-section-title">{t('filters.encrypted')}</div>
        <div className="filter-options">
          <button
            className={`filter-option ${filterEncrypted === 'all' ? 'active' : ''}`}
            onClick={() => onEncryptedFilterChange('all')}
          >
            {t('filters.all')}
          </button>
          <button
            className={`filter-option ${filterEncrypted === 'encrypted' ? 'active' : ''}`}
            onClick={() => onEncryptedFilterChange('encrypted')}
          >
            🔒 {t('filters.encrypted')}
          </button>
          <button
            className={`filter-option ${filterEncrypted === 'unencrypted' ? 'active' : ''}`}
            onClick={() => onEncryptedFilterChange('unencrypted')}
          >
            {t('filters.unencrypted')}
          </button>
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-section-title">{t('filters.tags')}</div>
        {availableTags.length > 0 ? (
          <>
            <div className="filter-tags-search-wrapper">
              <span className="filter-tags-search-icon">🔍</span>
              <input
                type="text"
                className="filter-tags-search"
                placeholder={t('filters.searchTags')}
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
              />
              {tagSearch && (
                <button
                  className="filter-tags-search-clear"
                  onClick={() => setTagSearch('')}
                  title={t('filters.clearSearch')}
                >
                  ×
                </button>
              )}
            </div>
            <div className="filter-tags">
              {filteredTags.length > 0 ? (
                filteredTags.map((tag) => (
                  <button
                    key={tag}
                    className={`filter-tag ${selectedTags.includes(tag) ? 'active' : ''}`}
                    onClick={() => onTagToggle(tag)}
                  >
                    #{tag}
                  </button>
                ))
              ) : (
                <span className="filter-empty">{t('filters.noTagsFound')}</span>
              )}
            </div>
          </>
        ) : (
          <span className="filter-empty">{t('filters.noTags')}</span>
        )}
      </div>
    </div>
  );
}

