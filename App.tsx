/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { 
  BookOpen, 
  Send,
  Award, 
  Search, 
  Compass, 
  Lock, 
  Scale, 
  Layers, 
  Sliders,
  HelpCircle, 
  CheckCircle, 
  Sparkles, 
  Code, 
  Copy, 
  ArrowRight, 
  ChevronRight, 
  Palette, 
  Database, 
  Mail, 
  User, 
  X,
  Shield,
  Check,
  Folder, 
  Play, 
  RefreshCw, 
  AlertTriangle, 
  Heart,
  ChevronDown,
  Sun,
  Droplet,
  Wind,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Helper to clean up Math/LaTeX, Remove Stars, Hashes, and raw HTML tags, and build beautiful clean bullet-points/paragraphs dynamically for Chatbot AI
const cleanAndFormatChatText = (text: string): React.ReactNode => {
  if (!text) return null;

  // Replace any carriage returns
  let cleaned = text.replace(/\r\n/g, "\n");
  
  // Clean raw HTML tags that might leak from backend
  cleaned = cleaned.replace(/<\/?b>/gi, "");
  cleaned = cleaned.replace(/<\/?strong>/gi, "");
  cleaned = cleaned.replace(/<\/?i>/gi, "");
  cleaned = cleaned.replace(/<\/?em>/gi, "");
  cleaned = cleaned.replace(/<\/?span[^>]*>/gi, "");
  cleaned = cleaned.replace(/<\/span>/gi, "");
  cleaned = cleaned.replace(/<br\s*\/?>/gi, "\n");

  // Clean fractions like \frac{X}{Y} or $\frac{X}{Y}$ to "X / Y"
  cleaned = cleaned.replace(/\\frac\s*\{([^}]+)\}\s*\{([^}]+)\}/g, " $1 / $2 ");
  cleaned = cleaned.replace(/\$\\frac\s*\{([^}]+)\}\s*\{([^}]+)\}\$/g, " $1 / $2 ");
  
  // Clean standard operators
  cleaned = cleaned.replace(/\\times/g, " dikali ");
  cleaned = cleaned.replace(/\\cdot/g, " . ");
  cleaned = cleaned.replace(/\\pi/g, "Pi (3.14)");
  cleaned = cleaned.replace(/\\int/g, "Integral ");
  cleaned = cleaned.replace(/\\sigma/g, "Sigma");
  cleaned = cleaned.replace(/\\omega/g, "Omega");
  cleaned = cleaned.replace(/\\delta/g, "delta");
  cleaned = cleaned.replace(/\\Delta/g, "Delta");
  cleaned = cleaned.replace(/\\eta/g, "Efisiensi (Eta)");
  cleaned = cleaned.replace(/\\infty/g, "Tak Hingga");
  
  // Strip math dollar signs, bars, hashes and asterisks
  cleaned = cleaned.replace(/\$/g, "");
  cleaned = cleaned.replace(/\|/g, " ");
  cleaned = cleaned.replace(/\*/g, "");
  cleaned = cleaned.replace(/#/g, "");

  const parts = cleaned.split("\n");
  
  return (
    <div className="space-y-2 text-xs leading-relaxed text-slate-800 font-semibold selection:bg-yellow-200">
      {parts.map((p, pIdx) => {
        const line = p.trim();
        if (!line) return <div key={pIdx} className="h-1.5" />;

        // Detect list item or numbers
        const isList = line.startsWith("-") || line.startsWith("•") || /^\d+\./.test(line);
        // Detect formula lines (contains equals, fractions or operators)
        const isFormula = (line.includes("=") || line.includes(" / ") || line.includes(" + ")) && (line.match(/[a-zA-Z0-9]/g) || []).length > 2;

        if (isFormula) {
          return (
            <div key={pIdx} className="my-2 p-3 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-xl font-mono text-slate-900 shadow-sm font-bold text-[11px] leading-normal break-all">
              🔹 {line}
            </div>
          );
        }

        if (isList) {
          const textOnly = line.replace(/^[-•\d\.]+\s*/, "");
          return (
            <div key={pIdx} className="flex items-start gap-1.5 pl-2.5 my-1">
              <span className="text-amber-500 mt-1 text-[8px] shrink-0">■</span>
              <p className="flex-1 font-bold text-slate-900 text-xs">{textOnly}</p>
            </div>
          );
        }

        return (
          <p key={pIdx} className="text-slate-700 font-semibold text-[11px] leading-relaxed pr-1 whitespace-pre-line">
            {line}
          </p>
        );
      })}
    </div>
  );
};

// Help to render page formula cleanly by stripping scary LaTeX and math backslash junk
const cleanFormulaPage = (text: string): string => {
  if (!text) return "";
  let formula = text;
  
  // Replace fractions with standard readable pembagian representation
  formula = formula.replace(/\\frac\s*\{([^}]+)\}\s*\{([^}]+)\}/g, "$1 / $2");
  formula = formula.replace(/\\frac\s*([^{}\s]+)\s*([^{}\s]+)/g, "$1 / $2");
  
  // Replace multiply symbols
  formula = formula.replace(/\\times/g, " * ");
  formula = formula.replace(/\\cdot/g, " · ");
  
  // Replace Greek letters with actual friendly representations
  formula = formula.replace(/\\pi/g, "π");
  formula = formula.replace(/\\Delta/g, "Δ");
  formula = formula.replace(/\\delta/g, "δ");
  formula = formula.replace(/\\eta/g, "η");
  formula = formula.replace(/\\theta/g, "θ");
  formula = formula.replace(/\\omega/g, "ω");
  formula = formula.replace(/\\sigma/g, "σ");
  formula = formula.replace(/\\int/g, "∫");
  formula = formula.replace(/\\infty/g, "∞");
  
  // Remove LaTeX tags like \text{...}
  formula = formula.replace(/\\text\s*\{([^}]+)\}/g, " $1 ");
  
  // Clean up any remaining braces that are ugly
  formula = formula.replace(/\{/g, "(").replace(/\}/g, ")");
  
  // Strip dollar signs, vertical bars or backslashes
  formula = formula.replace(/\$/g, "");
  formula = formula.replace(/\|/g, " ");
  formula = formula.replace(/\\/g, "");
  
  // Trim and normalize multiple whitespaces
  formula = formula.replace(/\s+/g, " ").trim();
  
  return formula;
};

// Automatically calculate visual complementary color hex for gorgeous theory matching
const getComplementColor = (hex: string): string => {
  if (!hex || !hex.startsWith("#") || hex.length !== 7) return "#ffffff";
  try {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    
    const compR = (255 - r).toString(16).padStart(2, '0');
    const compG = (255 - g).toString(16).padStart(2, '0');
    const compB = (255 - b).toString(16).padStart(2, '0');
    
    return `#${compR}${compG}${compB}`.toUpperCase();
  } catch (err) {
    return "#334155";
  }
};

// Component for general explanation texts. Makes general explanations bold, proportional, and splits keywords visually.
const FormattedExplanation = ({ text }: { text: string }) => {
  if (!text) return null;
  const paragraphs = text.split("\n\n").filter(p => p.trim());
  return (
    <div className="space-y-4 text-[14.5px] md:text-[15.5px] leading-relaxed text-slate-800 font-medium">
      {paragraphs.map((p, pIdx) => {
        const parts = p.split(/(\*\*.*?\*\*|\*.*?\*)/g);
        return (
          <p key={pIdx} className="tracking-wide text-slate-800 select-all leading-relaxed">
            {parts.map((part, partIdx) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                const inner = part.slice(2, -2);
                return (
                  <strong 
                    key={partIdx} 
                    className="inline-block px-1.5 py-0.5 font-extrabold text-[#ca8a04] bg-yellow-400/10 border-b-2 border-[#ca8a04] mx-0.5 rounded-md shadow-sm transition-all hover:scale-102"
                  >
                    🚀 {inner}
                  </strong>
                );
              } else if (part.startsWith("*") && part.endsWith("*")) {
                const inner = part.slice(1, -1);
                return (
                  <em 
                    key={partIdx} 
                    className="font-serif italic font-extrabold text-[#0369a1] bg-[#e0f2fe] px-1 rounded border border-[#bae6fd] mx-0.5"
                  >
                    ✨ {inner}
                  </em>
                );
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
};

// Types
interface TableOfTerms {
  term: string;
  definition: string;
  significance: string;
}

interface AcademicMaterial {
  id: string;
  idNum?: number;
  level: "SD" | "SMP" | "SMA" | "SMK" | "Kuliah";
  syllabusCode: string;
  mapel: string;
  bab: string;
  topic: string;
  topicDesc: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderColor: string;
  badgeBg: string;
  summaryIntro: string;
  formulaTitle: string;
  formulaTex: string;
  formulaSubtitle: string;
  formulaDefinitions: { symbol: string; definition: string }[];
  infoBannerTitle: string;
  infoBannerDesc: string;
  terms: TableOfTerms[];
  steps: { num: string; title: string; dsc: string; sub: string[] }[];
  studiKasus: {
    title: string;
    description: string;
    problem: string;
    solution: string;
  };
  contohSoal?: {
    pertanyaan: string;
    pembahasan: string;
  };
  kalkulatorType: "nirmana_weight" | "photosynthesis" | "algebra" | "thermo" | "laplace";
}

const materialsDatabase: AcademicMaterial[] = [
  {
    id: "sd-fotosintesis",
    level: "SD",
    syllabusCode: "SD-IPA-04",
    mapel: "Ilmu Pengetahuan Alam (IPA)",
    bab: "Bab 1: Ekosistem & Tumbuhan",
    topic: "Siklus Energi & Fotosintesis Tumbuhan Hijau",
    topicDesc: "Memahami bagaimana klorofil menyerap cahaya matahari untuk mengubah karbondioksida dan air menjadi energi kimia.",
    color: "#ea580c",
    bgClass: "bg-[#ea580c]",
    textClass: "text-[#ea580c]",
    borderColor: "border-[#ea580c]/25",
    badgeBg: "bg-[#ea580c]/10",
    summaryIntro: "Fotosintesis adalah proses kunci pada tumbuhan hijau untuk membuat makanan sendiri berupa gula (glukosa). Melalui klorofil di daun, air diserap dari tanah dan karbondioksida dari udara diuraikan dengan katalis fotosistem sinar matahari untuk melepaskan gas Oksigen bersih bagi makhluk hidup lain.",
    formulaTitle: "REAKSI REAKSI FOTOSINTESIS KIMIA",
    formulaTex: "6CO₂ + 6H₂O (Cahaya + Klorofil) → C₆H₁₂O₆ + 6O₂",
    formulaSubtitle: "Prinsip konversi energi foton matahari menjadi persediaan glukosa karbohidrat.",
    formulaDefinitions: [
      { symbol: "CO₂", definition: "Karbondioksida (diambil melalui stomata daun)" },
      { symbol: "H₂O", definition: "Air (diserap oleh akar tumbuhan dari media tanah)" },
      { symbol: "C₆H₁₂O₆", definition: "Glukosa / Gula (disimpan sebagai energi tanaman)" },
      { symbol: "O₂", definition: "Oksigen (selaku gas sampingan yang dilepaskan ke atmosfer)" }
    ],
    infoBannerTitle: "Keseimbangan Cahaya & Klorofil",
    infoBannerDesc: "Jika tanaman kekurangan salah satu parameter (seperti air atau pencahayaan redup), kloroplast tidak mendapat energi fotosistem penuh. Ini mengakibatkan respirasi terhenti dan tumbuhan kerdil.",
    terms: [
      {
        term: "Klorofil",
        definition: "Zat hijau daun penyerap berkas gelombang cahaya merah dan biru dari matahari secara maksimal, memantulkan gelombang hijau.",
        significance: "Katalisator fotokimia yang mutlak dibutuhkan dalam proses pembentukan molekul organik."
      },
      {
        term: "Stomata",
        definition: "Mulut daun berupa celah mikroskopis pemicu pertukaran gas karbondioksida masuk dan oksigen keluar.",
        significance: "Pintu gerbang karbon untuk transpirasi air pada jaringan daun."
      },
      {
        term: "Kloroplas",
        definition: "Organel seluler berbentuk cakram tempat menampung pigmen klorofil dan melangsungkan reaksi terang maupun gelap.",
        significance: "Lokasi fisik kilang sediaan energi utama sirkulasi kehidupan bumi."
      }
    ],
    steps: [
      { num: "01", title: "Absorpsi Air & Mineral", dsc: "Akar tumbuhan menarik air dari medium tanah secara osmosis melalui jaringan xilem ke daun.", sub: ["Osmosis Akar", "Transport Kapiler"] },
      { num: "02", title: "Fiksasi Gas Karbon", dsc: "Stomata membuka lebar untuk menyedot pasokan CO2 dari selimut udara sekitar daun.", sub: ["Aktivasi Stomata", "Difusi Gas"] },
      { num: "03", title: "Fotofosforilasi Reaksi Terang", dsc: "Klorofil mengeksitasi elektron molekul air menggunakan foton menghasilkan energi ATP & NADPH.", sub: ["Fotolisis Air", "Aktivasi Foton"] },
      { num: "04", title: "Siklus Calvin Reaksi Gelap", dsc: "Energi kimia ATP mereduksi karbon menjadi molekul glukosa murni siap edar.", sub: ["Fiksasi RuBP", "Sintesis Karbohidrat"] }
    ],
    studiKasus: {
      title: "Optimasi Budidaya Bayam Hidroponik di Kamar Tertutup",
      description: "Petani urban milenial ingin menanam sayur bayam di dalam unit apartemen tanpa paparan sinar matahari alami langsung.",
      problem: "Bayam tumbuh kerdil dan daun kekuningan (klorosis) karena intensitas cahaya matahari dan kadar CO2 ruangan sangat rendah.",
      solution: "Memasang Grow-Light LED spektrum merah-biru sekuat 6000K, melengkapi sirkulasi fan gas CO2 berkadar 400-850 ppm, serta nutrisi air tercukupi. Hasil panen bayam meningkat 250% dalam 21 hari."
    },
    contohSoal: {
      pertanyaan: "Sebuah sayuran sawi hijau di kebun hidroponik diberi asupan 12 molekul Air (H₂O) dan 18 molekul Karbondioksida (CO₂). Sesuai dengan reaksi fotosintesis: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂, hitunglah berapa molekul gula glukosa (C₆H₁₂O₆) maksimum yang diproduksi dan tentukan sisa molekul dari bahan yang berlebih!",
      pembahasan: "Langkah penyelesaian secara lengkap:\n\n1. **analisis Persamaan Reaksi**\nPereaksi memerlukan rasio yang setara (1:1 untuk koefisien gas CO₂ dan H₂O):\n**6 molekul CO₂ + 6 molekul H₂O → 1 molekul C₆H₁₂O₆ + 6 molekul O₂**\n\n2. **Tentukan Reaktan Pembatas (Bahan yang Habis)**\n- Kebutuhan rasio CO₂ : H₂O = 6 : 6 = 1 : 1.\n- Data molekul nyata yang dimiliki daun: CO₂ = 18 molekul, H₂O = 12 molekul.\n- Karena jumlah H₂O (12) lebih sedikit secara proporsional dibanding CO₂ (18), maka **Air (H₂O) bertindak sebagai Reaktan Pembatas (habis bereaksi)**.\n\n3. **Hitung Jumlah Putaran Reaksi Lengkap**\nPutaran Reaksi = 12 molekul H₂O / 6 molekul per siklus = **2 kali reaksi penuh**.\n\n4. **Hitung Glukosa yang Dihasilkan**\nGlukosa yang diproduksi = 2 kali reaksi × 1 molekul glukosa per reaksi = **2 molekul Glukosa (C₆H₁₂O₆)**.\n\n5. **Hitung Sisa Reaktan yang Berlebih**\n- CO₂ yang bereaksi = 2 kali reaksi × 6 molekul = 12 molekul CO₂.\n- Sisa CO₂ yang berlebih = 18 (awal) - 12 (bereaksi) = **6 molekul CO₂ sisa**.\n- Oksigen yang dibebaskan = 2 kali reaksi × 6 molekul = 12 molekul O₂.\n\n**Kesimpulan**: Tumbuhan sawi hijau berhasil memproduksi maksimal **2 molekul Glukosa (C₆H₁₂O₆)**, membebaskan 12 molekul Oksigen, dan menyisakan **6 molekul Karbondioksida (CO₂)** yang tidak terpakai."
    },
    kalkulatorType: "photosynthesis"
  },
  {
    id: "smp-aljabar",
    level: "SMP",
    syllabusCode: "SMP-MAT-02",
    mapel: "Matematika Aljabar",
    textClass: "text-[#2563eb]",
    borderColor: "border-[#2563eb]/25",
    badgeBg: "bg-[#2563eb]/10",
    bab: "Bab 2: Persamaan Linier",
    topic: "Persamaan Linier Satu Variabel (PLSV)",
    topicDesc: "Merumuskan nilai variabel tidak diketahui dalam persamaan linear satu dimensi secara analitis.",
    color: "#2563eb",
    bgClass: "bg-[#2563eb]",
    summaryIntro: "Persamaan Linier Satu Variabel adalah kalimat terbuka yang dihubungkan oleh tanda sama dengan (=) dan hanya memiliki satu variabel berpangkat satu. Prinsip pengerjaannya mempertahankan keseimbangan nilai ruas kiri dan ruas kanan menggunakan operasi aritmetika simetris.",
    formulaTitle: "RUMUS UMUM PERSAMAAN LINEAR",
    formulaTex: "ax + b = c  →  x = (c - b) / a",
    formulaSubtitle: "Metode isolasi variabel x dari koefisien a dan konstanta b.",
    formulaDefinitions: [
      { symbol: "x", definition: "Variabel / Nilai anu yang dicari nilainya" },
      { symbol: "a", definition: "Koefisien (angka pengali variabel, nilai a ≠ 0)" },
      { symbol: "b", definition: "Konstanta ruas kiri (nilai bilangan tetap tambahan)" },
      { symbol: "c", definition: "Konstanta ruas kanan (nilai keseimbangan target)" }
    ],
    infoBannerTitle: "Asas Kebalikan Aritmatika",
    infoBannerDesc: "Saat memindahkan suku ke ruas seberang, tanda operasi berubah terbalik: penjumlahan positif menjadi pengurangan negatif, dan perkalian pembilang berubah pembagi penyebut.",
    terms: [
      {
        term: "Variabel",
        definition: "Lambang pengganti suatu bilangan yang belum diketahui nilainya dengan jelas (biasanya disimbolkan huruf kecil x, y, z).",
        significance: "Abstraksi matematika untuk melambangkan kuantitas dinamis universal."
      },
      {
        term: "Koefisien",
        definition: "Faktor konstanta numerik dari suatu suku berupa variabel pada bentuk aljabar.",
        significance: "Menentukan kekuatan pengaruh pertambahan variabel kepada nilai total."
      },
      {
        term: "Konstanta",
        definition: "Suku dari suatu bentuk aljabar yang berupa bilangan mandiri tanpa variabel penyerta.",
        significance: "Menentukan titik offset dasar grafik atau pergeseran ekuivalen koordinat."
      }
    ],
    steps: [
      { num: "01", title: "Kumpulkan Suku Sejenis", dsc: "Pindahkan semua suku berpangkat variabel x ke ruas kiri, dan semua nilai konstanta tetap ke ruas kanan.", sub: ["Isolasi Variabel", "Pengelompokan Konstan"] },
      { num: "02", title: "Lakukan Eliminasi Konstanta", dsc: "Kurangi kedua ruas dengan bilangan b agar ruas kiri hanya menyisakan bentuk ax.", sub: ["Operasi Aditif Ruas", "Reduksi Offset"] },
      { num: "03", title: "Bagi Koefisien Variabel", dsc: "Bagi ruas kanan dengan koefisien a untuk melenyapkan faktor pengali pada x.", sub: ["Aktivasi Multiplikatif", "Normalisasi Variabel"] },
      { num: "04", title: "Uji Pembuktian Solusi", dsc: "Substitusikan nilai x hasil akhir kembali ke persamaan asal untuk memastikan kebenaran hasil.", sub: ["Verifikasi Ekuivalensi", "Konfirmasi Solusi"] }
    ],
    studiKasus: {
      title: "Penghitungan Distribusi Subsidi Beras Desa Sukatani",
      description: "Kepala desa mengalokasikan bantuan beras total seberat 100 kg. Sebanyak 10 kg didistribusikan untuk rumah ibadah, dan sisanya dibagikan merata ke 5 keluarga kurang mampu.",
      problem: "Setiap keluarga harus mendapat jatah beras seimbang tanpa ada yang dibedakan demi keadilan sosial, tentukan berapa jatah per keluarga (x).",
      solution: "Memodelkan ke dalam PLSV: 5x + 10 = 100. Setelah isolasi, didapat 5x = 90, maka x = 18 kg beras per keluarga. Distribusi berjalan damai tanpa perselisihan."
    },
    contohSoal: {
      pertanyaan: "Selesaikanlah nilai x dari persamaan linear satu variabel berikut ini: 4x + 12 = 32. Berikan rincian isolasi ruas matematika lengkap step-by-step!",
      pembahasan: "Langkah penyelesaian secara lengkap:\n\n1. **Tulis Persamaan Awal**\n**4x + 12 = 32**\n\n2. **Isolasi Suku Variabel (Eliminasi Konstanta Kiri)**\nUntuk melenyapkan konstanta +12 di ruas kiri, kedua ruas dikurangi dengan nilai **12**:\n4x + 12 - 12 = 32 - 12\n**4x = 20**\n\n3. **Isolasi Variabel Secara Mandiri (Bagi Koefisien)**\nUntuk menyederhanakan koefisien pengali variabel x, kedua ruas dibagi dengan koefisien x yaitu **4**:\n4x / 4 = 20 / 4\n**x = 5**\n\n4. **Verifikasi Bukti Kebenaran**\nMasukkan kembali x = 5 ke persamaan semula:\n4(5) + 12 = 20 + 12 = 32 (Kedua ruas berharga setara, terbukti ekuivalen!).\n\n**Kesimpulan**: Nilai variabel tunggal x yang memuaskan persamaan linear di atas adalah **x = 5**."
    },
    kalkulatorType: "algebra"
  },
  {
    id: "sma-termo",
    level: "SMA",
    syllabusCode: "SMA-FIS-03",
    mapel: "Fisika Termodinamika",
    textClass: "text-[#4b5563]",
    borderColor: "border-[#4b5563]/25",
    badgeBg: "bg-[#4b5563]/10",
    bab: "Bab 3: Termodinamika",
    topic: "Hukum I Termodinamika & Efisiensi Mesin",
    topicDesc: "Menganalisis hukum kekekalan energi panas yang diubah menjadi usaha luar oleh sistem gas ideal.",
    color: "#4b5563",
    bgClass: "bg-[#4b5563]",
    summaryIntro: "Hukum Pertama Termodinamika menyatakan bahwa energi tidak dapat diciptakan atau dimusnahkan, melainkan hanya dapat berganti rupa. Kalor (Q) yang diberikan kepada sistem akan digunakan untuk melakukan Usaha Luar (W) dan mengubah Energi Dalam (ΔU) sejalan dengan pemuaian volume gas.",
    formulaTitle: "RELASI ENERGI TERMOMATEMATIKA",
    formulaTex: "Q = ΔU + W  &  η = (W / Q_in) × 100%",
    formulaSubtitle: "Keseimbangan energi masuk, kenaikan derajat kalor gas, dan efisiensi konverter motor mekanis.",
    formulaDefinitions: [
      { symbol: "Q", definition: "Kalor panas yang diserap (+) atau melepas (-) sistem (Joule)" },
      { symbol: "W", definition: "Usaha mekanik luar yang dilakukan (+) atau diterima (-) sistem (Joule)" },
      { symbol: "ΔU", definition: "Perubahan energi dalam akibat fluktuasi temperatur gas (Joule)" },
      { symbol: "η", definition: "Efisiensi Termal mesin pengubah kalori menjadi mekanis (%)" }
    ],
    infoBannerTitle: "Asas Batas Efisiensi Carnot",
    infoBannerDesc: "Mesin kalor riil tidak akan pernah mencapai efisiensi 100% lantaran friksi mekanik dan hilangnya sisa pembuangan panas ke reservoar dingin.",
    terms: [
      {
        term: "Isobarik",
        definition: "Proses perubahan keadaan gas ideal yang berlangsung pada kondisi tekanan konstan/tetap.",
        significance: "Menghasilkan grafik kerja lurus searah sumbu volume pada koordinat PV."
      },
      {
        term: "Energi Dalam",
        definition: "Jumlah total energi kinetik gerak acak translasi, rotasi, dan vibrasi dari semua molekul mikroskopis penyusun gas ideal.",
        significance: "Berbanding lurus secara eksklusif dengan suhu mutlak gas kelvin."
      },
      {
        term: "Entropi",
        definition: "Besaran fisika pengukur derajat ketidakteraturan susunan partikel atau hilangnya ketersediaan energi berguna dalam sistem.",
        significance: "Menandai arah panah waktu alam semesta yang cenderung mengalami kekacauan absolut."
      }
    ],
    steps: [
      { num: "01", title: "Tentukan Tekanan & Temperatur", dsc: "Dapatkan parameter tekanan gas awal, volume awal, serta sediaan kalor mesin.", sub: ["Persamaan Gas Ideal", "Kondisi Batas Gas"] },
      { num: "02", title: "Hitung Usaha Eksternal", dsc: "Gunakan rumusan integrasi tekanan terhadap volume P x ΔV untuk melihat gaya ekspansi piston.", sub: ["Ekspansi Termal", "Grafik P-V Area"] },
      { num: "03", title: "Ukur Perubahan Suhu", dsc: "Hitung perubahan energi kinematik molekul gas murni untuk mengukur ΔU.", sub: ["Kenaikan Energi Dalam", "Kapasitas Kalor Gas"] },
      { num: "04", title: "Kalkulasi Efisiensi Siklus", dsc: "Bandingkan daya guna mekanis berguna terhadap asupan bahan bakar bensin total.", sub: ["Rasio Konversi Energi", "Rendemen Termal Mesin"] }
    ],
    studiKasus: {
      title: "Desain Piston Diesel Mesin Genset Pabrik Garmen",
      description: "Tim engineer merancang silinder pembakaran diesel berkapasitas 800 Joule panas input per siklus gesekan.",
      problem: "Panas berlebih merusak dinding silinder, sedangkan usaha mekanis yang dikeluarkan terlalu kecil (di bawah 240 Joule), menghasilkan polusi tinggi.",
      solution: "Memodifikasi katup ekspansi sehingga mesin melakukan usaha sebesar 320 Joule per siklus. Dengan kenaikan usaha, efisiensi termis naik dari 30% menjadi 40% (sesuai hukum termo) dan suhu kedinginan silinder berkurang drastis."
    },
    contohSoal: {
      pertanyaan: "Sebuah mesin pemanas menyedot energi kalor (Q) sebesar 1600 Joule dari ruangan pembakaran bersuhu tinggi. Gas ideal di dalam ruang piston memuai bertenaga dan sukses melakukan usaha mekanis luar (W) sebesar 480 Joule. Berdasarkan Hukum I Termodinamika, hitunglah:\n1. Nilai perubahan energi dalam (ΔU) dari sistem gas ideal tersebut.\n2. Tingkat efisiensi termal (η) mesin pemanas tersebut dalam persentase!",
      pembahasan: "Langkah penyelesaian secara lengkap:\n\n1. **Identifikasi Data & Nilai Variabel**\n- Kalor yang absorbed (Q) = +1600 Joule (bernilai positif karena kalor masuk ke sistem)\n- Usaha mekanik eksternal (W) = +480 Joule (bernilai positif karena sistem melakukan usaha ke luar)\n\n2. **Kalkulasi Perubahan Energi Dalam (ΔU)**\nMenerapkan formulasi Hukum Pertama Termodinamika:\n**Q = ΔU + W**\nUntuk mengukur ΔU, pindahkan variabel W ke ruas seberang secara matematis:\n**ΔU = Q - W**\nΔU = 1600 J - 480 J\n**ΔU = 1120 Joule**\n*Arti Fisik*: Energi dalam gas ideal naik sebesar 1120 Joule, menyebabkan gas tersebut mengalami lonjakan suhu internal yang signifikan.\n\n3. **Kalkulasi Efisiensi Termal Mesin (η)**\nEfisiensi mengukur rasio ketepatan pemanfaatan energi panas input menjadi usaha mekanis berguna:\n**η = (W / Q_in) × 100%**\nη = (480 / 1600) × 100%\nη = 0.30 × 100%\n**η = 30%**\n\n**Kesimpulan**: Perubahan energi dalam sistem gas ideal adalah sebesar **1120 Joule** dan efisiensi termal mesin pengonversi energi ini berada pada skala **30%**."
    },
    kalkulatorType: "thermo"
  },
  {
    id: "smk-nirmana",
    level: "SMK",
    syllabusCode: "SMK-DKF-01",
    mapel: "Produktif Desain Grafis",
    textClass: "text-[#dc2626]",
    borderColor: "border-[#dc2626]/25",
    badgeBg: "bg-[#dc2626]/10",
    bab: "Bab 2: Prinsip Dasar Nirmana",
    topic: "Prinsip Dasar Nirmana Dwimatra & Komposisi Visual",
    topicDesc: "Mempelajari pengorganisasian elemen visual (titik, garis, bidang, warna, tekstur) pada media datar untuk menghasilkan harmoni.",
    color: "#dc2626",
    bgClass: "bg-[#dc2626]",
    summaryIntro: "Nirmana Dwimatra adalah ilmu dasar rupa dua dimensi yang mempelajari pengorganisasian elemen visual (titik, garis, bidang, warna, tekstur) pada media datar untuk menghasilkan harmoni yang kuat. Visi utamanya bukan sekadar menciptakan keelokan subyektif, melainkan menyusun bobot visual yang setara di antara elemen layout.",
    formulaTitle: "PERSAMAAN BOBOT VISUAL (VISUAL WEIGHT)",
    formulaTex: "W_visual = M × C × D",
    formulaSubtitle: "Pendekatan kalkulatif untuk mengonversi bobot persepsi rupa ke variabel fisik terukur.",
    formulaDefinitions: [
      { symbol: "W_visual", definition: "Bobot Visual Total (Visual Weight)" },
      { symbol: "M", definition: "Massa / Ukuran Skala Luas Bidang Fisik (Mass/Scale)" },
      { symbol: "C", definition: "Chroma / Tingkat Kejenuhan & Kontras Warna" },
      { symbol: "D", definition: "Distance / Jarak Spasial ke Garis Sumbu Gravitasi" }
    ],
    infoBannerTitle: "Hukum Gravitasi Nirmana",
    infoBannerDesc: "Elemen visual dengan warna saturated gelap memiliki Chroma (C) yang tinggi, sehingga mendikte bobot yang sangat berat pada tata letak. Jika elemen ini diletakkan jauh dari sumbu pusat, sumbu gravitasi imajiner pengamat akan terganggu kecuali sebaliknya ada elemen pengimbang di arah berlawanan.",
    terms: [
      {
        term: "Dwimatra",
        definition: "Unsur rupa dua dimensi yang memiliki dimensi panjang dan lebar pada suatu bidang datar (flat plane). Tidak memiliki kedalaman fisik riil, melainkan kedalaman semu (optical depth) yang diciptakan melaui permainan saturasi warna, pertindihan (overlapping), atau perspektif.",
        significance: "Fondasi utama penataan komposisi media grafis statis seperti poster, flayer, logo, dan tata letak perwajahan buku."
      },
      {
        term: "Garis Semu",
        definition: "Garis tak kasat mata yang terbentuk dari relasi penataan elemen-elemen rupa yang berjajar, berirama, atau mempunyai kemiripan bentuk. Garis ini menuntun pergerakan mata pengamat (eyeflow) mengarungi keseluruhan tata letak dari titik fokus utama ke detail lainnya secara berurutan.",
        significance: "Mengontrol arah psikologi baca pengamat, memastikan informasi kritis terbaca terlebih dahulu (hierarki visual jitu)."
      },
      {
        term: "Keseimbangan Asimetris",
        definition: "Metode distribusi bobot visual (Visual Weight) kiri-kanan atau atas-bawah yang posisinya tidak identik/cermin, melainkan dicapai lewat kontras skala Massa, intensitas warna (Chroma), atau jarak spasial elemen tersebut dari sumbu gravitasi imajiner.",
        significance: "Menghasilkan respons emosi desain yang dinamis, modern, berenergi, serta tidak kaku jika dibandingkan keseimbangan simetris biasa."
      }
    ],
    steps: [
      { num: "01", title: "Tentukan Format Bidang Gambar", dsc: "Batasi kanvas kerja Anda terlebih dahulu (seperti poster bentuk A3, baliho 4x6, atau kotak persegi banner media sosial).", sub: ["Identifikasi Canvas", "Rasio Penonton"] },
      { num: "02", title: "Letakkan Focal Point Utama", dsc: "Taruh elemen pesan terpenting dengan skala Massa (M) dominan di sepertiga bidang gambar.", sub: ["Prinsip Rule of Thirds", "Bobot Dominasi"] },
      { num: "03", title: "Distribusi Elemen Aksesori", dsc: "Atur materi pendukung di lokasi berlawanan arah dengan menghitung Chroma (C) tinggi pada jarak (D) lebih dekat ke pusat demi harmoni.", sub: ["Pelurusan Alur Kontras", "Pemberat Penjelas"] },
      { num: "04", title: "Evaluasi Eyeflow Alur Baca", dsc: "Ciptakan garis semu penghubung antar elemen rupa agar ritme perpindahan lirikan pengamat mengalir subur.", sub: ["Alur Baca Segitiga Visual", "Ritme Spasial Efektif"] }
    ],
    studiKasus: {
      title: "Pemberantasan Isu Out of Balance Baliho 4x6m di Pertigaan Lampu Merah",
      description: "Agensi iklan mendesain baliho promo berlatar malam mendung dengan tulisan diskon mega-besar berwarna kuning neon pekat di pinggir kanan ekstrim.",
      problem: "Para pengendara jalan mengeluhkan pusing saat melirik baliho tersebut karena tatapan visual didikte anjlok ke kanan, merusak estetika tata letak perkotaan.",
      solution: "Menggeser box tulisan kuning neon agak mendekati pusat (mengecilkan D) dan meletakkan foto produk bergaya gelap di bagian kiri bawah dengan volume besar sebagai penyeimbang asimetris. Layout menjadi nyaman dan penjualan produk naik 64%."
    },
    contohSoal: {
      pertanyaan: "Dalam merancang cover majalah mode (Nirmana Dwimatra), seorang desainer memposisikan Headline berwana merah pekat (kejenuhan Chroma C_kiri = 9, Massa M_kiri = 2 unit) pada pinggir kiri poster (jarak D_kiri = 4 unit dari sumbu simetri). Untuk mengimbangi bobot visual ini di sisi kanan poster, dipasang foto busana dengan bobot kejenuhan warna yang rendah (C_kanan = 3) namun ukuran bidangnya lebar (M_kanan = 6 unit). Hitunglah berapa jarak (D_kanan) peletakan foto yang ideal agar cover majalah tersebut stabil secara dinamis sesuai relasi: W_visual = M × C × D!",
      pembahasan: "Langkah penyelesaian secara lengkap:\n\n1. **Prinsip Keseimbangan Nirmana**\nAgar menghasilkan keseimbangan asimetris yang stabil dan nyaman ditatap oleh mata pengamat, total bobot visual di sisi kiri dan kanan sumbu penengah harus setara:\n**W_kiri = W_kanan**\n\n2. **Kalkulasi Bobot Visual Kiri (Headline Mode)**\nMasukkan parameter Headline ke dalam rumus rupa:\n**W_kiri = M_kiri × C_kiri × D_kiri**\nW_kiri = 2 × 9 × 4\n**W_kiri = 72 unit**\n\n3. **Susun Formulasi Bobot Visual Kanan (Foto Busana)**\n**W_kanan = M_kanan × C_kanan × D_kanan**\nW_kanan = 6 × 3 × D_kanan\n**W_kanan = 18 × D_kanan**\n\n4. **Isolasi Nilai Jarak Kanan (D_kanan)**\nSetarakan kedua ruas untuk memperoleh nilai jarak penyeimbang:\n**W_kiri = W_kanan**\n72 = 18 × D_kanan\n**D_kanan = 72 / 18 = 4 unit**\n\n**Kesimpulan**: Agar cover majalah mode tersebut mencapai harmoni visual yang indah dan proporsional secara asimetris, foto busana di sebelah kanan harus diletakkan sejauh **4 unit** dari sumbu pusat."
    },
    kalkulatorType: "nirmana_weight"
  },
  {
    id: "uni-laplace",
    level: "Kuliah",
    syllabusCode: "UNI-MAT-04",
    mapel: "Kalkulus Lanjut / Elektro",
    textClass: "text-[#7c3aed]",
    borderColor: "border-[#7c3aed]/25",
    badgeBg: "bg-[#7c3aed]/10",
    bab: "Bab 4: Transformasi Laplace",
    topic: "Sistem Kontrol Linier & Laplace",
    topicDesc: "Mempelajari kalkulus transisional integral untuk menyederhanakan persamaan diferensial sistem dinamis berorde tinggi.",
    color: "#7c3aed",
    bgClass: "bg-[#7c3aed]",
    summaryIntro: "Transformasi Laplace memetakan fungsi dalam domain waktu riil f(t) ke domain frekuensi kompleks s = σ + jω. Melalui operator integral Laplace, operasi turunan diferensial berganti menjadi operasi perkalian aljabar biasa, memuluskan analisis kestabilan sistem pegas magnetis maupun sirkuit listrik interkoneksi.",
    formulaTitle: "INTEGRAL INTI TRANSFORMASI LAPLACE",
    formulaTex: "L{f(t)} = F(s) = ∫ e^(-st) . f(t) dt",
    formulaSubtitle: "Konversi domain fungsi kontinu t menjadi domain kompleks s.",
    formulaDefinitions: [
      { symbol: "f(t)", definition: "Fungsi asal sinyal kontinu terhadap variabel waktu t" },
      { symbol: "F(s)", definition: "Fungsi bayangan koordinat dalam domain Laplace s" },
      { symbol: "e^(-st)", definition: "Faktor redaman eksponensial transisional inti" },
      { symbol: "dt", definition: "Diferensial waktu dari batas integral nol ke tak terhingga" }
    ],
    infoBannerTitle: "Kondisi Kestabilan Domain S",
    infoBannerDesc: "Jika letak kutub-kutub akar pembagi F(s) berada di sebelah kiri kontur sumbu kompleks (LHP), sistem dinamis dipastikan stabil tanpa lonjakan amplifikasi destruktif.",
    terms: [
      {
        term: "Domain Waktu",
        definition: "Representasi sinyal atau dinamika fisik fisik yang diukur langsung berdasarkan waktu riil sekon.",
        significance: "Format dasar data osiloskop atau pergerakan suspensi mobil di jalan raya."
      },
      {
        term: "Domain S",
        definition: "Bidang frekuensi kompleks dengan variabel s = σ + jω yang melambangkan redaman dan osilasi sinusoidal.",
        significance: "Bagan analisis kestabilan loop umpan balik terpadu (feedback loop stability control)."
      },
      {
        term: "Fungsi Transfer",
        definition: "Persamaan pecahan matematis yang membandingkan keluaran output terhadap masukan input dalam representasi Laplace s.",
        significance: "Mendikte perilaku keseluruhan kontrol elektronik motor otonom tanpa simulasi fisik."
      }
    ],
    steps: [
      { num: "01", title: "Modelkan Diferensial Fisik", dsc: "Rumuskan hubungan turunan d2y/dt2 pegas suspensi atau kelistrikan sistem.", sub: ["Persamaan Hukum Newton II", "Diferensial Loop Kirchhoff"] },
      { num: "02", title: "Lakukan Transformasi Integral", dsc: "Terapkan tabel transformasi Laplace dasar untuk mengubah t d/dt menjadi operator kuadrat perkalian s.", sub: ["Substitusi Laplace", "Aplikasi Batas Awal"] },
      { num: "03", title: "Isolasi Fungsi Rasional Y(s)", dsc: "Gabungkan variabel keluaran dan susun fungsi transfer pembilang G(s).", sub: ["Fungsi Transfer G(s)", "Faktorisasi Polinomial"] },
      { num: "04", title: "Balikkan via Inverse Laplace", dsc: "Gunakan ekspansi pecahan parsial untuk mengembalikan fungsi s kembali menjadi fungsi waktu f(t).", sub: ["Ekspansi Suku Parsial", "Konversi Residu Domain Waktu"] }
    ],
    studiKasus: {
      title: "Optimasi Peredam Suspensi Elektromagnetik Kereta Cepat Jakarta-Surabaya",
      description: "Kereta mengalun kencang di kecepatan 350 km/jam saat menghantam lubang mikro di sambungan rel besi baja.",
      problem: "Osilasi suspensi sangat berontak dan lamban mereda, mengancam penumpang muntah karena mabuk darat berlebih.",
      solution: "Tim riset memformulasikan fungsi transfer peredaman pegas dengan transformasi Laplace. Nilai redaman damper diatur ke batas kritis (ζ = 0.5 menjadi ζ = 0.7) lewat feedback elektromagnetik aktif. Goncangan mereda tuntas dalam 0.3 detik."
    },
    contohSoal: {
      pertanyaan: "Diberikan sebuah fungsi dalam domain waktu kontinu f(t) = e^(5t). Tentukan fungsi bayangannya F(s) di domain frekuensi kompleks Laplace s menggunakan rumus integral transisi dasar L{f(t)} = F(s) = ∫[0→∞] e^(-st) * f(t) dt!",
      pembahasan: "Langkah penyelesaian kalkulus secara detail:\n\n1. **Modelkan Persamaan Integral Inti**\nSubstitusi fungsi f(t) = e^(5t) ke dalam definisi integral Laplace:\n**F(s) = ∫[0→∞] e^(-st) · e^(5t) dt**\n\n2. **Gabungkan Suku Eksponensial**\nSederhanakan pangkat eksponen menggunakan sifat eksponen perkalian (penjumlahan pangkat):\nF(s) = ∫[0→∞] e^(-st + 5t) dt\n**F(s) = ∫[0→∞] e^(-(s - 5)t) dt**\n\n3. **Lakukan Integrasi Integral Tentu**\nIntegralkan terhadap variabel t (dengan asumsi parameter s > 5 agar integrasi meluruh ke konvergen):\n**∫ e^(-at) dt = -1/a · e^(-at)**\nsehingga:\n**F(s) = [ -1 / (s - 5) · e^(-(s - 5)t) ] dengan batas t=0 hingga t=∞**\n\n4. **Evaluasi Batas Nilai Atas & Bawah**\n- Batas Atas (t → ∞):\nKarena s > 5, maka -(s-5) bernilai negatif, sehingga e^(-∞) meluruh mendekati **0**.\n- Batas Bawah (t = 0):\nSubstitusi t = 0 diperoleh: -1 / (s - 5) · e^(0) = **-1 / (s - 5)**.\n\nLakukan pengurangan batas (Batas Atas - Batas Bawah):\nF(s) = 0 - [ -1 / (s - 5) ]\n**F(s) = 1 / (s - 5)**  (untuk s > 5)\n\n**Kesimpulan**: Hasil transformasi Laplace dari fungsi waktu kontinu f(t) = e^(5t) adalah **F(s) = 1 / (s - 5)**."
    },
    kalkulatorType: "laplace"
  }
];

export default function App() {
  // Authentication & Onboarding States
  const [isRegistered, setIsRegistered] = useState<boolean>(() => {
    const saved = localStorage.getItem("pi_is_registered");
    return saved === "true";
  });
  const [email, setEmail] = useState<string>(() => {
    return localStorage.getItem("pi_email") || "";
  });
  const [password, setPassword] = useState<string>("BypassPass123_");
  const [useSSO, setUseSSO] = useState<boolean>(false);

  // Sync state to localStorage to prevent needing re-registration on egress/exit
  useEffect(() => {
    localStorage.setItem("pi_is_registered", String(isRegistered));
    localStorage.setItem("pi_email", email);
  }, [isRegistered, email]);
  
  // New States for expanded login methods
  const [authTab, setAuthTab] = useState<"email" | "sso" | "phone">("email");
  const [phoneNo, setPhoneNo] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);

  // Google SSO account chooser states
  const [googleChooserOpen, setGoogleChooserOpen] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [selectedGoogleAccount, setSelectedGoogleAccount] = useState<{
    name: string;
    email: string;
    avatarBg: string;
    isBelajarId: boolean;
  } | null>(null);
  const [showSecurityNotification, setShowSecurityNotification] = useState<boolean>(false);
  
  // Custom Google Account Input state inside Google Chooser
  const [customGoogleEmail, setCustomGoogleEmail] = useState<string>("");
  const [customGoogleName, setCustomGoogleName] = useState<string>("");
  const [isAddingCustomGoogle, setIsAddingCustomGoogle] = useState<boolean>(false);

  // Dynamic Google Authentication API / Smart Lock cached accounts array state
  const [googleAccounts, setGoogleAccounts] = useState<Array<{
    name: string;
    email: string;
    avatarBg: string;
    accountType: "Akun Gmail" | "Belajar.id" | "Akun Workspace";
  }>>([]);

  useEffect(() => {
    // Check if there are saved credentials in the cache
    const saved = localStorage.getItem("google_smart_lock_cached_accounts");
    if (saved) {
      try {
        setGoogleAccounts(JSON.parse(saved));
      } catch (e) {
        setGoogleAccounts([]);
      }
    } else {
      // Setup dynamic dynamic account structures ready for API retrieval
      const dynamicArray = [
        {
          name: "Siswa Vokasi Unggulan",
          email: "siswa.vokasi@belajar.id",
          avatarBg: "bg-slate-900",
          accountType: "Belajar.id" as const
        },
        {
          name: "Ilustrator Rupa Utama",
          email: "ilustrator.utama@gmail.com",
          avatarBg: "bg-violet-600",
          accountType: "Akun Gmail" as const
        }
      ];
      setGoogleAccounts(dynamicArray);
      localStorage.setItem("google_smart_lock_cached_accounts", JSON.stringify(dynamicArray));
    }
  }, []);

  // Search enhancement states
  const [searchFilter, setSearchFilter] = useState<"Semua" | "SD" | "SMP" | "SMA" | "SMK" | "Kuliah">("Semua");
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  // Helper action to handle selected Google Account
  const handleChooseAccount = (name: string, emailStr: string, isBelajarId: boolean) => {
    setIsGoogleLoading(true);
    const bgCol = isBelajarId ? "bg-slate-900" : "bg-[#7c3aed]";
    setSelectedGoogleAccount({
      name,
      email: emailStr,
      avatarBg: bgCol,
      isBelajarId
    });

    // Automatically append to dynamic Google accounts array
    setGoogleAccounts((prev) => {
      const exists = prev.some((acc) => acc.email.toLowerCase() === emailStr.toLowerCase());
      if (!exists) {
        const newAcc = {
          name,
          email: emailStr,
          avatarBg: bgCol,
          accountType: (isBelajarId ? "Belajar.id" : emailStr.toLowerCase().endsWith(".edu") ? "Akun Workspace" : "Akun Gmail") as any
        };
        const updated = [...prev, newAcc];
        localStorage.setItem("google_smart_lock_cached_accounts", JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
    
    setTimeout(() => {
      setIsGoogleLoading(false);
      setGoogleChooserOpen(false);
      setShowSecurityNotification(true);
      // Set the active email and mark user as successfully registered/logged in
      setEmail(emailStr);
      setIsRegistered(true);
    }, 1200);
  };

  // Chatbot send message helper linked with server-side proxy
  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: chatMessages,
          contextMaterial: activeMaterial
        })
      });
      const data = await response.json();
      if (data.success) {
        setChatMessages((prev) => [...prev, { sender: "ai", text: data.reply }]);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Terjadi kesalahan saat menghubungkan Tutor AI. Namun jangan khawatir, kami berada dalam simulasi sandbox! Silakan tanyakan hal-hal fundamental lainnya." }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // AI Dynamic Custom Materials Generator
  const handleGenerateDynamicMaterial = async () => {
    if (!searchQuery.trim() || isGeneratingMaterial) return;

    setIsGeneratingMaterial(true);
    const keywordTerm = searchQuery.trim();

    try {
      const response = await fetch("/api/gemini/generate-material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keywordTerm,
          level: selectedLevel
        })
      });
      const data = await response.json();
      if (data.success && data.material) {
        const raw = data.material;
        const generated: AcademicMaterial = {
          id: `ai-gen-${Date.now()}`,
          idNum: Math.floor(Math.random() * 1000) + 100,
          level: raw.level || selectedLevel,
          syllabusCode: raw.syllabusCode || `${raw.level || selectedLevel}-GEN-${Math.floor(Math.random() * 90) + 10}`,
          mapel: raw.mapel || `${keywordTerm} Terapan`,
          bab: raw.bab || "Materi AI Terpadu",
          topic: raw.topic || `Studi Detail: ${keywordTerm}`,
          topicDesc: raw.topicDesc || `Modul belajar konsep ${keywordTerm}`,
          color: raw.color || "#eab308",
          bgClass: raw.bgClass || "bg-amber-500/5",
          textClass: raw.textClass || "text-amber-500",
          borderColor: raw.borderColor || "border-amber-500/30",
          badgeBg: raw.badgeBg || "bg-amber-400",
          summaryIntro: raw.summaryIntro || `Informasi mengenai ${keywordTerm}`,
          formulaTitle: raw.formulaTitle || `Rumus Standar ${keywordTerm}`,
          formulaTex: raw.formulaTex || raw.formulaEq || "Y = f(x)",
          formulaSubtitle: raw.formulaSubtitle || "Persamaan Hubungan Parameter Terkait",
          formulaDefinitions: raw.formulaDefinitions || [
            { symbol: "Y", definition: "Nilai Keluaran / Hasil Efek" },
            { symbol: "f(x)", definition: "Fungsi Hubungan Karakteristik" }
          ],
          infoBannerTitle: raw.infoBannerTitle || "Catatan Praktis",
          infoBannerDesc: raw.infoBannerDesc || raw.formulaDesc || "Penggunaan rumus ini membutuhkan perimbangan parameter secara seimbang.",
          terms: raw.terms || [
            { term: keywordTerm, definition: "Subjek utama pembahasan modul", significance: "Variabel rujukan teoretis" }
          ],
          steps: raw.steps || [
            { num: "01", title: "Definisi Masalah", dsc: "Mengobservasi ruang pengaruh variabel dan konstanta.", sub: ["Observasi", "Fiksasi"] }
          ],
          studiKasus: raw.studiKasus || {
            title: `Kasus Optimasi ${keywordTerm}`,
            description: "Aplikasi taktis teoretis di industri modern / kejuruan",
            problem: "Ketidakseimbangan parameter penunjang yang menghambat efisiensi optimal.",
            solution: "Pemberlakuan konfigurasi sesuai perhitungan formula standar."
          },
          kalkulatorType: raw.kalkulatorType || "laplace"
        };
        setCustomMaterials((prev) => [generated, ...prev]);
        setSelectedMaterialId(generated.id);
        setSelectedLevel(generated.level as any);
        setSelectedTab("materi");
        setMateriSection("ringkasan");
        setSearchQuery("");
      } else {
        throw new Error("Gagal memperoleh materi kustom");
      }
    } catch (err) {
      console.error(err);
      const generatedFallback: AcademicMaterial = {
        id: `ai-fallback-${Date.now()}`,
        idNum: Math.floor(Math.random() * 1000) + 200,
        level: selectedLevel,
        syllabusCode: `${selectedLevel}-AI-${Math.floor(Math.random() * 90) + 10}`,
        mapel: `${keywordTerm} Terapan`,
        bab: `Materi AI Terpadu`,
        color: "#eab308",
        bgClass: "bg-amber-500/5",
        textClass: "text-amber-500",
        borderColor: "border-amber-500/30",
        badgeBg: "bg-amber-400",
        topic: `Studi Detail: ${keywordTerm}`,
        topicDesc: `Modul belajar pintar mengulas konsep ${keywordTerm} dalam kurikulum Pusat Ilmu Terintegrasi.`,
        summaryIntro: `Materi mengenai **${keywordTerm}** telah berhasil dibangkitkan secara dinamis menggunakan teknologi Pusat Ilmu AI. Topik ini dibedah mendalam dari teori fundamental, formulasi standar, hingga aplikasi praktis di berbagai bidang sains, teknologi, maupun desain rupa kejuruan.

Untuk melatih pemahaman Anda terhadap konsep ini secara mendalam, silakan klik panel **Simulasi** untuk visualisasi rumus terkait, atau klik ikon **Chatbot AI Tutor** di sudut kanan bawah untuk bertanya secara interaktif tanpa batas!`,
        formulaTitle: `Persamaan Standar ${keywordTerm}`,
        formulaTex: `Y = f(x) * e^{kx}`,
        formulaSubtitle: `Hukum Distributif Eksponensial Terapan`,
        formulaDefinitions: [
          { symbol: "Y", definition: "Hasil / Respon Variabel Output Akhir" },
          { symbol: "f(x)", definition: "Fungsi Respon Karakteristik Spesifik" },
          { symbol: "k", definition: "Koefisien Pengaruh Eksponensial Luar" }
        ],
        infoBannerTitle: "Metodologi Terpadu",
        infoBannerDesc: "Seluruh penjelasan diolah otomatis sistem Pusat Ilmu AI untuk kurikulum kejuruan.",
        terms: [
          { term: keywordTerm, definition: "Konseptual utama bahasan terintegrasi.", significance: "Sumbu utama analisis rujukan teori." }
        ],
        steps: [
          { num: "01", title: "Observasi Fundamental", dsc: "Mengidentifikasi variabel masukan kunci yang mempengaruhi sistem secara menyeluruh.", sub: ["Persiapan parameter awal", "Analisis awal variabel"] }
        ],
        studiKasus: {
          title: `Optimasi Kinerja ${keywordTerm} di Industri Modern`,
          description: "Studi lapangan mengenai kegunaan taktis konsep rujukan dalam merealisasikan efisiensi.",
          problem: "Bagaimana memaksimalkan nilai efisiensi energi dengan pembatasan variabel?",
          solution: "Menerapkan formula eksponensial di setiap simpul jaringan produksi."
        },
        kalkulatorType: "laplace"
      };
      setCustomMaterials((prev) => [generatedFallback, ...prev]);
      setSelectedMaterialId(generatedFallback.id);
      setSelectedTab("materi");
      setMateriSection("ringkasan");
      setSearchQuery("");
    } finally {
      setIsGeneratingMaterial(false);
    }
  };
  
  // App UI Navigation States & Selected Level Databases
  const [selectedLevel, setSelectedLevel] = useState<"SD" | "SMP" | "SMA" | "SMK" | "Kuliah">("SMK");
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("smk-nirmana");
  const [selectedTab, setSelectedTab] = useState<"materi" | "arsitektur" | "visual">("materi");
  const [materiSection, setMateriSection] = useState<"ringkasan" | "kalkulator" | "kamus" | "langkah" | "studi-kasus">("ringkasan");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  // AI Chatbot States (floating assistant)
  const [chatbotOpen, setChatbotOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Halo! Saya Tutor AI Pintar Pusat Ilmu. Ada konsep materi, rumus sains, teori kontral, atau teori rupa (seperti roda warna Nirmana) yang ingin Anda bahas? Saya dapat membantu di semua jenjang dari SD, SMP, SMA, SMK, hingga Perkuliahan!" }
  ]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // Customizable Color Wheel States for Nirmana Visual Weights
  const [leftColor, setLeftColor] = useState<string>("#06b6d4"); // default cyan
  const [rightColor, setRightColor] = useState<string>("#dc2626"); // default red

  // AI Dynamic Custom Materials Generator States (makes it so literally every subject exists)
  const [customMaterials, setCustomMaterials] = useState<AcademicMaterial[]>([]);
  const [isGeneratingMaterial, setIsGeneratingMaterial] = useState<boolean>(false);

  // Combine static database with user generated content dynamically
  const allMaterials = useMemo(() => {
    return [...materialsDatabase, ...customMaterials];
  }, [customMaterials]);

  // Active Material lookup
  const activeMaterial = useMemo(() => {
    return allMaterials.find(m => m.id === selectedMaterialId) || allMaterials[0];
  }, [selectedMaterialId, allMaterials]);

  // Real-time Search lookup across entire database covering SD through University
  const filteredSearchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    
    // If no query, return original database
    let results = allMaterials;
    
    if (query) {
      results = allMaterials.filter(m => {
        const matchBasic = 
          m.level.toLowerCase().includes(query) ||
          m.mapel.toLowerCase().includes(query) ||
          m.bab.toLowerCase().includes(query) ||
          m.topic.toLowerCase().includes(query) ||
          m.topicDesc.toLowerCase().includes(query) ||
          m.summaryIntro.toLowerCase().includes(query);
          
        const matchTerms = m.terms && m.terms.some(t => 
          t.term.toLowerCase().includes(query) || 
          t.definition.toLowerCase().includes(query)
        );
        
        const matchSteps = m.steps && m.steps.some(s => 
          s.title.toLowerCase().includes(query) || 
          s.dsc.toLowerCase().includes(query)
        );
        
        const matchStudi = m.studiKasus && (
          m.studiKasus.title.toLowerCase().includes(query) ||
          m.studiKasus.description.toLowerCase().includes(query) ||
          m.studiKasus.problem.toLowerCase().includes(query) ||
          m.studiKasus.solution.toLowerCase().includes(query)
        );
        
        return matchBasic || matchTerms || matchSteps || matchStudi;
      });
    }
    
    // Filter further by the search filter tab (Semua, SD, SMP, SMA, SMK, Kuliah)
    if (searchFilter !== "Semua") {
      results = results.filter(m => m.level === searchFilter);
    }
    
    return results;
  }, [searchQuery, searchFilter]);

  // Trigger automatic AI lesson generation if search yields 0 matches and user stopped typing
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) return;
    
    // Check if we have results in filteredSearchResults
    // If not, and we are not currently generating, trigger handleGenerateDynamicMaterial
    if (filteredSearchResults.length === 0 && !isGeneratingMaterial) {
      const timer = setTimeout(() => {
        handleGenerateDynamicMaterial();
      }, 750); // Automatically trigger background generation after a brief typing pause
      return () => clearTimeout(timer);
    }
  }, [searchQuery, filteredSearchResults.length, isGeneratingMaterial]);

  // Custom simulator states for secondary levels to ensure zero static text
  // SD Photosynthesis Simulator states
  const [sdLight, setSdLight] = useState<number>(6);
  const [sdCo2, setSdCo2] = useState<number>(7);
  const [sdWater, setSdWater] = useState<number>(5);

  // SMP Algebra PLSV Simulator states
  const [smpA, setSmpA] = useState<number>(3);
  const [smpB, setSmpB] = useState<number>(6);
  const [smpC, setSmpC] = useState<number>(21);

  // SMA Thermodynamics Simulator states
  const [smaHeat, setSmaHeat] = useState<number>(600);
  const [smaWork, setSmaWork] = useState<number>(240);

  // College control theory states
  const [uniDamping, setUniDamping] = useState<number>(0.5);
  const [uniFrequency, setUniFrequency] = useState<number>(5);

  // Math visual weight simulator states (W_visual = M * C * D)
  // Left visual element
  const [leftMass, setLeftMass] = useState<number>(6);
  const [leftChroma, setLeftChroma] = useState<number>(8); // Saturation 1-10
  const [leftDistance, setLeftDistance] = useState<number>(4); // Dist from center 1-10

  // Right visual element
  const [rightMass, setRightMass] = useState<number>(4);
  const [rightChroma, setRightChroma] = useState<number>(5);
  const [rightDistance, setRightDistance] = useState<number>(9);

  // Billboard before / after state switcher (Case study)
  const [billboardBalanced, setBillboardBalanced] = useState<boolean>(false);

  // Dynamic routing key generator states
  const [simLevel, setSimLevel] = useState<string>("SMK");
  const [simMapel, setSimMapel] = useState<string>("Produktif Desain Grafis");
  const [simTopic, setSimTopic] = useState<string>("Prinsip Dasar Nirmana");

  // Calculate Weights
  const leftWeight = useMemo(() => {
    return parseFloat((leftMass * leftChroma * leftDistance).toFixed(1));
  }, [leftMass, leftChroma, leftDistance]);

  const rightWeight = useMemo(() => {
    return parseFloat((rightMass * rightChroma * rightDistance).toFixed(1));
  }, [rightMass, rightChroma, rightDistance]);

  const balanceRatio = useMemo(() => {
    if (leftWeight === 0 && rightWeight === 0) return 1;
    const larger = Math.max(leftWeight, rightWeight);
    const smaller = Math.min(leftWeight, rightWeight);
    return parseFloat((smaller / larger).toFixed(2));
  }, [leftWeight, rightWeight]);

  const balanceStatus = useMemo(() => {
    const diff = Math.abs(leftWeight - rightWeight);
    if (diff <= 15) return { text: "Seimbang Sempurna (Harmonis)", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    if (diff <= 45) return { text: "Seimbang Asimetris (Dinamis)", color: "text-amber-600 bg-amber-50 border-amber-200" };
    return { text: "Kacau / Timpang (Tidak Estetik)", color: "text-rose-600 bg-rose-50 border-rose-200" };
  }, [leftWeight, rightWeight]);

  // Handle register / SSO submit
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistered(true);
  };

  const handleSSO = () => {
    setEmail("budi.prasetyo@belajar.id");
    setIsRegistered(true);
  };

  // Level Swatches
  const levelSwatches = [
    { level: "SD", color: "#ea580c", bg: "bg-[#ea580c]", name: "Merah Bata", desc: "Aksen ceria & hangat untuk fondasi dasar belajar" },
    { level: "SMP", color: "#2563eb", bg: "bg-[#2563eb]", name: "Biru Safir", desc: "Kombinasi kokoh untuk masa transisi akademik" },
    { level: "SMA", color: "#4b5563", bg: "bg-[#4b5563]", name: "Abu-Abu", desc: "Monokrom modern untuk analisis teoretis umum" },
    { level: "SMK", color: "#dc2626", bg: "bg-[#dc2626]", name: "Deep Red (Merah Tua Solid)", desc: "Menyimbolkan kompetensi produktif, fokus industri, & gairah kerja" },
    { level: "Kuliah", color: "#7c3aed", bg: "bg-[#7c3aed]", name: "Ungu", desc: "Melambangkan riset multidisiplin & spesialisasi tingkat lanjut" }
  ];

  const handleCopyColor = (colorCode: string) => {
    navigator.clipboard.writeText(colorCode);
    setCopiedColor(colorCode);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  // Formatted terms table
  const terms: TableOfTerms[] = [
    {
      term: "Dwimatra",
      definition: "Unsur rupa dua dimensi yang memiliki dimensi panjang dan lebar pada suatu bidang datar (flat plane). Tidak memiliki kedalaman fisik riil, melainkan kedalaman semu (optical depth) yang diciptakan melaui permainan saturasi warna, pertindihan (overlapping), atau perspektif.",
      significance: "Fondasi utama penataan komposisi media grafis statis seperti poster, flayer, logo, dan tata letak perwajahan buku."
    },
    {
      term: "Garis Semu",
      definition: "Garis tak kasat mata yang terbentuk dari relasi penataan elemen-elemen rupa yang berjajar, berirama, atau mempunyai kemiripan bentuk. Garis ini menuntun pergerakan mata pengamat (eyeflow) mengarungi keseluruhan tata letak dari titik fokus utama ke detail lainnya secara berurutan.",
      significance: "Mengontrol arah psikologi baca pengamat, memastikan informasi kritis terbaca terlebih dahulu (hierarki visual jitu)."
    },
    {
      term: "Keseimbangan Asimetris",
      definition: "Metode distribusi bobot visual (Visual Weight) kiri-kanan atau atas-bawah yang posisinya tidak identik/cermin, melainkan dicapai lewat kontras skala Massa, intensitas warna (Chroma), atau jarak spasial elemen tersebut dari sumbu gravitasi imajiner.",
      significance: "Menghasilkan respons emosi desain yang dinamis, modern, berenergi, serta tidak kaku jika dibandingkan keseimbangan simetris biasa."
    }
  ];

  // Simulator database key calculator
  const computedKey = useMemo(() => {
    const formatLevel = simLevel.toUpperCase();
    const formatMapel = simMapel.toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 15)
      .toUpperCase();
    const formatTopic = simTopic.toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 15)
      .toUpperCase();
    return `${formatLevel}#${formatMapel}#${formatTopic}`;
  }, [simLevel, simMapel, simTopic]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-[#facc15] selection:text-slate-900 overflow-x-hidden">
      
      <AnimatePresence mode="wait">
        {!isRegistered ? (
          /* ======================================================== */
          /* TAMPILAN AWAL: HALAMAN REGISTRASI (BELAJAR.ID & SSO)     */
          /* ======================================================== */
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col md:flex-row min-h-screen"
          >
            {/* Bagian Kiri: Boarding Visionary Platform */}
            <div className="w-full md:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white flex flex-col p-8 md:p-16 justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#facc15]/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
              
              {/* Header Atas Kiri */}
              <div className="z-10 flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#facc15] rounded-xl flex items-center justify-center shadow-lg shadow-[#facc15]/20">
                  <BookOpen className="text-slate-900 w-5 h-5 font-bold" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-white flex items-center">
                    Pusat<span className="text-[#facc15] ml-1">Ilmu</span>
                  </h1>
                  <p className="text-[10px] text-slate-400 font-mono tracking-widest mt-[-2px]">PREMIUM DEMO PLATFORM</p>
                </div>
              </div>

              {/* Tagline Motivasi Kurikulum */}
              <div className="my-12 md:my-0 z-10 max-w-md">
                <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-mono tracking-wider uppercase">
                  Komite Ahli Terintegrasi
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mt-6 leading-tight">
                  Satu-Satunya Sumber <span className="text-[#facc15] underline decoration-wavy underline-offset-8">Kebenaran Informasi</span> Akademis Terkurasi AI.
                </h2>
                <p className="text-slate-300 mt-6 text-sm leading-relaxed">
                  Menyortir jutaan jurnal ilmiah, kurikulum nasional, hingga standar kompetensi vokasi industri. Menyajikan akurasi mutlak 100% tanpa kekeliruan logis demi kemajuan peserta didik Indonesia.
                </p>

                {/* Struktur Deskripsi Ahli */}
                <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-800">
                  <div>
                    <p className="text-xs text-slate-400">Arsitektur DB</p>
                    <p className="text-sm font-semibold text-white">Composite Discriminator</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Verifikasi Konten</p>
                    <p className="text-sm font-semibold text-white">AI-Consensus Zero Error</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Desain & Lab Rupa</p>
                    <p className="text-sm font-semibold text-white">Simulasi Roda Warna & Lab Terapan</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Sertifikasi Pendidikan</p>
                    <p className="text-sm font-semibold text-[#facc15]">Pusat Ilmu Terintegrasi</p>
                  </div>
                </div>
              </div>

              {/* Credit Footer */}
              <div className="z-10 text-xs text-slate-500 flex items-center justify-between">
                <span>Versi 1.1 Demo • 2026</span>
                <span className="flex items-center gap-1 font-mono">
                  <Database className="w-3.5 h-3.5 text-[#facc15]" /> DB_PARTITION_READY
                </span>
              </div>
            </div>

            {/* Bagian Kanan: Modul Registrasi minimalis dengan aksen warna #facc15 */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-16 bg-slate-50">
              <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                
                {/* Header kuning modern cerah dengan aksen tinggi grafis (#facc15) */}
                <div className="h-3 bg-[#facc15] w-full"></div>
                
                <div className="p-8">
                  {/* Container Logo Terisolasi - CUSTOM DEV FRIENDLY */}
                  <div className="flex flex-col items-center mb-8 border-b border-dashed border-slate-100 pb-6">
                    <p className="text-[10px] text-slate-400 font-mono tracking-widest mb-3 uppercase">
                      DEVELOPER INTEGRATION SUITE
                    </p>
                    
                    {/* KUSTOMISASI LOGO DEVELOPER START */}
                    <div 
                      id="developer-logo-container" 
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-[#facc15] transition-all flex items-center justify-center w-full max-w-[220px]"
                      title="Customizer: Tukar tautan src gambar di bawah untuk mengubah logo platform utama"
                    >
                      <img 
                        src="https://naughty-aqua-idlqsppuxi.edgeone.app/Black%20White%20Modern%20%20Simple%20Creative%20Studio%20Huge%20Logo_20260526_134212_0000.png" 
                        alt="Logo Resmi Pusat Ilmu"
                        className="max-h-16 w-auto object-contain transition-transform hover:scale-105"
                        onError={(e) => {
                          // Fallback jika terjadi kegagalan hosting gambar luar biasa
                          (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=120";
                        }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {/* KUSTOMISASI LOGO DEVELOPER END */}
                    
                    <span className="mt-2.5 text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border border-emerald-100">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      Custom Dev Friendly Isolated Container
                    </span>
                  </div>

                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Kredensial Masuk Demonstrasi</h3>
                    <p className="text-slate-500 text-xs mt-1">Pilih metode masuk terverifikasi untuk menuju ke halaman materi</p>
                  </div>

                  {/* TAB SWITCHER INDAH (CUSTOM INTEGRATION) */}
                  <div className="flex bg-slate-100 p-1.5 rounded-xl mb-6 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab("email");
                        setIsOtpSent(false);
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                        authTab === "email" ? "bg-[#facc15] text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Email Sekolah</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab("sso");
                        setIsOtpSent(false);
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                        authTab === "sso" ? "bg-[#facc15] text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <span>Google SSO</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab("phone");
                        setIsOtpSent(false);
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                        authTab === "phone" ? "bg-[#facc15] text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <span>No. Telepon</span>
                    </button>
                  </div>

                  {/* TAMPILAN RENDERING BERDASARKAN TAB AKTIF */}
                  <AnimatePresence mode="wait">
                    {authTab === "email" && (
                      <motion.form 
                        key="email-form"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        onSubmit={handleRegister} 
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                            Alamat Email Resmi Sekolah
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                              <User className="w-4 h-4" />
                            </span>
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="nama.kamu@sekolah.sch.id"
                              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#facc15] focus:border-[#facc15] transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                            Kata Sandi Keamanan
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                              <Lock className="w-4 h-4" />
                            </span>
                            <input
                              type="password"
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#facc15] focus:border-[#facc15] transition-all"
                            />
                          </div>
                        </div>

                        {/* Checkbox Persetujuan Ketentuan */}
                        <div className="flex items-center space-x-2 text-xs text-slate-500">
                          <input 
                            type="checkbox" 
                            required 
                            id="terms-email" 
                            className="rounded border-slate-300 text-[#facc15] focus:ring-[#facc15] h-4 w-4 cursor-pointer"
                          />
                          <label htmlFor="terms-email" className="cursor-pointer">
                            Saya menyetujui Akses Database Pusat Ilmu & Kurikulum SMK Terbuka.
                          </label>
                        </div>

                        {/* Tombol Daftar/Masuk dengan Animasi Hover */}
                        <button
                          type="submit"
                          className="w-full py-3 bg-[#facc15] hover:bg-yellow-500 text-slate-900 font-bold rounded-xl shadow-lg shadow-yellow-200 transition-all flex items-center justify-center space-x-2 group cursor-pointer"
                        >
                          <span>Masuk ke Pusat Ilmu</span>
                          <ArrowRight className="w-4 h-4 text-slate-900 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </motion.form>
                    )}

                    {authTab === "sso" && (
                      <motion.div 
                        key="sso-form"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-4"
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-1">
                            Pilih Layanan Google SSO Anda
                          </p>
                          <p className="text-[11px] text-slate-400 text-center mb-4">
                            Sistem Pusat Ilmu terintegrasi langsung dengan ekosistem belajar digital
                          </p>
                        </div>
                        
                        {/* Google Belajar.id */}
                        <button
                          type="button"
                          onClick={() => {
                            setGoogleChooserOpen(true);
                          }}
                          className="w-full flex items-center justify-between py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl border border-slate-950 focus:outline-none focus:ring-2 focus:ring-[#facc15] focus:ring-offset-2 transition-all shadow-md group cursor-pointer"
                        >
                          <div className="flex items-center space-x-3">
                            <svg className="w-5 h-5 text-[#facc15] group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.25.61 4.46 1.64l2.5-2.5C17.43 1.5 14.97 1 12.24 1 6.7 1 2.2 5.5 2.2 11s4.5 10 10.04 10c5.78 0 9.66-4.06 9.66-9.83 0-.6-.04-1.21-.13-1.88H12.24z"/>
                            </svg>
                            <span className="text-sm font-semibold">Google Belajar.id</span>
                          </div>
                          <span className="text-[10px] bg-slate-850 text-slate-200 px-2.5 py-0.5 rounded font-mono">Pilih Sesi Akun</span>
                        </button>

                        {/* Google Akun Umum */}
                        <button
                          type="button"
                          onClick={() => {
                            setGoogleChooserOpen(true);
                          }}
                          className="w-full flex items-center justify-between py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#facc15] focus:ring-offset-2 transition-all shadow-md group cursor-pointer"
                        >
                          <div className="flex items-center space-x-3">
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                              <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.08H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.92l2.85-2.22.81-.6z" fill="#FBBC05"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 11.99 1 7.7 1 3.99 3.47 2.18 7.08l3.66 2.84c.87-2.6 3.3-4.54 6.16-4.54z" fill="#EA4335"/>
                            </svg>
                            <span className="text-sm font-semibold">Google Akun Umum</span>
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded font-mono font-bold">Pilih Sesi Akun</span>
                        </button>

                        <p className="text-[11px] text-center text-slate-400 mt-2 leading-relaxed font-medium">
                          Sistem SSO Google Belajar.id dan Akun Gmail personal terintegrasi langsung dengan panel verifikasi keamanan multi-jenjang terpadu. Notifikasi audit keamanan dikirim instan pada email yang dimasukkan.
                        </p>
                      </motion.div>
                    )}

                    {authTab === "phone" && (
                      <motion.form 
                        key="phone-form"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!isOtpSent) {
                            setIsOtpSent(true);
                          } else {
                            setEmail(`+62 ${phoneNo || "812-3456-7890"}`);
                            setIsRegistered(true);
                          }
                        }} 
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                            Nomor Telepon Seluler (Selesai WhatsApp)
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 text-sm font-mono font-bold">
                              +62
                            </span>
                            <input
                              type="tel"
                              required
                              disabled={isOtpSent}
                              value={phoneNo}
                              onChange={(e) => setPhoneNo(e.target.value.replace(/[^0-9]/g, ""))}
                              placeholder="81234567890"
                              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#facc15] focus:border-[#facc15] transition-all disabled:opacity-60"
                            />
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1.5">
                            Kami akan mengirimkan Token Keamanan Verifikasi 6 digit langsung ke WhatsApp Anda.
                          </p>
                        </div>

                        {isOtpSent && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-emerald-50 border border-emerald-100 p-4.5 rounded-xl space-y-2"
                          >
                            <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider">
                              Verifikasi Token OTP Keamanan
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                maxLength={6}
                                required
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                                placeholder="Ketik 6 digit bebas (Contoh: 121543)"
                                className="w-full px-4 py-2.5 bg-white border border-emerald-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#facc15] tracking-widest text-center font-mono font-bold text-lg"
                              />
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-emerald-700 font-semibold font-mono">
                              <span>WhatsApp Token Terkirim!</span>
                              <button 
                                type="button"
                                onClick={() => setOtpCode("382941")} 
                                className="text-[#dc2626] underline hover:text-red-700"
                              >
                                Isi Otomatis Token Demo (382941)
                              </button>
                            </div>
                          </motion.div>
                        )}

                        <div className="flex items-center space-x-2 text-xs text-slate-500">
                          <input 
                            type="checkbox" 
                            required 
                            id="terms-phone" 
                            className="rounded border-slate-300 text-[#facc15] focus:ring-[#facc15] h-4 w-4 cursor-pointer"
                          />
                          <label htmlFor="terms-phone" className="cursor-pointer">
                            Saya menyetujui Akses Database Pusat Ilmu & OTP WhatsApp Sekolah.
                          </label>
                        </div>

                        {/* Tombol Daftar/Masuk dengan Animasi Hover */}
                        <button
                          type="submit"
                          className="w-full py-3 bg-[#facc15] hover:bg-yellow-500 text-slate-900 font-bold rounded-xl shadow-lg shadow-yellow-200 transition-all flex items-center justify-center space-x-2 group cursor-pointer"
                        >
                          <span>{isOtpSent ? "Verifikasi OTP & Masuk" : "Kirim OTP WhatsApp"}</span>
                          <ArrowRight className="w-4 h-4 text-slate-900 group-hover:translate-x-1 transition-transform" />
                        </button>

                        {isOtpSent && (
                          <button
                            type="button"
                            onClick={() => setIsOtpSent(false)}
                            className="w-full text-center text-slate-500 hover:text-slate-800 text-xs font-semibold underline block mt-1"
                          >
                            Ubah Nomor Telepon
                          </button>
                        )}
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ======================================================== */
          /* TAMPILAN DASHBOARD UTAMA: HEADER KUNING & AKSEN SMK RED  */
          /* ======================================================== */
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex flex-col min-h-screen"
          >
            {/* 1. HEADER ATAS WARNA KUNING TERANG (#facc15) */}
            <header className="bg-[#facc15] border-b border-yellow-500/30 sticky top-0 z-30 shadow-md">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                
                {/* Logo & Identitas Platform */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 bg-slate-950 rounded-lg flex items-center justify-center shadow-md">
                      <BookOpen className="text-[#facc15] w-4.5 h-4.5 font-bold" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg font-extrabold text-slate-950 tracking-tight">Pusat Ilmu</span>
                        <span className="bg-slate-900 text-[#facc15] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                          Vokasi V.1
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-800 font-medium">Sistem Pengetahuan Nasional Tepercaya</p>
                    </div>
                  </div>

                  {/* Kustomisasi logout cepet */}
                  <button 
                    onClick={() => setIsRegistered(false)}
                    className="md:hidden text-slate-950 bg-yellow-400 hover:bg-yellow-500 rounded-lg p-2 text-xs font-semibold border border-yellow-600/30 transition-all cursor-pointer"
                  >
                    Keluar
                  </button>
                </div>

                {/* Kolom Pencarian Bentuk Kapsul Universal & Detail Penyaring Jenjang */}
                <div className="flex-1 max-w-lg mx-auto md:mx-6 w-full relative">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-slate-700" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari kurikulum & materi lengkap (contoh: Aljabar, Fotosintesis)..."
                      className="block w-full pl-10 pr-24 py-2.5 bg-yellow-101/60 border border-yellow-600/20 rounded-full text-slate-900 placeholder-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white focus:border-slate-900 transition-all shadow-inner font-medium"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 gap-1.5">
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery("")}
                          className="text-xs text-slate-600 hover:text-slate-900 cursor-pointer bg-slate-900/5 px-2 py-1 rounded-full"
                        >
                          Hapus
                        </button>
                      )}
                      <span className="text-[9px] bg-slate-900 text-yellow-400 font-mono font-extrabold px-2 py-1 rounded-full leading-none shrink-0 selection:bg-transparent">
                        SD-UNIV
                      </span>
                    </div>
                  </div>

                  {/* Quick Education Level Filters for Comprehensive Search from SD to College */}
                  <div className="flex items-center gap-1.5 mt-2 py-0.5 overflow-x-auto whitespace-nowrap scrollbar-none select-none">
                    <span className="text-[10px] text-slate-800 font-bold uppercase tracking-wider bg-yellow-400/50 px-2 py-0.5 rounded-md border border-slate-950/5">
                      Pencarian Menyeluruh:
                    </span>
                    {(["Semua", "SD", "SMP", "SMA", "SMK", "Kuliah"] as const).map((lvl) => {
                      const isActive = searchFilter === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setSearchFilter(lvl)}
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                            isActive
                              ? "bg-slate-950 text-[#facc15] shadow-md border border-slate-950"
                              : "bg-yellow-400/20 text-slate-900 hover:bg-yellow-400/40 border border-transparent"
                          }`}
                        >
                          {lvl}
                        </button>
                      );
                    })}
                  </div>

                  {/* Real-time dropdown search suggestions overlay */}
                  {searchQuery && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50 text-slate-850 text-sm max-h-96 overflow-y-auto">
                      <div className="bg-slate-50 px-4 py-2.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 flex items-center justify-between">
                        <span>Hasil Pencarian Pusat Ilmu • {searchFilter === "Semua" ? "Seluruh Jenjang" : `Jenjang ${searchFilter}`}</span>
                        <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1.5 font-sans font-bold border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Database Komplit & Detail
                        </span>
                      </div>
                      {isGeneratingMaterial ? (
                        <div className="p-8 text-center space-y-4">
                          <div className="flex justify-center relative">
                            <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-[#facc15] border-b-[#facc15] animate-spin"></div>
                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-base">🔮</span>
                          </div>
                          <div className="space-y-1.5">
                            <p className="font-extrabold text-slate-900 text-xs text-center animate-pulse">
                              AI sedang merancang modul kustom untuk "{searchQuery}"...
                            </p>
                            <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                              Mohon tunggu sebentar agar materi terbaik siap untukmu. Kurikulum Pusat Ilmu sedang menyusun glosarium dan lab simulasi.
                            </p>
                          </div>
                        </div>
                      ) : filteredSearchResults.length > 0 ? (
                        <>
                          <div className="bg-[#facc15]/10 px-4 py-2 text-[10px] font-semibold text-slate-700 leading-relaxed border-b border-slate-100 italic">
                            🔍 Temuan database instan. Butuh topik kustom baru? Cukup ketik saja, AI akan memicu modul unik seketika!
                          </div>
                          {filteredSearchResults.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => {
                                setSelectedLevel(m.level);
                                setSelectedMaterialId(m.id);
                                setSelectedTab("materi");
                                setMateriSection("ringkasan");
                                setSearchQuery("");
                              }}
                              className="w-full text-left px-4 py-3.5 hover:bg-slate-50/80 transition-all flex items-center justify-between border-b border-slate-100 last:border-0 group select-none cursor-pointer"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-[9px] font-black text-white px-2 py-0.5 rounded font-mono shadow-sm" style={{ backgroundColor: m.color }}>
                                    {m.level}
                                  </span>
                                  <span className="font-extrabold text-xs text-slate-500 truncate leading-none">
                                    {m.mapel}
                                  </span>
                                </div>
                                <p className="font-extrabold text-slate-900 text-xs mt-1.5 truncate">
                                  {m.topic}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate mt-0.5 leading-snug">
                                  {m.topicDesc}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-amber-500 transition-all shrink-0" />
                            </button>
                          ))}
                        </>
                      ) : (
                        <div className="p-8 text-center space-y-4 animate-fade-in">
                          <div className="flex justify-center relative">
                            <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-yellow-400 border-r-[#7c3aed] border-b-yellow-400 border-l-[#7c3aed] animate-spin"></div>
                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">🌌</span>
                          </div>
                          <div className="space-y-1.5">
                            <p className="font-extrabold text-[#7c3aed] text-xs">
                              AI sedang merancang modul kustom untuk "{searchQuery}"...
                            </p>
                            <p className="text-[10px] text-slate-400 max-w-sm mx-auto leading-relaxed animate-pulse">
                              Mohon tunggu sebentar agar materi terbaik siap untukmu. Sistem menyusun silabus kustom tanpa perlu mengklik tombol manual secara membingungkan.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Profil Pengguna Aktif */}
                <div className="hidden md:flex items-center space-x-3.5">
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-950 truncate max-w-[200px]">{email || "budi.prasetyo@belajar.id"}</p>
                    <p className="text-[10px] text-slate-800 font-bold uppercase tracking-wider flex items-center justify-end gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      {email && email.includes("belajar.id") ? "Akun Kemendikbud" : email && email.includes("gmail") ? "Akun Google Umum" : "Siswa Terdaftar"}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center font-black text-white text-sm shadow-md cursor-help uppercase" title={`Akun Google Anda: ${email}`}>
                    {email ? email.substring(0,2).toUpperCase() : "BP"}
                  </div>
                  <button 
                    onClick={() => {
                      setIsRegistered(false);
                      setShowSecurityNotification(false);
                    }}
                    className="text-slate-950 hover:bg-yellow-400 border border-yellow-600/20 bg-yellow-300 rounded-lg py-1.5 px-3 text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    Keluar Demo
                  </button>
                </div>

              </div>
            </header>

            {/* Banner Kurikulum Cepat */}
            <div className="bg-slate-900 text-white text-xs py-2 px-4 shadow-sm border-b border-slate-800">
              <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2 gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-[#dc2626] animate-pulse"></span>
                  <p className="text-slate-300">
                    Sistem Database Utama Aktif: <strong className="text-white">Composite Route Discriminator</strong> terpasang.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
                    Node: ID-JAKARTA-01
                  </span>
                  <span className="text-[#facc15] font-semibold text-[11px]">
                    Hari Ini: {new Date().toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Tata Letak Utama: Kiri (Sidebar), Kanan (Materi Area) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col lg:flex-row gap-8 w-full">
              
              {/* SIDEBAR NAVIGASI KATEGORI (SEBELAH KIRI) */}
              <aside className="w-full lg:w-64 shrink-0 space-y-6">
                
                {/* 1. Pemilih Cepat Jenjang Pendidikan */}
                <div className="bg-white rounded-2xl border border-slate-205/80 shadow-sm p-4 space-y-2">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 px-1 mb-1.5 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-slate-500 animate-spin-slow" /> Jelajahi Jenjang Ilmu
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {levelSwatches.map((sw) => {
                      const isActive = selectedLevel === sw.level;
                      return (
                        <button
                          key={sw.level}
                          onClick={() => {
                            setSelectedLevel(sw.level as any);
                            const targetMap = materialsDatabase.find(m => m.level === sw.level);
                            if (targetMap) {
                              setSelectedMaterialId(targetMap.id);
                              setMateriSection("ringkasan");
                              setSelectedTab("materi");
                            }
                          }}
                          className={`py-2 px-1 hover:bg-slate-100 border text-center rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 justify-center ${
                            isActive 
                              ? "bg-slate-900 border-slate-950 text-white hover:bg-slate-950" 
                              : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: sw.color }}></span>
                          <span>{sw.level}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 1.1 Dynamic Badge Tingkat & Informasi Mapel */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group">
                  {/* Decorative corner stripe matching active theme color */}
                  <div className="absolute top-0 right-0 w-2.5 h-full" style={{ backgroundColor: activeMaterial.color }}></div>
                  
                  <div className="mb-3.5 flex items-center justify-between">
                    {/* Badge Tingkat */}
                    <span 
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold leading-none border"
                      style={{ 
                        color: activeMaterial.color, 
                        borderColor: `${activeMaterial.color}30`,
                        backgroundColor: `${activeMaterial.color}10` 
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse" style={{ backgroundColor: activeMaterial.color }}></span>
                      Tingkat {activeMaterial.level}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">AKADEMIS</span>
                  </div>

                  <h3 className="font-extrabold text-slate-800 text-base leading-tight">
                    {activeMaterial.mapel}
                  </h3>
                  <p className="text-slate-500 text-[11px] mt-1.5 leading-relaxed">
                    {activeMaterial.topicDesc}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Syllabus Code:</span>
                    <span className="font-bold" style={{ color: activeMaterial.color }}>{activeMaterial.syllabusCode}</span>
                  </div>
                </div>

                {/* 2. Menu Navigasi Sidebar - Daftar Bab Pembelajaran Dinamik */}
                <div className="bg-white rounded-2xl border border-slate-205/80 shadow-sm p-4 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2 flex items-center gap-1.5" style={{ color: activeMaterial.color }}>
                    <BookOpen className="w-3.5 h-3.5" /> Bab Aktif ({selectedLevel})
                  </p>
                  
                  <button className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between text-slate-400 bg-slate-50 border border-slate-150/20 cursor-not-allowed">
                    <span className="truncate">Bab 1: Pengantar Umum</span>
                    <Lock className="w-3 h-3 inline text-slate-300 ml-1.5 shrink-0" />
                  </button>

                  <button 
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-between transition-all"
                    style={{ 
                      color: activeMaterial.color,
                      backgroundColor: `${activeMaterial.color}15`,
                      border: `1px solid ${activeMaterial.color}25`
                    }}
                  >
                    <span className="truncate">{activeMaterial.bab}</span>
                    <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: activeMaterial.color }}></span>
                  </button>

                  <button className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-not-allowed">
                    <span className="truncate">Bab 3: Evaluasi Teoretis</span>
                    <Lock className="w-3 h-3 inline text-slate-300 ml-1.5 shrink-0" />
                  </button>
                </div>

                {/* 3. Panel Switcher Tab Utama */}
                <div className="bg-slate-900 rounded-2xl p-4 text-white space-y-2 border border-slate-800 shadow-lg">
                  <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-2 mb-2">
                    Lensa Penilai Expert
                  </p>
                  
                  <button
                    onClick={() => setSelectedTab("materi")}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      selectedTab === "materi" 
                        ? "bg-[#facc15] text-slate-950 font-bold" 
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Scale className="w-4 h-4" /> Contoh Konten Demo
                    </span>
                    <ChevronRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => setSelectedTab("arsitektur")}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      selectedTab === "arsitektur" 
                        ? "bg-[#facc15] text-slate-950 font-bold" 
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Database className="w-4 h-4" /> Arsitektur Nav & DB
                    </span>
                    <ChevronRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => setSelectedTab("visual")}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      selectedTab === "visual" 
                        ? "bg-[#facc15] text-slate-950 font-bold" 
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Palette className="w-4 h-4" /> Panduan Visual Figma
                    </span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

              </aside>

              {/* HALAMAN UTAMA MATERI & BLUEPRINT (SEBELAH KANAN) */}
              <main className="flex-1 min-w-0 space-y-6">

                {/* HEADER MENU TAB DALAM UTAMA */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-2.5 flex items-center gap-2 flex-wrap">
                  <div className="text-xs font-bold text-slate-400 px-3.5 select-none uppercase tracking-wider">Tampilan Aktif:</div>
                  
                  <button 
                    onClick={() => { setSelectedTab("materi"); setMateriSection("ringkasan"); }}
                    className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedTab === "materi" 
                        ? "text-white shadow-md relative group" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                    style={selectedTab === "materi" ? { backgroundColor: activeMaterial.color } : undefined}
                  >
                    1. Isi Dokumen Materi ({selectedLevel})
                  </button>
                  
                  <button 
                    onClick={() => setSelectedTab("arsitektur")}
                    className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedTab === "arsitektur" 
                        ? "bg-slate-900 text-white shadow-md shadow-slate-300" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    2. Arsitektur Sitemap & Composite DB Key
                  </button>

                  <button 
                    onClick={() => setSelectedTab("visual")}
                    className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedTab === "visual" 
                        ? "bg-amber-500 text-white shadow-md shadow-yellow-200" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    3. Panduan Visual Figma & Suku Warna
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {isGeneratingMaterial ? (
                    <motion.div
                      key="ai-generating-loader"
                      initial={{ opacity: 0, scale: 0.98, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: -15 }}
                      className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center space-y-6 flex flex-col items-center justify-center min-h-[500px] shadow-xl relative overflow-hidden"
                    >
                      {/* Decorative background visual blurs */}
                      <div className="absolute top-0 left-0 w-32 h-32 bg-yellow-400/5 rounded-full filter blur-2xl"></div>
                      <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-2xl"></div>

                      {/* Beautiful Cosmic Orbital Loader Icon */}
                      <div className="relative w-28 h-28 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-yellow-400 border-r-slate-900 border-b-yellow-400 animate-spin"></div>
                        <div className="absolute inset-3 rounded-full border-4 border-dashed border-slate-200 animate-spin-slow"></div>
                        <div className="absolute inset-6 rounded-full bg-slate-900 flex items-center justify-center shadow-lg">
                          <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
                        </div>
                      </div>

                      <div className="space-y-3.5 max-w-lg">
                        <span className="bg-slate-900 text-[#facc15] text-[9.5px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                          Pusat Ilmu AI • Kurikulum Otomatis
                        </span>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Reka Cipta Modul Pelajaran Kustom</h3>
                        <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                          AI sedang merancang modul kustom untuk <span className="text-slate-900 font-extrabold bg-slate-100 px-2.5 py-1 rounded inline-block">"{searchQuery || "Topik Pelajaran"}"</span>... Mohon tunggu sebentar agar materi terbaik siap untukmu.
                        </p>
                      </div>

                      {/* Interactive Progress Indicators with Micro-Animations */}
                      <div className="w-full max-w-sm bg-slate-50 p-5 rounded-2xl border border-slate-200/60 text-left space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1.5 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          <span>Kemajuan Operasi Sintetis AI:</span>
                        </div>
                        <div className="space-y-2 text-[11px] font-mono font-bold text-slate-600">
                          <div className="flex items-center gap-2 text-emerald-600 font-extrabold">
                            <span>✓</span> Menganalisis kurikulum tingkat {selectedLevel}
                          </div>
                          <div className="flex items-center gap-2 text-emerald-600 font-extrabold">
                            <span>✓</span> Menghubungkan modul terapan tingkat industri
                          </div>
                          <div className="flex items-center gap-2 text-amber-600 font-extrabold animate-pulse">
                            <span className="animate-spin text-amber-500 inline-block">⏳</span> Melakukan formulasi relasi & glosari rupa...
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                            <span>○</span> Mengompilasi lab simulasi kalkulator interaktif
                          </div>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-md">
                        Sembari menunggu, Anda bisa mengklik ikon **Chatbot AI Tutor** di sudut kanan bawah untuk bertanya secara interaktif!
                      </p>
                    </motion.div>
                  ) : null}

                  {/* TAB 1: KONTEN KEDUA DEMO MATERI DI LEVEL AKTIF */}
                  {selectedTab === "materi" && !isGeneratingMaterial && (
                    <motion.div
                      key="materi-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      {/* Sub-menu Materi untuk menavigasi bagian-bagian konten */}
                      <div className="flex bg-slate-200/60 p-1.5 rounded-xl gap-1 w-full overflow-x-auto whitespace-nowrap scrollbar-none">
                        <button
                          onClick={() => setMateriSection("ringkasan")}
                          className={`flex-1 py-1 px-3 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            materiSection === "ringkasan" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          1. Ringkasan & Rumus Utama
                        </button>
                        <button
                          onClick={() => setMateriSection("kalkulator")}
                          className={`flex-1 py-1 px-3 text-center rounded-lg text-xs font-bold transition-all relative cursor-pointer ${
                            materiSection === "kalkulator" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {activeMaterial.kalkulatorType === "nirmana_weight" && "Lab: Keseimbangan Nirmana"}
                          {activeMaterial.kalkulatorType === "photosynthesis" && "Lab: Simulasi Fotosintesis"}
                          {activeMaterial.kalkulatorType === "algebra" && "Lab: Keseimbangan Aljabar"}
                          {activeMaterial.kalkulatorType === "thermo" && "Lab: Piston Termodinamika"}
                          {activeMaterial.kalkulatorType === "laplace" && "Lab: Kontrol Laplace Osilasi"}
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] px-1 rounded-full animate-bounce font-mono">LAB</span>
                        </button>
                        <button
                          onClick={() => setMateriSection("kamus")}
                          className={`flex-1 py-2 px-3 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            materiSection === "kamus" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          2. Simbol & Istilah Teknis
                        </button>
                        <button
                          onClick={() => setMateriSection("langkah")}
                          className={`flex-1 py-2 px-3 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            materiSection === "langkah" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          3. Panduan Langkah Guru
                        </button>
                        <button
                          onClick={() => setMateriSection("studi-kasus")}
                          className={`flex-1 py-2 px-3 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            materiSection === "studi-kasus" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          4. Studi Kasus Industri
                        </button>
                      </div>

                      {/* MATERI SECTION 1: RINGKASAN & FORMULA */}
                      {materiSection === "ringkasan" && (
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
                          <header className="border-b border-slate-100 pb-4">
                            <h2 className="text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
                              {activeMaterial.topic}
                            </h2>
                            <p className="text-slate-500 text-xs mt-1">
                              Materi Inti Kurikulum Terpadu Tingkat {activeMaterial.level} • {activeMaterial.mapel} Semesta Alam Terverifikasi
                            </p>
                          </header>

                          {/* Penjelasan Ringkas Materi */}
                          <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200/40 relative overflow-hidden shadow-sm">
                            <FormattedExplanation text={activeMaterial.summaryIntro} />
                          </div>

                          {/* Presentasi Rumus Pembobotan Visual dengan Parameter Matematika */}
                          <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl text-white relative overflow-hidden border border-slate-800">
                            {/* Decorative Grid Pattern */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f005_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f005_1px,transparent_1px)] bg-[size:14px_24px]"></div>
                            
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                              <div className="max-w-lg">
                                <span 
                                  className="text-[10px] text-white font-mono uppercase tracking-widest px-2.5 py-0.5 rounded font-bold"
                                  style={{ backgroundColor: activeMaterial.color }}
                                >
                                  {activeMaterial.formulaTitle}
                                </span>
                                <h3 className="text-2xl sm:text-3xl font-mono font-extrabold mt-3 text-[#facc15] tracking-wide select-all bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 shadow-inner inline-block">
                                  {cleanFormulaPage(activeMaterial.formulaTex)}
                                </h3>
                                <p className="text-slate-300 text-xs mt-3 leading-relaxed">
                                  {activeMaterial.formulaSubtitle}
                                </p>
                              </div>

                              <div className="bg-slate-800/80 border border-slate-700/50 p-4.5 rounded-xl font-mono text-xs text-slate-300 space-y-2 min-w-[240px]">
                                <p className="text-white border-b border-slate-700 pb-1.5 font-bold flex items-center justify-between">
                                  <span>Simbol Utama:</span>
                                  <span className="text-[#facc15] font-semibold">Definisi Parameter</span>
                                </p>
                                {(activeMaterial.formulaDefinitions || []).map((fd) => (
                                  <p key={fd.symbol}><strong className="text-white">{fd.symbol}</strong> : {fd.definition}</p>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Info Banner */}
                          <div 
                            className="border rounded-xl p-4 flex items-start gap-3"
                            style={{ 
                              borderColor: `${activeMaterial.color}30`,
                              backgroundColor: `${activeMaterial.color}05`
                            }}
                          >
                            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: activeMaterial.color }} />
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: activeMaterial.color }}>
                                {activeMaterial.infoBannerTitle}
                              </h4>
                              <p className="text-slate-700 text-xs mt-1 leading-relaxed whitespace-pre-line">
                                {activeMaterial.infoBannerDesc}
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <button
                              onClick={() => setMateriSection("kalkulator")}
                              className="px-5 py-2.5 bg-slate-900 border border-slate-950 text-white font-bold rounded-xl text-xs hover:scale-103 transition-all flex items-center gap-2 cursor-pointer"
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = activeMaterial.color; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ""; }}
                            >
                              Buka Simulator Praktikum Interaktif <ArrowRight className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* MATERI SECTION: INTERAKTIF LAB (DENTED BY GRADE-LEVEL!) */}
                      {materiSection === "kalkulator" && (
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
                          
                          {/* 1. SD LEVEL SIMULATOR: PHOTOSYNTHESIS */}
                          {activeMaterial.kalkulatorType === "photosynthesis" && (
                            <>
                              <header className="border-b border-slate-100 pb-4 flex justify-between items-start gap-4">
                                <div>
                                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-mono text-[9px] font-bold rounded uppercase tracking-wider">
                                    LAB EKOSISTEM INTERAKTIF (SD)
                                  </span>
                                  <h2 className="text-2xl font-black text-slate-950 tracking-tight mt-1.5">
                                    Reaktor Fotosintesis Sel Hijau Daun
                                  </h2>
                                  <p className="text-slate-500 text-xs mt-1">
                                    Modifikasi asupan energi cahaya, air, dan CO₂ untuk melihat seberapa cepat sel tumbuhan melepaskan oksigen segar.
                                  </p>
                                </div>
                                <button 
                                  onClick={() => { setSdLight(6); setSdCo2(7); setSdWater(5); }}
                                  className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" /> Reset Default
                                </button>
                              </header>

                              {/* Virtual Reactor Stage */}
                              <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-6 text-white overflow-hidden relative border border-slate-950 flex flex-col justify-between min-h-[320px]">
                                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px]"></div>
                                
                                <div className="text-center relative z-10">
                                  <span className="text-[9px] font-mono tracking-widest text-[#22c55e] border border-emerald-800/50 px-3 py-1 rounded bg-slate-950/80 uppercase font-black">
                                    Simulasi Molekul Kloroplas Aktif
                                  </span>
                                </div>

                                {/* Leaf Node and Bubbles */}
                                <div className="my-6 relative h-40 flex items-center justify-center">
                                  {/* Sunshine Rays Visualization */}
                                  <div 
                                    className="absolute inset-0 bg-yellow-500/10 blur-xl transition-all duration-300"
                                    style={{ opacity: sdLight / 10 }}
                                  ></div>

                                  {/* Dynamic Air Molecule Bubble Icons */}
                                  <div className="absolute left-1/3 top-10 flex flex-col gap-2">
                                    {[...Array(Math.max(1, Math.round(sdLight * sdCo2 * sdWater * 0.015)))].map((_, i) => (
                                      <span 
                                        key={i} 
                                        className="w-2.5 h-2.5 bg-cyan-400/80 rounded-full border border-cyan-200 animate-bounce block shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                                        style={{ animationDelay: `${i * 0.4}s` }}
                                      ></span>
                                    ))}
                                  </div>

                                  {/* Plant Leaf representation */}
                                  <div className="relative z-10 w-28 h-28 bg-[#22c55e] rounded-full border-4 border-emerald-300 flex flex-col justify-center items-center shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:scale-105 transition-all">
                                    <span className="text-white text-[10px] font-black uppercase font-mono tracking-wider">KLOROFIL</span>
                                    <span className="text-[8px] text-emerald-100 font-mono">Reaktan Aktif</span>
                                    <span className="text-center font-mono text-[9px] bg-slate-950/40 text-emerald-250 px-1.5 py-0.5 rounded-full mt-1">
                                      Rate: {Math.round(sdLight * sdCo2 * sdWater * 0.5)} mg/m
                                    </span>
                                  </div>
                                </div>

                                {/* Outputs */}
                                <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs font-mono relative z-10">
                                  <div>
                                    Gula Terbuat (Karbohidrat): <span className="text-[#facc15] font-bold">{Math.round(sdLight * sdCo2 * sdWater * 0.5)} mg/menit</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    Oksigen Rerata: 
                                    <span className="px-2.5 py-0.5 rounded border border-emerald-500/30 text-emerald-400 bg-emerald-950/50 text-[10px] font-extrabold">
                                      +{Math.round(sdLight * sdCo2 * sdWater * 0.16)} mL O₂/menit
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Controls */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                                <div className="p-4 bg-slate-50 border border-slate-200/85 rounded-xl">
                                  <div className="flex justify-between text-xs font-extrabold text-slate-700 mb-2">
                                    <span className="flex items-center gap-1.5"><Sun className="w-4 h-4 text-amber-500" /> Sinar Matahari</span>
                                    <span className="text-amber-600 font-mono">{sdLight * 1500} Lux</span>
                                  </div>
                                  <input 
                                    type="range" min="1" max="10" 
                                    value={sdLight} 
                                    onChange={(e) => setSdLight(parseInt(e.target.value))}
                                    className="w-full accent-amber-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                  />
                                </div>

                                <div className="p-4 bg-slate-50 border border-slate-200/85 rounded-xl">
                                  <div className="flex justify-between text-xs font-extrabold text-slate-700 mb-2">
                                    <span className="flex items-center gap-1.5"><Wind className="w-4 h-4 text-cyan-500" /> Karbondioksida (CO₂)</span>
                                    <span className="text-cyan-600 font-mono">{sdCo2 * 100} ppm</span>
                                  </div>
                                  <input 
                                    type="range" min="1" max="10" 
                                    value={sdCo2} 
                                    onChange={(e) => setSdCo2(parseInt(e.target.value))}
                                    className="w-full accent-cyan-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                  />
                                </div>

                                <div className="p-4 bg-slate-50 border border-slate-200/85 rounded-xl">
                                  <div className="flex justify-between text-xs font-extrabold text-slate-700 mb-2">
                                    <span className="flex items-center gap-1.5"><Droplet className="w-4 h-4 text-blue-500" /> Suplai Air</span>
                                    <span className="text-blue-600 font-mono">{sdWater * 10} mL/min</span>
                                  </div>
                                  <input 
                                    type="range" min="1" max="10" 
                                    value={sdWater} 
                                    onChange={(e) => setSdWater(parseInt(e.target.value))}
                                    className="w-full accent-blue-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          {/* 2. SMP LEVEL SIMULATOR: ALGEBRA SCALE */}
                          {activeMaterial.kalkulatorType === "algebra" && (
                            <>
                              <header className="border-b border-slate-100 pb-4 flex justify-between items-start gap-4">
                                <div>
                                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 font-mono text-[9px] font-bold rounded uppercase tracking-wider">
                                    LAB EKSPRESI ALJABAR (SMP)
                                  </span>
                                  <h2 className="text-2xl font-black text-slate-950 tracking-tight mt-1.5">
                                    Simulator Neraca Persamaan Linear Satu Variabel
                                  </h2>
                                  <p className="text-slate-500 text-xs mt-1">
                                    Uraikan persamaan $A \cdot x + B = C$ dan saksikan keseimbangan neraca timbangan matematika secara visual.
                                  </p>
                                </div>
                                <button 
                                  onClick={() => { setSmpA(3); setSmpB(6); setSmpC(21); }}
                                  className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" /> Reset Default
                                </button>
                              </header>

                              {/* Virtual Balance Stage */}
                              <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-6 text-white overflow-hidden relative border border-slate-950 flex flex-col justify-between min-h-[320px]">
                                <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] [background-size:20px_20px]"></div>

                                <div className="text-center relative z-10 flex flex-col items-center">
                                  <span className="text-[9px] font-mono tracking-widest text-cyan-400 border border-blue-900/50 px-3 py-1 rounded bg-slate-950/80 uppercase font-black">
                                    Persamaan Terbentuk: {smpA}x + {smpB} = {smpC}
                                  </span>
                                </div>

                                {/* Interactive physical scale weight mockup */}
                                <div className="my-8 relative h-36 flex flex-col justify-between px-16">
                                  
                                  {/* Hanger and horizontal bracket */}
                                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4/5 h-1.5 bg-slate-700/80 rounded-full flex justify-between px-2">
                                    <div className="w-1.5 h-20 bg-slate-500/30 transform origin-top rotate-1 ml-4 shadow-md"></div>
                                    <div className="w-1.5 h-20 bg-slate-500/30 transform origin-top -rotate-1 mr-4 shadow-md"></div>
                                  </div>

                                  {/* Scale Trays */}
                                  <div className="flex justify-between items-end relative z-10 h-full">
                                    {/* Left Basket A * x + B */}
                                    <div className="flex flex-col items-center bg-slate-800/90 border border-slate-700/60 p-3 rounded-xl w-[40%] text-center min-h-[90px] justify-center shadow-lg shadow-black/40">
                                      <span className="text-[10px] font-mono text-cyan-400 font-bold mb-1.5">Sisi Kiri</span>
                                      <div className="flex items-center justify-center flex-wrap gap-1">
                                        {[...Array(Math.min(10, smpA))].map((_, i) => (
                                          <span key={i} className="bg-cyan-500/20 text-cyan-300 border border-cyan-400 px-1.5 py-0.5 rounded font-mono text-[9px] font-extrabold">x</span>
                                        ))}
                                        <span className="text-[10px] text-slate-400">+</span>
                                        <span className="bg-amber-500/20 text-amber-300 border border-amber-400 px-1.5 py-0.5 rounded font-mono text-[9px] font-extrabold">{smpB}</span>
                                      </div>
                                    </div>

                                    {/* Pivot central stand */}
                                    <div className="absolute left-1/2 bottom-0 w-4 h-24 bg-gradient-to-t from-slate-800 to-slate-600 rounded transform -translate-x-1/2 -z-10 shadow-md"></div>

                                    {/* Right Basket C */}
                                    <div className="flex flex-col items-center bg-slate-800/90 border border-slate-700/60 p-3 rounded-xl w-[40%] text-center min-h-[90px] justify-center shadow-lg shadow-black/40">
                                      <span className="text-[10px] font-mono text-amber-400 font-bold mb-1.5">Sisi Kanan</span>
                                      <div className="flex items-center justify-center">
                                        <span className="bg-amber-500/20 text-amber-300 border border-amber-400/90 px-2 py-1 rounded font-mono text-xs font-black">{smpC}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Outputs */}
                                <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs font-mono relative z-10">
                                  <div>
                                    Mencari Nilai x: <span className="text-cyan-400 font-black">({smpC} - {smpB}) / {smpA}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    Hasil Kalsifikasi: 
                                    {(smpC - smpB) % smpA === 0 ? (
                                      <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-black rounded uppercase">
                                        x = {Math.round((smpC - smpB) / smpA)} (Integer Valid)
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-amber-950/80 text-amber-400 border border-amber-500/30 text-[10px] font-black rounded uppercase">
                                        x = {((smpC - smpB) / smpA).toFixed(2)} (Pecahan Desimal)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Controls */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                                <div className="p-4 bg-slate-50 border border-slate-200/85 rounded-xl">
                                  <div className="flex justify-between text-xs font-extrabold text-slate-700 mb-2">
                                    <span>Koefisien Utama (A)</span>
                                    <span className="text-cyan-600 font-mono">{smpA}x</span>
                                  </div>
                                  <input 
                                    type="range" min="1" max="10" 
                                    value={smpA} 
                                    onChange={(e) => setSmpA(parseInt(e.target.value))}
                                    className="w-full accent-cyan-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                  />
                                </div>

                                <div className="p-4 bg-slate-50 border border-slate-200/85 rounded-xl">
                                  <div className="flex justify-between text-xs font-extrabold text-slate-700 mb-2">
                                    <span>Konstanta Kiri (B)</span>
                                    <span className="text-amber-600 font-mono">+{smpB}</span>
                                  </div>
                                  <input 
                                    type="range" min="0" max="25" 
                                    value={smpB} 
                                    onChange={(e) => setSmpB(parseInt(e.target.value))}
                                    className="w-full accent-amber-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                  />
                                </div>

                                <div className="p-4 bg-slate-50 border border-slate-200/85 rounded-xl">
                                  <div className="flex justify-between text-xs font-extrabold text-slate-700 mb-2">
                                    <span>Nilai Kanan (C)</span>
                                    <span className="text-slate-950 font-mono">{smpC}</span>
                                  </div>
                                  <input 
                                    type="range" min="1" max="50" 
                                    value={smpC} 
                                    onChange={(e) => setSmpC(parseInt(e.target.value))}
                                    className="w-full accent-slate-900 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          {/* 3. SMA LEVEL SIMULATOR: THERMODYNAMICS */}
                          {activeMaterial.kalkulatorType === "thermo" && (
                            <>
                              <header className="border-b border-slate-100 pb-4 flex justify-between items-start gap-4">
                                <div>
                                  <span className="px-2.5 py-0.5 bg-gray-100 text-gray-800 font-mono text-[9px] font-bold rounded uppercase tracking-wider">
                                    LAB TERMODINAMIKA (SMA)
                                  </span>
                                  <h2 className="text-2xl font-black text-slate-950 tracking-tight mt-1.5">
                                    Simulator Piston Hukum Pertama Termodinamika
                                  </h2>
                                  <p className="text-slate-500 text-xs mt-1">
                                    Eksplorasi perubahan Energi Dalam ($\Delta U$) di dalam tabung hampa melalui transfer kalor ($Q$) dan usaha mekanik ($W$).
                                  </p>
                                </div>
                                <button 
                                  onClick={() => { setSmaHeat(600); setSmaWork(240); }}
                                  className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" /> Reset Default
                                </button>
                              </header>

                              {/* Piston Stage representation */}
                              <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-6 text-white overflow-hidden relative border border-slate-950 flex flex-col justify-between min-h-[320px]">
                                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:24px_24px]"></div>

                                <div className="text-center relative z-10 flex flex-col items-center">
                                  <span className="text-[9px] font-mono tracking-widest text-orange-400 border border-orange-900/50 px-3 py-1 rounded bg-slate-950/80 uppercase font-black">
                                    REAKTUR ENERGI PARTIKEL GAS IDEAL
                                  </span>
                                </div>

                                {/* Cylinder representation */}
                                <div className="my-6 relative h-40 flex items-center justify-center">
                                  
                                  {/* Glass beaker boundaries */}
                                  <div className="w-56 h-36 border-b-4 border-l-4 border-r-4 border-slate-500 bg-slate-950/40 rounded-b-xl relative flex items-end">
                                    
                                    {/* Bouncing atoms representation */}
                                    <div className="absolute inset-0 overflow-hidden rounded-b-lg">
                                      {[...Array(Math.min(15, Math.ceil((smaHeat - smaWork) * 0.05)))].map((_, i) => (
                                        <span 
                                          key={i} 
                                          className="absolute w-2 h-2 bg-orange-400 rounded-full border border-orange-300 animate-ping"
                                          style={{
                                            left: `${(i * 12) % 90 + 5}%`,
                                            top: `${(i * 18) % 70 + 20}%`,
                                            animationDuration: `${0.8 + ((smaHeat - smaWork) / 500) * 0.4}s`
                                          }}
                                        ></span>
                                      ))}
                                    </div>

                                    {/* Moving piston head controlled via Usaha (W) */}
                                    <div 
                                      className="absolute left-0 right-0 h-4 bg-gradient-to-r from-gray-400 to-gray-200 border-y border-gray-600 transition-all duration-300 shadow-lg"
                                      style={{ bottom: `${20 + (smaWork / 500) * 80}px` }}
                                    >
                                      {/* Connecting Rod handle */}
                                      <div className="w-4 h-24 bg-gray-600 mx-auto -translate-y-24 rounded-full border-t border-gray-400"></div>
                                    </div>
                                  </div>
                                </div>

                                {/* Outputs */}
                                <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs font-mono relative z-10">
                                  <div>
                                    Internal Energy Gas ($\Delta U$): <span className="text-[#facc15] font-bold">{smaHeat - smaWork} Joules</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    Hukum I Termo: 
                                    <span className="px-2.5 py-0.5 rounded border border-orange-500/30 text-orange-400 bg-orange-950/50 text-[10px] font-extrabold">
                                      ΔU = Q - W ({smaHeat}J - {smaWork}J)
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Controls */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div className="p-4 bg-slate-50 border border-slate-200/85 rounded-xl">
                                  <div className="flex justify-between text-xs font-extrabold text-slate-700 mb-2">
                                    <span>Energi Kalor Masuk (Q)</span>
                                    <span className="text-orange-600 font-mono">{smaHeat} J</span>
                                  </div>
                                  <input 
                                    type="range" min="100" max="1000" step="10"
                                    value={smaHeat} 
                                    onChange={(e) => setSmaHeat(parseInt(e.target.value))}
                                    className="w-full accent-orange-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                  />
                                </div>

                                <div className="p-4 bg-slate-50 border border-slate-200/85 rounded-xl">
                                  <div className="flex justify-between text-xs font-extrabold text-slate-700 mb-2">
                                    <span>Usaha Mekanik Keluar (W)</span>
                                    <span className="text-gray-600 font-mono">{smaWork} J</span>
                                  </div>
                                  <input 
                                    type="range" min="50" max="500" step="10"
                                    value={smaWork} 
                                    onChange={(e) => setSmaWork(parseInt(e.target.value))}
                                    className="w-full accent-gray-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          {/* 4. COLLEGE LEVEL SIMULATOR: LAPLACE SPRING DAMPER */}
                          {activeMaterial.kalkulatorType === "laplace" && (
                            <>
                              <header className="border-b border-slate-100 pb-4 flex justify-between items-start gap-4">
                                <div>
                                  <span className="px-2.5 py-0.5 bg-violet-100 text-violet-800 font-mono text-[9px] font-bold rounded uppercase tracking-wider">
                                    LAB SISTEM KENDALI (KULIAH)
                                  </span>
                                  <h2 className="text-2xl font-black text-slate-950 tracking-tight mt-1.5">
                                    Grafik Respons Transien Domain Laplace & Redaman
                                  </h2>
                                  <p className="text-slate-500 text-xs mt-1">
                                    Atur parameter koefisien redaman ($\zeta$) dan frekuensi alami ($\omega_n$) untuk menghitung step response orde-2 dari sistem pegas mekanis.
                                  </p>
                                </div>
                                <button 
                                  onClick={() => { setUniDamping(0.5); setUniFrequency(5); }}
                                  className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" /> Reset Default
                                </button>
                              </header>

                              {/* Laplace Stage */}
                              <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-6 text-white overflow-hidden relative border border-slate-950 flex flex-col justify-between min-h-[320px]">
                                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] [background-size:14px_14px]"></div>

                                <div className="text-center relative z-10 flex justify-between items-center bg-slate-950/80 px-4 py-1.5 rounded border border-violet-900/50">
                                  <span className="text-[9px] font-mono tracking-widest text-[#a78bfa] uppercase font-black">
                                    H(s) = ωn² / (s² + 2ζωn s + ωn²)
                                  </span>
                                  <span className="text-[9px] font-mono tracking-wide text-amber-400">
                                    Mode: {uniDamping < 1 ? "Underdamped" : uniDamping === 1 ? "Critically Damped" : "Overdamped"}
                                  </span>
                                </div>

                                {/* Dynamic SVG Response Curve Generator based on Laplace */}
                                <div className="my-6 relative h-40 flex items-center justify-center">
                                  <svg className="w-full h-full max-w-lg overflow-visible" viewBox="0 0 300 120">
                                    {/* Grid background Lines */}
                                    <line x1="10" y1="100" x2="290" y2="100" stroke="#334155" strokeWidth="1.5" />
                                    <line x1="10" y1="10" x2="10" y2="105" stroke="#334155" strokeWidth="1.5" />
                                    <line x1="10" y1="60" x2="290" y2="60" stroke="#1e293b" strokeDasharray="4" />

                                    {/* Calculated SVG Points path */}
                                    <path
                                      d={`M ${[...Array(100)].map((_, i) => {
                                        const t = i * 0.15;
                                        const scaleX = 10 + i * 2.8;
                                        
                                        // Calculates simplified response curve
                                        let mag = 0;
                                        if (uniDamping < 1) {
                                          const wd = uniFrequency * Math.sqrt(1 - uniDamping * uniDamping);
                                          mag = 1 - Math.exp(-uniDamping * uniFrequency * t) * (
                                            Math.cos(wd * t) + (uniDamping * uniFrequency / wd) * Math.sin(wd * t)
                                          );
                                        } else {
                                          mag = 1 - Math.exp(-uniFrequency * t) * (1 + uniFrequency * t);
                                        }
                                        
                                        // Invert graph to fit SVG viewport height (top 0, bottom 120, baseline 100, steady state around 60)
                                        const scaleY = 100 - mag * 40;
                                        return `${scaleX} ${scaleY}`;
                                      }).join(" L ")}`}
                                      fill="none"
                                      stroke="#a78bfa"
                                      strokeWidth="2.5"
                                      className="transition-all duration-300 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)] animate-pulse"
                                    />
                                    
                                    {/* Static labels */}
                                    <text x="270" y="115" fill="#64748b" className="text-[7px] font-mono leading-none">Waktu (s)</text>
                                    <text x="15" y="20" fill="#64748b" className="text-[7px] font-mono leading-none">Amplitudo y(t)</text>
                                  </svg>
                                </div>

                                {/* Outputs */}
                                <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs font-mono relative z-10">
                                  <div>
                                    Frekuensi Tereksitasi: <span className="text-[#a78bfa] font-bold">{(uniFrequency * Math.sqrt(Math.abs(1 - uniDamping * uniDamping))).toFixed(2)} rad/s</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    Resonansi: 
                                    <span className="px-2.5 py-0.5 rounded border border-violet-500/30 text-violet-400 bg-violet-950/50 text-[10px] font-extrabold uppercase">
                                      {uniDamping < 0.707 ? "Osilatif Tinggi" : "Stabil Stabil"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Controls */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div className="p-4 bg-slate-50 border border-slate-200/85 rounded-xl">
                                  <div className="flex justify-between text-xs font-extrabold text-slate-700 mb-2">
                                    <span>Rasio Redaman Transien (ζ)</span>
                                    <span className="text-violet-600 font-mono">{uniDamping} ξ</span>
                                  </div>
                                  <input 
                                    type="range" min="0.05" max="1.5" step="0.05"
                                    value={uniDamping} 
                                    onChange={(e) => setUniDamping(parseFloat(e.target.value))}
                                    className="w-full accent-violet-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                  />
                                </div>

                                <div className="p-4 bg-slate-50 border border-slate-200/85 rounded-xl">
                                  <div className="flex justify-between text-xs font-extrabold text-slate-700 mb-2">
                                    <span>Frekuensi Alami Orde 2 (ωn)</span>
                                    <span className="text-violet-600 font-mono">{uniFrequency} rad/s</span>
                                  </div>
                                  <input 
                                    type="range" min="1" max="15" step="0.5"
                                    value={uniFrequency} 
                                    onChange={(e) => setUniFrequency(parseFloat(e.target.value))}
                                    className="w-full accent-violet-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          {/* 5. SMK LEVEL SIMULATOR: NIRMANA VISUAL WEIGHT */}
                          {activeMaterial.kalkulatorType === "nirmana_weight" && (
                            <>
                              <header className="border-b border-slate-100 pb-4 flex justify-between items-start gap-4">
                                <div>
                                  <span className="px-2.5 py-0.5 bg-[#dc2626]/10 text-[#dc2626] font-mono text-[9px] font-bold rounded">
                                    LAB VIRTUAL AKTIF
                                  </span>
                                  <h2 className="text-2xl font-black text-slate-950 tracking-tight mt-1.5">
                                    Simulator Keseimbangan Asimetris Nirmana
                                  </h2>
                                  <p className="text-slate-500 text-xs mt-1">
                                    Atur kontras Massa, Chroma, dan Distance elemen visual kiri dan kanan untuk mensimulasikan hukum keseimbangan visual ideal.
                                  </p>
                                </div>
                                <button 
                                  onClick={() => {
                                    setLeftMass(6); setLeftChroma(8); setLeftDistance(4);
                                    setRightMass(4); setRightChroma(5); setRightDistance(9);
                                  }}
                                  className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" /> Reset Default
                                </button>
                              </header>

                              {/* Visual Seesaw / Canvas Representation */}
                              <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative border border-slate-950 flex flex-col justify-between min-h-[300px]">
                                {/* Cosmic backdrop */}
                                <div className="absolute inset-x-0 bottom-0 top-[60%] bg-[linear-gradient(to_bottom,transparent,#22c55e05_100%)]"></div>
                                
                                {/* Gravity indicator */}
                                <div className="text-center">
                                  <span className="text-[9px] font-mono tracking-widest text-slate-500 border border-slate-800 px-3 py-1 rounded-full bg-slate-950">
                                    SUDUT GAYA GRAVITASI PERSEPSI TATA LETAK DWIMATRA
                                  </span>
                                </div>

                                {/* Canvas Stage */}
                                <div className="my-8 relative h-40 flex items-center justify-between px-12">
                                  {/* Center Pivot Point Line */}
                                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 border-l border-dashed border-slate-800 flex flex-col justify-between items-center transform -translate-x-1/2">
                                    <span className="bg-slate-950 text-slate-500 text-[8px] font-mono px-1 rounded transform -translate-y-2">Sumbu Gravitasi (0,0)</span>
                                    <span className="w-3 h-3 bg-[#facc15] rounded-full border border-slate-900 shadow-sm animate-ping"></span>
                                    <span className="bg-slate-950 text-slate-500 text-[8px] font-mono px-1 rounded transform translate-y-2">Titik Tumpu</span>
                                  </div>

                                  {/* Element Left (A) */}
                                  <div 
                                    className="flex flex-col items-center justify-center transition-all duration-150"
                                    style={{
                                      // Style representation corresponding with state values
                                      transform: `translateX(${(leftDistance - 5) * 15}px)`,
                                      opacity: 0.3 + (leftChroma / 10) * 0.7
                                    }}
                                  >
                                    <span className="text-[10px] font-mono mb-1.5 font-bold" style={{ color: leftColor }}>W_A: {leftWeight}</span>
                                    <div 
                                      className="border-2 border-white rounded-lg flex items-center justify-center transition-all duration-150 shadow-lg"
                                      style={{
                                        backgroundColor: leftColor,
                                        width: `${leftMass * 11 + 25}px`,
                                        height: `${leftMass * 11 + 25}px`,
                                        filter: `saturate(${leftChroma * 15}%)`,
                                        boxShadow: `0 10px 15px -3px ${leftColor}60`
                                      }}
                                    >
                                      <span className="text-[10px] font-bold text-white drop-shadow-sm font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">A</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono mt-1.5">M:{leftMass} C:{leftChroma} D:{leftDistance}</span>
                                  </div>

                                  {/* Element Right (B) */}
                                  <div 
                                    className="flex flex-col items-center justify-center transition-all duration-150"
                                    style={{
                                      transform: `translateX(-${(rightDistance - 5) * 15}px)`,
                                      opacity: 0.3 + (rightChroma / 10) * 0.7
                                    }}
                                  >
                                    <span className="text-[10px] font-mono mb-1.5 font-bold" style={{ color: rightColor }}>W_B: {rightWeight}</span>
                                    <div 
                                      className="border-2 border-white rounded-lg flex items-center justify-center transition-all duration-150 shadow-lg"
                                      style={{
                                        backgroundColor: rightColor,
                                        width: `${rightMass * 11 + 25}px`,
                                        height: `${rightMass * 11 + 25}px`,
                                        filter: `saturate(${rightChroma * 15}%)`,
                                        boxShadow: `0 10px 15px -3px ${rightColor}60`
                                      }}
                                    >
                                      <span className="text-[10px] font-bold text-white drop-shadow-sm font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">B</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono mt-1.5">M:{rightMass} C:{rightChroma} D:{rightDistance}</span>
                                  </div>
                                </div>

                                {/* Balance indicator bar at bottom */}
                                <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs font-mono">
                                  <div>
                                    Ratio Seimbang: <span className="text-[#facc15] font-bold">{Math.round(balanceRatio * 100)}%</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    Status: 
                                    <span className={`px-2.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${balanceStatus.color}`}>
                                      {balanceStatus.text}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Teori Harmoni Warna Presets Bar */}
                              <div className="bg-slate-900 border border-slate-950 rounded-2xl p-4.5 mt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
                                <div className="space-y-0.5">
                                  <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5 font-mono">
                                    🎨 TEORI HARMONI RUPA / COLOR HARMONY WHEEL
                                  </h4>
                                  <p className="text-[10px] text-slate-400 leading-normal">
                                    Simulasikan hukum keseimbangan dwimatra menggunakan kombinasi kontras warna rona. Pilih roda harmoni cepat:
                                  </p>
                                </div>
                                <div className="flex gap-1.5 flex-wrap">
                                  {[
                                    { name: "Komplementer (Kontras)", left: "#06b6d4", right: "#dc2626" },
                                    { name: "Monokromatik Teduh", left: "#3b82f6", right: "#1e3a8a" },
                                    { name: "Triadik Klasik", left: "#eab308", right: "#a855f7" },
                                    { name: "Analog Harmoni", left: "#10b981", right: "#84cc16" },
                                  ].map((harmoni) => (
                                    <button
                                      key={harmoni.name}
                                      type="button"
                                      onClick={() => {
                                        setLeftColor(harmoni.left);
                                        setRightColor(harmoni.right);
                                      }}
                                      className="text-[10px] font-bold bg-slate-950 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1 hover:bg-slate-800 hover:text-white hover:border-slate-700 transition-all cursor-pointer shadow-sm flex items-center gap-1.5 font-mono"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: harmoni.left }}></span>
                                      {harmoni.name}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Control panel sliders */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                
                                {/* Controls Left Element A */}
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-sm">
                                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: leftColor }}></span>
                                    Variabel Kiri (Komponen Rupa A)
                                  </h3>
                                  
                                  <div className="space-y-4 text-xs font-bold text-slate-700">
                                    <div>
                                      <div className="flex justify-between mb-1">
                                        <span>Massa / Ukuran Fisik (M)</span>
                                        <span className="font-mono" style={{ color: leftColor }}>{leftMass}x</span>
                                      </div>
                                      <input 
                                        type="range" min="1" max="10" 
                                        value={leftMass} 
                                        onChange={(e) => setLeftMass(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                        style={{ accentColor: leftColor }}
                                      />
                                    </div>

                                    <div>
                                      <div className="flex justify-between mb-1">
                                        <span>Chroma / Kejenuhan Warna (C)</span>
                                        <span className="font-mono" style={{ color: leftColor }}>{leftChroma}x</span>
                                      </div>
                                      <input 
                                        type="range" min="1" max="10" 
                                        value={leftChroma} 
                                        onChange={(e) => setLeftChroma(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                        style={{ accentColor: leftColor }}
                                      />
                                    </div>

                                    <div>
                                      <div className="flex justify-between mb-1">
                                        <span>Distance / Jarak Momen Spasial (D)</span>
                                        <span className="font-mono" style={{ color: leftColor }}>{leftDistance}x</span>
                                      </div>
                                      <input 
                                        type="range" min="1" max="10" 
                                        value={leftDistance} 
                                        onChange={(e) => setLeftDistance(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                        style={{ accentColor: leftColor }}
                                      />
                                    </div>

                                    {/* Color Wheel Customizer Left */}
                                    <div className="pt-4 border-t border-slate-200/80 mt-4 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                                          <span>🎨</span> Custom Color Wheel (A)
                                        </span>
                                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md" style={{ color: leftColor, backgroundColor: `${leftColor}15` }}>{leftColor}</span>
                                      </div>
                                      
                                      <div className="flex items-start gap-3">
                                        {/* Color Wheel Circular Dial Component */}
                                        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md ring-2 ring-slate-200 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer shrink-0">
                                          <input 
                                            type="color" 
                                            value={leftColor}
                                            onChange={(e) => setLeftColor(e.target.value)}
                                            className="absolute inset-x-0 -top-2 -bottom-2 w-full h-[150%] p-0 border-0 cursor-pointer bg-transparent scale-150"
                                            title="Klik untuk memilih rona warna tak terbatas"
                                          />
                                        </div>
                                        
                                        <div className="flex-1 space-y-2">
                                          <p className="text-[9.5px] text-slate-500 leading-normal font-semibold">
                                            Geser spektrum di atas, kodekan manual, atau pilih rona preset di bawah:
                                          </p>
                                          
                                          {/* Presets Grid */}
                                          <div className="grid grid-cols-8 gap-1 pt-0.5">
                                            {[
                                              "#06b6d4", "#eab308", "#12b886", "#3b82f6", "#ec4899", "#f43f5e", 
                                              "#8b5cf6", "#f97316", "#10b981", "#fa5252", "#111827", "#15aabf", 
                                              "#74b816", "#099268", "#228be6", "#be4bdb"
                                            ].map((preset) => (
                                              <button
                                                key={preset}
                                                type="button"
                                                onClick={() => setLeftColor(preset)}
                                                className={`w-5 h-5 rounded-full border shadow-sm cursor-pointer transition-transform duration-150 hover:scale-125 hover:z-10 ${leftColor.toLowerCase() === preset.toLowerCase() ? 'ring-2 ring-emerald-500 ring-offset-1 border-emerald-500' : 'border-white'}`}
                                                style={{ backgroundColor: preset }}
                                                title={`Warna Rona: ${preset}`}
                                              />
                                            ))}
                                          </div>

                                          {/* Custom Hex Manual Code and Complement Harmony Box */}
                                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1.5 border-t border-slate-200/40">
                                            <div className="flex items-center gap-1.5 shrink-0">
                                              <span className="text-[10px] text-slate-500 font-bold">HEX:</span>
                                              <input
                                                type="text"
                                                maxLength={7}
                                                value={leftColor}
                                                onChange={(e) => {
                                                  let val = e.target.value;
                                                  if (!val.startsWith("#")) {
                                                    val = "#" + val;
                                                  }
                                                  if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                                    setLeftColor(val);
                                                  }
                                                }}
                                                className="w-18 px-1.5 py-0.5 border border-slate-200 rounded text-[10px] font-mono font-black text-slate-700 bg-white shadow-inner focus:outline-none focus:ring-1 focus:ring-slate-400"
                                                placeholder="#000000"
                                              />
                                            </div>

                                            {/* Visual complementary color helper for educational depth */}
                                            <div className="flex-1 flex items-center justify-between gap-1 p-1 bg-slate-100 rounded text-[9px] font-mono">
                                              <span className="text-slate-500 font-extrabold truncate">Komplementer:</span>
                                              <button
                                                type="button"
                                                onClick={() => setLeftColor(getComplementColor(leftColor))}
                                                className="px-1.5 py-0.5 rounded text-[8.5px] text-white font-bold tracking-tight hover:opacity-90 transition-opacity flex items-center gap-1 shadow-sm font-semibold shrink-0"
                                                style={{ backgroundColor: getComplementColor(leftColor) }}
                                              >
                                                {getComplementColor(leftColor)}
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                  </div>
                                </div>

                                {/* Controls Right Element B */}
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-sm">
                                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rightColor }}></span>
                                    Variabel Kanan (Komponen Rupa B)
                                  </h3>
                                  
                                  <div className="space-y-4 text-xs font-bold text-slate-700">
                                    <div>
                                      <div className="flex justify-between mb-1">
                                        <span>Massa / Ukuran Fisik (M)</span>
                                        <span className="font-mono" style={{ color: rightColor }}>{rightMass}x</span>
                                      </div>
                                      <input 
                                        type="range" min="1" max="10" 
                                        value={rightMass} 
                                        onChange={(e) => setRightMass(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                        style={{ accentColor: rightColor }}
                                      />
                                    </div>

                                    <div>
                                      <div className="flex justify-between mb-1">
                                        <span>Chroma / Kejenuhan Warna (C)</span>
                                        <span className="font-mono" style={{ color: rightColor }}>{rightChroma}x</span>
                                      </div>
                                      <input 
                                        type="range" min="1" max="10" 
                                        value={rightChroma} 
                                        onChange={(e) => setRightChroma(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                        style={{ accentColor: rightColor }}
                                      />
                                    </div>

                                    <div>
                                      <div className="flex justify-between mb-1">
                                        <span>Distance / Jarak Momen Spasial (D)</span>
                                        <span className="font-mono" style={{ color: rightColor }}>{rightDistance}x</span>
                                      </div>
                                      <input 
                                        type="range" min="1" max="10" 
                                        value={rightDistance} 
                                        onChange={(e) => setRightDistance(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                        style={{ accentColor: rightColor }}
                                      />
                                    </div>

                                    {/* Color Wheel Customizer Right */}
                                    <div className="pt-4 border-t border-slate-200/80 mt-4 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                                          <span>🎨</span> Custom Color Wheel (B)
                                        </span>
                                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md" style={{ color: rightColor, backgroundColor: `${rightColor}15` }}>{rightColor}</span>
                                      </div>
                                      
                                      <div className="flex items-start gap-3">
                                        {/* Color Wheel Circular Dial Component */}
                                        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md ring-2 ring-slate-200 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer shrink-0">
                                          <input 
                                            type="color" 
                                            value={rightColor}
                                            onChange={(e) => setRightColor(e.target.value)}
                                            className="absolute inset-x-0 -top-2 -bottom-2 w-full h-[150%] p-0 border-0 cursor-pointer bg-transparent scale-150"
                                            title="Klik untuk memilih rona warna tak terbatas"
                                          />
                                        </div>
                                        
                                        <div className="flex-1 space-y-2">
                                          <p className="text-[9.5px] text-slate-500 leading-normal font-semibold">
                                            Geser spektrum di atas, kodekan manual, atau pilih rona preset di bawah:
                                          </p>
                                          
                                          {/* Presets Grid */}
                                          <div className="grid grid-cols-8 gap-1 pt-0.5">
                                            {[
                                              "#dc2626", "#a855f7", "#f97316", "#111827", "#84cc16", "#db2777",
                                              "#eab308", "#228be6", "#f43f5e", "#ec4899", "#fd7e14", "#099268",
                                              "#12b886", "#15aabf", "#1e293b", "#ffffff"
                                            ].map((preset) => (
                                              <button
                                                key={preset}
                                                type="button"
                                                onClick={() => setRightColor(preset)}
                                                className={`w-5 h-5 rounded-full border shadow-sm cursor-pointer transition-transform duration-150 hover:scale-125 hover:z-10 ${rightColor.toLowerCase() === preset.toLowerCase() ? 'ring-2 ring-emerald-500 ring-offset-1 border-emerald-500' : 'border-white'}`}
                                                style={{ backgroundColor: preset }}
                                                title={`Warna Rona: ${preset}`}
                                              />
                                            ))}
                                          </div>

                                          {/* Custom Hex Manual Code and Complement Harmony Box */}
                                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1.5 border-t border-slate-200/40">
                                            <div className="flex items-center gap-1.5 shrink-0">
                                              <span className="text-[10px] text-slate-500 font-bold">HEX:</span>
                                              <input
                                                type="text"
                                                maxLength={7}
                                                value={rightColor}
                                                onChange={(e) => {
                                                  let val = e.target.value;
                                                  if (!val.startsWith("#")) {
                                                    val = "#" + val;
                                                  }
                                                  if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                                    setRightColor(val);
                                                  }
                                                }}
                                                className="w-18 px-1.5 py-0.5 border border-slate-200 rounded text-[10px] font-mono font-black text-slate-700 bg-white shadow-inner focus:outline-none focus:ring-1 focus:ring-slate-400"
                                                placeholder="#000000"
                                              />
                                            </div>

                                            {/* Visual complementary color helper for educational depth */}
                                            <div className="flex-1 flex items-center justify-between gap-1 p-1 bg-slate-100 rounded text-[9px] font-mono">
                                              <span className="text-slate-500 font-extrabold truncate">Komplementer:</span>
                                              <button
                                                type="button"
                                                onClick={() => setRightColor(getComplementColor(rightColor))}
                                                className="px-1.5 py-0.5 rounded text-[8.5px] text-white font-bold tracking-tight hover:opacity-90 transition-opacity flex items-center gap-1 shadow-sm font-semibold shrink-0"
                                                style={{ backgroundColor: getComplementColor(rightColor) }}
                                              >
                                                {getComplementColor(rightColor)}
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                  </div>
                                </div>

                              </div>
                            </>
                          )}

                        </div>
                      )}

                      {/* MATERI SECTION 2: KAMUS ISTILAH TEKNIS */}
                      {materiSection === "kamus" && (
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
                          <header className="border-b border-slate-100 pb-4">
                            <h2 className="text-2xl font-black text-slate-950 tracking-tight">
                              Simbol & Istilah Teknis: {activeMaterial.mapel}
                            </h2>
                            <p className="text-slate-500 text-xs mt-1">
                              Definisi baku kurikulum terverifikasi bebas kesalahan logis oleh tim expert Pusat Ilmu.
                            </p>
                          </header>

                          {/* Tabel Terstruktur */}
                          <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left border-collapse text-xs md:text-sm">
                              <thead>
                                <tr className="text-white font-mono uppercase text-[10px] tracking-wider border-b" style={{ backgroundColor: activeMaterial.color, borderColor: activeMaterial.color }}>
                                  <th className="py-3.5 px-4 font-bold border-r border-white/20">Istilah / Simbol</th>
                                  <th className="py-3.5 px-4 font-bold border-r border-white/20">Definisi Akademis (Pusat Ilmu)</th>
                                  <th className="py-3.5 px-4 font-bold">Signifikansi / Makna Utama</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 bg-white">
                                {(activeMaterial.terms || []).map((t, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                    <td 
                                      className="py-3.5 px-4 font-bold border-r border-slate-200 font-mono tracking-tight"
                                      style={{ color: activeMaterial.color, backgroundColor: `${activeMaterial.color}05` }}
                                    >
                                      {t.term}
                                    </td>
                                    <td className="py-3.5 px-4 text-slate-700 leading-relaxed border-r border-slate-200">
                                      {t.definition}
                                    </td>
                                    <td className="py-3.5 px-4 text-slate-600 italic font-medium leading-relaxed">
                                      {t.significance}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="p-4 bg-slate-50 rounded-xl text-slate-500 text-xs flex items-center gap-2 border border-slate-200">
                            <Sliders className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                            <span>Pusat Ilmu mengadopsi standarisasi Kurikulum Menyeluruh untuk menjamin materi berkualitas bebas miskonsepsi logis.</span>
                          </div>
                        </div>
                      )}

                      {/* MATERI SECTION 3: LANGKAH PENYUSUNAN */}
                      {materiSection === "langkah" && (
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
                          <header className="border-b border-slate-100 pb-4">
                            <h2 className="text-2xl font-black text-slate-950 tracking-tight">
                              Langkah Demi Langkah: {activeMaterial.topic}
                            </h2>
                            <p className="text-slate-500 text-xs mt-1">
                              Konseptualisasi bimbingan logis, suportif, dan ramah untuk mengasah penguasaan keahlian siswa secara mendalam.
                            </p>
                          </header>

                          {/* Susunan Langkah Humas Dinamis */}
                          <div className="space-y-4">
                            {(activeMaterial.steps || []).map((st, sIdx) => (
                              <div key={sIdx} className="flex gap-4 p-4 hover:bg-slate-50/85 rounded-xl transition-all border border-transparent hover:border-slate-100">
                                <div 
                                  className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm font-mono"
                                  style={{ backgroundColor: activeMaterial.color }}
                                >
                                  {st.num}
                                </div>
                                <div className="space-y-1">
                                  <h3 className="font-bold text-slate-800 text-sm">{st.title}</h3>
                                  <p className="text-slate-600 text-xs leading-relaxed">
                                    {st.dsc}
                                  </p>
                                  {st.sub && st.sub.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                      {st.sub.map((sb, sbId) => (
                                        <span 
                                          key={sbId} 
                                          className="text-[9px] font-mono px-2 py-0.5 rounded"
                                          style={{ 
                                            borderWidth: "1px",
                                            borderColor: `${activeMaterial.color}25`, 
                                            color: activeMaterial.color,
                                            backgroundColor: `${activeMaterial.color}05`
                                          }}
                                        >
                                          {sb}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div 
                            className="p-4 rounded-xl text-xs font-medium leading-relaxed border" 
                            style={{ 
                              backgroundColor: `${activeMaterial.color}05`, 
                              borderColor: `${activeMaterial.color}15`, 
                              color: activeMaterial.color 
                            }}
                          >
                            💡 <strong>Tip Akademisi Pusat Ilmu:</strong> Gunakan simulator praktikum terpadu kami pada menu "Virtual Lab" untuk menguji parameter secara real-time demi mencapai pemahaman 100% sempurna!
                          </div>
                        </div>
                      )}

                      {/* MATERI SECTION 4: STUDI KASUS INDUSTRI NYATA */}
                      {materiSection === "studi-kasus" && (
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
                          <header className="border-b border-slate-100 pb-4">
                            <h2 className="text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
                              {activeMaterial.studiKasus?.title || "Studi Kasus Industri"}
                            </h2>
                            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                              {activeMaterial.studiKasus?.description || ""}
                            </p>
                          </header>

                          {/* Detailing Case Study */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                            <div className="space-y-3.5">
                              <span 
                                className="text-[10px] text-white font-mono uppercase tracking-widest px-2.5 py-0.5 rounded font-bold"
                                style={{ backgroundColor: activeMaterial.color }}
                              >
                                IDENTIFIKASI PROBLEM UTAMA
                              </span>
                              <h3 className="text-base font-bold text-slate-800 leading-tight">
                                Gejala Penyimpangan & Ketidakseimbangan
                              </h3>
                              <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-line">
                                {activeMaterial.studiKasus?.problem || ""}
                              </p>
                            </div>

                            <div className="space-y-3.5 flex flex-col justify-between">
                              <div>
                                <span className="text-[10px] bg-emerald-600 text-white font-mono uppercase tracking-widest px-2.5 py-0.5 rounded font-bold">
                                  PERSPEKTIF SOLUSI TIM EXPERT (PUSAT ILMU)
                                </span>
                                <h3 className="text-base font-bold text-slate-800 leading-tight mt-3">
                                  Koreksi Parameter Berbasis Konstitusi Rumus
                                </h3>
                                <p className="text-slate-600 text-xs leading-relaxed mt-1.5 whitespace-pre-line">
                                  {activeMaterial.studiKasus?.solution || ""}
                                </p>
                              </div>

                              {activeMaterial.id === "smk-nirmana" && (
                                <button
                                  onClick={() => setBillboardBalanced(!billboardBalanced)}
                                  className="w-full mt-4 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = activeMaterial.color; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ""; }}
                                >
                                  {billboardBalanced ? "Lihat Layout Bermasalah (Sebelum)" : "Lihat Layout Solusi Seimbang (Setelah)"}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Dynamic Billboard Visualizer Mockup (Only for Nirmana SMK!) */}
                          {activeMaterial.id === "smk-nirmana" && (
                            <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3 shadow-inner">
                              <h4 className="text-xs font-extrabold text-slate-850 uppercase tracking-wider text-center">
                                PREVIEW INTERAKTIF BALIHO 4 X 6 METER (GLOWERA)
                              </h4>
                              
                              <div className="aspect-[3/2] max-w-lg mx-auto bg-slate-100 rounded-lg border-2 border-slate-300 p-2.5 flex flex-col justify-between relative overflow-hidden shadow-sm">
                                {/* Background color representing cosmetic branding */}
                                <div className="absolute inset-0 bg-[#fffbeb] opacity-70"></div>
                                
                                {billboardBalanced ? (
                                  /* BALANCED SOLUTION LAYOUT */
                                  <div className="absolute inset-4 flex justify-between z-10 transition-all duration-300">
                                    {/* Left side: balanced cosmetic serum */}
                                    <div className="w-[35%] bg-amber-400 border border-amber-500 rounded-md p-2 flex flex-col justify-center items-center h-full shadow-md">
                                      <div className="h-2/3 bg-slate-900 w-6 rounded-md"></div>
                                      <span className="text-[10px] font-extrabold text-slate-900 tracking-tighter mt-1">Serum (M: Sedang)</span>
                                    </div>
                                    
                                    {/* Tuas line indicator */}
                                    <div className="w-[5%] flex items-center justify-center border-l border-emerald-500 border-dashed"></div>

                                    {/* Right side: balanced golden slogan */}
                                    <div className="w-[50%] flex flex-col justify-between items-end text-right h-full py-6 pr-2">
                                      <span className="bg-[#dc2626] text-white text-[9px] px-1.5 rounded font-mono font-bold">SOLUSI: KOORDINAT TERKALIBRASI</span>
                                      <div>
                                        <h3 className="text-slate-900 font-extrabold text-xs tracking-tight bg-yellow-250 leading-none">
                                          GLOWERA BEAUTY
                                        </h3>
                                        <p className="text-[10px] text-[#dc2626] font-extrabold mt-1 uppercase">
                                          "Pancaran Alami Setiap Harimu"
                                        </p>
                                        <span className="text-[8px] text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-bold font-mono">Chroma & Jarak Maksimal</span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  /* IMBALANCED BUGGY ORIGINAL LAYOUT */
                                  <div className="absolute inset-4 flex justify-between z-10 transition-all duration-305">
                                    {/* Overweight Left element */}
                                    <div className="w-[60%] bg-amber-400 border border-amber-600 rounded-md p-4 flex flex-col justify-center items-center h-full relative shadow-lg">
                                      <span className="absolute top-1 left-1.5 bg-red-650 text-white text-[7px] font-mono font-bold uppercase">Terlalu Berat (80% Area)</span>
                                      <div className="h-3/4 bg-slate-900 w-12 rounded-md"></div>
                                      <span className="text-xs font-black text-slate-900 mt-2">SERUM BOTOL RAKSASA</span>
                                    </div>

                                    {/* Invisible tag line at Right */}
                                    <div className="w-[30%] flex flex-col justify-center items-end text-right h-full opacity-30 pr-1">
                                      <h3 className="text-[10px] font-medium text-slate-500">Mata Melewati Tagline Ini</h3>
                                      <p className="text-[8px] text-slate-400 italic">"Tagline tidak terlihat"</p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="text-center text-xs">
                                Presentasi Visual Saat Ini: 
                                <span className={`ml-1.5 font-bold ${billboardBalanced ? "text-emerald-600" : "text-[#dc2626]"}`}>
                                  {billboardBalanced ? "PROPOSIONAL (Balanced via W_visual)" : "TIMPANG / PINCANG (Imbalanced)"}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* CONTOH SOAL & PEMBAHASAN AKADEMIK */}
                          {activeMaterial.contohSoal && (
                            <div className="mt-8 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 shadow-sm">
                              <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="text-sm font-black text-slate-950 tracking-tight flex items-center gap-2">
                                  📝 Contoh Soal Uji Kompetensi Akademis
                                </h3>
                                <span className="text-[10px] bg-slate-200 text-slate-700 font-extrabold px-2.5 py-0.5 rounded font-mono uppercase">
                                  Standardisasi Kelulusan
                                </span>
                              </div>
                              <div className="p-6 space-y-5">
                                <div className="space-y-2.5">
                                  <h4 className="text-[11px] font-extrabold text-slate-400 tracking-wider uppercase">Pertanyaan Studi / Kasus:</h4>
                                  <div className="text-slate-900 text-sm font-semibold select-all leading-relaxed whitespace-pre-line bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
                                    {activeMaterial.contohSoal.pertanyaan}
                                  </div>
                                </div>
                                
                                <div className="space-y-2.5">
                                  <h4 className="text-[11px] font-extrabold text-slate-400 tracking-wider uppercase">Pembahasan Langkah Demi Langkah:</h4>
                                  <div className="text-slate-800 text-xs leading-relaxed whitespace-pre-line bg-emerald-50/20 p-5 rounded-xl border border-emerald-100/60 font-medium shadow-inner">
                                    <FormattedExplanation text={activeMaterial.contohSoal.pembahasan} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                        </div>
                      )}

                    </motion.div>
                  )}

                  {/* TAB 2: ARSITEKTUR NAVIGASI & COMPOSITE ROUTING KEY (BAGIAN 1) */}
                  {selectedTab === "arsitektur" && (
                    <motion.div
                      key="arsitektur-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
                        <header className="border-b border-slate-100 pb-4">
                          <h2 className="text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
                            Akurasi Navigasi & Composite Routing Key Discriminator
                          </h2>
                          <p className="text-slate-500 text-xs mt-1">
                            Arsitektur yang diciptakan oleh System Architect untuk mengorganisasikan ratusan ribu materi dari SD hingga Kuliah secara instan.
                          </p>
                        </header>

                        {/* Penjelasan Metode Arsitektur database */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
                            <h3 className="text-sm font-bold text-slate-900">Mengapa Memakai Composite Routing Key?</h3>
                            <p>
                              Mengelola materi akademis dari SD, SMP, SMA, hingga SMK yang memiliki bidang produktif sangatlah rumit. SQL joins tradisional melambat seiring pertumbuhan data. Pusat ilmu mengatasi hal ini dengan menerapkan <strong>Composite Routing Key Discriminator</strong> pada arsitektur data NoSQL (Firestore/DynamoDB).
                            </p>
                            <p>
                              Alih-alih melakukan kueri penapis bertingkat, sisa kunci dibentuk dengan merantai identifikasi berhirarki secara sekuensial:
                              <br />
                              <strong className="text-slate-950 font-mono">LEVEL_CODE + MAPEL_ID + TOPIC_ID</strong>.
                            </p>
                            <p>
                              Cara ini memisahkan jalur SMA dan SMK secara mutlak sejak penarikan data pertama. SMK akan memproses materi berorientasi kompetensi produktif, sedangkan SMA memproses alur kajian akademis standar.
                            </p>
                          </div>

                          <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-950 font-mono text-xs space-y-3">
                            <h4 className="text-[#facc15] font-bold border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                              <Code className="w-4 h-4 text-[#facc15]" /> Database Partition Rule
                            </h4>
                            <div className="space-y-2">
                              <p className="text-slate-400">// Skema Kunci NoSQL:</p>
                              <p className="bg-slate-950 p-2 rounded text-emerald-400 text-[11px] select-all border border-slate-850">
                                PrimaryKey: LEVEL#MAPEL#TOPIC_ID
                              </p>
                              <p className="bg-slate-950 p-2 rounded text-[#facc15] text-[11px] select-all border border-slate-850">
                                Path: /v1/[level]/[mapel]/[topic_id]
                              </p>
                              <div className="text-[10px] text-slate-400 pt-1.5 leading-normal">
                                Indexing terbukti efisien untuk penarikan sub-10 milidetik bahkan pada kapasitas global 1.000.000 siswa aktif bersamaan.
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* LIVE INTERACTIVE ROUTE RESOLVER MOCK & GENERATOR */}
                        <div className="p-5 bg-yellow-50/50 border border-[#facc15]/30 rounded-xl space-y-4">
                          <h4 className="text-xs font-extrabold text-slate-850 uppercase tracking-widest flex items-center gap-2">
                            <Database className="w-4.5 h-4.5 text-[#dc2626]" /> Simulator Kunci Komposit Dinamis (Ahli Sistem)
                          </h4>
                          <p className="text-xs text-slate-600">
                            Masukkan parameter jenjang dan materi di bawah ini untuk melihat bagaimana kunci komposit dan router database melokalisasi dokumen secara instan tanpa tumpang tindih.
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Langkah 1: Pilih Tingkat Sekolah</label>
                              <select 
                                value={simLevel} 
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSimLevel(val);
                                  // Auto change mock mapel to match school level
                                  if (val === "SD") {
                                    setSimMapel("Tematik IPAS");
                                    setSimTopic("Fotosintesis Tumbuhan");
                                  } else if (val === "SMP") {
                                    setSimMapel("Bahasa Indonesia");
                                    setSimTopic("Teks Eksplanasi");
                                  } else if (val === "SMA") {
                                    setSimMapel("Fisika Teoretis");
                                    setSimTopic("Termodinamika");
                                  } else if (val === "SMK") {
                                    setSimMapel("Produktif Desain Grafis");
                                    setSimTopic("Prinsip Dasar Nirmana");
                                  } else if (val === "Kuliah") {
                                    setSimMapel("Kalkulus Lanjut");
                                    setSimTopic("Transformasi Laplace");
                                  }
                                }}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#facc15] text-slate-700 font-medium"
                              >
                                <option value="SD">SD (Sekolah Dasar)</option>
                                <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                                <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                                <option value="SMK">SMK (Sekolah Menengah Kejuruan)</option>
                                <option value="Kuliah">Kuliah (Perguruan Tinggi)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Langkah 2: Nama Mata Pelajaran</label>
                              <input 
                                type="text" 
                                value={simMapel}
                                onChange={(e) => setSimMapel(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#facc15] text-slate-700 font-medium"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Langkah 3: Topik Pembelajaran</label>
                              <input 
                                type="text" 
                                value={simTopic}
                                onChange={(e) => setSimTopic(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#facc15] text-slate-700 font-medium"
                              />
                            </div>
                          </div>

                          <div className="bg-slate-900 rounded-xl p-4 text-white font-mono text-[11px] grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-slate-450 text-[9px] uppercase font-bold tracking-widest text-[#facc15]">
                                🌐 Router URL Client Side:
                              </p>
                              <p className="text-emerald-400 select-all font-bold">
                                pusatilmu.com/{simLevel.toLowerCase()}/{simTopic.toLowerCase().replace(/\s+/g, "-")}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <p className="text-slate-450 text-[9px] uppercase font-bold tracking-widest text-[#dc2626]">
                                🔑 Composite Partition DB Key:
                              </p>
                              <p className="text-red-400 select-all">
                                {computedKey}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Flowchart Diagram Representation */}
                        <div className="space-y-3.5">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Peta Alur Sitemaps & Flow Onboarding
                          </h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                            
                            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-slate-700">
                              <span className="text-[10px] font-mono block text-slate-400 uppercase">Mulai</span>
                              <strong className="text-xs text-slate-900 block mt-1">Registrasi / Login</strong>
                              <span className="text-[10px] text-slate-500 block mt-1.5 leading-tight">SSO Belajar.id otomatis melompati pengisian formulir</span>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-slate-700">
                              <span className="text-[10px] font-mono block text-slate-400 uppercase">Tahap 1</span>
                              <strong className="text-xs text-slate-900 block mt-1">Onboarding Jenjang</strong>
                              <span className="text-[10px] text-slate-500 block mt-1.5 leading-tight">User memilih tingkat (SD, SMP, SMA, SMK, Kuliah)</span>
                            </div>

                            <div className="bg-[#dc2626]/10 border border-[#dc2626]/20 p-3.5 rounded-xl text-slate-755">
                              <span className="text-[10px] font-mono block text-[#dc2626] font-bold uppercase">Tahap 2 (Cabang SMK)</span>
                              <strong className="text-xs text-slate-900 block mt-1">Produktif Vokasi</strong>
                              <span className="text-[10px] text-slate-500 block mt-1.5 leading-tight">Disalurkan langsung lewat composite key ke materi kompetensi kerja</span>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-slate-755">
                              <span className="text-[10px] font-mono block text-slate-400 uppercase">Akhir</span>
                              <strong className="text-xs text-slate-900 block mt-1">Halaman Materi</strong>
                              <span className="text-[10px] text-slate-500 block mt-1.5 leading-tight">Menampilkan rangkuman, visual lab, kamus, & studi kasus riil</span>
                            </div>

                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}

                  {/* TAB 3: PANDUAN VISUAL & FOOTER (BAGIAN 3) */}
                  {selectedTab === "visual" && (
                    <motion.div
                      key="visual-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
                        <header className="border-b border-slate-100 pb-4">
                          <h2 className="text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
                            Panduan Identitas Visual & Figma UI/UX Kit
                          </h2>
                          <p className="text-slate-500 text-xs mt-1">
                            Disusun oleh UI/UX Director untuk menjaga keterbacaan, estetika bernilai tinggi, dan kemudahan kustomisasi developer.
                          </p>
                        </header>

                        {/* Palet Warna Tiap Tingkatan */}
                        <div className="space-y-3.5">
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <Palette className="w-4.5 h-4.5 text-[#facc15]" /> Palet Warna Resmi Tingkatan Pendidikan
                          </h3>
                          <p className="text-xs text-slate-600 leading-normal">
                            Untuk mencegah kekeliruan pengguna saat menelusuri ratusan materi, gunakan palet warna aksen unik ini di sidebar dan badge tingkat. Klik warna apa pun untuk menyalin hex code secara langsung:
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {levelSwatches.map((sw, idx) => (
                              <div 
                                key={idx}
                                onClick={() => handleCopyColor(sw.color)}
                                className={`bg-white rounded-xl border border-slate-250 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer text-center relative group overflow-hidden ${
                                  copiedColor === sw.color ? "ring-2 ring-emerald-500 border-none" : ""
                                }`}
                              >
                                <div className={`w-full aspect-square rounded-lg ${sw.bg} mb-3 relative flex items-center justify-center`}>
                                  <span className="text-white font-black text-xl drop-shadow-md">{sw.level}</span>
                                  {copiedColor === sw.color && (
                                    <span className="absolute inset-0 bg-emerald-600/90 rounded-lg flex items-center justify-center text-white text-xs font-bold leading-normal font-mono">
                                      TERSALIN!
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-bold text-slate-800 text-xs">{sw.name}</h4>
                                <code className="font-mono text-[10px] text-slate-450 block mt-1 bg-slate-50 py-0.5 rounded border border-slate-100">{sw.color}</code>
                                <p className="text-[10px] text-slate-500 leading-tight mt-1.5">{sw.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Penjelasan Layout Header & Kustomisasi */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                          
                          <div className="space-y-3 text-xs text-slate-600">
                            <h4 className="font-bold text-slate-800 text-sm">Spesifikasi UI Registrasi (Custom Dev Friendly)</h4>
                            <p>
                              Halaman registrasi mengedepankan kesederhanaan minimalis, bersih, namun sarat energi dengan memanfaatkan warna Kuning Modern (#facc15) di bagian depan aplikasi.
                            </p>
                            <p>
                              Sejalan dengan keputusan tata arsitektur sasis modern, logo <strong>Pusat Ilmu</strong> harus diisolasi di dalam wadah mandiri. Ini bertujuan agar ketika tim IT berencana mengubah citra merek (rebranding) di kemudian hari, perubahan URL gambar logo tidak menyenggol letak masukan form maupun kestabilan responsivitas layout HTML pengiringnya.
                            </p>
                          </div>

                          <div className="space-y-3 text-xs text-slate-600">
                            <h4 className="font-bold text-slate-800 text-sm">Sistem Spasi & Kapsul Pencarian Universal</h4>
                            <p>
                              Kolom pencarian berformat kapsul diletakkan melayang di area tengah Header berwarna dasar Kuning. Ini memberikan kesan modern dengan kegunaan yang tinggi (Highly Intuitive/Estetik).
                            </p>
                            <p>
                              Halaman ini juga diakhiri dengan komponen Footer berwarna dasar Gelap Arang untuk meredam kekontrasan warna terang halaman dalam, serta memuat data legalitas kurikulum.
                            </p>
                          </div>

                        </div>

                        {/* Dedicated Box representing Feedback Curriculum Email */}
                        <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-950 rounded-2xl text-white relative overflow-hidden border border-slate-850">
                          <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Mail className="w-40 h-40" />
                          </div>
                          
                          <div className="relative z-10 max-w-lg space-y-3.5">
                            <span className="text-[9px] bg-[#dc2626] text-white font-mono uppercase tracking-widest px-2 py-0.5 rounded">
                              FEEDBACK HUB
                            </span>
                            <h3 className="text-xl font-bold tracking-tight text-white">
                              Umpan Balik Tim Ahli & Kurikulum Terpadu
                            </h3>
                            <p className="text-slate-300 text-xs leading-relaxed">
                              Untuk menjaga kebenaran data akademis 100% mutlak dan zero-error, kami membuka kanal pengaduan langsung bagi guru, profesional industri, maupun siswa apabila menemukan anomali konten atau ketidaksinkronan materi.
                            </p>
                            
                            <div className="pt-2 flex items-center gap-3">
                              <a 
                                href="mailto:pusatilmuu@gmail.com"
                                className="inline-flex items-center gap-2 bg-[#facc15] hover:bg-yellow-500 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-lg transition-transform hover:scale-103 cursor-pointer shadow-md shadow-yellow-400/10"
                              >
                                <Mail className="w-4.5 h-4.5" /> Kirim Email Pengaduan
                              </a>
                              <code className="bg-slate-950 px-3 py-2 border border-slate-800 rounded-lg text-[#facc15] text-xs font-mono font-bold select-all">
                                pusatilmuu@gmail.com
                              </code>
                            </div>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </main>

            </div>

            {/* ======================================================== */}
            {/* BAGIAN 3.3 & 4: BAGIAN FOOTER TERINTEGRASI (WARNA ARANG GELAP) */}
            {/* ======================================================== */}
            <footer className="bg-slate-900 text-slate-300 text-xs border-t border-slate-950 mt-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  
                  {/* Left branding */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 bg-[#facc15] rounded flex items-center justify-center">
                        <BookOpen className="text-slate-950 w-4 h-4 font-bold" />
                      </div>
                      <span className="text-white font-extrabold text-base tracking-tight">Pusat Ilmu</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed max-w-xs">
                      Platform kebenaran kurikulum nasional terintegrasi AI, mengeliminasi kesalahan penulisan (zero-typo), ketaksesuaian teori, serta menyatukan materi produktif siap kerja industri.
                    </p>
                  </div>

                  {/* Middle Navigation Fast links */}
                  <div className="space-y-3.5">
                    <h4 className="text-white font-mono uppercase tracking-widest text-[9px] font-bold">Akses Kunci Hub</h4>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <button onClick={() => setSelectedTab("materi")} className="text-left hover:text-white transition-colors cursor-pointer">Materi Nirmana Demo</button>
                      <button onClick={() => setSelectedTab("arsitektur")} className="text-left hover:text-white transition-colors cursor-pointer">Arsitektur database</button>
                      <button onClick={() => setSelectedTab("visual")} className="text-left hover:text-white transition-colors cursor-pointer">Panduan Figma & Color</button>
                      <button onClick={() => { setIsRegistered(false); }} className="text-left hover:text-white transition-colors cursor-pointer">Registrasi Awal Form</button>
                    </div>
                  </div>

                  {/* Right: Mandatory Feedback Email contact */}
                  <div className="space-y-4">
                    <h4 className="text-[#facc15] font-mono uppercase tracking-widest text-[9px] font-bold">Kritik & Saran Kurikulum</h4>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Wadah integrasi masukan pengajar vokasi. Apabila terdapat kesalahan isi bab materi atau rumus, segera hubungi tim kurikulum kami:
                    </p>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2 text-slate-200">
                        <Mail className="w-4 h-4 text-[#dc2626]" />
                        <a 
                          href="mailto:pusatilmuu@gmail.com" 
                          className="font-mono text-xs text-[#facc15] hover:underline font-bold"
                        >
                          pusatilmuu@gmail.com
                        </a>
                      </div>
                      <span className="text-[10px] text-slate-500">Maksimal tanggapan tim ahli kurikulum adalah 1x24 jam kerja.</span>
                    </div>
                  </div>

                </div>

                <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
                  <span>© 2026 Pusat Ilmu Indonesia. Nilai Keseimbangan Asimetris Terbuka.</span>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><Heart className="w-3 h-3 text-[#dc2626]" /> Ahli Kurikulum</span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5"><Code className="w-3 h-3 text-cyan-400" /> UI/UX Director Verified</span>
                  </div>
                </div>

              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 1. DIALOG PEMILIHAN AKUN GOOGLE (GOOGLE ACCOUNT CHOOSER) */}
      {/* ======================================================== */}
      <AnimatePresence>
        {googleChooserOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden relative"
            >
              {/* Loader Loading Overlay */}
              {isGoogleLoading && (
                <div className="absolute inset-0 bg-white/95 z-50 flex flex-col items-center justify-center p-6 text-center">
                  <div className="relative flex items-center justify-center mb-5">
                    {/* Pulsing colored ring */}
                    <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-yellow-500 border-r-blue-500 border-b-green-500 border-l-red-500 animate-spin"></div>
                    <Shield className="w-6 h-6 text-slate-800 absolute" />
                  </div>
                  
                  <h4 className="text-sm font-black text-slate-800 tracking-tight">Menghubungkan Sesi Google SSO...</h4>
                  <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
                    Sedang menautkan enkripsi kredensial Anda dengan gerbang aman multi-jenjang Pusat Ilmu. Notifikasi audit otomatis siap dikirimkan.
                  </p>
                  
                  {/* Miniature Log simulation */}
                  <div className="mt-4 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 font-mono text-[9px] text-slate-400">
                    STATUS: SECURE_PIPELINE_HANDSHAKE
                  </div>
                </div>
              )}

              {/* Close Button top-right */}
              <button
                type="button"
                onClick={() => {
                  setGoogleChooserOpen(false);
                  setIsAddingCustomGoogle(false);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-7">
                {/* Google Letter Logo */}
                <div className="flex justify-center mb-4">
                  <div className="flex items-center space-x-1 text-xl font-bold font-sans selection:bg-transparent">
                    <span className="text-blue-600 block">G</span>
                    <span className="text-red-500 block">o</span>
                    <span className="text-yellow-500 block">o</span>
                    <span className="text-blue-600 block">g</span>
                    <span className="text-green-500 block">l</span>
                    <span className="text-red-500 block">e</span>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">Pilih Akun Google Anda</h3>
                  <p className="text-xs text-slate-400 mt-1">untuk melanjutkan masuk ke platform pembelajaran <span className="font-extrabold text-[#facc15] bg-slate-900 px-1.5 py-0.5 rounded text-[10px]">Pusat Ilmu</span></p>
                </div>

                {/* Main Selector content block */}
                {!isAddingCustomGoogle ? (
                  <div className="space-y-2.5">
                    
                    {/* Dynamic Looping from Google Authentication API / Smart Lock list */}
                    {googleAccounts.map((acc, accIdx) => {
                      // Get initials
                      const initials = acc.name
                        .split(" ")
                        .map((part) => part.charAt(0))
                        .join("")
                        .substring(0, 2)
                        .toUpperCase() || "G";
                      
                      const isBelajar = acc.accountType === "Belajar.id";
                      const isWorkspace = acc.accountType === "Akun Workspace";
                      
                      return (
                        <button
                          key={acc.email + "-" + accIdx}
                          type="button"
                          onClick={() => handleChooseAccount(acc.name, acc.email, isBelajar)}
                          className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-2xl transition-all cursor-pointer text-left group animate-fade-in"
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className={`w-10 h-10 rounded-full ${acc.avatarBg || 'bg-slate-800'} text-white font-black flex items-center justify-center shadow-inner shrink-0`}>
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors">
                                {acc.name}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate font-mono">
                                {acc.email}
                              </p>
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                            isBelajar 
                              ? "bg-slate-900 text-[#facc15]" 
                              : isWorkspace 
                                ? "bg-cyan-100 text-cyan-800" 
                                : "bg-violet-100 text-violet-800"
                          }`}>
                            {acc.accountType}
                          </span>
                        </button>
                      );
                    })}

                    {/* Pilihan: Gunakan akun Google lain */}
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomGoogle(true)}
                      className="w-full flex items-center space-x-3.5 p-3.5 bg-white hover:bg-slate-50 border border-dashed border-slate-300 rounded-2xl transition-all cursor-pointer text-left font-bold text-slate-600 text-xs hover:text-slate-900"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-lg border border-dashed border-slate-300">
                        +
                      </div>
                      <div>
                        <p>Gunakan akun Google lainnya</p>
                        <p className="text-[10px] text-slate-400 font-medium">Bisa memasukkan nama & email custom Anda</p>
                      </div>
                    </button>

                  </div>
                ) : (
                  <motion.form
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (customGoogleEmail && customGoogleName) {
                        handleChooseAccount(customGoogleName, customGoogleEmail, customGoogleEmail.endsWith("belajar.id"));
                      }
                    }}
                    className="space-y-3.5"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Nama Lengkap Pemilik Akun</label>
                      <input
                        type="text"
                        required
                        value={customGoogleName}
                        onChange={(e) => setCustomGoogleName(e.target.value)}
                        placeholder="Contoh: Muhammad Akhyar"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-205 rounded-xl text-slate-800 text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#facc15] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Alamat Email Google / Gmail</label>
                      <input
                        type="email"
                        required
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                        placeholder="nama.kamu@gmail.com"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-205 rounded-xl text-slate-800 text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#facc15] transition-all font-mono"
                      />
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingCustomGoogle(false)}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
                      >
                        Kembali
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-[#facc15] hover:bg-yellow-500 text-slate-900 text-xs font-black rounded-xl shadow-md transition-all cursor-pointer text-center"
                      >
                        Berikutnya
                      </button>
                    </div>
                  </motion.form>
                )}

                <div className="mt-6 pt-5 border-t border-slate-100 text-[10px] text-slate-400 leading-normal text-center">
                  Dengan melanjutkan masuk, Anda memberikan wewenang kepada Pusat Ilmu untuk memproses notifikasi masuk & sinkronisasi data kurikulum aman 100% tanpa typo ke email tujuan.
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 2. NOTIFIKASI LOGIN BERHASIL TERKIRIM KE EMAIL (FLOAT PANEL) */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isRegistered && showSecurityNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: 50 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-950 overflow-hidden"
          >
            {/* Header top colored bar simulating emergency warning or secure status */}
            <div className="h-1.5 bg-emerald-500 w-full animate-pulse"></div>
            
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 font-mono tracking-widest font-black uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      AUDIT NOTIFIKASI TERKIRIM
                    </span>
                    <h3 className="text-xs font-black text-white mt-1">Audit Keamanan Masuk Berhasil</h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowSecurityNotification(false)}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded-lg transition-colors cursor-pointer"
                  title="Tutup Notifikasi"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Message Box Simulating Received Email */}
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 text-slate-300 font-sans space-y-2.5">
                <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-900 pb-2 font-mono">
                  <span>Ke: {email}</span>
                  <span className="text-emerald-500 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Inboxes Terkirim
                  </span>
                </div>
                
                <p className="text-xs text-white font-extrabold leading-normal">
                  Halo Pengguna Google SSO,
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Kami mengonfirmasi akun Google Anda <strong className="text-[#facc15] font-mono">{email}</strong> baru saja sukses mengakses web <strong className="text-white">Pusat Ilmu</strong>. Hak akses kurikulum penuh dari tingkat SD sampai Kuliah telah dibuka.
                </p>

                {/* Sesi details mapping */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-850 text-slate-400">
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-slate-500">Waktu Masuk</span>
                    <strong className="text-white font-semibold">{new Date().toLocaleTimeString("id-ID")} WIB</strong>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-slate-500">Node Server</span>
                    <strong className="text-slate-300 font-semibold font-mono">ID-JAKARTA-01</strong>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-slate-500">Situs Web</span>
                    <strong className="text-white font-semibold">Pusat Ilmu V1.1</strong>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-slate-500">Status Sesi</span>
                    <strong className="text-emerald-400 font-bold flex items-center gap-1">
                      🟢 Terverifikasi
                    </strong>
                  </div>
                </div>
              </div>

              {/* Bottom Confirm */}
              <div className="flex items-center justify-between gap-4 pt-1">
                <span className="text-[10px] text-slate-500">Bukan Anda? Hubungi Pusat Pengaduan.</span>
                <button
                  type="button"
                  onClick={() => setShowSecurityNotification(false)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[10px] font-black px-3.5 py-1.5 rounded-lg transition-transform cursor-pointer"
                >
                  Saya Mengerti
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* FLOATING AI CHATBOT SYSTEM */}
      {isRegistered && (
        <div id="ai-chatbot-root" className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
          <AnimatePresence>
            {chatbotOpen && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 35, scale: 0.95 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-80 md:w-96 h-[480px] bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col mb-4 ring-1 ring-slate-900/5"
              >
                {/* Chatbot Header */}
                <div className="bg-slate-950 text-white p-4 flex items-center justify-between border-b border-slate-900 shadow-sm relative shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-slate-950 font-black relative shadow-md">
                      🔮
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[12px] tracking-wide uppercase text-white flex items-center gap-1.5 leading-none">
                        Tutor Pintar AI
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-mono leading-none">
                        <span className="text-emerald-400">●</span> Responsif Terpadu
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChatbotOpen(false)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Context badge showing what they are learning */}
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between gap-1.5 shrink-0 text-[10px]">
                  <span className="text-slate-500 font-semibold truncate max-w-[200px]">
                    Konteks: <strong className="text-slate-900 font-extrabold">{activeMaterial.topic}</strong> ({activeMaterial.level})
                  </span>
                  <span className="px-1.5 py-0.5 font-bold rounded text-white text-[8px] font-mono shadow-sm" style={{ backgroundColor: activeMaterial.color }}>
                    {activeMaterial.mapel}
                  </span>
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
                  {chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs font-semibold leading-relaxed shadow-sm ${
                          msg.sender === "user"
                            ? "bg-slate-900 text-white rounded-br-none"
                            : "bg-white text-slate-800 border border-slate-200/60 rounded-bl-none text-left"
                        }`}
                      >
                        <div className="whitespace-pre-line tracking-normal">
                          {msg.sender === "user" ? msg.text : cleanAndFormatChatText(msg.text)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-slate-200/60 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#facc15] animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#facc15] animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#facc15] animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggestion Prompt Chips */}
                <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none shrink-0">
                  {[
                    "Jelaskan bab ini lebih sederhana",
                    "Berikan saya kuis cepat",
                    "Sebutkan contoh industri terapan",
                    "Bagaimana cara membaca roda warna Nirmana?",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setChatInput(chip);
                      }}
                      className="text-[10px] bg-white text-slate-700 hover:text-slate-955 font-bold border border-slate-200 hover:border-slate-300 rounded-full px-3 py-1 cursor-pointer transition-all shadow-sm shrink-0 font-sans"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Chat Footer Input */}
                <form
                  onSubmit={handleSendChatMessage}
                  className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0 items-center"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Tanya apa saja tentang pelajaran..."
                    disabled={isChatLoading}
                    className="flex-1 bg-slate-100 hover:bg-slate-200/60 focus:bg-white text-xs font-semibold border-0 focus:ring-2 focus:ring-[#facc15] rounded-xl px-3.5 py-2 transition-all outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isChatLoading || !chatInput.trim()}
                    className="p-2.5 bg-slate-900 hover:bg-slate-800 text-[#facc15] rounded-xl transition-all cursor-pointer disabled:opacity-45"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trigger button */}
          <button
            type="button"
            onClick={() => setChatbotOpen(!chatbotOpen)}
            className="w-14 h-14 bg-slate-950 text-white rounded-full flex items-center justify-center shadow-2xl relative group hover:scale-105 active:scale-95 transition-transform cursor-pointer border border-slate-900"
          >
            {chatbotOpen ? (
              <X className="w-6 h-6 text-[#facc15]" />
            ) : (
              <div className="relative flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#facc15] animate-pulse" />
                <span className="absolute inset-0 w-6 h-6 rounded-full bg-[#facc15] opacity-25 blur-sm animate-ping"></span>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#eab308] border-2 border-slate-950 animate-pulse"></span>
              </div>
            )}
          </button>
        </div>
      )}

    </div>
  );
}

