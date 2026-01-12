import { neo4jClient } from '../config/database/neo4j.config';

export abstract class BaseGraphRepo {
  protected async executeCypher(
    cypher: string,
    params?: Record<string, unknown>
  ) {
    const session = neo4jClient.getSession();
    try {
      await session.run(cypher, params);
    } finally {
      await session.close();
    }
  }
}
