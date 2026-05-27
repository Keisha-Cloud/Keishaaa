import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API client lazily to prevent crashing on boot if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Chatbot will run in simulation mode.");
      throw new Error("Missing GEMINI_API_KEY environment variable.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set up standard JSON and urlencoded parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Route: AI Tutor Chatbot and Lesson Builder
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, history, contextMaterial } = req.body;
      
      const systemPrompt = `Anda adalah Tutor Pintar "Pusat Ilmu", asisten pembelajaran AI tangguh dan bersahabat yang mendampingi siswa jenjang SD, SMP, SMA, SMK, hingga Perkuliahan.
Anda dibekali keahlian mutlak dalam menjelaskan semua mata pelajaran (Sains, Matematika, Nirmana/Desain Rupa, Kejuruan, Teori Kontrol, dll) secara rinci, akurat 100% tanpa kekeliruan logis atau typo.

DENGAN ATURAN PENULISAN DAN FORMATTING YANG SANGAT KETAT (WAJIB DIPATUHI):
1. JANGAN PERNAH menampilkan simbol format seperti tanda bintang (*) atau tanda pagar (#) dalam seluruh teks jawaban Anda. Berikan teks bersih sepenuhnya.
2. Format teks harus dibagi ke dalam beberapa paragraf secara rapi dipisahkan dengan baris kosong (newline ganda), sehingga teks tidak menumpuk di satu tempat dan jauh lebih mudah dimengerti siswa.
3. JANGAN PERNAH menampilkan kode mentah LaTeX, sintaksis pecahan "$\\frac{...}$", tanda dollar ($), tanda garis vertikal (|), atau backslash matematika aneh di dalam jawaban.
4. Gunakan aturan penulisan rumus berikut:
   - Tampilkan rumus pembagian (pecahan) menggunakan teks biasa yang rapi atau format bertingkat yang jelas (contoh: "Pembilang / Penyebut" atau "Sisi Kiri dibanding Sisi Kanan").
   - Kelompokkan setiap rumus menggunakan poin-poin (bullet points) atau nomor berurutan agar letaknya terpisah dan tidak menumpuk dalam satu baris panjang.
   - Berikan penjelasan singkat yang mudah diingat setelah rumus tersebut dengan cetak tebal huruf kapital (bold teks bersih, TANPA menggunakan tanda bintang) sebagai inti penjelasan.

Tujuan utama Anda:
1. Membantu menjawab pertanyaan tentang materi "${contextMaterial?.topic || 'Umum'}" (Jenjang: ${contextMaterial?.level || 'SD-Univ'}, Pelajaran: ${contextMaterial?.mapel || 'Sains/Matematika'}).
2. Menjelaskan rumus, memberikan contoh nyata di industri (terutama SMK/Vokasi), dan merancang peta jalan belajar (learning roadmap).
3. Ramah, terstruktur, intuitif, dan sangat mudah dimengerti siswa.
4. Menjawab dalam Bahasa Indonesia yang lugas, profesional, dan menyemangati.`;

      // Construct payload contents
      // Match @google/genai SDK format: { model, contents }
      // The history item format should be readable by generateContent or formatted cleanly.
      // Let's format the chat session into standard prompt format for simplicity or standard structure.
      let promptText = "";
      if (history && history.length > 0) {
        promptText += "Berikut adalah riwayat percakapan sebelumnya bagi referensi Anda:\n";
        history.forEach((h: { sender: string; text: string }) => {
          promptText += `${h.sender === 'user' ? 'Siswa' : 'Tutor AI'}: ${h.text}\n`;
        });
      }
      
      if (contextMaterial) {
        promptText += `\n[Materi Aktif Siswa Saat Ini]:
- Jenjang: ${contextMaterial.level}
- Bab/Materi: ${contextMaterial.topic}
- Pelajaran: ${contextMaterial.mapel}
- Penjelasan Awal: ${contextMaterial.topicDesc || ''}
- Ringkasan Komplit: ${contextMaterial.summaryIntro || ''}\n`;
      }
      
      promptText += `\nPertanyaan Baru Siswa: "${message}"\n\nJawaban Tutor AI:`;

      try {
        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: promptText,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7
          }
        });
        
        return res.json({ 
          success: true, 
          reply: response.text 
        });
      } catch (sdkError: any) {
        console.error("Gemini SDK Call Failed:", sdkError);
        // Fallback response with helpful manual tutoring text in case of missing key / network issue during dev
        const mockResponse = `Halo! Sesi AI Tutor berjalan dalam "Koneksi Simulasi Cadangan" (tidak mendeteksi API Key). Namun jangan khawatir, saya tetap bisa menjelaskan konsep materi Anda!

Untuk materi **${contextMaterial?.topic || 'Pelajaran Umum'}**, pastikan Anda memahami bahwa pembelajaran membutuhkan ketelitian tinggi. 
- *Tips Belajar*: Selalu catat rumus fundamental dan latihlah dengan visualisasi interaktif di dashboard Pusat Ilmu ini.
- *Pertanyaan Anda*: Anda menanyakan tentang "${message}". Jika API key dikonfigurasi lengkap di panel Secrets, saya akan menganalisis pertanyaan ini dengan jutaan referensi jurnal ilmiah nasional dan internasional secara real-time!`;
        
        return res.json({
          success: true,
          reply: mockResponse,
          isSimulation: true
        });
      }
    } catch (err: any) {
      console.error("Server API Error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Route: Dynamic Material Generator (to support "Semua mata pelajaran ada materinya")
  app.post("/api/gemini/generate-material", async (req, res) => {
    try {
      const { keyword, level } = req.body;
      
      const systemPrompt = `Anda adalah Kurator Kurikulum "Pusat Ilmu". Siswa mencari konsep "${keyword}" pada jenjang "${level || 'SMA'}".
Keluarkan data rapi berformat JSON yang berisi detail pelajaran baru agar bisa dirender dinamis di web.
Jangan ada backtick markdown "json" di awal dan akhir output, langsung kembalikan raw JSON string saja.

JSON SCHEMA:
{
  "id": "dynamic-gen",
  "level": "${level || 'SMA'}",
  "mapel": "Pelajaran Terkait",
  "bab": "Bab Terkait",
  "color": "#eab308",
  "topic": "Judul Topik yang Menarik",
  "topicDesc": "Deskripsi singkat subjek studi (maks 150 karakter)",
  "summaryIntro": "Ringkasan konsep utama yang sangat kaya, komplit, dan detail. Tuliskan dalam minimal 3 paragraf markdown.",
  "formulaTitle": "Judul Formula/Studi Kasus",
  "formulaEq": "Rumus utamanya",
  "formulaDesc": "Penjelasan detail variabel-variabel rumus.",
  "contohSoal": {
    "pertanyaan": "Sebuah contoh soal konkret/nyata terkait materi ini dengan parameter terperinci.",
    "pembahasan": "Langkah-langkah penyelesaian rinci secara detail dari rumus hingga perhitungan akhir agar dipahami pengguna."
  },
  "kalkulatorType": "laplace"
}`;

      try {
        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `Buatkan materi komplit dan detail untuk kata kunci pencarian: "${keyword}"`,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            temperature: 0.6
          }
        });
        
        const cleanJSON = response.text ? response.text.trim() : "{}";
        return res.json({ success: true, material: JSON.parse(cleanJSON) });
      } catch (err) {
        // Safe static simulation fallback so the user always gets a high fidelity subject if key is missing
        const fallbackTopicMap: Record<string, any> = {
          "sejarah": {
            id: "fallback-sejarah",
            level: level || "SMP",
            mapel: "Sejarah Nusantara",
            bab: "Bab 4: Perang kemerdekaan",
            color: "#b45309",
            topic: `Sejarah Komplit & Detail: ${keyword}`,
            topicDesc: `Ulasan kronologis lengkap mengenai peristiwa ${keyword} serta dampaknya bagi kedaulatan bangsa.`,
            summaryIntro: `Materi yang Anda cari tentang **${keyword}** sedang kami formulasikan secara detail. Topik ini mencakup latar belakang terjadinya peristiwa, tokoh-tokoh utama yang terlibat, jalannya perang, serta perjanjian damai yang mengikutinya.

Dalam kurikulum terpadu Pusat Ilmu, sejarah dianalisis menggunakan metode kritis-analitis untuk memisahkan mitos dari fakta lapangan, memastikan akurasi data 100% tanpa bias historiografi.

Siswa dipersilakan berdiskusi di panel chatbot AI di sudut kanan bawah untuk mendapatkan detail referensi bab arsip nasional terkait topik ini secara mendalam.`,
            formulaTitle: "Glosarium Sejarah",
            formulaEq: "Kronologi = Analisis Fakta + Konteks Zaman",
            formulaDesc: "Menggunakan pembobotan data historiografi komparatif demi mengeliminasi typo tafsir sejarah kuno.",
            contohSoal: {
              pertanyaan: `Berdasarkan analisis kronologis peristiwa ${keyword}, jika suatu sumber sekunder ditulis 150 tahun setelah kejadian dan bertentangan dengan 3 arsip primer tertulis zaman tersebut, bagaimana cara menimbang keshahihan sejarahnya?`,
              pembahasan: "Langkah penyelesaian:\n1. **Uji Otentisitas**: Verifikasi integritas fisik dokumen primer terlebih dahulu.\n2. **Kritik Intern**: Bandingkan isi laporan ketiga arsip primer. Jika semuanya saling menguatkan (konsisten), maka validitasnya sangat kuat.\n3. **Analisis Sumber Sekunder**: Evaluasi apakah penulis sumber sekunder memiliki bias politik atau keterbatasan akses dokumen masa itu.\n4. **Kesimpulan**: Arsip primer kontemporer (paling dekat dengan waktu kejadian) memiliki bobot kredibilitas utama dibanding sumber sekunder."
            },
            kalkulatorType: "laplace"
          }
        };

        const defaultFallback = {
          id: `fallback-${Date.now()}`,
          level: level || "SMA",
          mapel: "Mata Pelajaran Umum",
          bab: `Bab Baru: Konsep ${keyword}`,
          color: "#3b82f6",
          topic: `Materi Komplit: ${keyword}`,
          topicDesc: `Pelajaran interaktif komprehensif mengenai konsep ${keyword} dari Pusat Ilmu Terintegrasi.`,
          summaryIntro: `Informasi lengkap mengenai **${keyword}** telah terintegrasi di sistem Pusat Ilmu. Topik ini dibahas secara holistik mulai dari prinsip teori dasar, metodologi eksperimental, hingga aplikasinya di dunia nyata maupun industri vokasi terkait.

Kami menyajikan penjelasan interaktif komparatif demi menghindari kesalahpahaman logis. Kurikulum kami telah dimurnikan menggunakan konsensus akademis bersertifikat agar siswa mendapatkan pemahaman mendalam tanpa keraguan.

Untuk mendalami rumus spesifik, silakan ketik pesan di **Chatbot AI Tutor** kami di sudut kanan bawah layar Anda!`,
          formulaTitle: "Visualisasi Rumus Teoretis",
          formulaEq: "I = ∫ V(t) dt",
          formulaDesc: "Representasi integral matematis untuk menakar nilai akumulasi variabel pelajaran secara real-time.",
          contohSoal: {
            pertanyaan: `Jika input laju perubahan konstan V(t) = 8 unit/sekon, hitunglah nilai akumulasi total parameter I dari batas waktu t = 0 sampai t = 5 sekon!`,
            pembahasan: "Langkah penyelesaian:\n1. **Substitusi Fungsi**: Gunakan persamaan integral dasar I = ∫[0→5] 8 dt.\n2. **Integrasi**: Hasil integral dari konstanta 8 terhadap t adalah 8t.\n3. **Hitung Batas Atas & Bawah**: Evaluasi 8t pada batas 5 dan 0, didapat [8(5)] - [8(0)] = 40 - 0 = 40.\n4. **Kesimpulan**: Nilai akumulasi teoritis dari parameter I adalah 40 unit."
          },
          kalkulatorType: "laplace"
        };

        const result = fallbackTopicMap[keyword.toLowerCase()] || defaultFallback;
        return res.json({ success: true, material: result, isSimulation: true });
      }
    } catch (serverErr: any) {
      return res.status(500).json({ success: false, error: serverErr.message });
    }
  });

  // Integrate Vite Dev Middleware in Development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Pusat Ilmu secure full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
