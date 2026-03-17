export async function loadKnowledge(file) {

    const response = await fetch(`/knowledge/${file}`);
    const data = await response.json();

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
                const json = await response.json();

                const name = file.split("/").pop().replace(".json", "");

                this.data[name] = json;
            }

            console.log("Knowledge loaded", this.data);
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
                chat: this.data.chat_rules,
                game: this.data.game_rules
            };
        }
    };
    return data;
}
