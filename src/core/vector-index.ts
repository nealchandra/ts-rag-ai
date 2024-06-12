import { EmbeddingFunction, Vector } from "./index.js";
import { AnyDocument, DocumentModel, DocumentSchemaType } from "./documents.js";
import { batchEmbed } from "./utils.js";
import { IndexableDocument, VectorStore } from "./vector-store.js";
import { CohereClient } from 'cohere-ai'

const cohere = new CohereClient({ token: 'ZCHcj5aOpZ0OujAfLFuhG9NzuCd8WAIpQ7KpQ42y' });

export class VectorIndex{
	models: DocumentModel<string, DocumentSchemaType>[];
	store: VectorStore;
	embeddingFn: EmbeddingFunction;

	constructor(models: DocumentModel<string, DocumentSchemaType>[], store: VectorStore, embeddingFn: EmbeddingFunction) {
		this.models = models;
		this.store = store;
		this.embeddingFn = embeddingFn;
	}

	async upsert(documents: AnyDocument[]) {
		const embeddings = await batchEmbed(documents.map(doc => doc.content), this.embeddingFn);
		const indexableDocuments = documents.map((doc, index) => ({
			id: doc.id,
			vector: embeddings[index],
			metadata: {
				content: doc.content,
				documentType: doc.documentType,
				...doc.metadata 
			}
		} as IndexableDocument));
		await this.store.upsert(indexableDocuments);
	}

	async retrieve(query: string, _options: { topK: number, topN: number, rerank: boolean} = { topK: 10, topN: 5, rerank: true}) {
		const embeddings = await this.embeddingFn([query]);
		const results: IndexableDocument[] = await this.store.query(embeddings[0]!);
		const reranked = _options.rerank ? await this.rerank(results, query, _options.topN) : results.slice(0, _options.topN);

		return reranked.map(result => {
			const model = this.models.find(model => model.documentType === result.metadata.documentType);
			if (!model) {
				throw new Error(`No model found for document type: ${result.metadata.documentType}`);
			}
			return {
				id: result.id,
				documentType: result.metadata.documentType,
				content: result.metadata.content,
				metadata: model.schema.parse(result.metadata)
			};
		});
	}

	private async rerank(results: IndexableDocument[], query: string, topN: number): Promise<IndexableDocument[]> {
		const reranked = await cohere.rerank({
			documents: results.map(result => result.metadata.content),
			topN,
			query: query,
			model: 'rerank-english-v3.0',
			returnDocuments: false,
		})

		return reranked.results.map((r) => (
			results[r.index] as IndexableDocument
		))
	}
}

