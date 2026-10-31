import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';

/**
 * SubjectDetailsScreen has been merged into TopicDetailsScreen (/topic-details).
 * Automatically redirects to /topic-details while preserving all parameters.
 */
export default function SubjectDetailsScreen() {
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{
    id?: string;
    subjectId?: string;
    name?: string;
    subjectName?: string;
    topicId?: string;
    topicTitle?: string;
  }>();

  useEffect(() => {
    router.replace({
      pathname: '/(tabs)/topic-details',
      params: {
        id: params.id || params.subjectId,
        subjectId: params.subjectId || params.id,
        name: params.name || params.subjectName,
        subjectName: params.subjectName || params.name,
        topicId: params.topicId,
        topicTitle: params.topicTitle,
      },
    });
  }, [params]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
