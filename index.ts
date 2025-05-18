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

interface ExtendedClient extends Client {
    prefixCommands: Collection<string, any>;
    slashCommands: Collection<string, any>;
}

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

client.prefixCommands = new Collection();
client.slashCommands = new Collection();

async function init() {
    try {
        const prefixCommandFiles = fs.readdirSync('./prefix-commands').filter(file => file.endsWith('.ts'));
        for (const file of prefixCommandFiles) {
            const command = await import(`./prefix-commands/${file}`);
            client.prefixCommands.set(command.default.name, command.default);
        }

        const slashCommands = [];
        const slashCommandFiles = fs.readdirSync('./slash-commands').filter(file => file.endsWith('.ts'));
        for (const file of slashCommandFiles) {
            const command = await import(`./slash-commands/${file}`);
            client.slashCommands.set(command.default.data.name, command.default);
            slashCommands.push(command.default.data.toJSON());
        }

        const eventFiles = fs.readdirSync(path.join(__dirname, 'events')).filter(file => file.endsWith('.ts'));
        for (const file of eventFiles) {
            const event = await import(path.join(__dirname, 'events', file));
            if (event.default.once) {
                client.once(event.default.name, (...args) => event.default.execute(...args, client));
            } else {
                client.on(event.default.name, (...args) => event.default.execute(...args, client));
            }
        }

        if (!process.env.LoginID || !process.env.CLIENT_ID) {
            throw new Error('Missing CLIENT_ID or LoginID in .env!');
        }

        const rest = new REST({ version: '10' }).setToken(process.env.LoginID);
        console.log('Refreshing global application (/) commands...');
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: slashCommands });
        console.log('Successfully reloaded application (/) commands.');

        await client.login(process.env.LoginID);
    } catch (error) {
        console.error('Fatal error during init():', error);
    }
}


init();



