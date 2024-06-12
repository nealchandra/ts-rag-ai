
import type { EmbeddingFunction, Vector } from "./index.js";

function chunk(array: string[], size: number) {
	return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
		array.slice(i * size, i * size + size),
	);
}

type EmbeddingOptions = {
	batchSize: number;
};

// FIXME: Add parallel batching.
export async function batchEmbed(
	contents: string[],
	embeddingFn: EmbeddingFunction,
	options: EmbeddingOptions = { batchSize: 2048 },
) {
	const embeddings: Vector[] = [];
	for (const batch of chunk(contents, options.batchSize)) {
		const batchEmbeddings = await embeddingFn(batch);
		embeddings.push(...batchEmbeddings);
	}
	return embeddings;
}