/**
 * ATHA-BOT version 1.00
 * WhatsApp Bot - Minimal Version
 * Langsung jalan!
 */

const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

// Database sederhana (pake memory)
global.gameSessions = {};
global.userPoints = {};

async function connectToWhatsApp() {
    console.log('╔════════════════════════════╗');
    console.log('║   ATHA-BOT VERSION 1.00    ║');
    console.log('║       Starting...           ║');
    console.log('╚════════════════════════════╝\n');
    
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        printQRInTerminal: false,
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['atha-bot', 'Chrome', '1.0.0']
    });

    // Handle koneksi
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('\n📱 SCAN QR CODE INI DENGAN WHATSAPP:\n');
            qrcode.generate(qr, { small: true });
            console.log('\n⏳ Tunggu scan...');
        }
        
        if (connection === 'open') {
            console.log('\n✅✅✅ BOT BERHASIL CONNECT! ✅✅✅');
            console.log('📱 Nomor Bot: ' + sock.user?.id?.split(':')[0]);
            console.log('💬 Ketik .menu untuk melihat perintah\n');
        }
        
        if (connection === 'close') {
            console.log('❌ Koneksi terputus. Reconnect dalam 3 detik...');
            setTimeout(() => connectToWhatsApp(), 3000);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Handle pesan masuk
    sock.ev.on('messages.upsert', async ({ messages }) => {
        try {
            const m = messages[0];
            
            // Filter pesan yang tidak perlu
            if (!m || !m.message || m.key.fromMe) return;
            if (m.key.remoteJid === 'status@broadcast') return;
            
            const sender = m.key.remoteJid;
            const isGroup = sender.endsWith('@g.us');
            const senderName = m.pushName || 'User';
            
            // Ambil teks pesan
            let pesan = '';
            const msgType = Object.keys(m.message)[0];
            
            if (msgType === 'conversation') {
                pesan = m.message.conversation || '';
            } else if (msgType === 'extendedTextMessage') {
                pesan = m.message.extendedTextMessage.text || '';
            } else if (msgType === 'imageMessage') {
                pesan = m.message.imageMessage.caption || '';
            }
            
            if (!pesan) return;
            
            // Log pesan
            console.log(`📨 [${new Date().toLocaleTimeString()}] ${senderName}: ${pesan}`);
            
            // Handle command
            if (pesan.startsWith('.')) {
                const cmd = pesan.slice(1).split(' ')[0].toLowerCase();
                const args = pesan.slice(1).split(' ').slice(1);
                const query = args.join(' ');
                
                // ========== MENU UTAMA ==========
                if (cmd === 'menu' || cmd === 'help') {
                    const teks = `╔══✿ *ATHA-BOT v1.00* ✿══╗
║
║  Halo *${senderName}*!
║
╠══ 📋 *MENU UTAMA* ══╣
║  • .menu - Menu ini
║  • .info - Info bot
║  • .ping - Cek respon
║
╠══ 🎨 *KREATOR* ══╣
║  • .sticker - Buat stiker
║  • .brat [teks] - Stiker BRAT
║
╠══ 🎮 *GAMES* ══╣
║  • .tebakangka - Tebak angka
║  • .suit [pilihan] - Suit
║  • .slot - Mesin slot
║  • .poin - Cek poin
║
╠══ 📦 *LAINNYA* ══╣
║  • .quotes - Quotes random
║  • .bacot - Kata random
║  • .cuaca [kota] - Info cuaca
║
╚══════════════════╝`;
                    
                    await sock.sendMessage(sender, { text: teks });
                }
                
                // ========== INFO ==========
                else if (cmd === 'info') {
                    await sock.sendMessage(sender, { 
                        text: `🤖 *ATHA-BOT v1.00*\n\n📅 Rilis: 2024\n⚡ Status: Online\n👨‍💻 Dev: Atha\n📊 Fitur: 15+\n\nKetik .menu untuk bantuan` 
                    });
                }
                
                // ========== PING ==========
                else if (cmd === 'ping') {
                    const start = Date.now();
                    await sock.sendMessage(sender, { text: '⚡ *Pong!*' });
                    const end = Date.now();
                    await sock.sendMessage(sender, { text: `⏱️ *${end - start}ms*` });
                }
                
                // ========== QUOTES ==========
                else if (cmd === 'quotes') {
                    const quotes = [
                        "Hidup itu seperti bersepeda. Untuk menjaga keseimbangan, kamu harus terus bergerak.",
                        "Jangan tunda sampai besok apa yang bisa kamu lakukan hari ini.",
                        "Kesuksesan bukanlah akhir, kegagalan tidak fatal. Yang terpenting adalah keberanian untuk melanjutkan.",
                        "Hidup adalah petualangan, beranikan diri untuk menjalaninya.",
                        "Bersyukur adalah kunci kebahagiaan."
                    ];
                    const random = quotes[Math.floor(Math.random() * quotes.length)];
                    await sock.sendMessage(sender, { text: `💭 *Quotes of the Day*\n\n"${random}"` });
                }
                
                // ========== BACOT ==========
                else if (cmd === 'bacot') {
                    const bacot = [
                        "Udah makan? Jangan lupa minum!",
                        "Halo juga, apa kabar?",
                        "Capek? Istirahat dulu...",
                        "Semangat ya hari ini!",
                        "Jangan lupa bahagia 😊"
                    ];
                    const random = bacot[Math.floor(Math.random() * bacot.length)];
                    await sock.sendMessage(sender, { text: `💬 *Bacotan:* ${random}` });
                }
                
                // ========== TEBAK ANGKA ==========
                else if (cmd === 'tebakangka') {
                    const angka = Math.floor(Math.random() * 10) + 1;
                    global.gameSessions[sender] = {
                        game: 'tebakangka',
                        angka: angka,
                        attempts: 0
                    };
                    await sock.sendMessage(sender, { 
                        text: `🎲 *GAME TEBAK ANGKA*\n\nAku sudah memilih angka 1-10.\nCoba tebak! (Ketik angkanya)\n\nKetik .cancel untuk batal.` 
                    });
                }
                
                // ========== SUIT ==========
                else if (cmd === 'suit') {
                    if (!query || !['batu', 'gunting', 'kertas'].includes(query)) {
                        await sock.sendMessage(sender, { 
                            text: '❌ Pilihan tidak valid!\nGunakan: .suit batu / gunting / kertas' 
                        });
                        return;
                    }
                    
                    const pilihanBot = ['batu', 'gunting', 'kertas'][Math.floor(Math.random() * 3)];
                    
                    let hasil = '';
                    if (query === pilihanBot) {
                        hasil = '🤝 *SERI!*';
                    } else if (
                        (query === 'batu' && pilihanBot === 'gunting') ||
                        (query === 'gunting' && pilihanBot === 'kertas') ||
                        (query === 'kertas' && pilihanBot === 'batu')
                    ) {
                        hasil = '🎉 *KAMU MENANG!*';
                        // Tambah poin
                        global.userPoints[sender] = (global.userPoints[sender] || 100) + 10;
                    } else {
                        hasil = '😢 *KAMU KALAH!*';
                        // Kurang poin
                        global.userPoints[sender] = (global.userPoints[sender] || 100) - 5;
                    }
                    
                    await sock.sendMessage(sender, { 
                        text: `🪨📄✂️ *SUIT*\n\nKamu: ${query}\nBot: ${pilihanBot}\n\n${hasil}\n\n💰 Poin: ${global.userPoints[sender] || 100}` 
                    });
                }
                
                // ========== SLOT ==========
                else if (cmd === 'slot') {
                    // Cek poin
                    global.userPoints[sender] = global.userPoints[sender] || 100;
                    
                    if (global.userPoints[sender] < 10) {
                        await sock.sendMessage(sender, { text: '❌ Poin tidak cukup! Minimal 10 poin.' });
                        return;
                    }
                    
                    global.userPoints[sender] -= 10;
                    
                    const slot = ['🍒', '🍊', '7⃣', '💎', '🎰'];
                    const a = slot[Math.floor(Math.random() * slot.length)];
                    const b = slot[Math.floor(Math.random() * slot.length)];
                    const c = slot[Math.floor(Math.random() * slot.length)];
                    
                    let hadiah = 0;
                    if (a === b && b === c) {
                        hadiah = 100;
                    } else if (a === b || b === c || a === c) {
                        hadiah = 20;
                    }
                    
                    global.userPoints[sender] += hadiah;
                    
                    await sock.sendMessage(sender, { 
                        text: `🎰 *SLOT MACHINE*\n\n[ ${a} | ${b} | ${c} ]\n\n${hadiah > 0 ? '🎉 MENANG +' + hadiah : '😢 Coba lagi'}\n💰 Poin: ${global.userPoints[sender]}` 
                    });
                }
                
                // ========== CEK POIN ==========
                else if (cmd === 'poin') {
                    const poin = global.userPoints[sender] || 100;
                    await sock.sendMessage(sender, { 
                        text: `💰 *Poin Kamu*\n\nTotal: *${poin}*\n\nMain game untuk dapat poin lebih!` 
                    });
                }
                
                // ========== CANCEL ==========
                else if (cmd === 'cancel') {
                    if (global.gameSessions[sender]) {
                        delete global.gameSessions[sender];
                        await sock.sendMessage(sender, { text: '✅ Game dibatalkan.' });
                    } else {
                        await sock.sendMessage(sender, { text: '❌ Tidak ada game aktif.' });
                    }
                }
                
                // ========== CUACA ==========
                else if (cmd === 'cuaca') {
                    const kota = query || 'Jakarta';
                    await sock.sendMessage(sender, { 
                        text: `🌤️ *Cuaca di ${kota}*\n\nSuhu: 28°C\nKondisi: Cerah\nKelembaban: 70%\nAngin: 15 km/jam\n\n(Data simulasi - untuk real pakai API)` 
                    });
                }
                
                // ========== BRAT ==========
                else if (cmd === 'brat') {
                    const teks = query || 'ATHA-BOT';
                    await sock.sendMessage(sender, { 
                        text: `🎨 *BRAT STICKER*\n\nTeks: "${teks}"\n\n(Fitur ini perlu library tambahan)\nInstall sharp & ffmpeg untuk generate` 
                    });
                }
                
                // ========== COMMAND TIDAK DIKENAL ==========
                else {
                    await sock.sendMessage(sender, { 
                        text: `❌ Command *.${cmd}* tidak dikenal.\nKetik .menu untuk bantuan.` 
                    });
                }
            }
            
            // Handle game response (untuk tebak angka)
            else if (global.gameSessions[sender]?.game === 'tebakangka') {
                const session = global.gameSessions[sender];
                const tebakan = parseInt(pesan);
                
                if (!isNaN(tebakan)) {
                    session.attempts++;
                    
                    if (tebakan === session.angka) {
                        // Beri poin
                        global.userPoints[sender] = (global.userPoints[sender] || 100) + 20;
                        
                        await sock.sendMessage(sender, { 
                            text: `🎉 *BENAR!*\nAngka: ${session.angka}\nPercobaan: ${session.attempts}\n💰 Hadiah: +20 poin\n💎 Poin: ${global.userPoints[sender]}` 
                        });
                        delete global.gameSessions[sender];
                    } else if (tebakan < session.angka) {
                        await sock.sendMessage(sender, { text: '📈 Terlalu rendah' });
                    } else {
                        await sock.sendMessage(sender, { text: '📉 Terlalu tinggi' });
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ Error:', error);
        }
    });
}

// Error handling
process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);

// Jalankan
connectToWhatsApp();