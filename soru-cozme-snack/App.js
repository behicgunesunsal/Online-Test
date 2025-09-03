import React, { useState } from 'react';
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
  {
    id: 'q1',
    text: '2 + 2 = ?',
    choices: ['3', '4', '5', '22'],
    correctIndex: 1,
    explanation: '2 ile 2’nin toplamı 4 eder.',
  },
  {
    id: 'q2',
    text: 'Türkiye’nin başkenti hangisidir?',
    choices: ['İstanbul', 'Ankara', 'İzmir', 'Bursa'],
    correctIndex: 1,
    explanation: '1923’ten beri Ankara başkenttir.',
  },
  {
    id: 'q3',
    text: 'JavaScript’te dizinin uzunluğu hangi özellikle alınır?',
    choices: ['size', 'count', 'length', 'len'],
    correctIndex: 2,
    explanation: 'length özelliği kullanılır.',
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
  const [questions, setQuestions] = useState(() => shuffle(INITIAL_QUESTIONS));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [mode, setMode] = useState('quiz'); // 'quiz' | 'admin'

  // Admin form state
  const [formText, setFormText] = useState('');
  const [formChoices, setFormChoices] = useState(['', '', '', '']);
  const [formCorrect, setFormCorrect] = useState(0);
  const [formExplanation, setFormExplanation] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');

  const hasQuestions = questions.length > 0;
  const q = hasQuestions ? questions[index] : null;
  const progress = hasQuestions ? (index / questions.length) * 100 : 0;

  const handleSelect = (i) => {
    if (selected !== null) return; // yalnızca bir seçim
    setSelected(i);
    if (i === q.correctIndex) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  };

  const handleRestart = () => {
    setQuestions(shuffle(INITIAL_QUESTIONS));
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  const handleDeleteQuestion = (qid) => {
    setQuestions((prev) => {
      const next = prev.filter((it) => it.id !== qid);
      // index/finished durumunu güvenli hale getir
      if (index >= next.length) {
        setIndex(0);
        setSelected(null);
        setFinished(false);
      }
      return next;
    });
  };

  const validateForm = () => {
    if (!formText.trim()) return 'Soru metni gerekli';
    const cleanChoices = formChoices.map((c) => c.trim());
    if (cleanChoices.some((c) => !c)) return 'Tüm şıkları doldurun';
    if (formCorrect < 0 || formCorrect >= cleanChoices.length) return 'Doğru şık indeksi hatalı';
    if (formImageUrl && !/^https?:\/\//i.test(formImageUrl.trim())) return 'Görsel URL http(s) olmalı';
    return null;
  };

  const handleAddQuestion = () => {
    const err = validateForm();
    if (err) {
      alert(err);
      return;
    }
    const newQ = {
      id: `q_${Date.now()}`,
      text: formText.trim(),
      choices: formChoices.map((c) => c.trim()),
      correctIndex: formCorrect,
      explanation: formExplanation.trim(),
      image: formImageUrl.trim() || undefined,
    };
    setQuestions((prev) => [...prev, newQ]);
    // formu sıfırla
    setFormText('');
    setFormChoices(['', '', '', '']);
    setFormCorrect(0);
    setFormExplanation('');
    setFormImageUrl('');
    alert('Soru eklendi');
  };

  // QUIZ: Bitiş ekranı
  if (mode === 'quiz' && finished) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.appTitle}>Quiz</Text>
          <View style={styles.modeSwitch}>
            <TouchableOpacity onPress={() => setMode('quiz')} style={[styles.modeBtn, styles.modeBtnActive]}>
              <Text style={styles.modeBtnTextActive}>Quiz</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode('admin')} style={styles.modeBtn}>
              <Text style={styles.modeBtnText}>Admin</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.title}>Tebrikler!</Text>
        <Text style={styles.subtitle}>
          Skor: {score} / {questions.length}
        </Text>
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>
            Başarı oranı: {Math.round((score / questions.length) * 100)}%
          </Text>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleRestart}>
          <Text style={styles.primaryBtnText}>Baştan Başla</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ADMIN PANEL
  if (mode === 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.appTitle}>Admin</Text>
          <View style={styles.modeSwitch}>
            <TouchableOpacity onPress={() => setMode('quiz')} style={styles.modeBtn}>
              <Text style={styles.modeBtnText}>Quiz</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode('admin')} style={[styles.modeBtn, styles.modeBtnActive]}>
              <Text style={styles.modeBtnTextActive}>Admin</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Yeni Soru Ekle</Text>
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

            <TouchableOpacity style={styles.primaryBtn} onPress={handleAddQuestion}>
              <Text style={styles.primaryBtnText}>Soruyu Ekle</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { marginTop: 16 }]}>
            <Text style={styles.sectionTitle}>Mevcut Sorular ({questions.length})</Text>
            {questions.map((item, i) => (
              <View key={item.id} style={styles.listRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{i + 1}. {item.text}</Text>
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

  // QUIZ PANEL
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.appTitle}>Quiz</Text>
        <View style={styles.modeSwitch}>
          <TouchableOpacity onPress={() => setMode('quiz')} style={[styles.modeBtn, styles.modeBtnActive]}>
            <Text style={styles.modeBtnTextActive}>Quiz</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('admin')} style={styles.modeBtn}>
            <Text style={styles.modeBtnText}>Admin</Text>
          </TouchableOpacity>
        </View>
      </View>

      {hasQuestions ? (
        <>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Soru {index + 1} / {questions.length}
          </Text>
        </>
      ) : (
        <Text style={[styles.progressText, { marginBottom: 8 }]}>Henüz soru yok. Admin’den ekleyin.</Text>
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
                    onPress={() => handleSelect(i)}
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
          <Text style={styles.question}>Soru eklemek için Admin’e geçin.</Text>
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
              {index + 1 >= questions.length ? 'Bitir' : 'Sonraki Soru'}
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
  // Admin styles
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
});
