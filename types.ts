import { ClientEvents } from 'discord.js';


export interface Event {
    name: keyof ClientEvents;
    execute: (...args: any[]) => Promise<void>;
}
