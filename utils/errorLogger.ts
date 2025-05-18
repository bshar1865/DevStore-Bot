import { TextChannel, DMChannel, NewsChannel } from 'discord.js';
import idclass from '../idclass';
import { client } from '../index';

export async function logErrorToChannel(error: any, source = 'Unknown') {
    try {
        const logChannel = await client.channels.fetch(idclass.channelErrorLogs).catch(() => null);
        if (
            logChannel &&
            (logChannel instanceof TextChannel || logChannel instanceof DMChannel || logChannel instanceof NewsChannel)
        ) {
            const errorMessage = `**Error in:** \`${source}\`\n\`\`\`${error.stack || error.message || error}\`\`\``;
            if (errorMessage.length > 2000) {
                logChannel.send(`**Error in:** \`${source}\` (Too long, check logs)`);
            } else {
                await logChannel.send(errorMessage);
            }
        }
    } catch (err) {
        console.error(`Error while logging error:`, err);
    }
}

const originalConsoleError = console.error;
console.error = (...args) => {
    originalConsoleError(...args);
    const errorString = args.map(arg => (arg instanceof Error ? arg.stack : arg)).join(' ');
    logErrorToChannel(errorString, 'Console Error');
};
