const { Client, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
require('dotenv').config();

// Initialisierung des Discord Clients mit den benötigten Intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const PREFIX = '!!';

client.once('ready', () => {
    console.log(`Bot ist online als ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    // Ignoriere Bots, Nachrichten ohne Präfix oder Nachrichten außerhalb von Servern
    if (message.author.bot || !message.guild || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Befehl: !!ticket
    if (command === 'ticket') {
        try {
            // Bereinigter Name für den Kanal basierend auf dem Usernamen
            const channelName = `ticket-${message.author.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

            // Prüfen, ob bereits ein Kanal mit diesem Namen existiert
            const existingChannel = message.guild.channels.cache.find(ch => ch.name === channelName);
            if (existingChannel) {
                return message.reply(`Du hast bereits ein offenes Ticket: ${existingChannel}`);
            }

            // Ticket-Kanal erstellen
            const ticketChannel = await message.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: message.guild.id, // @everyone - Zugriff verweigern
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: message.author.id, // Ticket-Ersteller - Zugriff erlauben
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.AttachFiles
                        ],
                    },
                    {
                        id: client.user.id, // Der Bot selbst - Zugriff erlauben
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ManageChannels
                        ],
                    },
                ],
            });

            // Willkommens-Embed im neuen Ticket
            const welcomeEmbed = new EmbedBuilder()
                .setColor(0x00AE86)
                .setTitle('Support-Ticket')
                .setDescription(`Hallo ${message.author},\n\nvielen Dank für deine Anfrage. Ein Teammitglied wird sich in Kürze bei dir melden.\n\nNutze den Befehl **!!close**, um dieses Ticket zu schließen.`)
                .setTimestamp()
                .setFooter({ text: 'Support System' });

            await ticketChannel.send({ embeds: [welcomeEmbed] });
            
            // Bestätigung im ursprünglichen Kanal
            await message.reply(`Dein Support-Ticket wurde erstellt: ${ticketChannel}`);

        } catch (error) {
            console.error('Fehler beim Erstellen des Tickets:', error);
            message.reply('Fehler: Ich konnte das Ticket nicht erstellen. Bitte stelle sicher, dass ich die Berechtigung "Kanäle verwalten" habe.');
        }
    }

    // Befehl: !!close
    if (command === 'close') {
        try {
            // Prüfen, ob der Befehl in einem Ticket-Kanal ausgeführt wird
            if (!message.channel.name.startsWith('ticket-')) {
                return message.reply('Dieser Befehl kann nur in einem Ticket-Kanal verwendet werden.');
            }

            const closingEmbed = new EmbedBuilder()
                .setColor(0xffa500)
                .setDescription('Dieses Ticket wird in 5 Sekunden geschlossen und gelöscht...');

            await message.channel.send({ embeds: [closingEmbed] });

            // Verzögerung vor dem Löschen des Kanals
            setTimeout(async () => {
                try {
                    await message.channel.delete();
                } catch (err) {
                    console.error('Kanal konnte nicht gelöscht werden:', err);
                }
            }, 5000);

        } catch (error) {
            console.error('Fehler beim Schließen des Tickets:', error);
            message.reply('Es gab einen Fehler beim Schließen des Tickets.');
        }
    }
});

// Bot einloggen
client.login(process.env.DISCORD_TOKEN);
