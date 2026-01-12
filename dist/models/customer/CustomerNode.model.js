"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerNode = void 0;
class CustomerNode {
    constructor(customer) {
        this.id = customer.id;
    }
    static formatRaw(node) {
        const p = node.properties;
        return new CustomerNode({
            id: p.id,
        });
    }
}
exports.CustomerNode = CustomerNode;
