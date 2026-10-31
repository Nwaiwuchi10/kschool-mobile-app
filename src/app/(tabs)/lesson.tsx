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
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { lessonService, MobileLesson, STUDENT_VOICES, VoiceOption } from '@/services/lesson.service';
import { quizService, MobileQuiz } from '@/services/quiz.service';
import { storageService } from '@/services/storage.service';
import { MathView } from '@/components/MathView';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useClass } from '@/store/ClassContext';

export default function LessonScreen() {
  const { colors, isDark } = useAppTheme();
  const { selectedClass } = useClass();
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    subject?: string;
    topicId?: string;
  }>();

  const [lesson, setLesson] = useState<MobileLesson | null>(null);
  const [lessonQuizzes, setLessonQuizzes] = useState<MobileQuiz[]>([]);
  const [isLoadingLesson, setIsLoadingLesson] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(STUDENT_VOICES[0]);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // Separate Audio Players for TTS Narrator and Teacher's Explanation
  // 1. TTS Narrator Player
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string>('');
  const ttsPlayer = useAudioPlayer(ttsAudioUrl ? { uri: ttsAudioUrl } : null);
  const ttsStatus = useAudioPlayerStatus(ttsPlayer);
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0);

  // 2. Teacher's Explanation Player
  const [teacherAudioUrl, setTeacherAudioUrl] = useState<string>(lesson?.voiceNoteUrl || '');
  const teacherPlayer = useAudioPlayer(teacherAudioUrl ? { uri: teacherAudioUrl } : null);
  const teacherStatus = useAudioPlayerStatus(teacherPlayer);
  const [teacherSpeed, setTeacherSpeed] = useState<number>(1.0);

  const [topicLessons, setTopicLessons] = useState<MobileLesson[]>([]);

  const lessonTitle = lesson?.title || params.title || 'Lesson Details';
  const subjectName = params.subject || 'Subject Curriculum';
  const lessonContent = lesson?.content || '';

  // Load student's saved preferred voice
  useEffect(() => {
    const loadVoice = async () => {
      try {
        const savedVoiceId = await storageService.getPreferredVoice();
        const found = STUDENT_VOICES.find((v) => v.id === savedVoiceId);
        if (found) {
          setSelectedVoice(found);
        }
      } catch {
        // Fallback default
      }
    };
    loadVoice();
  }, []);

  // Keep audio sources in sync when lesson loads
  useEffect(() => {
    if (lesson?.audioUrl) {
      setTtsAudioUrl(lesson.audioUrl);
    }
    if (lesson?.voiceNoteUrl) {
      setTeacherAudioUrl(lesson.voiceNoteUrl);
    }
  }, [lesson?.audioUrl, lesson?.voiceNoteUrl]);

  // Keep player sources synchronized without redundant replace calls
  useEffect(() => {
    if (ttsAudioUrl && ttsPlayer) {
      try {
        ttsPlayer.replace({ uri: ttsAudioUrl });
      } catch (err) {
        console.warn('TTS player replace error:', err);
      }
    }
  }, [ttsAudioUrl]);

  useEffect(() => {
    if (teacherAudioUrl && teacherPlayer) {
      try {
        teacherPlayer.replace({ uri: teacherAudioUrl });
      } catch (err) {
        console.warn('Teacher player replace error:', err);
      }
    }
  }, [teacherAudioUrl]);

  // Fetch current lesson and sibling lessons for topic
  useEffect(() => {
    let isMounted = true;

    // Reset previous lesson state when switching to a different lesson/topic
    setLesson(null);
    setTtsAudioUrl('');
    setTeacherAudioUrl('');
    setTopicLessons([]);
    setLessonQuizzes([]);

    const fetchLessonData = async () => {
      try {
        setIsLoadingLesson(true);
        let currentLessonData: MobileLesson | null = null;

        // 1. If params.id is given, load that specific lesson
        if (params.id) {
          try {
            currentLessonData = await lessonService.getLessonById(params.id);
          } catch (err) {
            console.warn('Error fetching lesson by ID:', err);
          }
        }

        // 2. Fetch all sibling lessons for the topic
        let siblings: MobileLesson[] = [];
        if (params.topicId) {
          try {
            const fetchedSiblings = await lessonService.getLessonsByTopic(params.topicId);
            if (Array.isArray(fetchedSiblings)) {
              siblings = fetchedSiblings;
            }
          } catch (e) {
            console.warn('Error fetching topic siblings:', e);
          }
        }

        // 3. Fallback: If no lesson was loaded by params.id (or params.id wasn't provided), pick the first lesson of this topic
        if (!currentLessonData && siblings.length > 0) {
          currentLessonData = siblings[0];
        }

        if (isMounted) {
          if (currentLessonData) {
            setLesson(currentLessonData);
            if (currentLessonData.audioUrl) {
              setTtsAudioUrl(currentLessonData.audioUrl);
            }
            if (currentLessonData.voiceNoteUrl) {
              setTeacherAudioUrl(currentLessonData.voiceNoteUrl);
            }
          }
          if (siblings.length > 0) {
            setTopicLessons(siblings);
          }
        }

        // 4. Fetch lesson quizzes
        try {
          const effectiveLessonId = currentLessonData?._id || params.id;
          let found: MobileQuiz[] = [];
          if (effectiveLessonId) {
            found = await quizService.getQuizzesByLesson(effectiveLessonId);
          }
          if ((!found || found.length === 0) && params.topicId) {
            found = await quizService.getQuizzesByTopic(params.topicId);
          }
          if (isMounted) {
            setLessonQuizzes(Array.isArray(found) ? found : []);
          }
        } catch (e) {
          console.warn('Error fetching lesson quizzes:', e);
        }
      } finally {
        if (isMounted) setIsLoadingLesson(false);
      }
    };

    fetchLessonData();

    return () => {
      isMounted = false;
    };
  }, [params.id, params.topicId]);

  // Enforce subscription access barrier
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { subscriptionService } = await import('@/services/subscription.service');
        const access = await subscriptionService.checkAccess(params.topicId, params.id, selectedClass);
        if (!access.canAccess) {
          router.replace('/premium-access');
        }
      } catch {
        // allow offline fallback
      }
    };
    checkAccess();
  }, [params.topicId, params.id, selectedClass]);

  // TTS Narrator player states
  const isTtsPlaying = ttsStatus.playing;
  const isTtsBuffering = ttsStatus.isBuffering;
  const ttsCurrentSec = ttsStatus.currentTime || 0;
  const ttsDurationSec = ttsStatus.duration || (lesson?.audioDuration || 0);

  // Teacher's Explanation player states
  const isTeacherPlaying = teacherStatus.playing;
  const isTeacherBuffering = teacherStatus.isBuffering;
  const teacherCurrentSec = teacherStatus.currentTime || 0;
  const teacherDurationSec = teacherStatus.duration || (lesson?.voiceNoteDuration || 0);

  const handleTtsPlayPause = async (forceVoice?: VoiceOption) => {
    try {
      // Pause teacher player if currently active
      if (teacherPlayer?.playing) {
        teacherPlayer.pause();
      }

      if (ttsPlayer.playing && !forceVoice) {
        ttsPlayer.pause();
        return;
      }

      const voiceToUse = forceVoice || selectedVoice;

      // If active audio is already loaded and no new voice requested
      if (ttsAudioUrl && !forceVoice) {
        ttsPlayer.play();
        return;
      }

      // Synthesize on-the-fly using the student's selected voice
      if (lessonContent || lessonTitle) {
        setIsSynthesizing(true);
        // Clean markdown and HTML tags, preserve full content from beginning to end
        const cleanContent = lessonContent
          ? lessonContent
              .replace(/<[^>]+>/g, ' ')
              .replace(/```[\s\S]*?```/g, ' ')
              .replace(/[#*`_~>]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
          : '';
        const textToSpeak = `${lessonTitle}. ${cleanContent}`;
        const res = await lessonService.synthesizeSpeech(textToSpeak, voiceToUse.id);
        if (res && res.audioUrl) {
          setTtsAudioUrl(res.audioUrl);
          if (ttsPlayer) {
            try {
              ttsPlayer.replace({ uri: res.audioUrl });
              ttsPlayer.play();
            } catch (pErr) {
              console.warn('Native player play error:', pErr);
            }
          }
          return;
        }
      }

      Alert.alert('Audio Notice', 'No lesson text is available to synthesize.');
    } catch (err: any) {
      console.error('TTS playback/synthesis error:', err);
      const detail = err?.message || 'Could not stream audio narration at the moment.';
      Alert.alert('Audio Notice', `${detail} Please verify your connection.`);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleSelectVoice = async (voice: VoiceOption) => {
    setSelectedVoice(voice);
    setShowVoiceModal(false);
    await storageService.setPreferredVoice(voice.id);
    handleTtsPlayPause(voice);
  };

  const handleTtsSkip = (deltaSeconds: number) => {
    if (!ttsPlayer) return;
    try {
      const targetSec = Math.max(0, Math.min(ttsCurrentSec + deltaSeconds, ttsDurationSec || 9999));
      ttsPlayer.seekTo(targetSec);
    } catch (e) {
      console.warn('Error skipping TTS audio:', e);
    }
  };

  const toggleTtsSpeed = () => {
    const speeds = [1.0, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(ttsSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setTtsSpeed(newSpeed);

    if (ttsPlayer) {
      try {
        if (typeof (ttsPlayer as any).setPlaybackRate === 'function') {
          (ttsPlayer as any).setPlaybackRate(newSpeed);
        }
      } catch (e) {
        console.warn('Error setting TTS playback speed:', e);
      }
    }
  };

  // Teacher Player Handlers
  const handleTeacherPlayPause = async () => {
    try {
      // Pause TTS player if active
      if (ttsPlayer?.playing) {
        ttsPlayer.pause();
      }

      if (teacherPlayer.playing) {
        teacherPlayer.pause();
        return;
      }

      if (teacherAudioUrl) {
        teacherPlayer.play();
        return;
      }

      Alert.alert("Teacher's Explanation", 'No recorded teacher explanation has been uploaded for this lesson yet.');
    } catch (err: any) {
      console.error('Teacher audio playback error:', err);
      Alert.alert("Teacher's Explanation", 'Could not play teacher audio at the moment.');
    }
  };

  const handleTeacherSkip = (deltaSeconds: number) => {
    if (!teacherPlayer) return;
    try {
      const targetSec = Math.max(0, Math.min(teacherCurrentSec + deltaSeconds, teacherDurationSec || 9999));
      teacherPlayer.seekTo(targetSec);
    } catch (e) {
      console.warn('Error skipping teacher audio:', e);
    }
  };

  const toggleTeacherSpeed = () => {
    const speeds = [1.0, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(teacherSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setTeacherSpeed(newSpeed);

    if (teacherPlayer) {
      try {
        if (typeof (teacherPlayer as any).setPlaybackRate === 'function') {
          (teacherPlayer as any).setPlaybackRate(newSpeed);
        }
      } catch (e) {
        console.warn('Error setting teacher playback speed:', e);
      }
    }
  };

  const formatTime = (secs: number) => {
    const totalSeconds = Math.floor(secs);
    const mins = Math.floor(totalSeconds / 60);
    const remainingSecs = totalSeconds % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const ttsProgressPercent = ttsDurationSec > 0 ? (ttsCurrentSec / ttsDurationSec) * 100 : 0;
  const teacherProgressPercent = teacherDurationSec > 0 ? (teacherCurrentSec / teacherDurationSec) * 100 : 0;

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

        {/* Lesson Top Details Section with Border Line */}
        <View style={[styles.topDetailsSection, { borderBottomColor: colors.border }]}>
          {/* Breadcrumb / Category Tag */}
          <View style={[styles.tagContainer, { backgroundColor: '#E6F7F5' }]}>
            <Text style={[styles.tagText, { color: colors.primary }]}>{subjectName}</Text>
          </View>

          {/* Lesson Title */}
          <Text style={[styles.title, { color: colors.text }]}>{lessonTitle}</Text>

          {/* AI Read Aloud Bar with Voice Selection */}
          <View style={[styles.aiReadAloudCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}
              onPress={() => handleTtsPlayPause()}
              disabled={isSynthesizing}
              activeOpacity={0.8}
            >
              <View style={[styles.aiMicCircle, { backgroundColor: '#E6F7F5' }]}>
                {isSynthesizing ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name={isTtsPlaying ? 'volume-high' : 'mic-outline'} size={20} color={colors.primary} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.aiReadAloudTitle, { color: colors.text }]}>AI Narrator (TTS)</Text>
                  {isTtsPlaying && (
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />
                  )}
                </View>
                <Text style={[styles.aiReadAloudSubtitle, { color: colors.textSecondary }]}>
                  {isSynthesizing
                    ? 'Generating voice narration...'
                    : isTtsPlaying
                    ? `Narrating in ${selectedVoice.label}...`
                    : `Tap to play narration • Voice: ${selectedVoice.label}`}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Voice Accent Switcher Button */}
            <TouchableOpacity
              style={[styles.voiceSwitchBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
              onPress={() => setShowVoiceModal(true)}
              activeOpacity={0.75}
            >
              <Text style={{ fontSize: 13 }}>{selectedVoice.flag}</Text>
              <Text style={[styles.voiceSwitchBtnText, { color: colors.primary }]}>{selectedVoice.name}</Text>
              <Ionicons name="chevron-down" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Lesson Progress Counter & Bar (e.g. "Lesson 1 of 3   33% Complete") */}
          <View style={styles.lessonProgressHeader}>
            <Text style={[styles.lessonProgressCount, { color: colors.textSecondary }]}>
              Lesson {currentIdx + 1} of {totalTopicLessons}
            </Text>
            <Text style={[styles.lessonProgressPercent, { color: colors.primary }]}>
              {Math.round(calculatedProgressPercent)}% Complete
            </Text>
          </View>
          <View style={[styles.lessonProgressBarBg, { backgroundColor: colors.surfaceAlt, marginBottom: 0 }]}>
            <View
              style={[
                styles.lessonProgressBarFill,
                { width: `${Math.max(8, Math.min(100, calculatedProgressPercent))}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
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

        {/* Lesson Outlines / Agenda if available */}
        {Array.isArray(lesson?.outlines) && lesson.outlines.filter((o) => typeof o === 'string' && o.trim().length > 0).length > 0 && (
          <View style={[styles.metaBlockCard, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: -8 }]}>
            <View style={styles.metaBlockHeader}>
              <Ionicons name="list-outline" size={18} color="#0D6D62" />
              <Text style={[styles.metaBlockTitle, { color: colors.text }]}>Lesson Outline & Flow</Text>
            </View>
            {lesson.outlines
              .filter((outl) => typeof outl === 'string' && outl.trim().length > 0)
              .map((outl, i) => (
                <View key={i} style={styles.metaRow}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#E6F7F5', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.metaText, { color: colors.textSecondary, flex: 1 }]}>{outl}</Text>
                </View>
              ))}
          </View>
        )}

        {/* Lesson Content Body with Border Line */}
        {lessonContent ? (
          <View
            style={[
              styles.naturalContentWrapper,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <MathView
              content={lessonContent}
              fontSize={15}
              color={colors.text}
              style={{ minHeight: 60 }}
            />
          </View>
        ) : !isLoadingLesson ? null : null}

        {/* 1. AI Narrator TTS Audio Media Card */}
        <View style={[styles.teacherPlayerCard, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="volume-high" size={18} color={colors.primary} />
              <Text style={[styles.teacherPlayerTitle, { color: colors.text, marginBottom: 0 }]}>
                AI Narrator Audio
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.voiceSwitchBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
              onPress={() => setShowVoiceModal(true)}
              activeOpacity={0.75}
            >
              <Text style={{ fontSize: 13 }}>{selectedVoice.flag}</Text>
              <Text style={[styles.voiceSwitchBtnText, { color: colors.primary }]}>{selectedVoice.name}</Text>
              <Ionicons name="chevron-down" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* TTS Player Main Controls Row */}
          <View style={styles.teacherControlsRow}>
            {/* Speed Toggle */}
            <TouchableOpacity
              style={styles.teacherSideIconBtn}
              onPress={toggleTtsSpeed}
              activeOpacity={0.7}
            >
              <Ionicons name="speedometer-outline" size={22} color={colors.primary} />
              <Text style={{ fontSize: 9, fontWeight: '700', color: colors.primary, marginTop: 1 }}>
                {ttsSpeed}x
              </Text>
            </TouchableOpacity>

            {/* TTS Main Play / Pause Circle */}
            <TouchableOpacity
              style={[styles.teacherPlayBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
              onPress={() => handleTtsPlayPause()}
              disabled={isTtsBuffering || isSynthesizing}
              activeOpacity={0.85}
            >
              {isTtsBuffering || isSynthesizing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons
                  name={isTtsPlaying ? 'pause' : 'play'}
                  size={26}
                  color="#FFFFFF"
                  style={{ marginLeft: isTtsPlaying ? 0 : 2 }}
                />
              )}
            </TouchableOpacity>

            {/* Skip 15s forward */}
            <TouchableOpacity
              style={styles.teacherSideIconBtn}
              onPress={() => handleTtsSkip(15)}
              activeOpacity={0.7}
            >
              <Ionicons name="play-forward" size={22} color={colors.primary} />
              <Text style={{ fontSize: 9, fontWeight: '700', color: colors.primary, marginTop: 1 }}>
                +15s
              </Text>
            </TouchableOpacity>
          </View>

          {/* TTS Audio Scrubber Bar */}
          <TouchableOpacity
            style={styles.teacherScrubberTrack}
            activeOpacity={0.8}
            onPress={(e) => {
              const { locationX } = e.nativeEvent;
              if (ttsDurationSec > 0 && ttsPlayer) {
                const ratio = Math.max(0, Math.min(1, locationX / 280));
                handleTtsSkip((ratio * ttsDurationSec) - ttsCurrentSec);
              }
            }}
          >
            <View style={[styles.teacherScrubberBg, { backgroundColor: colors.surfaceAlt }]}>
              <View
                style={[
                  styles.teacherScrubberFill,
                  { width: `${Math.min(100, Math.max(0, ttsProgressPercent))}%`, backgroundColor: colors.primary },
                ]}
              />
            </View>
          </TouchableOpacity>

          {/* Audio Timers Row */}
          <View style={styles.teacherTimeRow}>
            <Text style={[styles.teacherTimeText, { color: colors.textSecondary }]}>
              {formatTime(ttsCurrentSec)}
            </Text>
            <Text style={[styles.teacherTimeText, { color: colors.textSecondary }]}>
              {ttsDurationSec > 0 ? formatTime(ttsDurationSec) : (lesson?.duration || '10:00')}
            </Text>
          </View>
        </View>

        {/* 2. Teacher's Explanation Audio Media Player (Separate Card Below TTS) */}
        <View style={[styles.teacherPlayerCard, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 20 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Ionicons name="mic-outline" size={18} color="#D97706" />
            <Text style={[styles.teacherPlayerTitle, { color: colors.text, marginBottom: 0 }]}>
              Teacher's Explanation
            </Text>
          </View>

          {/* Teacher Player Main Controls Row */}
          <View style={styles.teacherControlsRow}>
            {/* Speed Toggle */}
            <TouchableOpacity
              style={styles.teacherSideIconBtn}
              onPress={toggleTeacherSpeed}
              activeOpacity={0.7}
            >
              <Ionicons name="speedometer-outline" size={22} color="#D97706" />
              <Text style={{ fontSize: 9, fontWeight: '700', color: '#D97706', marginTop: 1 }}>
                {teacherSpeed}x
              </Text>
            </TouchableOpacity>

            {/* Teacher Main Play / Pause Circle */}
            <TouchableOpacity
              style={[styles.teacherPlayBtn, { backgroundColor: '#D97706', shadowColor: '#D97706' }]}
              onPress={handleTeacherPlayPause}
              disabled={isTeacherBuffering}
              activeOpacity={0.85}
            >
              {isTeacherBuffering ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons
                  name={isTeacherPlaying ? 'pause' : 'play'}
                  size={26}
                  color="#FFFFFF"
                  style={{ marginLeft: isTeacherPlaying ? 0 : 2 }}
                />
              )}
            </TouchableOpacity>

            {/* Skip 15s forward */}
            <TouchableOpacity
              style={styles.teacherSideIconBtn}
              onPress={() => handleTeacherSkip(15)}
              activeOpacity={0.7}
            >
              <Ionicons name="play-forward" size={22} color="#D97706" />
              <Text style={{ fontSize: 9, fontWeight: '700', color: '#D97706', marginTop: 1 }}>
                +15s
              </Text>
            </TouchableOpacity>
          </View>

          {/* Teacher Interactive Audio Scrubber Bar */}
          <TouchableOpacity
            style={styles.teacherScrubberTrack}
            activeOpacity={0.8}
            onPress={(e) => {
              const { locationX } = e.nativeEvent;
              if (teacherDurationSec > 0 && teacherPlayer) {
                const ratio = Math.max(0, Math.min(1, locationX / 280));
                handleTeacherSkip((ratio * teacherDurationSec) - teacherCurrentSec);
              }
            }}
          >
            <View style={[styles.teacherScrubberBg, { backgroundColor: colors.surfaceAlt }]}>
              <View
                style={[
                  styles.teacherScrubberFill,
                  { width: `${Math.min(100, Math.max(0, teacherProgressPercent))}%`, backgroundColor: '#D97706' },
                ]}
              />
            </View>
          </TouchableOpacity>

          {/* Audio Timers Row */}
          <View style={styles.teacherTimeRow}>
            <Text style={[styles.teacherTimeText, { color: colors.textSecondary }]}>
              {formatTime(teacherCurrentSec)}
            </Text>
            <Text style={[styles.teacherTimeText, { color: colors.textSecondary }]}>
              {teacherDurationSec > 0 ? formatTime(teacherDurationSec) : (lesson?.duration || '8:15')}
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

        {/* Practice Exercises & Quizzes Section */}
        <View style={[styles.cleanContentCard, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 20 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
              <Ionicons name="help-circle-outline" size={18} color={colors.primary} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, flexShrink: 1 }}>
                Practice Exercises & Quizzes
              </Text>
            </View>
            <View
              style={{
                backgroundColor: colors.primaryMint,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
                alignSelf: 'flex-start',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: colors.primary,
                  includeFontPadding: false,
                }}
              >
                {Math.max(
                  lessonQuizzes.length,
                  Array.isArray(lesson?.exercises) ? lesson.exercises.length : 0,
                  1
                )}{' '}
                {Math.max(
                  lessonQuizzes.length,
                  Array.isArray(lesson?.exercises) ? lesson.exercises.length : 0,
                  1
                ) > 1
                  ? 'Quiz Exercises'
                  : 'Quiz Exercise'}
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 13, lineHeight: 19, color: colors.textSecondary, marginBottom: 14 }}>
            Please complete the quiz exercise for this lesson to test your understanding before advancing to the next lesson.
          </Text>

          <View style={{ gap: 8 }}>
            {(lessonQuizzes.length > 0
              ? lessonQuizzes
              : Array.isArray(lesson?.exercises) && lesson.exercises.length > 0
              ? lesson.exercises
              : [
                  {
                    _id: undefined,
                    title: `${lessonTitle} Quiz Exercise`,
                    questions: [],
                  },
                ]
            ).map((ex: any, idx: number) => {
              const exId = typeof ex === 'object' ? ex?._id : ex;
              const exTitle = (typeof ex === 'object' && ex?.title) || `${lessonTitle} Quiz Exercise`;
              const qCount = (typeof ex === 'object' && ex?.questions?.length) || 0;

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
                        lessonId: params.id || lesson?._id,
                        quizId: typeof exId === 'string' ? exId : undefined,
                        title: exTitle,
                        subjectName,
                        nextLessonId: nextLesson?._id || '',
                        nextLessonTitle: nextLesson?.title || '',
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
                      {qCount > 0 ? `${qCount} Questions (Q1 – Q${qCount}) • ` : ''}Lesson Quiz Exercise
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
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>Take Quiz</Text>
                    <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Previous Lesson / Take Quiz Navigation Buttons */}
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
              { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => {
              const firstQuizId =
                lessonQuizzes[0]?._id ||
                (Array.isArray(lesson?.exercises) && lesson.exercises[0]
                  ? typeof lesson.exercises[0] === 'object'
                    ? (lesson.exercises[0] as any)._id
                    : lesson.exercises[0]
                  : undefined);
              router.push({
                pathname: '/quiz',
                params: {
                  topicId: params.topicId,
                  lessonId: params.id || lesson?._id,
                  quizId: typeof firstQuizId === 'string' ? firstQuizId : undefined,
                  title: lessonQuizzes[0]?.title || `${lessonTitle} Quiz Exercise`,
                  subjectName,
                  nextLessonId: nextLesson?._id || '',
                  nextLessonTitle: nextLesson?.title || '',
                },
              });
            }}
          >
            <Text style={[styles.navBtnText, { color: '#FFFFFF', fontWeight: '700' }]}>
              Take Quiz
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Voice Selection Modal */}
      <Modal
        visible={showVoiceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVoiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowVoiceModal(false)}
          />
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Preferred Voice</Text>
                <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                  Select your preferred voice for lesson audio narration
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowVoiceModal(false)}
                style={[styles.modalCloseBtn, { backgroundColor: colors.surfaceAlt }]}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {STUDENT_VOICES.map((v) => {
                const isSelected = v.id === selectedVoice.id;
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[
                      styles.voiceItemCard,
                      {
                        backgroundColor: isSelected ? colors.cardHighlightBg : colors.surfaceAlt,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleSelectVoice(v)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 24, marginRight: 12 }}>{v.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.voiceItemName, { color: colors.text }]}>{v.label}</Text>
                      <Text style={[styles.voiceItemSub, { color: colors.textSecondary }]}>
                        {v.accent} • {v.gender === 'FEMALE' ? 'Female' : 'Male'} Voice
                      </Text>
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    ) : (
                      <View style={[styles.radioCircle, { borderColor: colors.border }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  voiceSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  voiceSwitchBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    maxHeight: '80%',
    zIndex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  modalSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  voiceItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  voiceItemName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  voiceItemSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
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
  topDetailsSection: {
    borderBottomWidth: 1,
    paddingBottom: 18,
    marginBottom: 20,
  },
  naturalContentWrapper: {
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderRadius: 16,
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
