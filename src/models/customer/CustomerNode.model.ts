import { Node } from 'neo4j-driver';

export class CustomerNode {
    public id: string;
    constructor(customer: { id: string }) {
        this.id = customer.id;
    }
    static formatRaw(node: Node): CustomerNode {
        const p = node.properties;
        return new CustomerNode({
            id: p.id as string,
        });
    }
}
