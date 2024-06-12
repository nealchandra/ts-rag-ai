import { VectorStore, type IndexableDocument } from "@/core/vector-store.js";
import { Vector } from "@/core/index.js";
import * as lancedb from "@lancedb/lancedb";

export class LanceDBVectorStore implements VectorStore {
    private db: any;

    constructor(uri: string) {
        this.connectDB(uri);
    }

    async connectDB(uri: string) {
        this.db = await lancedb.connect(uri);
    }

    async upsert(documents: IndexableDocument[]): Promise<void> {
        const table = await this.db.createTable("vectorTable", documents, { writeMode: lancedb.WriteMode.Overwrite });
        for (const doc of documents) {
            await table.add({
                vector: doc.vector,
                item: doc.metadata.documentType,
                price: doc.metadata.content,
            });
        }
    }

    async query(vector: Vector): Promise<IndexableDocument[]> {
        const table = await this.db.openTable("vectorTable");
        const queryResults = await table.vector_search(vector).limit(10).execute();
        return queryResults.map((result: any) => ({
            id: result.id,
            vector: result.vector,
            metadata: {
                documentType: result.item,
                content: result.price,
            },
        }));
    }

    async delete(ids: string[]): Promise<void> {
        const table = await this.db.openTable("vectorTable");
        for (const id of ids) {
            await table.delete(`id = "${id}"`);
        }
    }
}
