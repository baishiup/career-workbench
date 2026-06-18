/**
 * Supabase Edge Functions mock。
 *
 * 7 个函数都走 functions/v1/:name 路由。需要落库的（job-match / resume-generate /
 * import 流程）直接读写 mockDb，保证和 PostgREST 看到的数据一致；纯 AI 产出的
 * （resume-chat）回安全的占位响应。所有响应形状对齐 web 侧的 Response 类型。
 */

import {
  createDefaultResumeStyleConfig,
  emptyProfile,
  profileDraftToBaseResumeDocument,
  type ProfileDraft,
  type ResumeDocument,
  type ResumeModule,
} from "@career-workbench/domain";
import { http, HttpResponse } from "msw";

import { mockDb } from "../db/store.ts";
import {
  MOCK_USER_ID,
  type JobDescriptionRow,
  type MatchReportRow,
  type ResumeRow,
} from "../db/schema.ts";

function nowIso() {
  return new Date().toISOString();
}

function currentProfile(): ProfileDraft {
  const row = mockDb
    .table("profiles")
    .find((item) => item.user_id === MOCK_USER_ID);
  return (row?.profile_data as ProfileDraft) ?? emptyProfile;
}

function findJob(jobId: string): JobDescriptionRow | undefined {
  return mockDb.table("job_descriptions").find((job) => job.id === jobId);
}

/** 从当前 Profile 派生一份简历，落库并返回行。 */
function createResumeFromProfile(input: {
  title: string;
  sourceType: string;
  sourceContext?: unknown;
}): ResumeRow {
  const profile = currentProfile();
  const document = profileDraftToBaseResumeDocument(profile, {
    title: input.title,
  });
  const style = createDefaultResumeStyleConfig();
  const timestamp = nowIso();
  const row: ResumeRow = {
    id: crypto.randomUUID(),
    user_id: MOCK_USER_ID,
    title: document.title,
    source_type: input.sourceType,
    document_json: document,
    style_json: style,
    source_context_json: input.sourceContext ?? null,
    created_at: timestamp,
    updated_at: timestamp,
  };
  const rows = mockDb.table("resumes");
  rows.push(row);
  mockDb.persist();
  return row;
}

function mockResumeFile() {
  return { name: "resume.pdf", size: 102400, type: "application/pdf" };
}

const MOCK_TEST_NAME = "mock test";

/** resume-chat 的 mock 行为：把个人信息模块的姓名改成「mock test」，产出可采纳的 patch。 */
function buildNameChangePatch(document: ResumeDocument | undefined) {
  const personal = document?.modules.find(
    (module): module is Extract<ResumeModule, { kind: "personal" }> =>
      module.kind === "personal",
  );

  if (!personal) {
    return null;
  }

  const changed: ResumeModule = {
    ...personal,
    personal: { ...personal.personal, fullName: MOCK_TEST_NAME },
  };

  return {
    id: `resume-patch-${Date.now().toString(36)}`,
    title: `把姓名改成「${MOCK_TEST_NAME}」`,
    description: `把个人信息模块的姓名从「${personal.personal.fullName || "（空）"}」改为「${MOCK_TEST_NAME}」。`,
    original: [{ moduleId: personal.id, data: structuredClone(personal) }],
    changes: [{ moduleId: personal.id, data: changed }],
    evidenceRefs: ["当前简历正文中的原始模块内容", "用户本次输入的修改要求"],
    riskNotes: ["这是一份自动生成的修改建议，采纳前请确认事实准确。"],
    status: "pending" as const,
    createdAt: new Date().toISOString(),
  };
}

/** job-match：基于职位技能生成一份叙事报告并 upsert 到 match_reports。 */
function runJobMatch(jobId: string) {
  const job = findJob(jobId);
  if (!job) {
    return HttpResponse.json(
      { error: "没有找到这个职位。", stage: "job-match" },
      { status: 404 },
    );
  }

  const profile = currentProfile();
  const profileSkills = new Set(
    profile.skills.map((skill) => skill.toLowerCase()),
  );
  const hit = job.required_skills.filter((skill) =>
    profileSkills.has(skill.toLowerCase()),
  );
  const missing = job.required_skills.filter(
    (skill) => !profileSkills.has(skill.toLowerCase()),
  );
  const score = Math.min(
    98,
    50 +
      Math.round((hit.length / Math.max(job.required_skills.length, 1)) * 48),
  );

  const reportJson = {
    match_score: score,
    evidence:
      hit.length > 0
        ? hit.map((skill) => `Profile 中具备 ${skill}，可直接支撑该岗位要求。`)
        : ["Profile 与该岗位有部分通用工程能力交集。"],
    gaps:
      missing.length > 0
        ? missing.map((skill) => `JD 要求 ${skill}，简历中证据不足，建议补充。`)
        : ["暂无明显能力缺口，建议补强量化成果。"],
    risks: [
      "这是 mock 生成的演示报告，真实上线需由模型基于 Profile 事实校验。",
    ],
    aiNote: `命中 ${hit.length}/${job.required_skills.length} 项硬性要求，综合匹配度 ${score}。`,
  };

  const timestamp = nowIso();
  const reports = mockDb.table("match_reports");
  const existingIndex = reports.findIndex(
    (report) => report.job_id === jobId && report.user_id === MOCK_USER_ID,
  );
  const base = {
    user_id: MOCK_USER_ID,
    job_id: jobId,
    status: "succeeded",
    report_json: reportJson,
    profile_snapshot_at: timestamp,
    job_snapshot_at: job.updated_at,
    external_run_id: `mock-job-match-${jobId.slice(0, 8)}`,
    error_message: null,
    updated_at: timestamp,
  };

  let report: MatchReportRow;
  if (existingIndex >= 0) {
    report = { ...reports[existingIndex], ...base };
    reports[existingIndex] = report;
  } else {
    report = { id: crypto.randomUUID(), created_at: timestamp, ...base };
    reports.push(report);
  }
  mockDb.persist();

  return HttpResponse.json({ status: "ok", provider: "dify", report });
}

const functionsHandler = http.post(
  "*/functions/v1/:name",
  async ({ request, params }) => {
    const name = params.name as string;

    switch (name) {
      case "job-match": {
        const body = (await request.json().catch(() => ({}))) as {
          job_id?: string;
        };
        return runJobMatch(String(body.job_id ?? ""));
      }

      case "resume-generate": {
        const body = (await request.json().catch(() => ({}))) as {
          job_id?: string;
        };
        const job = findJob(String(body.job_id ?? ""));
        const title = job ? `${job.company} · 定制简历` : "定制简历";
        const resume = createResumeFromProfile({
          title,
          sourceType: "target_job",
          sourceContext: { job_id: body.job_id ?? null },
        });
        return HttpResponse.json({ status: "ok", provider: "dify", resume });
      }

      case "resume-chat": {
        const body = (await request.json().catch(() => ({}))) as {
          document?: ResumeDocument;
        };
        const patch = buildNameChangePatch(body.document);
        return HttpResponse.json({
          status: "ok",
          provider: "dify",
          message: patch
            ? `我把个人信息里的姓名改成了「${MOCK_TEST_NAME}」，请在预览里查看 Diff 后决定采纳或拒绝。`
            : "没有找到可修改的个人信息模块。",
          patch,
          conversation_id: `mock-conversation-${Date.now().toString(36)}`,
          message_id: crypto.randomUUID(),
          task_id: null,
          workflow_run_id: null,
        });
      }

      case "upload-resume": {
        const resume = createResumeFromProfile({
          title: "导入简历",
          sourceType: "imported",
        });
        return HttpResponse.json({
          status: "ok",
          provider: "dify",
          file: mockResumeFile(),
          profile_candidate: currentProfile(),
          resume,
          parse_warnings: [
            "未读取上传文件内容，已基于当前资料生成可预览的简历草稿。",
          ],
        });
      }

      case "complete-onboarding-with-resume": {
        const resume = createResumeFromProfile({
          title: "首份简历",
          sourceType: "imported",
        });
        return HttpResponse.json({
          status: "ok",
          provider: "dify",
          file: mockResumeFile(),
          profile: currentProfile(),
          resume,
          parse_warnings: [
            "未读取上传文件内容，已基于当前资料生成初始 Profile。",
          ],
        });
      }

      case "apply-resume-to-profile": {
        const body = (await request.json().catch(() => ({}))) as {
          resume_id?: string;
        };
        return HttpResponse.json({
          status: "ok",
          profile: currentProfile(),
          resume_id: String(body.resume_id ?? ""),
        });
      }

      case "job-parse": {
        // admin 解析 JD：回一份结构化草稿占位。
        return HttpResponse.json({
          status: "ok",
          provider: "dify",
          parsed: {
            schema_version: "job.parse.v1",
            source_platform: "mock",
            company: "Mock Company",
            title: "Mock Role",
            company_info: null,
            location: "Remote",
            remote_status: "remote",
            job_type: "full_time",
            years_required: null,
            required_skills: ["React", "TypeScript"],
            preferred_skills: [],
            responsibilities: ["mock 职责占位。"],
            requirements: ["mock 要求占位。"],
            salary_range: null,
            posted_at: null,
            summary: "mock 模式未接入真实解析。",
            parse_warnings: [],
          },
          parse_warnings: [],
        });
      }

      default:
        return HttpResponse.json(
          { error: `mock 未实现的 Edge Function: ${name}` },
          { status: 404 },
        );
    }
  },
);

export const functionsHandlers = [functionsHandler];
