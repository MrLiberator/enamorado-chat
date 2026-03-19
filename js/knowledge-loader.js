// Global knowledge layer (no frameworks, no module system required).
// This file exposes `window.KnowledgeBase`.
const KnowledgeBase = {
    data: {},

    async load() {
        const files = [
            "/data/knowledge/roles.json",
            "/data/knowledge/events.json",
            "/data/knowledge/admins.json",
            "/data/knowledge/chat_rules.json",
            "/data/knowledge/game_rules.json"
        ];

        for (const file of files) {
            const response = await fetch(file);
            if (!response.ok) {
                console.warn("KnowledgeBase: failed to load", file, response.status);
                continue;
            }

            const json = await response.json();
            const name = file.split("/").pop().replace(".json", "");
            this.data[name] = json;
        }

        console.log("KnowledgeBase loaded", this.data);
    },

    getRoles() {
        return this.data.roles || [];
    },

    getEvents() {
        return this.data.events || [];
    },

    getAdmins() {
        return this.data.admins || [];
    },

    getRules() {
        return {
            chat: this.data.chat_rules || null,
            game: this.data.game_rules || null
        };
    }
};

// Ensure global accessibility across scripts.
window.KnowledgeBase = KnowledgeBase;
