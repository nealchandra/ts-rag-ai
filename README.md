# WIP

# TS RAG Framework

The aim of this project is to offer an opinionated framework for easily building RAG-enabled apps in typescript. It has some similarities with langchain and similar frameworks, but is focused on specifically enabling "knowledge-base" style use cases.

This library is designed to be TS-native. There is a vast array of Python libraries for RAG and AI use-cases, but frustratingly fewer first-class options in Typescript. The TS ecosystem is where the bulk of AI application development occurs, and this library is intended to ease the burden of implementing richer AI apps in this ecosystem with excellent type support.

This framework does not orchestrate calls to LLMs at all. It should be used to generate context which can then be used with other TS-native frameworks such as Vercel's excellent AI SDK to query the LLM of your choice.

Intended usage example:

```typescript
// initialize pinecone and openai
const pineconeStore = new PineconeVectorStore(pineconeIndex);

const embeddingsFn: EmbeddingFunction = async (texts: string[]) => {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: texts,
  });
  return response.data.map((d) => d.embedding);
};

// define valid document types
const WebpageDocument = defineDocument(
  "webpage",
  z.object({
    url: z.string(),
    title: z.string(),
    content: z.string(),
    publishDate: z.string().optional(),
  })
);

// create vector index
const vectorIndex = new VectorIndex(
  [WebpageDocument],
  pineconeStore,
  embeddingsFn
);

// insert data
const docs = createDocuments(WebpageDocument, webDocs);
vectorIndex.upsert(docs);

// query data
const res = await vectorIndex.retrieve(
  "Where's the best spot to get ramen in NYC?",
  {
    topK: 20,
    topN: 5,
    rerank: true,
  }
);

// res is correctly typed for valid metadata for WebpageDocuments. Other records with a different document type may have a different metadata structure.
console.log(res[0].content);
```
