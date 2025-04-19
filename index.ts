import 'dotenv/config';
import {
    Client,
    GatewayIntentBits,
    Collection,
    REST,
    Routes,
    Partials,
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import './utils/errorLogger';

// Extend Discord Client with custom properties
interface ExtendedClient extends Client {
    prefixCommands: Collection<string, any>;
    slashCommands: Collection<string, any>;
}

// Create the bot client
export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel],
}) as ExtendedClient;

// Add command collections
client.prefixCommands = new Collection();
client.slashCommands = new Collection();

async function init() {
    try {
        // Load Prefix Commands
        const prefixCommandFiles = fs.readdirSync('./prefix-commands').filter(file => file.endsWith('.ts'));
        for (const file of prefixCommandFiles) {
            const command = await import(`./prefix-commands/${file}`);
            client.prefixCommands.set(command.default.name, command.default);
        }

        // Load Slash Commands
        const slashCommands = [];
        const slashCommandFiles = fs.readdirSync('./slash-commands').filter(file => file.endsWith('.ts'));
        for (const file of slashCommandFiles) {
            const command = await import(`./slash-commands/${file}`);
            client.slashCommands.set(command.default.data.name, command.default);
            slashCommands.push(command.default.data.toJSON());
        }

        // Load Events
        const eventFiles = fs.readdirSync(path.join(__dirname, 'events')).filter(file => file.endsWith('.ts'));
        for (const file of eventFiles) {
            const event = await import(path.join(__dirname, 'events', file));
            if (event.default.once) {
                client.once(event.default.name, (...args) => event.default.execute(...args, client));
            } else {
                client.on(event.default.name, (...args) => event.default.execute(...args, client));
            }
        }

        // Check if tokens exist
        if (!process.env.LoginID || !process.env.CLIENT_ID) {
            throw new Error('Missing CLIENT_ID or LoginID in .env!');
        }

        // Register Slash Commands
        const rest = new REST({ version: '10' }).setToken(process.env.LoginID);
        console.log('Refreshing global application (/) commands...');
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: slashCommands });
        console.log('Successfully reloaded application (/) commands.');

        // Now login
        await client.login(process.env.LoginID);
    } catch (error) {
        console.error('Fatal error during init():', error);
    }
}


init();



