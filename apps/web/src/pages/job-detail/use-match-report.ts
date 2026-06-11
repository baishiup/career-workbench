/**
 * 职位详情页的叙事分析状态：加载已有报告、判断过期、触发（重新）分析。
 */

import { useCallback, useEffect, useState } from "react";

import {
  fetchMatchReportContext,
  runJobMatchAnalysis,
  type MatchReportRecord,
} from "@/lib/jobs/match-report-api";
import type { RuleMatchResult } from "@career-workbench/domain";

type MatchReportState = {
  report: MatchReportRecord | null;
  isStale: boolean;
  isLoading: boolean;
  loadError: string | null;
};

type UseMatchReportResult = MatchReportState & {
  /** 正在调用 job-match Edge Function。 */
  isRunning: boolean;
  /** 本次触发分析的失败信息；已持久化的失败原因看 report.errorMessage。 */
  runError: string | null;
  runAnalysis: (ruleMatch: RuleMatchResult) => Promise<void>;
  reload: () => Promise<void>;
};

function useMatchReport(jobId: string): UseMatchReportResult {
  const [state, setState] = useState<MatchReportState>({
    report: null,
    isStale: false,
    isLoading: true,
    loadError: null,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, loadError: null }));

    try {
      const context = await fetchMatchReportContext(jobId);
      setState({
        report: context.report,
        isStale: context.isStale,
        isLoading: false,
        loadError: null,
      });
    } catch (error) {
      setState({
        report: null,
        isStale: false,
        isLoading: false,
        loadError:
          error instanceof Error ? error.message : "读取匹配分析失败。",
      });
    }
  }, [jobId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const runAnalysis = useCallback(
    async (ruleMatch: RuleMatchResult) => {
      setIsRunning(true);
      setRunError(null);

      try {
        const report = await runJobMatchAnalysis(jobId, ruleMatch);
        // 刚生成的报告必然基于当前快照，直接视为未过期。
        setState({ report, isStale: false, isLoading: false, loadError: null });
      } catch (error) {
        setRunError(
          error instanceof Error ? error.message : "AI 叙事分析失败。",
        );
        // 失败行已被 Edge Function 标记为 failed，重新拉取以展示失败态。
        await reload();
      } finally {
        setIsRunning(false);
      }
    },
    [jobId, reload],
  );

  return { ...state, isRunning, runError, runAnalysis, reload };
}

export { useMatchReport };
export type { UseMatchReportResult };
