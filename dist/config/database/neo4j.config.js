"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.neo4jClient = void 0;
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
const env_config_1 = require("../env.config");
class Neo4jClient {
    constructor() {
        this.driver = neo4j_driver_1.default.driver(env_config_1.config.neo4j.uri, neo4j_driver_1.default.auth.basic(env_config_1.config.neo4j.user, env_config_1.config.neo4j.password), {
            maxConnectionPoolSize: 50,
            connectionAcquisitionTimeout: 2 * 60 * 1000,
        });
        this.driver
            .verifyConnectivity()
            .then(() => {
            console.log(">>> Neo4j connected successfully");
        })
            .catch((error) => {
            console.error("❌ Neo4j connection failed:", error);
            process.exit(1);
        });
    }
    static getInstance() {
        if (!Neo4jClient.instance) {
            Neo4jClient.instance = new Neo4jClient();
        }
        return Neo4jClient.instance;
    }
    getSession() {
        return this.driver.session();
    }
    async close() {
        await this.driver.close();
        console.log("Neo4j connection closed");
    }
}
exports.neo4jClient = Neo4jClient.getInstance();
