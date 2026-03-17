const SearchEngine = {

    search(query) {

        query = query.toLowerCase();

        let results = [];

        const roles = KnowledgeBase.getRoles();

        for (const role of roles) {

            if (role.name.toLowerCase().includes(query)) {
                results.push(role);
                continue;
            }

            if (role.keywords.some(k => query.includes(k))) {
                results.push(role);
            }
        }

        return results;
    }

};