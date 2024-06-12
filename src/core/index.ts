import { z } from "zod";

export type Vector = Array<number>;
export type EmbeddingFunction = (contents: string[]) => Vector[];
