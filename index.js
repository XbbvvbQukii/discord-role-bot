require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

// Initialisierung des Discord Clients mit den erforderlichen Intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Bot Präfix
const PREFIX = '!';

client.once('ready', () => {
    console.log(`Bot eingeloggt als ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    // Ignoriere Bots und Nachrichten ohne Präfix
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Befehl: !ticket - Erstellt einen privaten Support-Kanal
    if (command === 'ticket') {
        try {
            const guild = message.guild;
            const user = message.author;

            // Name des Ticket-Kanals
            const channelName = `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

            // Prüfen, ob der Bot die Berechtigung hat, Kanäle zu verwalten
            if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return message.reply('Fehler: Mir fehlen Berechtigungen zum Erstellen von Kanälen.');
            }

            // Erstellen des Textkanals mit spezifischen Berechtigungen
            const ticketChannel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        // Verweigere dem @everyone-Role den Zugriff
                        id: guild.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        // Erlaube dem Ticket-Ersteller den Zugriff
                        id: user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.AttachFiles
                        ],
                    },
                    {
                        // Erlaube dem Bot selbst den Zugriff
                        id: client.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.ManageChannels
                        ],
                    }
                ],
            });

            const welcomeEmbed = new EmbedBuilder()
                .setColor(0x00AE86)
                .setTitle('Support Ticket erstellt')
                .setDescription(`Hallo ${user}, ein Support-Mitarbeiter wird sich in Kürze um dich kümmern.\nNutze **!close**, um dieses Ticket zu schließen.`)
                .setTimestamp();

            await ticketChannel.send({ embeds: [welcomeEmbed] });
            
            message.reply(`Dein Ticket wurde erstellt: ${ticketChannel}`);

        } catch (error) {
            console.error('Fehler beim Erstellen des Tickets:', error);
            message.reply('Es gab einen Fehler beim Erstellen deines Tickets.');
        }
    }

    // Befehl: !close - Schließt den aktuellen Ticket-Kanal
    if (command === 'close') {
        try {
            // Sicherstellen, dass der Befehl nur in Ticket-Kanälen ausgeführt wird
            if (!message.channel.name.startsWith('ticket-')) {
                return message.reply('Dieser Befehl kann nur innerhalb eines Ticket-Kanals verwendet werden.');
            }

            await message.channel.send('Dieses Ticket wird in 5 Sekunden geschlossen und gelöscht...');

            // Kurze Verzögerung vor dem Löschen
            setTimeout(async () => {
                try {
                    await message.channel.delete();
                } catch (err) {
                    console.error('Fehler beim Löschen des Kanals:', err);
                }
            }, 5000);

        } catch (error) {
            console.error('Fehler beim Schließen des Tickets:', error);
            message.reply('Fehler: Der Kanal konnte nicht geschlossen werden.');
        }
    }
});

// Error Handling für unvorhergesehene Abstürze
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unbehandelte Ablehnung bei:', promise, 'Grund:', reason);
});

// Bot Login
client.login(process.env.DISCORD_TOKEN);
