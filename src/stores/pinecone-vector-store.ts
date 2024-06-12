import { RecordMetadata, type Index } from "@pinecone-database/pinecone";
import { VectorStore, type IndexableDocument } from "@/core/vector-store.js";
import { Vector } from "@/core/index.js";

export class PineconeVectorStore implements VectorStore {
	private target: Index

	constructor(index: Index, namespace?: string) {
		this.target = namespace ? index.namespace(namespace) : index;
	}

	async upsert(documents: IndexableDocument[]): Promise<void> {
		await this.target.upsert(
			documents.map((doc) => ({
				id: doc.id,
				values: doc.vector,
				metadata: doc.metadata as RecordMetadata,
			})),
		);
	}

	async query(
		vector: Vector,
	): Promise<IndexableDocument[]> {
		const { matches } = await this.target.query({
			vector,
			topK: 20, // FIXME; Add options.
			includeMetadata: true,
		});

		if (matches == undefined) {
			return [];
		}

		return matches.map((match) => ({
			id: match.id,
			vector: match.values,
			metadata: match.metadata,
		})) as IndexableDocument[];
	}

	delete(): Promise<void> {
		throw new Error("Not implemented");
	}
}
