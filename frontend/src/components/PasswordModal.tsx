import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import './PasswordModal.css';

interface PasswordModalProps {
  isOpen: boolean;
  isCreate: boolean;
  onConfirm: (password: string) => void;
  onCancel: () => void;
  error?: string;
}

export function PasswordModal({ isOpen, isCreate, onConfirm, onCancel, error }: PasswordModalProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setConfirmPassword('');
      setLocalError('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!password.trim()) {
      setLocalError(t('password.required'));
      return;
    }

    if (password.length < 6) {
      setLocalError(t('password.minLength'));
      return;
    }

    if (isCreate) {
      if (!confirmPassword.trim()) {
        setLocalError(t('password.required'));
        return;
      }

      if (password !== confirmPassword) {
        setLocalError(t('password.mismatch'));
        return;
      }
    }

    onConfirm(password);
  };

  if (!isOpen) return null;

  return (
    <div className="password-modal-overlay" onClick={onCancel}>
      <div className="password-modal" onClick={(e) => e.stopPropagation()}>
        <div className="password-modal-header">
          <h3>{t('password.title')}</h3>
        </div>
        <form className="password-modal-form" onSubmit={handleSubmit}>
          <div className="password-modal-input-group">
            <input
              ref={inputRef}
              type="password"
              className="password-modal-input"
              placeholder={t('password.placeholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {isCreate && (
            <div className="password-modal-input-group">
              <input
                type="password"
                className="password-modal-input"
                placeholder={t('password.confirmPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}
          {(error || localError) && (
            <div className="password-modal-error">
              {error || localError}
            </div>
          )}
          <div className="password-modal-actions">
            <button type="button" className="btn-cancel" onClick={onCancel}>
              {t('password.cancel')}
            </button>
            <button type="submit" className="btn-confirm">
              {isCreate ? t('password.create') : t('password.unlock')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

