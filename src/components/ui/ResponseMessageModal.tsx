import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';

export type ResponseModalType = 'success' | 'error' | 'warning' | 'info';

export interface ResponseMessageModalProps {
  visible: boolean;
  type?: ResponseModalType;
  title: string;
  message: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
  timeoutMs?: number; // Duration in ms before auto-dismiss (defaults to 3000ms). Set to 0 to disable.
  showProgressBar?: boolean; // Displays an animated timeout bar at the bottom. Defaults to true.
}

const { width } = Dimensions.get('window');

export default function ResponseMessageModal({
  visible,
  type = 'info',
  title,
  message,
  primaryButtonText,
  secondaryButtonText,
  onPrimaryPress,
  onSecondaryPress,
  onClose,
  showCloseButton = true,
  timeoutMs,
  showProgressBar = true,
}: ResponseMessageModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Keep latest callback references to prevent resetting timer on re-renders
  const onPrimaryPressRef = useRef(onPrimaryPress);
  const onSecondaryPressRef = useRef(onSecondaryPress);
  const onCloseRef = useRef(onClose);
  const typeRef = useRef(type);

  useEffect(() => {
    onPrimaryPressRef.current = onPrimaryPress;
    onSecondaryPressRef.current = onSecondaryPress;
    onCloseRef.current = onClose;
    typeRef.current = type;
  });

  // By default, modals auto-timeout in 3000ms unless it's a dual-action dialog (like confirmation modal with secondaryButtonText)
  const shouldTimeout = timeoutMs !== undefined ? timeoutMs > 0 : !secondaryButtonText;
  const duration = timeoutMs && timeoutMs > 0 ? timeoutMs : 3000;

  // Entrance spring animation
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 70,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  // Timeout countdown & progress animation
  useEffect(() => {
    if (!visible || !shouldTimeout) {
      progressAnim.setValue(0);
      return;
    }

    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      if (typeRef.current === 'success' && onPrimaryPressRef.current) {
        onPrimaryPressRef.current();
      } else if (onCloseRef.current) {
        onCloseRef.current();
      }
    }, duration);

    return () => {
      clearTimeout(timer);
      progressAnim.stopAnimation();
    };
  }, [visible, shouldTimeout, duration, progressAnim]);

  const handleDismiss = () => {
    if (onClose) {
      onClose();
    }
  };

  const handlePrimaryPress = () => {
    if (onPrimaryPress) {
      onPrimaryPress();
    } else if (onClose) {
      onClose();
    }
  };

  const handleSecondaryPress = () => {
    if (onSecondaryPress) {
      onSecondaryPress();
    } else if (onClose) {
      onClose();
    }
  };

  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return {
          iconName: 'checkmark-outline' as const,
          outerBg: '#DCFCE7',
          innerBg: '#10B981',
          borderColor: '#86EFAC',
          buttonBg: '#127A71',
          defaultButtonText: 'Continue',
        };
      case 'error':
        return {
          iconName: 'close-outline' as const,
          outerBg: '#FEE2E2',
          innerBg: '#EF4444',
          borderColor: '#FCA5A5',
          buttonBg: '#DC2626',
          defaultButtonText: 'Try Again',
        };
      case 'warning':
        return {
          iconName: 'alert-outline' as const,
          outerBg: '#FEF3C7',
          innerBg: '#F59E0B',
          borderColor: '#FCD34D',
          buttonBg: '#127A71',
          defaultButtonText: 'OK',
        };
      case 'info':
      default:
        return {
          iconName: 'information-outline' as const,
          outerBg: '#E0F2FE',
          innerBg: '#0284C7',
          borderColor: '#BAE6FD',
          buttonBg: '#127A71',
          defaultButtonText: 'Got It',
        };
    }
  };

  const iconConfig = getIconConfig();
  const resolvedPrimaryText = primaryButtonText || iconConfig.defaultButtonText;
  const { colors } = useAppTheme();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.surface,
                  opacity: opacityAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Optional Close Button */}
              {showCloseButton && (
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: colors.surfaceAlt }]}
                  onPress={handleDismiss}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}

              {/* Status Icon */}
              <View
                style={[
                  styles.iconOuterRing,
                  {
                    backgroundColor: iconConfig.outerBg,
                    borderColor: iconConfig.borderColor,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconInnerCircle,
                    { backgroundColor: iconConfig.innerBg },
                  ]}
                >
                  <Ionicons
                    name={iconConfig.iconName}
                    size={28}
                    color="#FFFFFF"
                  />
                </View>
              </View>

              {/* Title & Message */}
              <Text style={[styles.titleText, { color: colors.text }]}>{title}</Text>
              <Text style={[styles.messageText, { color: colors.textSecondary }]}>{message}</Text>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { backgroundColor: iconConfig.buttonBg },
                  ]}
                  onPress={handlePrimaryPress}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>
                    {resolvedPrimaryText}
                  </Text>
                </TouchableOpacity>

                {secondaryButtonText && (
                  <TouchableOpacity
                    style={[styles.secondaryButton, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                    onPress={handleSecondaryPress}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
                      {secondaryButtonText}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Animated Timeout Progress Bar */}
              {shouldTimeout && showProgressBar && (
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[
                      styles.progressBar,
                      {
                        backgroundColor: iconConfig.buttonBg,
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: Math.min(width - 48, 380),
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 28,
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
    }),
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconOuterRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconInnerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14.5,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
  },
  primaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    color: '#4B5563',
    fontSize: 15,
    fontWeight: '600',
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
});
