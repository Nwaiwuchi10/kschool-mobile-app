import { useState, useCallback } from 'react';
import { ResponseModalType } from '@/components/ui/ResponseMessageModal';

export interface ResponseModalConfig {
  visible: boolean;
  type: ResponseModalType;
  title: string;
  message: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
  timeoutMs?: number;
}

export function useResponseModal() {
  const [modalConfig, setModalConfig] = useState<ResponseModalConfig>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const hideModal = useCallback(() => {
    setModalConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  const showModal = useCallback((config: Omit<ResponseModalConfig, 'visible'>) => {
    setModalConfig({
      ...config,
      visible: true,
    });
  }, []);

  const showSuccess = useCallback((
    title: string,
    message: string,
    onPrimaryPress?: () => void,
    primaryButtonText: string = 'Continue',
    timeoutMs?: number
  ) => {
    setModalConfig({
      visible: true,
      type: 'success',
      title,
      message,
      primaryButtonText,
      timeoutMs,
      onPrimaryPress: () => {
        hideModal();
        onPrimaryPress?.();
      },
    });
  }, [hideModal]);

  const showError = useCallback((
    title: string,
    message: string,
    onPrimaryPress?: () => void,
    primaryButtonText: string = 'Try Again',
    timeoutMs?: number
  ) => {
    setModalConfig({
      visible: true,
      type: 'error',
      title,
      message,
      primaryButtonText,
      timeoutMs,
      onPrimaryPress: () => {
        hideModal();
        onPrimaryPress?.();
      },
    });
  }, [hideModal]);

  const showWarning = useCallback((
    title: string,
    message: string,
    onPrimaryPress?: () => void,
    primaryButtonText: string = 'OK',
    secondaryButtonText?: string,
    onSecondaryPress?: () => void,
    timeoutMs?: number
  ) => {
    setModalConfig({
      visible: true,
      type: 'warning',
      title,
      message,
      primaryButtonText,
      secondaryButtonText,
      timeoutMs,
      onPrimaryPress: () => {
        hideModal();
        onPrimaryPress?.();
      },
      onSecondaryPress: () => {
        hideModal();
        onSecondaryPress?.();
      },
    });
  }, [hideModal]);

  const showInfo = useCallback((
    title: string,
    message: string,
    onPrimaryPress?: () => void,
    primaryButtonText: string = 'Got It',
    timeoutMs?: number
  ) => {
    setModalConfig({
      visible: true,
      type: 'info',
      title,
      message,
      primaryButtonText,
      timeoutMs,
      onPrimaryPress: () => {
        hideModal();
        onPrimaryPress?.();
      },
    });
  }, [hideModal]);

  return {
    modalConfig,
    showModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideModal,
  };
}
