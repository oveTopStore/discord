require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, getVoiceConnection } = require('@discordjs/voice');
const path = require('path');

const { TOKEN, VOICE_CHANNEL_ID, GUILD_ID, TEXT_CHANNEL_ID, ROLE_ID } = require('./config/config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', async () => {
    console.clear(); // 🧹 مسح `cmd` لعرض الحقوق بوضوح
    console.log(`
    ╔════════════════════════════════════════════════════╗
    ║  ✅ Bot Started Successfully                       ║
    ║  🤖 Logged in as: ${client.user.tag}                   ║
    ║  🛠️ Created by: [ OVE ]                            ║
    ║  🔗 Join our Discord: https://discord.gg/tiy       ║
    ║  📅 Date: ${new Date().toLocaleString()}               ║
    ╚════════════════════════════════════════════════════╝
    `);
});

// 🟢 **دالة لجعل البوت ينضم عند دخول أول شخص فقط**
async function joinVoice(channel) {
    if (getVoiceConnection(channel.guild.id)) return; // ✅ منع الانضمام إذا كان البوت متصلًا

    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator
    });

    console.log("🎤 The bot joined the voice channel and started playing audio.");

    const player = createAudioPlayer();
    const resource = createAudioResource(path.join(__dirname, 'audio', 'support.mp3'));
    player.play(resource);
    connection.subscribe(player);
}

// 🟢 **حدث دخول وخروج المستخدمين من الروم الصوتي**
client.on('voiceStateUpdate', async (oldState, newState) => {
    console.log("🔄 Event triggered: voiceStateUpdate");

    try {
        const channel = newState.channel || oldState.channel;
        if (!channel || channel.id !== VOICE_CHANNEL_ID) return;

        const textChannel = await client.channels.fetch(TEXT_CHANNEL_ID);
        if (!textChannel) {
            console.log("❌ Text channel not found!");
            return;
        }

        const guild = newState.guild || oldState.guild || await client.guilds.fetch(GUILD_ID);
        if (!guild) {
            console.log("❌ Guild not found!");
            return;
        }

        const role = guild.roles.cache.get(ROLE_ID);
        if (!role) {
            console.log("❌ Role not found!");
            return;
        }

        const member = newState.member || oldState.member;
        if (!member || member.user.bot) return; // ✅ منع البوت من إرسال الرسائل عند تفاعله

        const username = member.user.tag;
        const avatarURL = member.user.displayAvatarURL({ dynamic: true });
        const mentionUser = `<@${member.id}>`;
        const mentionRole = `<@&${ROLE_ID}>`;

        // 🟢 **إذا دخل العضو الروم الصوتي**
        if (!oldState.channelId && newState.channelId === VOICE_CHANNEL_ID) {
            console.log(`✅ ${username} entered the voice channel.`);

            const membersInChannel = channel.members.filter(member => !member.user.bot).size;
            if (membersInChannel === 1) {
                joinVoice(channel);
            }

            // 🟢 **إرسال رسالة دخول**
            const embed = new EmbedBuilder()
                .setColor("#2ECC71")
                .setTitle("🔊 مستخدم جديد دخل الروم الصوتي!")
                .setDescription(`${mentionUser} دخل الروم الصوتي! ${mentionRole}`)
                .setThumbnail("https://cdn.discordapp.com/avatars/1341945565659004998/a_02e1d13d97f8fe1cb3a18282b7645d50.gif")
                .setTimestamp()
                .setFooter({ text: "نشاط الصوت", iconURL: client.user.displayAvatarURL() });

            textChannel.send({ embeds: [embed] });
        } 
        // 🛑 **إذا خرج العضو من الروم الصوتي**
        else if (oldState.channelId === VOICE_CHANNEL_ID && !newState.channelId) {
            console.log(`❌ ${username} exited from the voice channel.`);

            const membersInChannel = channel.members.filter(member => !member.user.bot).size;
            if (membersInChannel === 0) {
                const connection = getVoiceConnection(channel.guild.id);
                if (connection) {
                    console.log("⚠️ No users left in the voice channel. The bot will leave.");
                    connection.destroy();
                }
            }

            // 🔴 **إرسال رسالة خروج**
            const embed = new EmbedBuilder()
                .setColor("#E74C3C")
                .setTitle("🔇 مستخدم غادر الروم الصوتي")
                .setDescription(`${mentionUser} خرج من الروم الصوتي! ${mentionRole}`)
                .setThumbnail("https://cdn.discordapp.com/avatars/1341945565659004998/a_02e1d13d97f8fe1cb3a18282b7645d50.gif")
                .setTimestamp()
                .setFooter({ text: "نشاط الصوت", iconURL: client.user.displayAvatarURL() });

            textChannel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error("❌ خطأ في مراقبة الصوت:", error);
    }
});

client.login('MTM0MTk0NTU2NTY1OTAwNDk5OA.Gv1-ev.u3E8My9KNIROXpg9i4TGfNzrRreUSAFlskUazI'); // استبدل برمز البوت الخاص بك
