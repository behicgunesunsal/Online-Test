Soru Çözme (Quiz) — Snack Projesi

Bu klasör, snack.expo.dev üzerinde çalışacak basit bir quiz (soru çözme) uygulaması için örnek bir `App.js` içerir.

İçerik
- `App.js`: Uygulamanın tamamı (soru listesi, akış, puan).

Snack’te Çalıştırma
1) https://snack.expo.dev adresine gidin ve yeni bir Snack açın.
2) Sağdaki dosya listesinde `App.js` dosyasını oluşturun veya var olanı açın.
3) Bu klasördeki `soru-cozme-snack/App.js` içeriğini aynen kopyalayıp Snack’teki `App.js` içine yapıştırın.
4) iOS/Android/Web önizlemelerinde test edin.

Lokal (Expo) ile Çalıştırma (opsiyonel)
1) Node.js 18+ ve npm/yarn kurulu olsun.
2) Yeni bir Expo projesi oluşturun:
   - `npx create-expo-app@latest quiz-app`
   - `cd quiz-app`
3) Bu klasördeki `App.js` dosyasını, proje kökündeki `App.js` ile değiştirin.
4) Çalıştırın: `npx expo start`

Soruları Çoğaltma
- `App.js` içindeki `INITIAL_QUESTIONS` dizisine şu yapıda yeni öğeler ekleyin:
  - `id`: benzersiz string
  - `text`: soru metni
  - `choices`: şıklar dizisi (string[])
  - `correctIndex`: doğru şıkkın 0 tabanlı indeksi (number)
  - `explanation`: isteğe bağlı açıklama (string)

Örnek öğe:
```
{ id: 'q4', text: '…', choices: ['A','B','C','D'], correctIndex: 0, explanation: '…' }
```

Notlar
- Uygulama her yeniden başlatmada (Baştan Başla) soruları karıştırır.
- Ek özellik isterseniz (zamanlayıcı, kategori, puan tablosu) haber verin.

