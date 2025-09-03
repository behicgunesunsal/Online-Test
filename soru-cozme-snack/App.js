import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';

const INITIAL_QUESTIONS = [
  // Deneme sınavı örnekleri (aynı sınav içinde farklı bölümler)
  {
    id: 'e1_q1',
    kind: 'exam',
    examId: 'deneme-1',
    examTitle: 'Deneme 1',
    section: 'Matematik',
    text: '3 × 4 = ?',
    choices: ['6', '7', '12', '14'],
    correctIndex: 2,
    explanation: '3 çarpı 4 = 12',
  },
  {
    id: 'e1_q2',
    kind: 'exam',
    examId: 'deneme-1',
    examTitle: 'Deneme 1',
    section: 'Fizik',
    text: 'Işık hızı yaklaşık olarak kaçtır?',
    choices: ['3×10^8 m/s', '3×10^6 m/s', '3×10^5 km/s', '3000 km/s'],
    correctIndex: 0,
    explanation: 'Yaklaşık 3×10^8 m/s',
  },
  {
    id: 'e1_q3',
    kind: 'exam',
    examId: 'deneme-1',
    examTitle: 'Deneme 1',
    section: 'Kimya',
    text: 'Su molekülünün kimyasal formülü nedir?',
    choices: ['H2', 'O2', 'CO2', 'H2O'],
    correctIndex: 3,
    explanation: 'Su, H2O’dur.',
  },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function App() {
  // Auth state
  const [user, setUser] = useState(null); // { role: 'admin'|'user', email, provider? }
  const [authTab, setAuthTab] = useState('user'); // 'user' | 'admin'
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Master questions repository
  const [questions, setQuestions] = useState(INITIAL_QUESTIONS);
  const exams = useMemo(() => {
    const map = new Map();
    questions.forEach((q) => {
      if (q.examId) {
        const curr = map.get(q.examId) || { examId: q.examId, title: q.examTitle || q.examId, count: 0, sections: new Set() };
        curr.count += 1;
        if (q.section) curr.sections.add(q.section);
        map.set(q.examId, curr);
      }
    });
    return Array.from(map.values()).map(e => ({ ...e, sections: Array.from(e.sections) }));
  }, [questions]);

  // Active quiz session
  const [selectedCategory, setSelectedCategory] = useState(null); // legacy
  const [selectedTopic, setSelectedTopic] = useState(null); // legacy
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [selectedExamSection, setSelectedExamSection] = useState(null);
  const [playQuestions, setPlayQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  // Tabs after login
  const [tab, setTab] = useState('quiz'); // 'quiz' | 'admin' | 'stats'

  // Admin form state (only exam mode)
  const [formText, setFormText] = useState('');
  const [formChoices, setFormChoices] = useState(['', '', '', '']);
  const [formCorrect, setFormCorrect] = useState(0);
  const [formExplanation, setFormExplanation] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');

  // Stats (in-memory)
  const [stats, setStats] = useState({});
  const currentUserKey = user ? (user.email || user.provider) : null;

  const hasQuestions = playQuestions.length > 0;
  const q = hasQuestions ? playQuestions[index] : null;
  const progress = hasQuestions ? (index / playQuestions.length) * 100 : 0;

  // Auth handlers
  const handleAdminLogin = () => {
    if (adminEmail.trim().toLowerCase() === 'adeviye@gmail.com' && adminPassword === '123456789') {
      setUser({ role: 'admin', email: 'adeviye@gmail.com' });
      setTab('admin');
    } else {
      alert('Admin bilgileri hatalı');
    }
  };

  const mockSocialSignIn = (provider) => {
    const fake = provider === 'apple'
      ? { role: 'user', provider: 'apple', email: 'apple_user@example.com' }
      : { role: 'user', provider: 'google', email: 'google_user@example.com' };
    setUser(fake);
    setTab('quiz');
  };

  const logout = () => {
    setUser(null);
    setSelectedCategory(null);
    setSelectedTopic(null);
    setSelectedExamId(null);
    setSelectedExamSection(null);
    setPlayQuestions([]);
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  // Topic selection → start quiz
  // Topic flow removed (only exams remain)

  const startExam = (examId) => {
    // First choose section screen
    setSelectedExamId(examId);
    setSelectedExamSection(null);
    setPlayQuestions([]);
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  const runExam = (examId, section = null) => {
    const filteredAll = questions.filter((qq) => qq.examId === examId);
    const filtered = section ? filteredAll.filter((qq) => qq.section === section) : filteredAll;
    setSelectedExamId(examId);
    setSelectedExamSection(section);
    setPlayQuestions(shuffle(filtered));
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
    setTab('quiz');
  };

  // Quiz handlers
  const updateStatsOnAnswer = (correct) => {
    if (!currentUserKey) return;
    setStats((prev) => {
      const s = prev[currentUserKey] || { total: 0, correct: 0, byTopic: {} };
      const topicKey = q?.examTitle ? `Deneme/${q.examTitle}/${q.section || 'Genel'}` : 'Genel';
      const t = s.byTopic[topicKey] || { total: 0, correct: 0 };
      const ns = {
        ...s,
        total: s.total + 1,
        correct: s.correct + (correct ? 1 : 0),
        byTopic: {
          ...s.byTopic,
          [topicKey]: {
            total: t.total + 1,
            correct: t.correct + (correct ? 1 : 0),
          },
        },
      };
      return { ...prev, [currentUserKey]: ns };
    });
  };

  const handleSelect = (i) => {
    if (selected !== null) return;
    setSelected(i);
    const isCorrect = i === q.correctIndex;
    if (isCorrect) setScore((s) => s + 1);
    updateStatsOnAnswer(isCorrect);
  };

  const handleNext = () => {
    if (index + 1 >= playQuestions.length) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  };

  const handleRestart = () => {
    if (selectedExamId) {
      const filtered = questions
        .filter((qq) => qq.examId === selectedExamId)
        .filter((qq) => (selectedExamSection ? qq.section === selectedExamSection : true));
      setPlayQuestions(shuffle(filtered));
    } else {
      setPlayQuestions([]);
    }
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  const handleDeleteQuestion = (qid) => {
    setQuestions((prev) => prev.filter((it) => it.id !== qid));
    setPlayQuestions((prev) => {
      const next = prev.filter((it) => it.id !== qid);
      if (index >= next.length) {
        setIndex(0);
        setSelected(null);
        setFinished(false);
      }
      return next;
    });
  };

  const [formExamId, setFormExamId] = useState('');
  const [formExamTitle, setFormExamTitle] = useState('');
  const [formSection, setFormSection] = useState('');

  const validateForm = () => {
    if (!formText.trim()) return 'Soru metni gerekli';
    const cleanChoices = formChoices.map((c) => c.trim());
    if (cleanChoices.some((c) => !c)) return 'Tüm şıkları doldurun';
    if (formCorrect < 0 || formCorrect >= cleanChoices.length) return 'Doğru şık indeksi hatalı';
    if (formImageUrl && !/^https?:\/\//i.test(formImageUrl.trim())) return 'Görsel URL http(s) olmalı';
    if (!formExamId.trim()) return 'Deneme ID gerekli';
    if (!formExamTitle.trim()) return 'Deneme başlığı gerekli';
    if (!formSection.trim()) return 'Bölüm (ör. Matematik) gerekli';
    return null;
  };

  const handleAddQuestion = () => {
    const err = validateForm();
    if (err) {
      alert(err);
      return;
    }
    const base = {
      id: `q_${Date.now()}`,
      text: formText.trim(),
      choices: formChoices.map((c) => c.trim()),
      correctIndex: formCorrect,
      explanation: formExplanation.trim(),
      image: formImageUrl.trim() || undefined,
    };
    const newQ = { ...base, kind: 'exam', examId: formExamId.trim(), examTitle: formExamTitle.trim(), section: formSection.trim() };
    setQuestions((prev) => [...prev, newQ]);
    setFormText('');
    setFormChoices(['', '', '', '']);
    setFormCorrect(0);
    setFormExplanation('');
    setFormImageUrl('');
    setFormExamId('');
    setFormExamTitle('');
    setFormSection('');
    alert('Soru eklendi');
  };

  // AUTH SCREEN
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.appTitle}>Giriş</Text>
        <View style={[styles.modeSwitch, { alignSelf: 'flex-start', marginVertical: 8 }]}>
          <TouchableOpacity onPress={() => setAuthTab('user')} style={[styles.modeBtn, authTab === 'user' && styles.modeBtnActive]}>
            <Text style={authTab === 'user' ? styles.modeBtnTextActive : styles.modeBtnText}>Kullanıcı</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setAuthTab('admin')} style={[styles.modeBtn, authTab === 'admin' && styles.modeBtnActive]}>
            <Text style={authTab === 'admin' ? styles.modeBtnTextActive : styles.modeBtnText}>Admin</Text>
          </TouchableOpacity>
        </View>

        {authTab === 'user' ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Kayıt / Giriş</Text>
            <TouchableOpacity style={styles.socialBtn} onPress={() => mockSocialSignIn('google')}>
              <Text style={styles.socialBtnText}>Google ile devam et</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#000' }]} onPress={() => mockSocialSignIn('apple')}>
              <Text style={[styles.socialBtnText, { color: '#fff' }]}>Apple ile devam et</Text>
            </TouchableOpacity>
            <Text style={[styles.listSub, { marginTop: 8 }]}>Not: Snack prototipinde sosyal giriş simüle edilir.</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Admin Giriş</Text>
            <TextInput
              placeholder="E-posta (adeviye@gmail.com)"
              autoCapitalize="none"
              value={adminEmail}
              onChangeText={setAdminEmail}
              style={styles.input}
            />
            <TextInput
              placeholder="Şifre (123456789)"
              value={adminPassword}
              onChangeText={setAdminPassword}
              secureTextEntry
              style={[styles.input, { marginTop: 8 }]}
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleAdminLogin}>
              <Text style={styles.primaryBtnText}>Giriş Yap</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // USER: Unified selection screen (Ana Konular + Deneme Sınavları)
  if (user.role === 'user' && !selectedExamId && playQuestions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.appTitle}>Deneme Sınavları</Text>
          <TouchableOpacity onPress={logout}><Text style={styles.link}>Çıkış</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.card}>
            {exams.length === 0 ? (
              <Text style={styles.listSub}>Deneme yok. Admin eklemeli.</Text>
            ) : (
              exams.map((e) => (
                <TouchableOpacity key={e.examId} style={styles.examBtn} onPress={() => startExam(e.examId)}>
                  <Text style={styles.listTitle}>{e.title}</Text>
                  <Text style={styles.listSub}>{e.sections.join(', ')} • {e.count} soru</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Exam section selection
  if (user.role === 'user' && selectedExamId && playQuestions.length === 0) {
    const examMeta = exams.find((e) => e.examId === selectedExamId);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.appTitle}>{examMeta?.title || 'Deneme'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setSelectedExamId(null)}><Text style={styles.link}>Geri</Text></TouchableOpacity>
            <TouchableOpacity onPress={logout} style={{ marginLeft: 12 }}><Text style={styles.link}>Çıkış</Text></TouchableOpacity>
          </View>
        </View>
        <View style={styles.card}>
          <TouchableOpacity style={styles.topicBtn} onPress={() => runExam(selectedExamId, null)}>
            <Text style={styles.topicBtnText}>Tüm Bölümler</Text>
          </TouchableOpacity>
          {examMeta?.sections?.map((sec) => (
            <TouchableOpacity key={sec} style={styles.topicBtn} onPress={() => runExam(selectedExamId, sec)}>
              <Text style={styles.topicBtnText}>{sec}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // Top navigation after login
  const TopNav = (
    <View style={styles.topBar}>
      <Text style={styles.appTitle}>{tab === 'admin' ? 'Admin' : tab === 'stats' ? 'İstatistik' : 'Quiz'}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={styles.modeSwitch}>
          <TouchableOpacity onPress={() => setTab('quiz')} style={[styles.modeBtn, tab === 'quiz' && styles.modeBtnActive]}>
            <Text style={tab === 'quiz' ? styles.modeBtnTextActive : styles.modeBtnText}>Quiz</Text>
          </TouchableOpacity>
          {user.role === 'admin' && (
            <TouchableOpacity onPress={() => setTab('admin')} style={[styles.modeBtn, tab === 'admin' && styles.modeBtnActive]}>
              <Text style={tab === 'admin' ? styles.modeBtnTextActive : styles.modeBtnText}>Admin</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setTab('stats')} style={[styles.modeBtn, tab === 'stats' && styles.modeBtnActive]}>
            <Text style={tab === 'stats' ? styles.modeBtnTextActive : styles.modeBtnText}>İstatistik</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={logout} style={{ marginLeft: 12 }}>
          <Text style={styles.link}>Çıkış</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // QUIZ: finished screen
  if (tab === 'quiz' && finished) {
    return (
      <SafeAreaView style={styles.container}>
        {TopNav}
        <Text style={styles.title}>Tebrikler!</Text>
        <Text style={styles.subtitle}>
          Skor: {score} / {playQuestions.length}
        </Text>
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>
            Başarı oranı: {Math.round((score / playQuestions.length) * 100)}%
          </Text>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleRestart}>
          <Text style={styles.primaryBtnText}>Baştan Başla</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ADMIN panel
  if (tab === 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        {TopNav}
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Yeni Deneme Sorusu Ekle</Text>
            <Text style={styles.inputLabel}>Soru Metni</Text>
            <TextInput
              placeholder="Soru metni"
              value={formText}
              onChangeText={setFormText}
              style={styles.input}
              multiline
            />
            <Text style={styles.inputLabel}>Şıklar</Text>
            {formChoices.map((c, idx) => (
              <View key={idx} style={styles.choiceRow}>
                <TouchableOpacity
                  onPress={() => setFormCorrect(idx)}
                  style={[styles.radio, formCorrect === idx && styles.radioActive]}
                />
                <TextInput
                  placeholder={`Şık ${idx + 1}`}
                  value={c}
                  onChangeText={(t) =>
                    setFormChoices((prev) => prev.map((pc, i) => (i === idx ? t : pc)))
                  }
                  style={[styles.input, { flex: 1, marginLeft: 8 }]}
                />
                {formCorrect === idx && <Text style={styles.correctHint}>Doğru</Text>}
              </View>
            ))}

            <Text style={styles.inputLabel}>Açıklama (opsiyonel)</Text>
            <TextInput
              placeholder="Açıklama"
              value={formExplanation}
              onChangeText={setFormExplanation}
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Görsel URL (opsiyonel)</Text>
            <TextInput
              placeholder="https://…"
              value={formImageUrl}
              onChangeText={setFormImageUrl}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {!!formImageUrl && /^https?:\/\//i.test(formImageUrl) && (
              <Image source={{ uri: formImageUrl }} style={styles.previewImage} />
            )}

            <Text style={styles.inputLabel}>Deneme ID</Text>
            <TextInput
              placeholder="örn. deneme-1"
              value={formExamId}
              onChangeText={setFormExamId}
              style={styles.input}
              autoCapitalize="none"
            />
            <Text style={styles.inputLabel}>Deneme Başlığı</Text>
            <TextInput
              placeholder="örn. Deneme 1"
              value={formExamTitle}
              onChangeText={setFormExamTitle}
              style={styles.input}
            />
            <Text style={styles.inputLabel}>Bölüm</Text>
            <TextInput
              placeholder="örn. Matematik"
              value={formSection}
              onChangeText={setFormSection}
              style={styles.input}
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleAddQuestion}>
              <Text style={styles.primaryBtnText}>Soruyu Ekle</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { marginTop: 16 }]}>
            <Text style={styles.sectionTitle}>Mevcut Sorular ({questions.length})</Text>
            {questions.map((item, i) => (
              <View key={item.id} style={styles.listRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>
                    {i + 1}. {item.examId ? `[Deneme: ${item.examTitle}${item.section ? ' • ' + item.section : ''}]` : `[${item.topic}]`} {item.text}
                  </Text>
                  {item.image ? (
                    <Text style={styles.listSub}>[Görsel] {item.image}</Text>
                  ) : null}
                </View>
                <TouchableOpacity style={styles.dangerBtn} onPress={() => handleDeleteQuestion(item.id)}>
                  <Text style={styles.dangerBtnText}>Sil</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // STATS panel
  if (tab === 'stats') {
    const s = stats[currentUserKey] || { total: 0, correct: 0, byTopic: {} };
    const ratio = s.total ? Math.round((s.correct / s.total) * 100) : 0;
    return (
      <SafeAreaView style={styles.container}>
        {TopNav}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Genel İstatistik</Text>
          <Text style={styles.listTitle}>Kullanıcı: {user.email || user.provider}</Text>
          <Text style={styles.listSub}>Toplam Soru: {s.total}</Text>
          <Text style={styles.listSub}>Doğru Sayısı: {s.correct}</Text>
          <Text style={styles.listSub}>Başarı Oranı: %{ratio}</Text>
        </View>
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.sectionTitle}>Deneme/Bölüm Bazlı</Text>
          {Object.keys(s.byTopic).length === 0 ? (
            <Text style={styles.listSub}>Henüz veri yok.</Text>
          ) : (
            Object.entries(s.byTopic).map(([topic, t]) => {
              const pr = t.total ? Math.round((t.correct / t.total) * 100) : 0;
              return (
                <View key={topic} style={styles.listRow}>
                  <Text style={styles.listTitle}>{topic}</Text>
                  <Text style={styles.listSub}>{t.correct}/{t.total} (%{pr})</Text>
                </View>
              );
            })
          )}
        </View>
      </SafeAreaView>
    );
  }

  // QUIZ panel
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.appTitle}>Quiz</Text>
        <View style={styles.modeSwitch}>
          <TouchableOpacity onPress={() => setTab('quiz')} style={[styles.modeBtn, tab === 'quiz' && styles.modeBtnActive]}>
            <Text style={tab === 'quiz' ? styles.modeBtnTextActive : styles.modeBtnText}>Quiz</Text>
          </TouchableOpacity>
          {user.role === 'admin' && (
            <TouchableOpacity onPress={() => setTab('admin')} style={[styles.modeBtn, tab === 'admin' && styles.modeBtnActive]}>
              <Text style={tab === 'admin' ? styles.modeBtnTextActive : styles.modeBtnText}>Admin</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setTab('stats')} style={[styles.modeBtn, tab === 'stats' && styles.modeBtnActive]}>
            <Text style={tab === 'stats' ? styles.modeBtnTextActive : styles.modeBtnText}>İstatistik</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={logout} style={{ marginLeft: 12 }}>
          <Text style={styles.link}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      {hasQuestions ? (
        <>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {selectedExamId && q?.examTitle ? `${q.examTitle}${selectedExamSection ? ' • ' + selectedExamSection : q.section ? ' • ' + q.section : ''} • ` : ''}
            Soru {index + 1} / {playQuestions.length}
          </Text>
        </>
      ) : (
        <Text style={[styles.progressText, { marginBottom: 8 }]}>Henüz soru yok veya konu seçilmedi.</Text>
      )}

      <View style={styles.card}>
        {hasQuestions ? (
          <>
            <Text style={styles.question}>{q.text}</Text>
            {q.image ? (
              <Image source={{ uri: q.image }} style={styles.questionImage} />
            ) : null}
            <View style={{ marginTop: 12 }}>
              {q.choices.map((choice, i) => {
                const isSelected = selected === i;
                const isCorrect = i === q.correctIndex;
                const showState = selected !== null;

                let bg = '#fff';
                let border = '#E5E7EB';
                let color = '#111827';

                if (showState && isSelected && isCorrect) {
                  bg = '#DCFCE7';
                  border = '#22C55E';
                  color = '#065F46';
                } else if (showState && isSelected && !isCorrect) {
                  bg = '#FEE2E2';
                  border = '#EF4444';
                  color = '#7F1D1D';
                } else if (showState && !isSelected && isCorrect) {
                  border = '#22C55E';
                }

                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setSelected(null) || handleSelect(i)}
                    disabled={selected !== null}
                    style={[styles.choice, { backgroundColor: bg, borderColor: border }]}
                  >
                    <Text style={[styles.choiceText, { color }]}>{choice}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selected !== null && (
              <View style={styles.explainer}>
                <Text style={styles.explainerTitle}>
                  {selected === q.correctIndex ? 'Doğru!' : 'Yanlış!'}
                </Text>
                {!!q.explanation && (
                  <Text style={styles.explainerText}>{q.explanation}</Text>
                )}
              </View>
            )}
          </>
        ) : (
          <Text style={styles.question}>Soru çözmek için konu seçin (veya Admin’e soru ekleyin).</Text>
        )}
      </View>

      {hasQuestions && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.secondaryBtn, { opacity: selected === null ? 0.5 : 1 }]}
            onPress={handleNext}
            disabled={selected === null}
          >
            <Text style={styles.secondaryBtnText}>
              {index + 1 >= playQuestions.length ? 'Bitir' : 'Sonraki Soru'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  header: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  appTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  modeSwitch: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 10 },
  modeBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
  modeBtnActive: { backgroundColor: '#111827' },
  modeBtnText: { color: '#111827', fontWeight: '600' },
  modeBtnTextActive: { color: '#fff', fontWeight: '700' },
  link: { color: '#2563EB', fontWeight: '600' },
  progressBar: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#3B82F6' },
  progressText: { marginTop: 6, color: '#6B7280' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 18, color: '#374151', marginBottom: 16 },
  question: { fontSize: 18, fontWeight: '600', color: '#111827' },
  questionImage: { width: '100%', height: 180, resizeMode: 'cover', borderRadius: 10, marginTop: 12 },
  choice: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 10,
  },
  choiceText: { fontSize: 16 },
  explainer: {
    marginTop: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
  },
  explainerTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4, color: '#111827' },
  explainerText: { color: '#374151' },
  actions: { marginTop: 16, flexDirection: 'row', justifyContent: 'flex-end' },
  primaryBtn: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 12,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  secondaryBtnText: { color: '#fff', fontWeight: '700' },
  resultBox: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginVertical: 12,
  },
  resultText: { color: '#1F2937' },
  // Admin / Auth styles
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  inputLabel: { marginTop: 10, marginBottom: 6, color: '#374151', fontWeight: '600' },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    color: '#111827',
  },
  choiceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9CA3AF',
  },
  radioActive: { borderColor: '#10B981', backgroundColor: '#10B981' },
  correctHint: { marginLeft: 8, color: '#10B981', fontWeight: '700' },
  previewImage: { width: '100%', height: 140, borderRadius: 10, marginTop: 8 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listTitle: { color: '#111827', fontWeight: '600' },
  listSub: { color: '#6B7280', marginTop: 2 },
  dangerBtn: { backgroundColor: '#EF4444', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  dangerBtnText: { color: '#fff', fontWeight: '700' },
  socialBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  socialBtnText: { color: '#111827', fontWeight: '700' },
  topicBtn: { backgroundColor: '#111827', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, marginTop: 8 },
  topicBtnText: { color: '#fff', fontWeight: '700' },
});
