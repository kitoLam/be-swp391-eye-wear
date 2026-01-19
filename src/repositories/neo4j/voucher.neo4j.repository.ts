import neo4j, { Driver, Session } from 'neo4j-driver';
import { config } from '../../config/env.config';

interface UserVoucherRelation {
    userId: string;
    email: string;
    grantedAt: Date;
    grantedBy: string;
    used: boolean;
    usedAt: Date | null;
}

class Neo4jVoucherRepository {
    private driver: Driver;

    constructor() {
        this.driver = neo4j.driver(
            config.neo4j.uri,
            neo4j.auth.basic(config.neo4j.user, config.neo4j.password),
            {
                maxConnectionPoolSize: 50,
                connectionAcquisitionTimeout: 2 * 60 * 1000,
            }
        );
    }

    private async runQuery<T = any>(
        query: string,
        params: Record<string, any> = {}
    ): Promise<T[]> {
        const session: Session = this.driver.session();
        try {
            const result = await session.run(query, params);
            return result.records.map(record => record.toObject() as T);
        } finally {
            await session.close();
        }
    }

    // ==================== User Management ====================

    /**
     * Create User node in Neo4j
     */
    async createUserNode(userId: string, email: string): Promise<void> {
        const query = `
            MERGE (u:User {userId: $userId})
            SET u.email = $email, u.createdAt = datetime()
            RETURN u
        `;
        await this.runQuery(query, { userId, email });
    }

    /**
     * Delete User node and all relationships
     */
    async deleteUserNode(userId: string): Promise<void> {
        const query = `
            MATCH (u:User {userId: $userId})
            DETACH DELETE u
        `;
        await this.runQuery(query, { userId });
    }

    // ==================== Voucher Management ====================

    /**
     * Create Voucher node in Neo4j
     */
    async createVoucherNode(voucherId: string, code: string): Promise<void> {
        const query = `
            MERGE (v:Voucher {voucherId: $voucherId})
            SET v.code = $code, v.createdAt = datetime()
            RETURN v
        `;
        await this.runQuery(query, { voucherId, code });
    }

    /**
     * Delete Voucher node and all relationships
     */
    async deleteVoucherNode(voucherId: string): Promise<void> {
        const query = `
            MATCH (v:Voucher {voucherId: $voucherId})
            DETACH DELETE v
        `;
        await this.runQuery(query, { voucherId });
    }

    // ==================== Relationship Management ====================

    /**
     * Grant voucher to user (create HAS_VOUCHER relationship)
     */
    async grantVoucherToUser(
        userId: string,
        voucherId: string,
        grantedBy: string
    ): Promise<void> {
        const query = `
            MATCH (u:User {userId: $userId})
            MATCH (v:Voucher {voucherId: $voucherId})
            MERGE (u)-[r:HAS_VOUCHER]->(v)
            SET r.grantedAt = datetime(),
                r.grantedBy = $grantedBy,
                r.used = false,
                r.usedAt = null
            RETURN r
        `;
        await this.runQuery(query, { userId, voucherId, grantedBy });
    }

    /**
     * Grant voucher to multiple users
     */
    async grantVoucherToUsers(
        userIds: string[],
        voucherId: string,
        grantedBy: string
    ): Promise<number> {
        const query = `
            MATCH (v:Voucher {voucherId: $voucherId})
            UNWIND $userIds as userId
            MATCH (u:User {userId: userId})
            MERGE (u)-[r:HAS_VOUCHER]->(v)
            SET r.grantedAt = datetime(),
                r.grantedBy = $grantedBy,
                r.used = false,
                r.usedAt = null
            RETURN COUNT(r) as count
        `;
        const result = await this.runQuery<{ count: number }>(query, {
            userIds,
            voucherId,
            grantedBy,
        });
        return result[0]?.count || 0;
    }

    /**
     * Revoke voucher from user (delete HAS_VOUCHER relationship)
     */
    async revokeVoucherFromUser(
        userId: string,
        voucherId: string
    ): Promise<void> {
        const query = `
            MATCH (u:User {userId: $userId})-[r:HAS_VOUCHER]->(v:Voucher {voucherId: $voucherId})
            DELETE r
        `;
        await this.runQuery(query, { userId, voucherId });
    }

    /**
     * Revoke voucher from multiple users
     */
    async revokeVoucherFromUsers(
        userIds: string[],
        voucherId: string
    ): Promise<number> {
        const query = `
            UNWIND $userIds as userId
            MATCH (u:User {userId: userId})-[r:HAS_VOUCHER]->(v:Voucher {voucherId: $voucherId})
            DELETE r
            RETURN COUNT(r) as count
        `;
        const result = await this.runQuery<{ count: number }>(query, {
            userIds,
            voucherId,
        });
        return result[0]?.count || 0;
    }

    /**
     * Mark voucher as used
     */
    async markVoucherAsUsed(userId: string, voucherId: string): Promise<void> {
        const query = `
            MATCH (u:User {userId: $userId})-[r:HAS_VOUCHER]->(v:Voucher {voucherId: $voucherId})
            SET r.used = true, r.usedAt = datetime()
            RETURN r
        `;
        await this.runQuery(query, { userId, voucherId });
    }

    // ==================== Query Methods ====================

    /**
     * Get all voucher IDs that user has access to
     */
    async getUserVouchers(userId: string): Promise<string[]> {
        const query = `
            MATCH (u:User {userId: $userId})-[:HAS_VOUCHER]->(v:Voucher)
            RETURN v.voucherId as voucherId
        `;
        const result = await this.runQuery<{ voucherId: string }>(query, {
            userId,
        });
        return result.map(r => r.voucherId);
    }

    /**
     * Get unused voucher IDs for user
     */
    async getUserUnusedVouchers(userId: string): Promise<string[]> {
        const query = `
            MATCH (u:User {userId: $userId})-[r:HAS_VOUCHER {used: false}]->(v:Voucher)
            RETURN v.voucherId as voucherId
        `;
        const result = await this.runQuery<{ voucherId: string }>(query, {
            userId,
        });
        return result.map(r => r.voucherId);
    }

    /**
     * Get users who have specific voucher
     */
    async getVoucherUsers(voucherId: string): Promise<UserVoucherRelation[]> {
        const query = `
            MATCH (u:User)-[r:HAS_VOUCHER]->(v:Voucher {voucherId: $voucherId})
            RETURN u.userId as userId, 
                   u.email as email,
                   r.grantedAt as grantedAt,
                   r.grantedBy as grantedBy,
                   r.used as used,
                   r.usedAt as usedAt
            ORDER BY r.grantedAt DESC
        `;
        const result = await this.runQuery<any>(query, { voucherId });
        return result.map(r => ({
            userId: r.userId,
            email: r.email,
            grantedAt: new Date(r.grantedAt),
            grantedBy: r.grantedBy,
            used: r.used,
            usedAt: r.usedAt ? new Date(r.usedAt) : null,
        }));
    }

    /**
     * Check if user has access to voucher
     */
    async userHasVoucher(userId: string, voucherId: string): Promise<boolean> {
        const query = `
            MATCH (u:User {userId: $userId})-[:HAS_VOUCHER]->(v:Voucher {voucherId: $voucherId})
            RETURN COUNT(*) > 0 as hasVoucher
        `;
        const result = await this.runQuery<{ hasVoucher: boolean }>(query, {
            userId,
            voucherId,
        });
        return result[0]?.hasVoucher || false;
    }

    /**
     * Get voucher usage statistics
     */
    async getVoucherStatistics(voucherId: string): Promise<{
        totalGranted: number;
        totalUsed: number;
        totalUnused: number;
    }> {
        const query = `
            MATCH (v:Voucher {voucherId: $voucherId})<-[r:HAS_VOUCHER]-()
            RETURN 
                COUNT(r) as totalGranted,
                SIZE([rel IN COLLECT(r) WHERE rel.used = true]) as totalUsed,
                SIZE([rel IN COLLECT(r) WHERE rel.used = false]) as totalUnused
        `;
        const result = await this.runQuery<any>(query, { voucherId });
        return {
            totalGranted: result[0]?.totalGranted || 0,
            totalUsed: result[0]?.totalUsed || 0,
            totalUnused: result[0]?.totalUnused || 0,
        };
    }

    /**
     * Close driver connection
     */
    async close(): Promise<void> {
        await this.driver.close();
    }
}

export const neo4jVoucherRepository = new Neo4jVoucherRepository();
export { UserVoucherRelation };
