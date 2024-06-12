import { Vector } from "./index.js";

export type IndexableDocument = {
	id: string;
	vector: Vector;
	metadata: Record<string, unknown> & { documentType: string, content: string };
}

export interface VectorStore {
	upsert(documents: IndexableDocument[]): Promise<void>;
	query(query: Vector): Promise<IndexableDocument[]>;
	delete(ids: string[]): Promise<void>;
}