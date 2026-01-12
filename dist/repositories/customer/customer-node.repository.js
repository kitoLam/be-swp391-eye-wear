"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_graph_repository_1 = require("../base-graph.repository");
class CustomerNodeRepo extends base_graph_repository_1.BaseGraphRepo {
    async createCustomer(id) {
        const cypher = `
        CREATE (c:Customer {id: $id})
      `;
        const params = { id };
        await this.executeCypher(cypher, params);
    }
}
exports.default = new CustomerNodeRepo();
