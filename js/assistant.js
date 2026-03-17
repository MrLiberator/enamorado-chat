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

    ask(question) {

        this.addMessage("user", question);

        const results = SearchEngine.search(question);

        if (results.length > 0) {

            const role = results[0];

            this.addMessage(
                "assistant",
                `Роль ${role.name} (${role.emoji})

Команда: ${role.team}

Здібності:
${role.abilities.join(", ")}`
            );

        } else {

            this.addMessage(
                "assistant",
                "Я ще не знаю відповіді на це..."
            );

        }

    },

    addMessage(type, text) {

        const box = document.getElementById("assistant-messages");

        const div = document.createElement("div");

        div.className = type;
        div.innerText = text;

        box.appendChild(div);
    }

}; // test commit