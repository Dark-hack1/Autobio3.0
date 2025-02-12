const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@adiwajshing/baileys');
const moment = require('moment-timezone');
const fs = require('fs');

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('Connected to WhatsApp');
            startBioUpdateCycle(sock);
            stayOnline(sock);
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

async function updateBio(sock) {
    const time = moment().tz('America/Port-au-Prince').format('ddd DD MMM YYYY HH:mm');
    const bio = `${time} ☑️🎚️I need someone`;
    try {
        await sock.updateProfileStatus(bio);
        console.log('Updated bio:', bio);
    } catch (error) {
        console.error('Failed to update bio:', error);
    }
}

function startBioUpdateCycle(sock) {
    updateBio(sock);
    setInterval(() => updateBio(sock), 60 * 60 * 1000); // Every hour
}

function stayOnline(sock) {
    setInterval(() => {
        sock.sendPresenceUpdate('available');
    }, 10 * 1000); // Every 10 seconds
}

connectToWhatsApp();
