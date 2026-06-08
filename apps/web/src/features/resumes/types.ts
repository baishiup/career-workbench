export type ParseResumeResponse = {
  status: "ok";
  provider: "dify";
  file: {
    name: string;
    size: number;
    type: string;
  };
  dify: {
    upload: unknown;
    workflow: unknown;
    outputs: unknown;
  };
};

export type ParseResumeErrorDetails = {
  status?: number;
  details?: unknown;
};
