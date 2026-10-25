import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';

interface InputFieldProps extends TextInputProps {
  label: string;
  isPassword?: boolean;
}

export default function InputField({ label, isPassword, style, ...props }: InputFieldProps) {
  const [isSecure, setIsSecure] = useState(isPassword);
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={[styles.inputContainer, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
        <TextInput
          style={[styles.input, { color: colors.inputText }, style]}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={isSecure}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setIsSecure(!isSecure)} style={styles.eyeIcon}>
            <Ionicons name={isSecure ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textSecondary} />
            <Text style={[styles.showText, { color: colors.textSecondary }]}>{isSecure ? "Show" : "Hide"}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#1A1A1A',
  },
  eyeIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  showText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
});
