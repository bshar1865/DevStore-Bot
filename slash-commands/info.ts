import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import os from 'os';
import { version as discordJsVersion } from 'discord.js';

function getCpuUsage(): Promise<string> {
    return new Promise((resolve) => {
        const start = os.cpus();

        setTimeout(() => {
            const end = os.cpus();
            let idleDiff = 0;
            let totalDiff = 0;

            for (let i = 0; i < start.length; i++) {
                const startCpu = start[i].times;
                const endCpu = end[i].times;

                const idle = endCpu.idle - startCpu.idle;
                const total = Object.keys(endCpu).reduce(
                    (acc, key) => acc + (endCpu[key as keyof typeof endCpu] - startCpu[key as keyof typeof startCpu]),
                    0
                );

                idleDiff += idle;
                totalDiff += total;
            }

            const usage = 100 - Math.round((idleDiff / totalDiff) * 100);
            resolve(`${usage}%`);
        }, 100);
    });
}

export default {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Displays bot information, uptime, and other details.'),

    async execute(interaction: ChatInputCommandInteraction) {
        const bot = interaction.client;

        const totalSeconds = Math.floor(bot.uptime! / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        const totalMem = os.totalmem() / 1024 / 1024;
        const freeMem = os.freemem() / 1024 / 1024;
        const usedMem = totalMem - freeMem;
        const memoryUsage = `${usedMem.toFixed(0)} MB / ${totalMem.toFixed(0)} MB`;

        const cpuUsage = await getCpuUsage();

        const developer = 'DevStore Team';
        const hosted = 'CloudPanel Server';

        const embed = new EmbedBuilder()
            .setTitle('DevStore Bot Info')
            .setDescription('Here is some useful information about me.')
            .addFields(
                { name: 'Uptime', value: uptime, inline: true },
                { name: 'Discord.JS Version', value: `v${discordJsVersion}`, inline: true },
                { name: 'Hosted On', value: hosted, inline: true },
                { name: 'Developed By', value: developer, inline: true },
                { name: 'RAM Usage', value: memoryUsage, inline: true },
                { name: 'CPU Usage', value: cpuUsage, inline: true },
                {
                    name: 'DevStore Bot is Open Source! Feel free to help us!',
                    value: 'https://github.com/bshar1865/DevStore-Bot'
                }
            )
            .setColor('#ff7200')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
