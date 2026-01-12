import neo4j, { Driver, Session } from "neo4j-driver";
import { config } from "../env.config";

class Neo4jClient {
  private static instance: Neo4jClient;
  private driver: Driver;

  private constructor() {
    this.driver = neo4j.driver(
      config.neo4j.uri,
      neo4j.auth.basic(config.neo4j.user, config.neo4j.password),
      {
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2 * 60 * 1000,
      }
    );

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

  public static getInstance(): Neo4jClient {
    if (!Neo4jClient.instance) {
      Neo4jClient.instance = new Neo4jClient();
    }
    return Neo4jClient.instance;
  }

  public getSession(): Session {
    return this.driver.session();
  }

  public async close(): Promise<void> {
    await this.driver.close();
    console.log("Neo4j connection closed");
  }
}

export const neo4jClient = Neo4jClient.getInstance();
