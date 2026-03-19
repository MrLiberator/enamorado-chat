// QuizEngine — UI-independent, JSON-driven.
const QuizEngine = {

    tests: {},
    activeTest: null,
    answers: [],

    async init() {
        const files = [
            "/data/tests/admin_test.json",
            "/data/tests/role_test.json"
        ];

        for (const file of files) {
            try {
                const r = await fetch(file);
                if (!r.ok) {
                    console.warn("QuizEngine: failed to load", file, r.status);
                    continue;
                }
                const j = await r.json();
                const name = file.split("/").pop().replace(".json", "");
                this.tests[name] = j;
            } catch (e) {
                console.error("QuizEngine: error loading", file, e);
            }
        }

        console.log("QuizEngine: tests loaded", Object.keys(this.tests));
    },

    start(testName) {
        if (!this.tests[testName]) {
            console.warn("QuizEngine.start: unknown test", testName);
            this.activeTest = null;
            this.answers = [];
            return;
        }

        this.activeTest = testName;
        this.answers = [];
    },

    answerQuestion(questionId, choiceIndex) {
        if (!this.activeTest) return;
        this.answers.push({ questionId, choiceIndex });
    },

    getActiveTest() {
        if (!this.activeTest) return null;
        return this.tests[this.activeTest] || null;
    },

    getTotalQuestions() {
        const test = this.getActiveTest();
        if (!test || !Array.isArray(test.questions)) return 0;
        return test.questions.length;
    },

    getQuestion(index) {
        const test = this.getActiveTest();
        if (!test || !Array.isArray(test.questions)) return null;
        return test.questions[index] || null;
    },

    computeResult() {
        const test = this.getActiveTest();
        if (!test || !Array.isArray(test.questions)) return null;

        const testName = this.activeTest;
        const isAdminTest = testName === "admin_test";

        // Count selected traits/roles from JSON answers.
        const counts = {};

        for (const ans of this.answers) {
            const q = test.questions.find(q => q.id === ans.questionId);
            if (!q || !Array.isArray(q.answers)) continue;
            const choice = q.answers[ans.choiceIndex];
            if (!choice) continue;

            const key = isAdminTest ? (choice.trait || choice.key || null) : (choice.role || choice.key || null);
            if (!key) continue;

            counts[key] = (counts[key] || 0) + 1;
        }

        if (Object.keys(counts).length === 0) return null;

        if (isAdminTest) {
            // Trait-to-admin matching based only on admins.json fields.
            const admins = window.KnowledgeBase.getAdmins() || [];
            const scoresByAdminId = {};

            for (const admin of admins) {
                if (!admin || !admin.id) continue;
                scoresByAdminId[admin.id] = 0;
            }

            for (const traitKey in counts) {
                const weight = counts[traitKey];
                for (const admin of admins) {
                    if (!admin || !Array.isArray(admin.traits)) continue;
                    if (admin.traits.includes(traitKey)) {
                        scoresByAdminId[admin.id] += weight;
                    }
                }
            }

            let bestId = null;
            let bestScore = -1;

            for (const adminId in scoresByAdminId) {
                if (scoresByAdminId[adminId] > bestScore) {
                    bestScore = scoresByAdminId[adminId];
                    bestId = adminId;
                }
            }

            const bestAdmin = admins.find(a => String(a.id) === String(bestId)) || null;

            if (!bestAdmin) return null;

            return {
                result_type: "admin",
                id: bestAdmin.id,
                score: bestScore,
                entity: bestAdmin
            };
        }

        // role test
        // In role_test.json we expect each answer choice to include `role` = roles.json id.
        let bestId = null;
        let bestScore = -1;

        for (const key in counts) {
            if (counts[key] > bestScore) {
                bestScore = counts[key];
                bestId = key;
            }
        }

        const roles = window.KnowledgeBase.getRoles() || [];
        const bestRole = roles.find(r => r.id === bestId || r.name === bestId) || null;

        if (!bestRole) return null;

        return {
            result_type: "role",
            id: bestRole.id,
            score: bestScore,
            entity: bestRole
        };
    }

};

window.QuizEngine = QuizEngine;