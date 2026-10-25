import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, useWindowDimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '@/hooks/useAppTheme';

const ONBOARDING_DATA = [
  {
    id: '1',
    title: 'Your School. Anywhere.\nAnytime.',
    description: 'Access premium written and audio lessons instantly. Master subjects from Primary 1 all the way up to SS3 on any device.',
    imagePlaceholderBg: '#E0F7FA', // Soft cyan
    image: require('../assets/images/onboarding_1.jpg'),
  },
  {
    id: '2',
    title: 'Learn at Your Own Pace',
    description: 'Choose how you learn best. Switch easily between clear, professional audio voice-overs and carefully summarized written class notes.',
    imagePlaceholderBg: '#FFF9C4', // Soft yellow
    image: require('../assets/images/onboarding_2.jpg'),
  },
  {
    id: '3',
    title: 'Practice & Improve',
    description: 'Reinforce lessons with targeted exercises and dynamic quizzes. Track your score improvements and gain confidence for exams.',
    imagePlaceholderBg: '#E8F5E9', // Soft green
    image: require('../assets/images/onboarding_3.jpg'),
  },
  {
    id: '4',
    title: 'Your Learning Journey\nStarts Here',
    description: 'Join thousands of active classmates. Get unlimited access to classes, homework prep, quizzes, and standard syllabus keys today.',
    imagePlaceholderBg: '#FFF3E0', // Soft orange
    image: require('../assets/images/onboarding_4.jpg'),
  },
];

import { storageService } from '@/services/storage.service';
import { useAuth } from '@/store/AuthContext';

export default function OnboardingScreen() {
  const { colors, isDark } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const { token, isLoading: isAuthLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      // 1. Check if student already has a saved login session
      const storedToken = await storageService.getToken();

      setTimeout(() => {
        if (!isMounted) return;
        if (storedToken) {
          // Keep user logged in! Bypass onboarding and login screens directly to main dashboard
          router.replace('/(tabs)');
        } else {
          setShowSplash(false);
        }
      }, 1800);
    };

    checkSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      router.push('/login');
    }
  };

  const handleSkip = () => {
    router.push('/login');
  };

  const onScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / width);
    setCurrentIndex(index);
  };

  if (showSplash) {
    return (
      <View style={[styles.splashContainer, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={[styles.logoBox, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
          <Text style={{ fontSize: 40, color: '#FFFFFF' }}>🎓</Text>
        </View>
        <Text style={[styles.splashTitle, { color: colors.text }]}>KSCHOOLMATE</Text>
        <Text style={[styles.splashSubtitle, { color: colors.primary }]}>Your School in Your Pocket</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Main Horizontal Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={ONBOARDING_DATA}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <ScrollView
                style={styles.slideScroll}
                contentContainerStyle={styles.slideScrollContent}
                showsVerticalScrollIndicator={false}
                bounces={true}
              >
                <View style={[styles.imageContainer, { backgroundColor: item.imagePlaceholderBg, width: width * 0.88, height: Math.min(height * 0.28, 250) }]}>
                  <Image source={item.image} style={styles.onboardingImage} resizeMode="cover" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.description, { color: colors.textSecondary }]}>{item.description}</Text>
                </View>
              </ScrollView>
            </View>
          )}
        />
      </View>

      {/* Fixed Static Footer with Next Button */}
      <View style={styles.footer}>
        <View style={styles.dotsContainer}>
          {ONBOARDING_DATA.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: colors.border },
                currentIndex === index && [styles.activeDot, { backgroundColor: colors.primary }],
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentIndex === ONBOARDING_DATA.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
  },
  splashSubtitle: {
    fontSize: 16,
    marginTop: 8,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 10,
    height: 40,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  carouselContainer: {
    flex: 1,
  },
  slide: {
    flex: 1,
  },
  slideScroll: {
    flex: 1,
  },
  slideScrollContent: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 24,
  },
  imageContainer: {
    borderRadius: 24,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  onboardingImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    width: '100%',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
    lineHeight: 34,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 20,
  },
  button: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

