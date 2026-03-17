const QuizEngine = {

    tests: {},

    async init() {

        const files = [
            "/data/tests/admin_test.json",
            "/data/tests/role_test.json"
        ];

        for (const file of files) {

            const r = await fetch(file);
            const j = await r.json();

            const name = file.split("/").pop().replace(".json", "");

            this.tests[name] = j;
        }

        console.log("Tests loaded", this.tests);

    }

};