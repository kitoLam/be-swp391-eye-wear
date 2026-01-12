import { BaseGraphRepo } from '../base-graph.repository';

class CustomerNodeRepo extends BaseGraphRepo {
  public async createCustomer(id: string): Promise<void> {
    const cypher = `
        CREATE (c:Customer {id: $id})
      `;
    const params = { id };
    await this.executeCypher(cypher, params);
  }

}
export default new CustomerNodeRepo();
