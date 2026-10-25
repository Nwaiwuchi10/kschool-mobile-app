import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, View, ActivityIndicator } from 'react-native';

interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  outline?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export default function PrimaryButton({
  title,
  outline,
  loading = false,
  disabled,
  icon,
  style,
  ...props
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        outline && styles.buttonOutline,
        isDisabled && styles.buttonDisabled,
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={outline ? '#127A71' : '#FFFFFF'} />
      ) : (
        <>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.text, outline && styles.textOutline]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#127A71',
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  textOutline: {
    color: '#1A1A1A',
  },
  iconContainer: {
    marginRight: 8,
  },
});
