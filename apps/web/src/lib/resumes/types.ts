import type {
  ProfileDraft,
  ResumeDocument,
  ResumeStyleConfig,
} from "@career-workbench/domain";

type ResumeFunctionFile = {
  name: string;
  size: number;
  type: string;
};

type ResumeFunctionRow = {
  created_at: string;
  document_json: ResumeDocument;
  id: string;
  source_context_json?: unknown;
  source_type: string;
  style_json: ResumeStyleConfig;
  title: string;
  updated_at: string;
};

type ResumeListRow = Pick<
  ResumeFunctionRow,
  "created_at" | "id" | "source_type" | "title" | "updated_at"
>;

type UploadResumeResponse = {
  status: "ok";
  provider: "dify";
  file: ResumeFunctionFile;
  profile_candidate: ProfileDraft;
  resume: ResumeFunctionRow;
  parse_warnings: string[];
};

type CompleteOnboardingWithResumeResponse = {
  status: "ok";
  provider: "dify";
  file: ResumeFunctionFile;
  profile: ProfileDraft;
  resume: ResumeFunctionRow;
  parse_warnings: string[];
};

type ApplyResumeToProfileResponse = {
  status: "ok";
  profile: ProfileDraft;
  resume_id: string;
};

type ResumeGenerateResponse = {
  status: "ok";
  provider: "dify";
  resume: ResumeFunctionRow;
};

export type {
  ApplyResumeToProfileResponse,
  CompleteOnboardingWithResumeResponse,
  ResumeGenerateResponse,
  ResumeFunctionFile,
  ResumeFunctionRow,
  ResumeListRow,
  UploadResumeResponse,
};
