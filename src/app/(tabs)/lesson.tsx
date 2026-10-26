import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { lessonService, MobileLesson } from '@/services/lesson.service';
import { MathView } from '@/components/MathView';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function LessonScreen() {
  const { colors, isDark } = useAppTheme();
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    subject?: string;
    topicId?: string;
  }>();

  const [lesson, setLesson] = useState<MobileLesson | null>(null);
  const [isLoadingLesson, setIsLoadingLesson] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Audio source and player setup
  const [activeAudioUrl, setActiveAudioUrl] = useState<string>(lesson?.audioUrl || lesson?.voiceNoteUrl || '');
  const player = useAudioPlayer(activeAudioUrl ? activeAudioUrl : undefined);
  const status = useAudioPlayerStatus(player);

  const [topicLessons, setTopicLessons] = useState<MobileLesson[]>([]);

  const lessonTitle = lesson?.title || params.title || 'Lesson Details';
  const subjectName = params.subject || 'Subject Curriculum';
  const lessonContent = lesson?.content || '';

  // Keep activeAudioUrl in sync when lesson loads
  useEffect(() => {
    if (lesson?.audioUrl) {
      setActiveAudioUrl(lesson.audioUrl);
    } else if (lesson?.voiceNoteUrl) {
      setActiveAudioUrl(lesson.voiceNoteUrl);
    }
  }, [lesson?.audioUrl, lesson?.voiceNoteUrl]);

  // Fetch current lesson and sibling lessons for topic
  useEffect(() => {
    let isMounted = true;
    const fetchLesson = async () => {
      if (!params.id) return;
      try {
        setIsLoadingLesson(true);
        const data = await lessonService.getLessonById(params.id);
        if (isMounted && data) {
          setLesson(data);
          const preferredAudio = data.audioUrl || data.voiceNoteUrl || '';
          if (preferredAudio) {
            setActiveAudioUrl(preferredAudio);
          }
        }
      } catch (err) {
        console.warn('Error fetching lesson:', err);
      } finally {
        if (isMounted) setIsLoadingLesson(false);
      }
    };

    const fetchTopicSiblings = async () => {
      if (!params.topicId) return;
      try {
        const siblings = await lessonService.getLessonsByTopic(params.topicId);
        if (isMounted && Array.isArray(siblings)) {
          setTopicLessons(siblings);
        }
      } catch (e) {
        console.warn('Error fetching topic siblings:', e);
      }
    };

    fetchLesson();
    fetchTopicSiblings();

    return () => {
      isMounted = false;
    };
  }, [params.id, params.topicId]);

  // Enforce subscription access barrier
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { subscriptionService } = await import('@/services/subscription.service');
        const access = await subscriptionService.checkAccess(params.topicId, params.id);
        if (!access.canAccess) {
          router.replace('/premium-access');
        }
      } catch {
        // allow offline fallback
      }
    };
    checkAccess();
  }, [params.topicId, params.id]);

  // Keep player source synchronized with activeAudioUrl
  useEffect(() => {
    if (activeAudioUrl && player) {
      try {
        player.replace({ uri: activeAudioUrl });
      } catch {}
    }
  }, [activeAudioUrl, player]);

  const isPlaying = status.playing;
  const isBuffering = status.isBuffering;
  const currentTimeSec = status.currentTime || 0;
  const durationSec = status.duration || (lesson?.audioDuration || lesson?.voiceNoteDuration || 0);

  const handlePlayPause = async () => {
    try {
      if (player.playing) {
        player.pause();
        return;
      }

      // If already has audio url and loaded
      if (activeAudioUrl) {
        player.play();
        return;
      }

      // If no audio url is generated yet, synthesize on-the-fly using TTS (ttsmp3.com / Google TTS)
      if (lessonContent || lessonTitle) {
        setIsSynthesizing(true);
        const textToSpeak = `${lessonTitle}. ${lessonContent.replace(/<[^>]+>/g, ' ').slice(0, 500)}`;
        const res = await lessonService.synthesizeSpeech(textToSpeak, lesson?.audioVoice || 'en-GB-Neural2-A');
        if (res && res.audioUrl) {
          setActiveAudioUrl(res.audioUrl);
          if (player) {
            player.replace({ uri: res.audioUrl });
            player.play();
          }
          return;
        }
      }

      Alert.alert('Audio Notice', 'No audio or lesson text is available to play.');
    } catch (err: any) {
      console.error('Audio playback/synthesis error:', err);
      Alert.alert(
        'Audio Notice',
        'Could not stream audio narration at the moment. Please check your internet connection.'
      );
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleSkip = (deltaSeconds: number) => {
    if (!player) return;
    try {
      const targetSec = Math.max(0, Math.min(currentTimeSec + deltaSeconds, durationSec || 9999));
      player.seekTo(targetSec);
    } catch (e) {
      console.warn('Error skipping audio:', e);
    }
  };

  const toggleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPlaybackSpeed(newSpeed);

    if (player) {
      try {
        if (typeof (player as any).setPlaybackRate === 'function') {
          (player as any).setPlaybackRate(newSpeed);
        }
      } catch (e) {
        console.warn('Error setting audio playback speed:', e);
      }
    }
  };

  const formatTime = (secs: number) => {
    const totalSeconds = Math.floor(secs);
    const mins = Math.floor(totalSeconds / 60);
    const remainingSecs = totalSeconds % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const progressPercent = durationSec > 0 ? (currentTimeSec / durationSec) * 100 : 0;

  // Calculate lesson sequence (e.g. Lesson 1 of 3, 33% Complete)
  const currentIdx = Math.max(
    0,
    topicLessons.findIndex((l) => l._id === params.id || l._id === lesson?._id)
  );
  const totalTopicLessons = Math.max(topicLessons.length || 1, 1);
  const calculatedProgressPercent = Math.min(100, Math.max(0, ((currentIdx + 1) / totalTopicLessons) * 100));

  const prevLesson = currentIdx > 0 ? topicLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < topicLessons.length - 1 ? topicLessons[currentIdx + 1] : null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else if (params.topicId) {
              router.replace({
                pathname: '/topic-details',
                params: {
                  topicId: params.topicId,
                  subjectName: subjectName.split(' > ')[0] || 'Subject',
                },
              });
            } else {
              router.replace('/(tabs)/subjects');
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Lesson</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {isLoadingLesson && (
          <View style={[styles.loadingBanner, { backgroundColor: colors.cardHighlightBg }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingBannerText, { color: colors.primary }]}>Loading lesson content...</Text>
          </View>
        )}

        {/* Breadcrumb / Category Tag */}
        <View style={[styles.tagContainer, { backgroundColor: '#E6F7F5' }]}>
          <Text style={[styles.tagText, { color: colors.primary }]}>{subjectName}</Text>
        </View>

        {/* Lesson Title */}
        <Text style={[styles.title, { color: colors.text }]}>{lessonTitle}</Text>

        {/* AI Read Aloud Bar (matching reference mockup) */}
        <TouchableOpacity
          style={[styles.aiReadAloudCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handlePlayPause}
          disabled={isSynthesizing}
          activeOpacity={0.8}
        >
          <View style={[styles.aiMicCircle, { backgroundColor: '#E6F7F5' }]}>
            {isSynthesizing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name={isPlaying ? 'volume-high' : 'mic-outline'} size={20} color={colors.primary} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.aiReadAloudTitle, { color: colors.text }]}>AI Read Aloud</Text>
            <Text style={[styles.aiReadAloudSubtitle, { color: colors.textSecondary }]}>
              {isSynthesizing
                ? 'Generating voice narration...'
                : isPlaying
                ? 'Playing audio narration...'
                : 'Tap to hear this lesson read aloud.'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Lesson Progress Counter & Bar (e.g. "Lesson 1 of 3   33% Complete") */}
        <View style={styles.lessonProgressHeader}>
          <Text style={[styles.lessonProgressCount, { color: colors.textSecondary }]}>
            Lesson {currentIdx + 1} of {totalTopicLessons}
          </Text>
          <Text style={[styles.lessonProgressPercent, { color: colors.primary }]}>
            {Math.round(calculatedProgressPercent)}% Complete
          </Text>
        </View>
        <View style={[styles.lessonProgressBarBg, { backgroundColor: colors.surfaceAlt }]}>
          <View
            style={[
              styles.lessonProgressBarFill,
              { width: `${Math.max(8, Math.min(100, calculatedProgressPercent))}%`, backgroundColor: colors.primary },
            ]}
          />
        </View>

        {/* Learning Objectives if uploaded by Admin (comes BEFORE lesson content) */}
        {Array.isArray(lesson?.objectives) && lesson.objectives.filter((o) => typeof o === 'string' && o.trim().length > 0).length > 0 && (
          <View style={[styles.metaBlockCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.metaBlockHeader}>
              <Ionicons name="flag-outline" size={18} color={colors.primary} />
              <Text style={[styles.metaBlockTitle, { color: colors.text }]}>Learning Objectives</Text>
            </View>
            {lesson.objectives
              .filter((obj) => typeof obj === 'string' && obj.trim().length > 0)
              .map((obj, i) => (
                <View key={i} style={styles.metaRow}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} style={{ marginTop: 2 }} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>{obj}</Text>
                </View>
              ))}
          </View>
        )}

        {/* Lesson Content Body - seamlessly integrated with same UI, transparent without extra border or contrasting background */}
        {lessonContent ? (
          <View style={styles.naturalContentWrapper}>
            <MathView
              content={lessonContent}
              fontSize={15}
              color={colors.text}
              style={{ minHeight: 60 }}
            />
          </View>
        ) : !isLoadingLesson ? null : null}

        {/* Teacher's Explanation Audio Media Player (Matching Mockup with complete controls) */}
        <View style={[styles.teacherPlayerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.teacherPlayerTitle, { color: colors.text }]}>Teacher's Explanation</Text>

          {/* Player Main Controls Row */}
          <View style={styles.teacherControlsRow}>
            {/* Speed / Reset button (Left icon) */}
            <TouchableOpacity
              style={styles.teacherSideIconBtn}
              onPress={toggleSpeed}
              activeOpacity={0.7}
            >
              <Ionicons name="speedometer-outline" size={22} color={colors.primary} />
              <Text style={{ fontSize: 9, fontWeight: '700', color: colors.primary, marginTop: 1 }}>
                {playbackSpeed}x
              </Text>
            </TouchableOpacity>

            {/* Main Play / Pause Circle (Center) */}
            <TouchableOpacity
              style={[styles.teacherPlayBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
              onPress={handlePlayPause}
              disabled={isBuffering || isSynthesizing}
              activeOpacity={0.85}
            >
              {isBuffering || isSynthesizing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={26}
                  color="#FFFFFF"
                  style={{ marginLeft: isPlaying ? 0 : 2 }}
                />
              )}
            </TouchableOpacity>

            {/* Skip 15s forward (Right icon) */}
            <TouchableOpacity
              style={styles.teacherSideIconBtn}
              onPress={() => handleSkip(15)}
              activeOpacity={0.7}
            >
              <Ionicons name="play-forward" size={22} color={colors.primary} />
              <Text style={{ fontSize: 9, fontWeight: '700', color: colors.primary, marginTop: 1 }}>
                +15s
              </Text>
            </TouchableOpacity>
          </View>

          {/* Interactive Audio Scrubber Bar */}
          <TouchableOpacity
            style={styles.teacherScrubberTrack}
            activeOpacity={0.8}
            onPress={(e) => {
              const { locationX } = e.nativeEvent;
              // Assuming standard container width approx 300px, seek proportionally
              if (durationSec > 0 && player) {
                const ratio = Math.max(0, Math.min(1, locationX / 280));
                handleSkip((ratio * durationSec) - currentTimeSec);
              }
            }}
          >
            <View style={[styles.teacherScrubberBg, { backgroundColor: colors.surfaceAlt }]}>
              <View
                style={[
                  styles.teacherScrubberFill,
                  { width: `${Math.min(100, Math.max(0, progressPercent))}%`, backgroundColor: colors.primary },
                ]}
              />
            </View>
          </TouchableOpacity>

          {/* Audio Timers Row (Current time & Duration) */}
          <View style={styles.teacherTimeRow}>
            <Text style={[styles.teacherTimeText, { color: colors.textSecondary }]}>
              {formatTime(currentTimeSec)}
            </Text>
            <Text style={[styles.teacherTimeText, { color: colors.textSecondary }]}>
              {durationSec > 0 ? formatTime(durationSec) : (lesson?.duration || '8:15')}
            </Text>
          </View>
        </View>

        {/* Lesson Illustrations / Images uploaded by Admin */}
        {Array.isArray(lesson?.images) && lesson.images.filter((img) => typeof img === 'string' && img.trim().length > 0).length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Lesson Illustrations</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 8 }}>
              {lesson.images
                .filter((img) => typeof img === 'string' && img.trim().length > 0)
                .map((imgUri, idx) => (
                  <View key={idx} style={[styles.imageCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Image source={{ uri: imgUri }} style={styles.lessonIllustration} resizeMode="cover" />
                  </View>
                ))}
            </ScrollView>
          </View>
        )}

        {/* Attached Exercises / Quizzes Card */}
        {Array.isArray(lesson?.exercises) && lesson.exercises.length > 0 && (
          <View style={[styles.cleanContentCard, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 20 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="help-circle-outline" size={18} color={colors.primary} />
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                  Practice Exercises & Quizzes
                </Text>
              </View>
              <View style={{ backgroundColor: colors.primaryMint, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                  {lesson.exercises.length} Attached
                </Text>
              </View>
            </View>

            <View style={{ gap: 8 }}>
              {lesson.exercises.map((ex: any, idx: number) => {
                const exId = ex?._id || ex;
                const exTitle = ex?.title || `Exercise #${idx + 1}`;
                const qCount = ex?.questions?.length || 0;

                return (
                  <TouchableOpacity
                    key={exId || idx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: colors.surfaceAlt,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                    onPress={() => {
                      router.push({
                        pathname: '/quiz',
                        params: {
                          topicId: params.topicId,
                          lessonId: params.id,
                          quizId: typeof exId === 'string' ? exId : undefined,
                          title: exTitle,
                        },
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                        {exTitle}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                        {qCount > 0 ? `${qCount} Questions • ` : ''}Practice Quiz
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: colors.primary,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>Start</Text>
                      <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Previous Lesson / Next Lesson Navigation Buttons (Matching Mockup) */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[
              styles.navBtn,
              styles.navBtnActiveOutline,
              { borderColor: colors.primary },
            ]}
            onPress={() => {
              if (prevLesson) {
                router.replace({
                  pathname: '/lesson',
                  params: {
                    id: prevLesson._id,
                    title: prevLesson.title,
                    subject: subjectName,
                    topicId: params.topicId,
                  },
                });
              } else if (params.topicId) {
                router.replace({
                  pathname: '/topic-details',
                  params: {
                    topicId: params.topicId,
                    topicTitle: subjectName.split(' > ')[1] || params.title || 'Topic Details',
                    subjectName: subjectName.split(' > ')[0] || 'Subject',
                  },
                });
              } else if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/subjects');
              }
            }}
          >
            <Text
              style={[
                styles.navBtnText,
                { color: colors.primary, fontWeight: '700' },
              ]}
            >
              Previous Lesson
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navBtn,
              styles.navBtnActiveOutline,
              { borderColor: colors.primary },
            ]}
            onPress={() => {
              if (nextLesson) {
                router.replace({
                  pathname: '/lesson',
                  params: {
                    id: nextLesson._id,
                    title: nextLesson.title,
                    subject: subjectName,
                    topicId: params.topicId,
                  },
                });
              } else {
                router.push({
                  pathname: '/quiz',
                  params: {
                    topicId: params.topicId,
                    lessonId: params.id,
                    title: `${lessonTitle} Assessment`,
                  },
                });
              }
            }}
          >
            <Text style={[styles.navBtnText, { color: colors.primary, fontWeight: '700' }]}>
              {nextLesson ? 'Next Lesson' : 'Take Quiz'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  container: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4F2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  loadingBannerText: {
    fontSize: 13,
    color: '#127A71',
    fontWeight: '600',
  },
  /* Reference Mockup: Category Tag */
  tagContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  tagText: {
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.1,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  /* Reference Mockup: AI Read Aloud Pill Card */
  aiReadAloudCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 12,
  },
  aiMicCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiReadAloudTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  aiReadAloudSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  /* Reference Mockup: Lesson Progress Counter & Bar */
  lessonProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lessonProgressCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  lessonProgressPercent: {
    fontSize: 13,
    fontWeight: '800',
  },
  lessonProgressBarBg: {
    height: 6,
    borderRadius: 3,
    marginBottom: 20,
    overflow: 'hidden',
  },
  lessonProgressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  naturalContentWrapper: {
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  /* Reference Mockup: Enhanced Clean Content Card */
  cleanContentCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 22,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  /* Reference Mockup: Teacher's Explanation Player Card */
  teacherPlayerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  teacherPlayerTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  teacherControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 10,
  },
  teacherSideIconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherPlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  teacherScrubberTrack: {
    paddingVertical: 6,
    marginBottom: 6,
  },
  teacherScrubberBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  teacherScrubberFill: {
    height: 6,
    borderRadius: 3,
  },
  teacherTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teacherTimeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    marginTop: 8,
    marginBottom: 20,
  },
  navBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  navBtnDisabled: {
    borderColor: '#E5E7EB',
    backgroundColor: 'transparent',
  },
  navBtnTextDisabled: {
    color: '#D1D5DB',
    fontWeight: '600',
  },
  navBtnActiveOutline: {
    backgroundColor: '#FFFFFF',
  },
  navBtnText: {
    fontSize: 15,
  },
  formulaCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderLeftColor: '#127A71',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  formulaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  formulaTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#127A71',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formulaText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#0F172A',
    lineHeight: 22,
    fontWeight: '600',
  },
  metaBlockCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  metaBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  metaBlockTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  imageCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  lessonIllustration: {
    width: 240,
    height: 150,
    borderRadius: 16,
  },
  voiceNoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  voiceNoteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceNoteTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  voiceNoteDesc: {
    fontSize: 12,
  },
  voiceNotePlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
