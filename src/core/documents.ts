import { Document } from "langchain/document";
import { nanoid } from "nanoid";
import { ZodTypeAny, z } from "zod";

// The document schema cannot contain the fields `content` and `documentType` because these values will be
// used to store the contents and document type in the vector store metadata.
// export type DocumentSchemaType = z.ZodObject<
// 	Record<string, ZodTypeAny> & { content?: never; documentType?: never }
// >;

type DocumentSchemaType = z.AnyZodObject;

type AnyDocument = Document<string, DocumentSchemaType>;

interface Document<K extends string, T extends DocumentSchemaType> {
	id: string;
	documentType: K;
	content: string;
	metadata: z.infer<T>;
}

interface DocumentModel<K extends string, T extends DocumentSchemaType> {
	documentType: K,
	schema: T,
	getDocumentContents: (object: any) => string 
	getId: (object: any) => string
};


function parseDocument<T extends DocumentModel<string, DocumentSchemaType>>(
	models: T[],
	document: AnyDocument
): Document<T["documentType"], T["schema"]> {
	const model = models.find(m => m.documentType === document.documentType);
	if (!model) {
		console.error(`No model found for document type: ${document.documentType}`);
		throw new Error(`No model found for document type: ${document.documentType}`);
	}
	const data = model.schema.parse(document.metadata);
	return {
		id: document.id,
		documentType: document.documentType,
		content: model.getDocumentContents(document.metadata),
		metadata: data,
	};
}

const extractDefaultContents = (obj: Record<string, unknown>) => {
	if (obj.hasOwnProperty("content") && typeof obj.content === "string") return obj.content
	else throw new Error("No content getter provided and default content not set.");
};

const defineDocument = <K extends string, T extends DocumentSchemaType>(
	documentType: DocumentModel<K, T>["documentType"],
	schema: DocumentModel<K, T>["schema"],
	getDocumentContents: DocumentModel<K, T>["getDocumentContents"] = extractDefaultContents,
	getId: DocumentModel<K, T>["getId"] = () => nanoid(),
): DocumentModel<K, T> => {
	return {
		documentType,
		schema,
		getId,
		getDocumentContents,
	};
};

const createDocuments = <T extends string, S extends DocumentSchemaType>(model: DocumentModel<T, S>, objects: Record<string, unknown>[]): Document<T, S>[] => (
	objects.map((object) => {
		const parsed = model.schema.parse(object);
		return {
			id: model.getId(object),
			documentType: model.documentType,
			content: model.getDocumentContents(object),
			metadata: parsed,
		};
	})
);

export {
	DocumentSchemaType,
	AnyDocument,
	Document,
	DocumentModel,
	defineDocument,
	createDocuments,
};