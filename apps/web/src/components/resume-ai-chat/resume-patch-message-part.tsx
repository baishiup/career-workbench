"use client";

import type { ResumePatch } from "@career-workbench/domain";

import { useResumeAiPatchActions } from "./resume-ai-types";
import { ResumePatchCard } from "./resume-patch-card";

type ResumePatchMessagePartProps = {
  patch: ResumePatch;
};

function ResumePatchMessagePart({ patch }: ResumePatchMessagePartProps) {
  const { onAcceptPatch, onRejectPatch } = useResumeAiPatchActions();

  return (
    <ResumePatchCard
      onAccept={() => onAcceptPatch(patch)}
      onReject={() => onRejectPatch(patch)}
      patch={patch}
    />
  );
}

export { ResumePatchMessagePart };
