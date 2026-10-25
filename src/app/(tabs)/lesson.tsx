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
  const [activeAudioUrl, setActiveAudioUrl] = useState<string>(lesson?.audioUrl || '');
  const player = useAudioPlayer(activeAudioUrl ? activeAudioUrl : undefined);
  const status = useAudioPlayerStatus(player);

  const lessonTitle = lesson?.title || params.title || 'Lesson Details';
  const subjectName = params.subject || 'Subject Curriculum';
  const lessonContent = lesson?.content || '';

  // Keep activeAudioUrl in sync when lesson loads
  useEffect(() => {
    if (lesson?.audioUrl) {
      setActiveAudioUrl(lesson.audioUrl);
    }
  }, [lesson?.audioUrl]);

  // Fetch lesson data if ID provided
  useEffect(() => {
    let isMounted = true;
    const fetchLesson = async () => {
      if (!params.id) return;
      try {
        setIsLoadingLesson(true);
        const data = await lessonService.getLessonById(params.id);
        if (isMounted && data) {
          setLesson(data);
          if (data.audioUrl) {
            setActiveAudioUrl(data.audioUrl);
          }
        }
      } catch (err) {
        console.warn('Error fetching lesson:', err);
      } finally {
        if (isMounted) setIsLoadingLesson(false);
      }
    };

    fetchLesson();
    return () => {
      isMounted = false;
    };
  }, [params.id]);

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
  const durationSec = status.duration || 0;

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
        const textToSpeak = `${lessonTitle}. ${lessonContent}`;
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

      Alert.alert('TTS Notice', 'No lesson text is available to read aloud.');
    } catch (err: any) {
      console.error('TTS Audio synthesis error:', err);
      Alert.alert(
        'Audio Notice',
        'Could not generate voice narration at the moment. Please verify your internet connection.'
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
      player.playbackRate = newSpeed;
    }
  };

  const formatTime = (secs: number) => {
    const totalSeconds = Math.floor(secs);
    const mins = Math.floor(totalSeconds / 60);
    const remainingSecs = totalSeconds % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const progressPercent = durationSec > 0 ? (currentTimeSec / durationSec) * 100 : 0;

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

        {/* Breadcrumb / Tag */}
        <View style={[styles.tagContainer, { backgroundColor: colors.primaryMint }]}>
          <Text style={[styles.tagText, { color: colors.primary }]}>{subjectName}</Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{lessonTitle}</Text>

        {/* AI Read Aloud Trigger */}
        <TouchableOpacity
          style={[styles.aiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handlePlayPause}
          disabled={isSynthesizing}
          activeOpacity={0.8}
        >
          <View style={[styles.aiIconBox, { backgroundColor: colors.primaryMint }]}>
            {isSynthesizing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name={isPlaying ? 'volume-high' : 'mic'} size={20} color={colors.primary} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.aiHeaderRow}>
              <Text style={[styles.aiTitle, { color: colors.text }]}>Natural TTS Voice Narration</Text>
              {lesson?.audioVoice && (
                <View style={[styles.voiceBadge, { backgroundColor: colors.cardHighlightBg }]}>
                  <Text style={[styles.voiceBadgeText, { color: colors.primary }]}>{lesson.audioVoice.split('-').pop()}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.aiDesc, { color: colors.textSecondary }]}>
              {isSynthesizing
                ? 'Synthesizing voice narration from lesson text...'
                : isPlaying
                ? 'Playing studio quality neural audio narration...'
                : 'Tap to listen to this lesson read aloud by AI.'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Progress Indicator */}
        <View style={styles.progressRow}>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Lesson Progress</Text>
          <Text style={[styles.progressPercent, { color: colors.primary }]}>{Math.round(progressPercent)}%</Text>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceAlt }]}>
          <View style={[styles.progressBarFill, { width: `${Math.max(5, progressPercent)}%`, backgroundColor: colors.primary }]} />
        </View>

        {/* Learning Objectives if uploaded by Admin */}
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

        {/* Lesson Outlines / Key Points if uploaded by Admin */}
        {Array.isArray(lesson?.outlines) && lesson.outlines.filter((o) => typeof o === 'string' && o.trim().length > 0).length > 0 && (
          <View style={[styles.metaBlockCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.metaBlockHeader}>
              <Ionicons name="list-outline" size={18} color={colors.primary} />
              <Text style={[styles.metaBlockTitle, { color: colors.text }]}>Lesson Outline & Key Points</Text>
            </View>
            {lesson.outlines
              .filter((otl) => typeof otl === 'string' && otl.trim().length > 0)
              .map((otl, i) => (
                <View key={i} style={styles.metaRow}>
                  <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>{otl}</Text>
                </View>
              ))}
          </View>
        )}

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

        {/* Teacher Voice Note if recorded & uploaded by Admin */}
        {lesson?.voiceNoteUrl && typeof lesson.voiceNoteUrl === 'string' && lesson.voiceNoteUrl.trim().length > 0 && (
          <View style={[styles.voiceNoteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.voiceNoteIcon, { backgroundColor: colors.primaryMint }]}>
              <Ionicons name="mic-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.voiceNoteTitle, { color: colors.text }]}>Teacher Audio Note</Text>
              <Text style={[styles.voiceNoteDesc, { color: colors.textSecondary }]}>
                Personal explanation recorded by your instructor
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.voiceNotePlayBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                if (player && lesson?.voiceNoteUrl) {
                  player.replace({ uri: lesson.voiceNoteUrl });
                  player.play();
                }
              }}
            >
              <Ionicons name="play" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Lesson Content Body - Enhanced Responsive Content Card */}
        {lessonContent ? (
          <View style={[styles.contentCard, { backgroundColor: colors.surface, borderColor: colors.border, padding: 18 }]}>
            {/* Content Section Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, marginBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: colors.primaryMint, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="book-outline" size={15} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                  Lesson Notes & Study Material
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surfaceAlt, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                <Ionicons name="eye-outline" size={12} color={colors.primary} />
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary }}>Standard</Text>
              </View>
            </View>

            <MathView
              content={lessonContent}
              fontSize={16}
              color={colors.text}
              style={{ minHeight: 60 }}
            />
          </View>
        ) : !isLoadingLesson ? null : null}

        {/* Teacher Audio Player (Integrated with Cloudinary / Google Cloud TTS) */}
        {(activeAudioUrl || lesson?.audioUrl) && (
          <View style={[styles.audioCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.audioHeader}>
              <Text style={[styles.audioTitle, { color: colors.text }]}>Audio Lesson Player</Text>
              <TouchableOpacity style={[styles.speedButton, { backgroundColor: colors.surfaceAlt }]} onPress={toggleSpeed}>
                <Text style={[styles.speedText, { color: colors.primary }]}>{playbackSpeed}x</Text>
              </TouchableOpacity>
            </View>

          {/* Controls */}
          <View style={styles.audioControls}>
            {/* Skip backward 15s */}
            <TouchableOpacity style={styles.iconBtn} onPress={() => handleSkip(-15)}>
              <Ionicons name="play-back-outline" size={24} color={colors.primary} />
            </TouchableOpacity>

            {/* Play/Pause Button */}
            <TouchableOpacity
              style={[styles.playBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
              onPress={handlePlayPause}
              disabled={isBuffering}
              activeOpacity={0.85}
            >
              {isBuffering ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            {/* Skip forward 15s */}
            <TouchableOpacity style={styles.iconBtn} onPress={() => handleSkip(15)}>
              <Ionicons name="play-forward-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Scrubber */}
          <View style={styles.scrubberRow}>
            <View style={[styles.scrubberBg, { backgroundColor: colors.surfaceAlt }]}>
              <View
                style={[
                  styles.scrubberFill,
                  { width: `${Math.min(100, Math.max(0, progressPercent))}%`, backgroundColor: colors.primary },
                ]}
              />
            </View>
          </View>

          {/* Time counters */}
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>{formatTime(currentTimeSec)}</Text>
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
              {durationSec > 0 ? formatTime(durationSec) : '0:00'}
            </Text>
          </View>
        </View>
        )}

        {/* Attached Exercises / Quizzes Card */}
        {Array.isArray(lesson?.exercises) && lesson.exercises.length > 0 && (
          <View style={[styles.contentCard, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 14 }]}>
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

        {/* Navigation Buttons */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, styles.navBtnDisabled, { borderColor: colors.border }]}
            disabled
          >
            <Text style={[styles.navBtnText, styles.navBtnTextDisabled, { color: colors.textMuted }]}>Previous Lesson</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navBtn, styles.navBtnActive, { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => {
              router.push({
                pathname: '/quiz',
                params: {
                  topicId: params.topicId,
                  lessonId: params.id,
                  title: `${lessonTitle} Exercise`,
                },
              });
            }}
          >
            <Text style={[styles.navBtnText, styles.navBtnTextActive]}>Take Quiz</Text>
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
  tagContainer: {
    backgroundColor: '#D1FAE5',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  tagText: {
    color: '#127A71',
    fontWeight: '700',
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  aiIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  voiceBadge: {
    backgroundColor: '#E6F4F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  voiceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#127A71',
  },
  aiDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#127A71',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 24,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#127A71',
    borderRadius: 3,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  paragraph: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 16,
  },
  audioCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
  },
  audioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  audioTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  speedButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  speedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#127A71',
  },
  audioControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 36,
    marginBottom: 20,
  },
  iconBtn: {
    padding: 8,
  },
  playBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#127A71',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#127A71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  scrubberRow: {
    marginBottom: 8,
  },
  scrubberBg: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  scrubberFill: {
    height: 6,
    backgroundColor: '#127A71',
    borderRadius: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  navBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  navBtnDisabled: {
    borderColor: '#E5E7EB',
    backgroundColor: 'transparent',
  },
  navBtnTextDisabled: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
  navBtnActive: {
    borderColor: '#127A71',
    backgroundColor: '#127A71',
  },
  navBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
