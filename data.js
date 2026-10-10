var PI = {};
(function(){
/* ---------- Data ---------- */
function A(id,bidang,pendek,penulis,tahun,judul,jurnal,rinci,link,ringkas,metode,tags,temuan){
  return {id:id,bidang:bidang,pendek:pendek,penulis:penulis,tahun:tahun,judul:judul,jurnal:jurnal,rinci:rinci,link:link,ringkas:ringkas,metode:metode,tags:tags,temuan:temuan};
}
var DOI='https://doi.org/';
var DATA=[
A('a01','Pendidikan','Hattie & Timperley','Hattie, J., & Timperley, H.',2007,'The Power of Feedback','Review of Educational Research','77(1), 81–112',DOI+'10.3102/003465430298487',
 'Tinjauan ini menyintesis bukti tentang apa yang membuat umpan balik efektif bagi pembelajaran. Penulis mengusulkan model umpan balik yang menjawab tiga pertanyaan: ke mana siswa menuju, bagaimana kemajuannya, dan apa langkah berikutnya.',
 'Tinjauan konseptual yang menyintesis hasil banyak meta-analisis',['umpan balik','penilaian','motivasi','pembelajaran'],
 ['Umpan balik termasuk pengaruh terkuat pada capaian belajar, tetapi efeknya sangat beragam tergantung jenisnya','Umpan balik pada level tugas, proses, dan regulasi diri lebih membantu daripada pujian yang tertuju pada pribadi siswa','Umpan balik paling efektif bila menjelaskan tujuan, kemajuan, dan langkah lanjut secara jelas dan spesifik']),
A('a02','Pendidikan','Black & Wiliam','Black, P., & Wiliam, D.',1998,'Assessment and Classroom Learning','Assessment in Education: Principles, Policy & Practice','5(1), 7–74',DOI+'10.1080/0969595980050102',
 'Tinjauan luas atas penelitian tentang penilaian formatif di kelas, yaitu penilaian yang dipakai guru dan siswa untuk menyesuaikan pengajaran dan membantu proses belajar.',
 'Tinjauan literatur atas ratusan studi',['penilaian formatif','kelas','umpan balik'],
 ['Penguatan penilaian formatif dikaitkan dengan peningkatan capaian belajar yang besar (ukuran efek sekitar 0,4–0,7)','Siswa berprestasi rendah mendapat manfaat paling besar','Umpan balik yang informatif dan keterlibatan siswa menilai pekerjaannya sendiri menjadi unsur penting']),
A('a03','Pendidikan','Kirschner dkk.','Kirschner, P. A., Sweller, J., & Clark, R. E.',2006,'Why Minimal Guidance During Instruction Does Not Work: An Analysis of the Failure of Constructivist, Discovery, Problem-Based, Experiential, and Inquiry-Based Teaching','Educational Psychologist','41(2), 75–86',DOI+'10.1207/s15326985ep4102_1',
 'Artikel ini berargumen, berdasarkan teori beban kognitif, bahwa pembelajaran dengan bimbingan minimal kurang efektif dibanding instruksi dengan bimbingan kuat, terutama bagi pemula.',
 'Tinjauan argumentatif berbasis teori beban kognitif',['beban kognitif','instruksi langsung','pembelajaran penemuan','pemula'],
 ['Memori kerja manusia sangat terbatas, sehingga tugas penemuan yang terlalu terbuka membebani pemula','Bukti dari berbagai studi lebih mendukung instruksi dengan bimbingan kuat bagi pemula','Artikel ini memicu tanggapan balik dari pendukung pembelajaran berbasis masalah dan inkuiri']),
A('a04','Pendidikan','Freeman dkk.','Freeman, S., Eddy, S. L., McDonough, M., dkk.',2014,'Active Learning Increases Student Performance in Science, Engineering, and Mathematics','Proceedings of the National Academy of Sciences (PNAS)','111(23), 8410–8415',DOI+'10.1073/pnas.1319030111',
 'Meta-analisis yang membandingkan kuliah tradisional dengan pembelajaran aktif pada mata kuliah sains, teknik, dan matematika (STEM) tingkat sarjana.',
 'Meta-analisis 225 studi',['pembelajaran aktif','STEM','perkuliahan','meta-analisis'],
 ['Nilai ujian pada kelas pembelajaran aktif lebih tinggi sekitar 0,47 simpangan baku','Tingkat kegagalan sekitar 21,8% pada pembelajaran aktif, dibanding sekitar 33,8% pada kuliah tradisional','Manfaatnya konsisten di berbagai bidang STEM']),
A('a06','Pendidikan','Mishra & Koehler','Mishra, P., & Koehler, M. J.',2006,'Technological Pedagogical Content Knowledge: A Framework for Teacher Knowledge','Teachers College Record','108(6), 1017–1054',DOI+'10.1111/j.1467-9620.2006.00684.x',
 'Artikel ini memperluas gagasan pengetahuan konten pedagogis dengan menambahkan teknologi, dan memperkenalkan kerangka TPACK untuk menjelaskan pengetahuan yang dibutuhkan guru agar dapat mengajar dengan teknologi secara efektif.',
 'Pengembangan kerangka konseptual',['TPACK','teknologi pendidikan','pengetahuan guru','pedagogi'],
 ['Integrasi teknologi yang efektif menuntut hubungan antara pengetahuan konten, pedagogi, dan teknologi','Menguasai alat saja tidak cukup; penggunaannya bergantung pada konteks pengajaran','Kerangka ini memberi arah bagi pelatihan dan pengembangan profesional guru']),

A('a07','Kesehatan','Moher dkk.','Moher, D., Liberati, A., Tetzlaff, J., & Altman, D. G.',2009,'Preferred Reporting Items for Systematic Reviews and Meta-Analyses: The PRISMA Statement','PLoS Medicine','6(7), e1000097',DOI+'10.1371/journal.pmed.1000097',
 'Pedoman pelaporan untuk tinjauan sistematis dan meta-analisis. PRISMA memberi daftar periksa dan diagram alir agar penulis melaporkan prosesnya secara lengkap dan transparan.',
 'Pedoman pelaporan hasil konsensus pakar, menggantikan pedoman QUOROM',['tinjauan sistematis','meta-analisis','pelaporan','metodologi'],
 ['Daftar periksa 27 butir untuk bagian-bagian laporan tinjauan sistematis','Diagram alir empat tahap untuk menunjukkan proses seleksi studi','Pelaporan yang transparan memudahkan pembaca menilai mutu dan menelusuri ulang tinjauan']),
A('a08','Kesehatan','Wang dkk.','Wang, D., Hu, B., Hu, C., dkk.',2020,'Clinical Characteristics of 138 Hospitalized Patients With 2019 Novel Coronavirus–Infected Pneumonia in Wuhan, China','JAMA','323(11), 1061–1069',DOI+'10.1001/jama.2020.1585',
 'Laporan awal tentang karakteristik klinis 138 pasien pneumonia akibat virus corona baru yang dirawat di sebuah rumah sakit di Wuhan pada awal 2020.',
 'Studi deskriptif retrospektif di satu pusat layanan',['COVID-19','klinis','pneumonia','rumah sakit'],
 ['Gejala yang umum antara lain demam, kelelahan, dan batuk kering','Sekitar seperempat pasien memerlukan perawatan ICU','Pasien ICU cenderung lebih tua dan lebih sering memiliki penyakit penyerta']),
A('a09','Kesehatan','Polack dkk.','Polack, F. P., Thomas, S. J., Kitchin, N., dkk.',2020,'Safety and Efficacy of the BNT162b2 mRNA Covid-19 Vaccine','New England Journal of Medicine','383, 2603–2615',DOI+'10.1056/NEJMoa2034577',
 'Uji klinis fase 2/3 yang menilai keamanan dan kemanjuran vaksin mRNA BNT162b2 pada puluhan ribu peserta berusia 16 tahun ke atas.',
 'Uji klinis acak, tersamar pengamat, terkontrol plasebo',['vaksin','mRNA','COVID-19','uji klinis'],
 ['Dua dosis memberi kemanjuran sekitar 95% dalam mencegah Covid-19 bergejala','Efek samping yang umum ringan hingga sedang, terutama nyeri di lokasi suntikan dan kelelahan','Perlindungan serupa tampak pada berbagai subkelompok peserta']),
A('a10','Kesehatan','Ng dkk.','Ng, M., Fleming, T., Robinson, M., dkk.',2014,'Global, Regional, and National Prevalence of Overweight and Obesity in Children and Adults During 1980–2013','The Lancet','384(9945), 766–781',DOI+'10.1016/S0140-6736(14)60460-8',
 'Analisis global tentang tren kelebihan berat badan dan obesitas pada anak dan dewasa selama 1980–2013 di 188 negara.',
 'Analisis sistematis dan pemodelan data survei dari banyak negara',['obesitas','epidemiologi','kesehatan global','tren'],
 ['Proporsi dewasa dengan kelebihan berat badan atau obesitas naik dari sekitar 29–30% pada 1980 menjadi sekitar 37–38% pada 2013','Kenaikan juga terjadi pada anak-anak, terutama di negara maju','Selama 33 tahun, tidak ada negara yang melaporkan keberhasilan menurunkan angka tersebut secara nasional']),

A('a11','Sosial','Putnam','Putnam, R. D.',1995,'Bowling Alone: America\u2019s Declining Social Capital','Journal of Democracy','6(1), 65–78',DOI+'10.1353/jod.1995.0002',
 'Esai ini menunjukkan menurunnya modal sosial di Amerika Serikat: warga makin jarang terlibat dalam organisasi sipil dan kegiatan komunitas. Gambaran \u201cbermain boling sendirian\u201d dipakai sebagai simbol.',
 'Esai analitis berbasis data survei dan keanggotaan organisasi',['modal sosial','partisipasi','komunitas','demokrasi'],
 ['Keterlibatan dalam organisasi sipil dan kegiatan komunitas menurun dalam beberapa dekade','Penurunan modal sosial dikaitkan dengan melemahnya kepercayaan dan kerja sama warga','Dugaan penyebab mencakup pergeseran generasi dan teknologi hiburan seperti televisi']),
A('a12','Sosial','Granovetter','Granovetter, M. S.',1973,'The Strength of Weak Ties','American Journal of Sociology','78(6), 1360–1380',DOI+'10.1086/225469',
 'Artikel klasik jaringan sosial yang berargumen bahwa kenalan (ikatan lemah) sering lebih berguna daripada sahabat dekat untuk menyebarkan informasi dan membuka peluang, karena menjembatani kelompok yang berbeda.',
 'Argumen teoretis tentang jaringan sosial',['jaringan sosial','ikatan lemah','informasi','mobilitas'],
 ['Ikatan lemah menjembatani kelompok sosial yang berbeda','Ikatan kuat membentuk kelompok padat yang informasinya cenderung berulang','Ikatan lemah penting bagi penyebaran informasi baru dan akses ke peluang']),
A('a13','Sosial','Vosoughi dkk.','Vosoughi, S., Roy, D., & Aral, S.',2018,'The Spread of True and False News Online','Science','359(6380), 1146–1151',DOI+'10.1126/science.aap9559',
 'Studi ini menganalisis penyebaran kabar benar dan kabar bohong di Twitter selama 2006–2017, mencakup ratusan ribu rantai penyebaran yang dibagikan oleh jutaan orang.',
 'Analisis data skala besar atas rantai penyebaran kabar di Twitter',['hoaks','media sosial','misinformasi','jaringan'],
 ['Kabar bohong menyebar lebih jauh, lebih cepat, dan lebih luas daripada kabar benar','Efek ini paling kuat pada kabar politik','Bot menyebarkan kabar benar dan bohong dengan tingkat yang sama, sehingga manusia lebih berperan dalam penyebaran kabar bohong']),
A('a14','Sosial','Braun & Clarke','Braun, V., & Clarke, V.',2006,'Using Thematic Analysis in Psychology','Qualitative Research in Psychology','3(2), 77–101',DOI+'10.1191/1478088706qp063oa',
 'Panduan praktis analisis tematik, yaitu metode mengidentifikasi, menganalisis, dan melaporkan pola (tema) dalam data kualitatif.',
 'Panduan metodologis',['analisis tematik','kualitatif','metodologi','wawancara'],
 ['Analisis tematik fleksibel dan dapat dipakai dengan berbagai pendekatan teoretis','Enam fase: mengenal data, membuat kode awal, mencari tema, meninjau tema, mendefinisikan dan menamai tema, lalu menulis laporan','Penulis menekankan keputusan analitis harus eksplisit dan dilaporkan']),

A('a05','Psikologi','Ryan & Deci','Ryan, R. M., & Deci, E. L.',2000,'Self-Determination Theory and the Facilitation of Intrinsic Motivation, Social Development, and Well-Being','American Psychologist','55(1), 68–78',DOI+'10.1037/0003-066X.55.1.68',
 'Artikel ini menguraikan teori determinasi diri: motivasi intrinsik dan kesejahteraan tumbuh ketika tiga kebutuhan psikologis dasar terpenuhi, yaitu otonomi, kompetensi, dan keterhubungan.',
 'Tinjauan teoretis',['motivasi','otonomi','kompetensi','kesejahteraan'],
 ['Kebutuhan akan otonomi, kompetensi, dan keterhubungan mendasari motivasi dan kesejahteraan','Kondisi sosial yang mendukung kebutuhan itu meningkatkan motivasi','Imbalan eksternal dan kontrol yang berlebihan dapat melemahkan motivasi intrinsik']),
A('a15','Psikologi','Open Science Collaboration','Open Science Collaboration',2015,'Estimating the Reproducibility of Psychological Science','Science','349(6251), aac4716',DOI+'10.1126/science.aac4716',
 'Proyek kolaboratif yang mereplikasi 100 studi psikologi yang diterbitkan di tiga jurnal terkemuka untuk melihat seberapa sering hasil aslinya terulang.',
 'Replikasi langsung terhadap 100 studi',['replikasi','reproduksibilitas','psikologi','sains terbuka'],
 ['Sekitar 97% studi asli melaporkan hasil signifikan, tetapi hanya sekitar 36% replikasi yang signifikan','Rata-rata ukuran efek pada replikasi kira-kira setengah dari studi asli','Hasil ini memicu diskusi luas tentang praktik penelitian dan keterbukaan data']),

A('a16','Teknologi','Vaswani dkk.','Vaswani, A., Shazeer, N., Parmar, N., dkk.',2017,'Attention Is All You Need','Advances in Neural Information Processing Systems 30 (NeurIPS)','30','https://arxiv.org/abs/1706.03762',
 'Artikel yang memperkenalkan arsitektur Transformer, model jaringan saraf yang sepenuhnya bertumpu pada mekanisme perhatian (attention) dan menjadi dasar banyak model bahasa modern.',
 'Perancangan arsitektur model dan evaluasi pada terjemahan mesin',['transformer','attention','NLP','deep learning'],
 ['Transformer tidak memakai rekurensi maupun konvolusi, hanya mekanisme perhatian','Pada tugas terjemahan mesin WMT 2014, kualitasnya mengungguli hasil terbaik saat itu','Proses pelatihan lebih mudah diparalelkan sehingga lebih cepat']),
A('a17','Teknologi','LeCun dkk.','LeCun, Y., Bengio, Y., & Hinton, G.',2015,'Deep Learning','Nature','521, 436–444',DOI+'10.1038/nature14539',
 'Tinjauan tentang pembelajaran mendalam, yaitu model berlapis banyak yang mempelajari representasi data secara bertahap dan dilatih dengan backpropagation.',
 'Artikel tinjauan (review)',['deep learning','jaringan saraf','CNN','representasi'],
 ['Jaringan konvolusional unggul pada citra, video, dan audio','Jaringan rekuren dipakai untuk data berurutan seperti teks dan ucapan','Pembelajaran mendalam mendorong kemajuan pengenalan suara, citra, dan bahasa']),
A('a18','Teknologi','Davis','Davis, F. D.',1989,'Perceived Usefulness, Perceived Ease of Use, and User Acceptance of Information Technology','MIS Quarterly','13(3), 319–340',DOI+'10.2307/249008',
 'Artikel yang mengembangkan dan menguji skala pengukuran untuk dua faktor penentu penerimaan teknologi: persepsi kegunaan dan persepsi kemudahan penggunaan. Ini dasar Technology Acceptance Model (TAM).',
 'Pengembangan dan validasi skala pengukuran lewat dua studi',['TAM','penerimaan teknologi','usability','sistem informasi'],
 ['Persepsi kegunaan dan persepsi kemudahan penggunaan dapat diukur dengan skala yang andal dan valid','Persepsi kegunaan berkaitan lebih kuat dengan penggunaan teknologi dibanding kemudahan penggunaan','Kemudahan penggunaan penting, tetapi pengaruhnya sebagian lewat persepsi kegunaan']),

A('a19','Ekonomi','Kahneman & Tversky','Kahneman, D., & Tversky, A.',1979,'Prospect Theory: An Analysis of Decision under Risk','Econometrica','47(2), 263–291',DOI+'10.2307/1914185',
 'Artikel ini mengusulkan teori prospek sebagai alternatif teori utilitas harapan untuk menjelaskan bagaimana orang sungguh-sungguh mengambil keputusan berisiko.',
 'Eksperimen pilihan hipotetis dan model teoretis',['teori prospek','ekonomi perilaku','keputusan','risiko'],
 ['Orang menilai hasil sebagai untung atau rugi terhadap titik acuan, bukan kekayaan total','Kerugian terasa lebih berat daripada keuntungan sebesar yang sama (aversi kerugian)','Probabilitas tidak dipertimbangkan secara linier; hasil yang pasti diberi bobot berlebih']),
A('a20','Ekonomi','Akerlof','Akerlof, G. A.',1970,'The Market for \u201cLemons\u201d: Quality Uncertainty and the Market Mechanism','The Quarterly Journal of Economics','84(3), 488–500',DOI+'10.2307/1879431',
 'Artikel ini menjelaskan bagaimana asimetri informasi, misalnya penjual tahu kualitas barang sedangkan pembeli tidak, dapat merusak fungsi pasar. Contoh utamanya pasar mobil bekas.',
 'Model teoretis',['asimetri informasi','pasar','kualitas','ekonomi'],
 ['Bila pembeli tidak bisa menilai kualitas, harga mencerminkan kualitas rata-rata','Barang berkualitas baik bisa tersingkir oleh barang berkualitas buruk','Pasar dapat menyusut atau runtuh; institusi seperti garansi dan reputasi membantu mengatasinya']),

A('a21','Lingkungan','Rockström dkk.','Rockström, J., Steffen, W., Noone, K., dkk.',2009,'A Safe Operating Space for Humanity','Nature','461, 472–475',DOI+'10.1038/461472a',
 'Artikel yang memperkenalkan konsep batas planet: sembilan proses sistem Bumi yang perlu dijaga dalam batas tertentu agar kondisi yang mendukung kehidupan manusia tetap stabil.',
 'Kerangka konseptual dengan estimasi batas kuantitatif',['batas planet','iklim','keanekaragaman hayati','keberlanjutan'],
 ['Diusulkan sembilan batas planet yang menandai ruang aman bagi manusia','Tiga batas dinilai sudah terlampaui: perubahan iklim, laju kehilangan keanekaragaman hayati, dan siklus nitrogen','Batas-batas itu saling terkait, sehingga melampaui satu dapat memengaruhi yang lain']),
A('a22','Lingkungan','Steffen dkk.','Steffen, W., Richardson, K., Rockström, J., dkk.',2015,'Planetary Boundaries: Guiding Human Development on a Changing Planet','Science','347(6223), 1259855',DOI+'10.1126/science.1259855',
 'Pembaruan kerangka batas planet dengan data dan konsep yang lebih baru, termasuk penyempurnaan cara menilai tiap batas.',
 'Pembaruan kerangka konseptual dengan analisis data terbaru',['batas planet','Antroposen','perubahan lingkungan','keberlanjutan'],
 ['Empat batas dinilai sudah terlampaui: perubahan iklim, integritas biosfer, perubahan sistem lahan, dan aliran biogeokimia (fosfor dan nitrogen)','Perubahan iklim dan integritas biosfer disebut sebagai batas inti','Kerangka ini dipakai sebagai panduan kebijakan pembangunan yang berkelanjutan']),
A('a23','Lingkungan','Hardin','Hardin, G.',1968,'The Tragedy of the Commons','Science','162(3859), 1243–1248',DOI+'10.1126/science.162.3859.1243',
 'Esai klasik yang berargumen bahwa sumber daya bersama yang bebas dipakai siapa saja cenderung rusak karena setiap orang mengejar keuntungan pribadi, dan bahwa masalah seperti ini tidak punya solusi teknis semata.',
 'Esai argumentatif',['sumber daya bersama','kebijakan publik','populasi','lingkungan'],
 ['Kebebasan memakai sumber daya bersama dapat berujung pada kerusakan bagi semua pihak','Sebagian masalah memerlukan perubahan nilai dan aturan, bukan hanya solusi teknis','Hardin mengusulkan pengaturan yang disepakati bersama sebagai jalan keluar'])
];

var FIELD_ORDER=['Pendidikan','Kesehatan','Sosial','Psikologi','Teknologi','Ekonomi','Lingkungan'];
var FIELD_COLOR={Pendidikan:'#0B7C86',Kesehatan:'#C8401F',Sosial:'#F2A900',Psikologi:'#7A4BC9',Teknologi:'#2F55D4',Ekonomi:'#C2255C',Lingkungan:'#257A37',Lainnya:'#5E6A7D'};
var EXAMPLES=['Pengaruh umpan balik terhadap motivasi belajar','Penyebaran hoaks di media sosial','Mengapa orang tertarik memakai aplikasi baru','Cara menganalisis data wawancara','Dampak tekanan pada lingkungan global'];

PI.DATA = DATA; PI.FIELD_ORDER = FIELD_ORDER; PI.FIELD_COLOR = FIELD_COLOR; PI.EXAMPLES = EXAMPLES;
})();
