"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseGraphRepo = void 0;
const neo4j_config_1 = require("../config/database/neo4j.config");
class BaseGraphRepo {
    async executeCypher(cypher, params) {
        const session = neo4j_config_1.neo4jClient.getSession();
        try {
            await session.run(cypher, params);
        }
        finally {
            await session.close();
        }
    }
}
exports.BaseGraphRepo = BaseGraphRepo;
