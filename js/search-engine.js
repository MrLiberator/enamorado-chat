// Lightweight keyword search across JSON knowledge.
const SearchEngine = {

    _toQuery(query) {
        return (query || "").toLowerCase().trim();
    },

    _stringIncludes(a, b) {
        const sa = String(a || "").toLowerCase();
        const sb = String(b || "").toLowerCase();
        return sa && sb && (sa.includes(sb) || sb.includes(sa));
    },

    // ---- Roles ----
    searchRoles(query) {
        const q = this._toQuery(query);
        if (!q) return [];

        const roles = window.KnowledgeBase.getRoles() || [];
        const results = [];

        for (const role of roles) {
            const name = role.name || "";
            const keywords = Array.isArray(role.keywords) ? role.keywords : [];

            let score = 0;

            if (this._stringIncludes(name, q)) score += 5;

            for (const k of keywords) {
                if (this._stringIncludes(k, q)) score += 3;
            }

            if (score > 0) {
                results.push({ entity: role, score });
            }
        }

        return results.sort((a, b) => b.score - a.score);
    },

    // ---- Events ----
    // Task 1 requirements: match by name + keywords only.
    // No day-based logic, no difficulty usage.
    searchEvents(query) {
        const q = this._toQuery(query);
        if (!q) return [];

        const events = window.KnowledgeBase.getEvents() || [];
        const results = [];

        for (const ev of events) {
            const name = ev.name || "";
            const keywords = Array.isArray(ev.keywords) ? ev.keywords : [];

            let score = 0;

            if (this._stringIncludes(name, q)) score += 5;

            for (const k of keywords) {
                if (this._stringIncludes(k, q)) score += 3;
            }

            if (score > 0) {
                results.push({ entity: ev, score });
            }
        }

        return results.sort((a, b) => b.score - a.score);
    },

    // ---- Admins ----
    searchAdmins(query) {
        const q = this._toQuery(query);
        if (!q) return [];

        const admins = window.KnowledgeBase.getAdmins() || [];
        const results = [];

        for (const admin of admins) {
            const name = admin.name || "";
            const nickname = admin.nickname || "";
            const keywords = Array.isArray(admin.keywords) ? admin.keywords : [];
            const traits = Array.isArray(admin.traits) ? admin.traits : [];

            let score = 0;

            if (this._stringIncludes(name, q)) score += 4;
            if (this._stringIncludes(nickname, q)) score += 4;

            for (const k of keywords.concat(traits)) {
                if (this._stringIncludes(k, q)) score += 2;
            }

            if (score > 0) results.push({ entity: admin, score });
        }

        return results.sort((a, b) => b.score - a.score);
    },

    // ---- Rules ----
    // Keep it simple: keyword match against JSON-serialized rules text.
    searchRules(query) {
        const q = this._toQuery(query);
        if (!q) return [];

        const rules = window.KnowledgeBase.getRules() || {};
        const out = [];

        const chatText = rules.chat ? JSON.stringify(rules.chat).toLowerCase() : "";
        if (chatText && chatText.includes(q)) out.push({ entity: rules.chat, subtype: "chat", score: 1 });

        const gameText = rules.game ? JSON.stringify(rules.game).toLowerCase() : "";
        if (gameText && gameText.includes(q)) out.push({ entity: rules.game, subtype: "game", score: 1 });

        return out;
    },

    // ---- Router ----
    route(query) {
        const roleMatches = this.searchRoles(query);
        const eventMatches = this.searchEvents(query);
        const adminMatches = this.searchAdmins(query);
        const ruleMatches = this.searchRules(query);

        const counts = {
            role: roleMatches.length,
            event: eventMatches.length,
            admin: adminMatches.length,
            rules: ruleMatches.length
        };

        let bestType = "unknown";
        let bestCount = 0;

        for (const type in counts) {
            if (counts[type] > bestCount) {
                bestCount = counts[type];
                bestType = type;
            }
        }

        if (!bestCount) return { type: "unknown", matches: [] };

        switch (bestType) {
            case "role":
                return { type: "role", matches: roleMatches };
            case "event":
                return { type: "event", matches: eventMatches };
            case "admin":
                return { type: "admin", matches: adminMatches };
            case "rules":
                return { type: "rules", matches: ruleMatches };
            default:
                return { type: "unknown", matches: [] };
        }
    },

    // ---- Legacy API (roles only) ----
    // Kept to avoid breaking any old calls.
    search(query) {
        return this.searchRoles(query).map(r => r.entity);
    }

};

window.SearchEngine = SearchEngine;