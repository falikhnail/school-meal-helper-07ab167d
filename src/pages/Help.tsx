import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Globe, Download, UserPlus, Trash2, Calendar, MousePointerClick, Layers, CreditCard, FileText, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Help = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-foreground">📖 Panduan Penggunaan</h2>
            <p className="text-sm text-muted-foreground">Sistem Pendataan Makan Guru SR</p>
          </div>
        </div>

        <Accordion type="multiple" className="space-y-3" defaultValue={["akses"]}>
          {/* Akses Aplikasi */}
          <AccordionItem value="akses" className="border rounded-xl bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                <span className="font-semibold">Mengakses Aplikasi</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-3 pb-4">
              <p>Buka browser di perangkat Anda (Chrome, Safari, Firefox, Edge) dan ketik alamat:</p>
              <code className="block bg-muted rounded-lg px-4 py-2 text-sm font-mono text-foreground">
                https://data-makansr.vercel.app/
              </code>
              <p>Aplikasi akan terbuka dan siap digunakan.</p>
            </AccordionContent>
          </AccordionItem>

          {/* Install PWA */}
          <AccordionItem value="install" className="border rounded-xl bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/10">
                  <Download className="w-4 h-4 text-secondary" />
                </div>
                <span className="font-semibold">Install Aplikasi (PWA)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4 pb-4">
              <p>Aplikasi ini dapat diinstall ke perangkat Anda untuk akses lebih cepat.</p>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">📱 Android (Chrome)</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Buka aplikasi di browser Chrome</li>
                  <li>Ketuk ikon menu (⋮) di pojok kanan atas</li>
                  <li>Pilih <strong>"Install app"</strong> atau <strong>"Add to Home Screen"</strong></li>
                  <li>Ketuk <strong>"Install"</strong> pada dialog konfirmasi</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">🍎 iPhone/iPad (Safari)</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Buka aplikasi di browser Safari</li>
                  <li>Ketuk ikon <strong>Share</strong> (kotak dengan panah ke atas)</li>
                  <li>Scroll ke bawah dan pilih <strong>"Add to Home Screen"</strong></li>
                  <li>Ketuk <strong>"Add"</strong></li>
                </ol>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">🖥️ Desktop (Chrome/Edge)</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Buka aplikasi di browser</li>
                  <li>Klik ikon install (⊕) di address bar</li>
                  <li>Klik <strong>"Install"</strong> pada dialog konfirmasi</li>
                </ol>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Mengelola Guru */}
          <AccordionItem value="guru" className="border rounded-xl bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/20">
                  <UserPlus className="w-4 h-4 text-accent-foreground" />
                </div>
                <span className="font-semibold">Mengelola Data Guru</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4 pb-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">➕ Menambah Guru Baru</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Lihat panel <strong>"Daftar Guru"</strong> di sebelah kanan</li>
                  <li>Klik tombol <strong>"+ Tambah Guru"</strong></li>
                  <li>Isi nama guru pada kolom yang tersedia</li>
                  <li>Pilih keterangan/peran: Kepala Sekolah, Guru, Tendik, Nakes, atau Kepala Komite</li>
                  <li>Klik <strong>"Simpan"</strong></li>
                </ol>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Menghapus Guru
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Pada daftar guru, cari nama yang ingin dihapus</li>
                  <li>Klik ikon 🗑️ di sebelah kanan nama</li>
                  <li>Data guru akan terhapus beserta semua catatan makannya</li>
                </ol>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Filter Periode */}
          <AccordionItem value="filter" className="border rounded-xl bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <span className="font-semibold">Memilih Periode (Bulan & Tahun)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-2 pb-4">
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Di bagian atas halaman, temukan <strong>"Filter Periode"</strong></li>
                <li>Pilih <strong>bulan</strong> dari dropdown pertama</li>
                <li>Pilih <strong>tahun</strong> dari dropdown kedua</li>
                <li>Untuk kembali ke bulan ini, klik tombol <strong>"Hari Ini"</strong></li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          {/* Mode Individual */}
          <AccordionItem value="individual" className="border rounded-xl bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/10">
                  <MousePointerClick className="w-4 h-4 text-secondary" />
                </div>
                <span className="font-semibold">Mencatat Makan - Mode Individual</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-3 pb-4">
              <p className="text-sm">Gunakan mode ini untuk mencatat makan pada <strong>satu tanggal spesifik</strong>.</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Pastikan mode <strong>"Individual"</strong> aktif (tombol di header tabel)</li>
                <li>Cari baris guru yang ingin dicatat</li>
                <li>Klik pada sel tanggal yang diinginkan</li>
                <li>☀️ = Sudah makan | Kosong = Belum makan</li>
                <li>Klik lagi untuk membatalkan</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          {/* Mode Bulk */}
          <AccordionItem value="bulk" className="border rounded-xl bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/20">
                  <Layers className="w-4 h-4 text-accent-foreground" />
                </div>
                <span className="font-semibold">Mencatat Makan - Mode Bulk (Massal)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4 pb-4">
              <p className="text-sm">Gunakan mode ini untuk mencatat makan <strong>beberapa minggu sekaligus</strong> pada hari yang sama.</p>
              
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Klik tombol <strong>"Bulk"</strong> di header tabel untuk mengaktifkan</li>
                <li>Klik tombol <strong>"Hari"</strong> untuk memilih hari apa saja (Senin-Jumat, dll)</li>
                <li>Klik tombol <strong>"Minggu"</strong> untuk memilih minggu ke berapa (1-5)</li>
                <li>Klik salah satu tanggal di baris guru yang diinginkan</li>
                <li>Semua tanggal sesuai hari & minggu yang dipilih akan otomatis tercentang</li>
              </ol>

              <Card className="border-dashed">
                <CardContent className="pt-4">
                  <h4 className="font-semibold text-foreground text-sm mb-2">💡 Contoh Penggunaan:</h4>
                  <p className="text-sm">
                    Guru April makan setiap Senin-Jumat selama 2 minggu pertama:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-sm mt-2">
                    <li>Aktifkan mode "Bulk"</li>
                    <li>Pilih Minggu 1 dan 2 di menu "Minggu"</li>
                    <li>Pastikan Senin-Jumat terpilih di menu "Hari"</li>
                    <li>Klik salah satu tanggal Senin di baris April</li>
                    <li>Ulangi untuk Selasa, Rabu, Kamis, Jumat → 10 hari terisi!</li>
                  </ol>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Status Pembayaran */}
          <AccordionItem value="pembayaran" className="border rounded-xl bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                  <CreditCard className="w-4 h-4 text-primary" />
                </div>
                <span className="font-semibold">Mengelola Status Pembayaran</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-2 pb-4">
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Pada tabel data makan, lihat kolom <strong>"Status"</strong></li>
                <li>Klik badge status untuk mengubah:</li>
              </ol>
              <ul className="list-disc list-inside text-sm ml-4 space-y-1">
                <li>🟢 <strong>Lunas</strong> = Pembayaran sudah diterima</li>
                <li>🔴 <strong>Belum</strong> = Pembayaran belum diterima</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Export PDF */}
          <AccordionItem value="export" className="border rounded-xl bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/10">
                  <FileText className="w-4 h-4 text-secondary" />
                </div>
                <span className="font-semibold">Export Laporan PDF</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-2 pb-4">
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Klik tombol <strong>"Export PDF"</strong> di bagian atas tabel</li>
                <li>File PDF akan otomatis terunduh</li>
                <li>PDF berisi: Judul laporan, tabel lengkap (Nama, Keterangan, Jumlah Porsi, Total Tagihan, Status), dan ringkasan total</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          {/* FAQ */}
          <AccordionItem value="faq" className="border rounded-xl bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/20">
                  <HelpCircle className="w-4 h-4 text-accent-foreground" />
                </div>
                <span className="font-semibold">FAQ (Pertanyaan Umum)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4 pb-4">
              <div className="space-y-1">
                <h4 className="font-semibold text-foreground text-sm">Apakah data tersimpan otomatis?</h4>
                <p className="text-sm">Ya, setiap perubahan tersimpan otomatis ke database.</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-foreground text-sm">Bisakah digunakan offline?</h4>
                <p className="text-sm">Ya, jika sudah diinstall sebagai aplikasi. Namun sinkronisasi data memerlukan koneksi internet.</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-foreground text-sm">Berapa harga per porsi?</h4>
                <p className="text-sm">Rp 10.000 per porsi makan.</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-foreground text-sm">Bagaimana jika salah input?</h4>
                <p className="text-sm">Klik kembali sel yang salah untuk membatalkan, atau gunakan Mode Individual untuk koreksi spesifik.</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </main>
    </div>
  );
};

export default Help;
