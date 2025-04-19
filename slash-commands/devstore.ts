import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType,
  CacheType,
} from 'discord.js';

function stripHtmlTags(html: string): string {
  html = html.replace(/<a\s+href="([^"]+)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  return html.replace(/<[^>]*>/g, '').trim();
}

interface Product {
  id: number;
  name: string;
  description?: string;
  url: string;
  file: string;
  image?: string;
}

interface Category {
  name: string;
  products: Product[];
}

let categories: Category[] = [];

async function fetchApps() {
  const response = await fetch('https://xbdev.store/products.json');
  categories = await response.json();
}

function getCategoryButtons(page: number): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>();
  const start = page * 3;
  const end = start + 3;
  const cats = categories.slice(start, end);

  for (let i = 0; i < cats.length; i++) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`category_${start + i}`)
        .setLabel(cats[i].name)
        .setStyle(ButtonStyle.Primary)
    );
  }

  if (page > 0) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('cat_prev_page')
        .setLabel('Previous')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  if (categories.length > end) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('cat_next_page')
        .setLabel('Next')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  return row;
}

function getAppButtons(apps: Product[], page: number): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>();
  const start = page * 3;
  const end = start + 3;
  const appsSlice = apps.slice(start, end);

  for (let i = 0; i < appsSlice.length; i++) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`app_${start + i}`)
        .setLabel(appsSlice[i].name)
        .setStyle(ButtonStyle.Primary)
    );
  }

  if (page > 0) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`app_prev_${page - 1}`)
        .setLabel('Previous')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  if (apps.length > end) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`app_next_${page + 1}`)
        .setLabel('Next')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  return row;
}

export default {
  data: new SlashCommandBuilder()
    .setName('devstore')
    .setDescription('Browse Devstore apps'),

  async execute(interaction: ChatInputCommandInteraction<CacheType>) {
    if (categories.length === 0) await fetchApps();
    if (categories.length === 0) return interaction.reply({ content: 'No categories found.' });

    let currentCatPage = 0;

    const categoryMessage = await interaction.reply({
      content: 'Select a category:',
      components: [getCategoryButtons(currentCatPage)],
      fetchReply: true,
    });

    const collector = categoryMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000,
    });

    collector.on('collect', async (btn) => {
      if (btn.user.id !== interaction.user.id) {
        return btn.reply({ content: 'This is not your menu.', ephemeral: true });
      }

      if (btn.customId === 'cat_next_page') {
        currentCatPage++;
        return btn.update({
          content: 'Select a category:',
          components: [getCategoryButtons(currentCatPage)],
        });
      }

      if (btn.customId === 'cat_prev_page') {
        currentCatPage = Math.max(0, currentCatPage - 1);
        return btn.update({
          content: 'Select a category:',
          components: [getCategoryButtons(currentCatPage)],
        });
      }

      if (btn.customId.startsWith('category_')) {
        const catIndex = parseInt(btn.customId.split('_')[1]);
        const selectedCategory = categories[catIndex];
        if (!selectedCategory) return;

        let appPage = 0;
        let currentApps = selectedCategory.products;

        await btn.update({
          content: `Choose apps in **${selectedCategory.name}** below:`,
          components: [getAppButtons(currentApps, appPage)],
        });

        const appCollector = categoryMessage.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 120000,
        });

        appCollector.on('collect', async (appBtn) => {
          if (appBtn.user.id !== interaction.user.id) {
            return appBtn.reply({ content: 'This is not your menu.', ephemeral: true });
          }

          if (appBtn.customId.startsWith('app_next_')) {
            appPage = parseInt(appBtn.customId.split('_')[2]);
            return appBtn.update({
              content: `Choose apps in **${selectedCategory.name}** below:`,
              components: [getAppButtons(currentApps, appPage)],
            });
          }

          if (appBtn.customId.startsWith('app_prev_')) {
            appPage = parseInt(appBtn.customId.split('_')[2]);
            return appBtn.update({
              content: `Choose apps in **${selectedCategory.name}** below:`,
              components: [getAppButtons(currentApps, appPage)],
            });
          }

          if (appBtn.customId.startsWith('app_')) {
            const appIndex = parseInt(appBtn.customId.split('_')[1]);
            const selectedApp = currentApps[appIndex];
            if (!selectedApp) return;

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setLabel('Download')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://xbdev.store/download/${selectedApp.id}`),
              new ButtonBuilder()
                .setLabel('GitHub Page')
                .setStyle(ButtonStyle.Link)
                .setURL(selectedApp.url)
            );

            const embed = new EmbedBuilder()
              .setTitle(selectedApp.name)
              .setDescription(
                `${stripHtmlTags(selectedApp.description || 'No description.')}\n\n**Note:** If you are on phone, please open in browser in order to download file.`
              )              
              .setColor('#ff7200');

            if (selectedApp.image) {
              embed.setThumbnail(`https://xbdev.store/${selectedApp.image}`);
            }

            await appBtn.reply({
              embeds: [embed],
              components: [row],
            });
          }
        });
      }
    });
  },
};
