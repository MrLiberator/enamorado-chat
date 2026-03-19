const Assistant = {

    init() {

        const input = document.getElementById("assistant-input");

        input.addEventListener("keypress", (e) => {

            if (e.key === "Enter") {

                const text = input.value;
                input.value = "";

                this.ask(text);
            }
        });

    },

    logQuestion(question) {

        fetch("https://script.google.com/macros/s/AKfycbx_4n1Fwxl-AdH_E5rgrwrq6Q1B_DAEGov1NOY04bvpCp3vNg9SUztWXt_XKhS0Z4_x/exec", {
            method: "POST",
            body: JSON.stringify({ question }),
        }).catch(err => {
            console.warn("Log failed:", err);
        });

    },

    ask(question) {
        this.addMessage("user", question);

        this.logQuestion(question);

        const result = SearchEngine.route(question);

        const q = (question || "").trim();
        if (!q) return;

        this.addMessage("user", q);

        const lower = q.toLowerCase();

        // Intent: list all available events
        if (this.isEventsListRequest(lower)) {
            this.addMessage("assistant", this.eventsListReply());
            return;
        }

        // Intent: suggest a random event
        if (this.isRandomEventRequest(lower)) {
            const events = window.KnowledgeBase.getEvents() || [];
            const ev = this.pickRandom(events);
            if (ev) this.addMessage("assistant", this.eventReply(ev));
            else this.addMessage("assistant", this.replyNoKnowledge());
            return;
        }

        const routed = SearchEngine.route(q);

        if (!routed || !routed.matches || routed.matches.length === 0 || routed.type === "unknown") {
            this.addMessage("assistant", this.replyNoKnowledge());
            return;
        }

        const top = routed.matches[0];
        const entity = top.entity;

        switch (routed.type) {
            case "role":
                this.addMessage("assistant", this.roleReply(entity));
                break;
            case "event":
                this.addMessage("assistant", this.eventReply(entity));
                break;
            case "admin":
                this.addMessage("assistant", this.adminReply(entity));
                break;
            case "rules":
                this.addMessage("assistant", this.rulesReply(entity, top.subtype));
                break;
            default:
                this.addMessage("assistant", this.replyNoKnowledge());
        }
    },

    addMessage(type, text) {

        const box = document.getElementById("assistant-messages");
        if (!box) return;

        const div = document.createElement("div");
        div.className = type;
        div.innerText = text;

        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
    },

    replyNoKnowledge() {
        return "Хм... right now I can’t find this in my сувоях. Спробуй переформулювати або спитай: «які івенти існують» / «випадковий івент».";
    },

    pickRandom(list) {
        if (!Array.isArray(list) || list.length === 0) return null;
        const i = Math.floor(Math.random() * list.length);
        return list[i] || null;
    },

    // Intent detection only (no day/difficulty knowledge).
    isEventsListRequest(lower) {
        return (
            lower.includes("what events") ||
            lower.includes("events exist") ||
            (lower.includes("які") && (lower.includes("івенти") || lower.includes("події"))) ||
            lower.includes("список івентів") ||
            lower.includes("перелік івентів") ||
            lower.includes("які івенти") ||
            lower.includes("які події")
        );
    },

    isRandomEventRequest(lower) {
        return (
            lower.includes("random event") ||
            (lower.includes("suggest") && lower.includes("event")) ||
            lower.includes("випадков") ||
            (lower.includes("порад") && lower.includes("івент")) ||
            lower.includes("дай івент") ||
            lower.includes("порадь івент")
        );
    },

    eventsListReply() {
        const events = window.KnowledgeBase.getEvents() || [];
        if (!events.length) return this.replyNoKnowledge();

        const lines = events.map(e => {
            const emoji = e.emoji || "";
            const name = e.name || "";
            return `${emoji} ${name}`.trim();
        });

        return `О-о-о... тримай мій список івентів:\n\n${lines.join("\n")}`;
    },

    roleReply(role) {
        if (!role) return this.replyNoKnowledge();

        const name = role.name || "невідома роль";
        const emoji = role.emoji || "";
        const team = role.team || "";
        const abilities = Array.isArray(role.abilities) ? role.abilities : [];
        const tips = Array.isArray(role.tips) ? role.tips : [];

        let text = `Хмм... хочеш дізнатися про роль ${emoji} ${name}?\n\n`;
        if (team) text += `Команда: ${team}\n\n`;
        if (abilities.length) text += `Здібності:\n${abilities.map(a => `• ${a}`).join("\n")}\n\n`;
        if (tips.length) text += `Поради:\n${tips.map(t => `• ${t}`).join("\n")}`;
        return text.trim();
    },

    eventReply(ev) {
        if (!ev) return this.replyNoKnowledge();

        const name = ev.name || "невідомий івент";
        const emoji = ev.emoji || "";
        const keywords = Array.isArray(ev.keywords) ? ev.keywords : [];

        let text = `О-о-о... ти питаєш про івент ${emoji} ${name}.\n\n`;
        if (ev.description) text += `Опис:\n${ev.description}\n\n`;
        if (ev.story) text += `Легенда:\n${ev.story}\n\n`;
        if (keywords.length) text += `Ключі:\n${keywords.join(", ")}\n\n`;

        // The JSON event already contains full details; keep assistant reply short.
        return text.trim();
    },

    adminReply(admin) {
        if (!admin) return this.replyNoKnowledge();

        const name = admin.name || "таємничий адміністратор";
        const nickname = admin.nickname || "";
        const traits = Array.isArray(admin.traits) ? admin.traits : [];
        const playstyle = admin.playstyle || "";
        const favoriteRoles = Array.isArray(admin.favorite_roles) ? admin.favorite_roles : [];

        let text = `Ох... це ${name}`;
        if (nickname) text += ` (${nickname})`;
        text += "\n\n";

        if (admin.role) text += `Роль в спільноті: ${admin.role}\n\n`;
        if (traits.length) text += `Риси:\n${traits.map(t => `• ${t}`).join("\n")}\n\n`;
        if (playstyle) text += `Стиль:\n${playstyle}\n\n`;
        if (favoriteRoles.length) text += `Улюблені ролі:\n${favoriteRoles.map(r => `• ${r}`).join("\n")}`;

        return text.trim();
    },

    rulesReply(rules, subtype) {
        if (!rules) return this.replyNoKnowledge();
        const kind = subtype === "game" ? "гри" : "чат-поваги";
        return `Правила ${kind}. Хм... я бачу суворі сувої. Спробуй уточнити запитання (наприклад: «мут», «спам», «особиста інформація»).`;
    }

};

window.Assistant = Assistant;