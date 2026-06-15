import { describe, expect, it } from "vitest";

import { createDefaultResumeStyleConfig } from "./normalize";
import {
  createResumeStyleFromTemplate,
  defaultResumeTemplateId,
  resumeStyleTemplates,
} from "./style";

describe("resume style templates", () => {
  it("默认样式固定使用标准模板且不包含页面尺寸字段", () => {
    const style = createDefaultResumeStyleConfig();

    expect(style.templateId).toBe(defaultResumeTemplateId);
    expect(style).not.toHaveProperty("page" + "Size");
  });

  it("提供 3 个第一版内置模板", () => {
    expect(resumeStyleTemplates.map((template) => template.templateId)).toEqual(
      ["standard-clean", "business-sidebar", "fresh-header"],
    );
  });

  it("每个模板都能生成完整的持久化样式", () => {
    for (const template of resumeStyleTemplates) {
      const style = createResumeStyleFromTemplate(template.templateId);

      expect(style.templateId).toBe(template.templateId);
      expect(style.colors.background).toBeTruthy();
      expect(style.colors.panelBackground).toBeTruthy();
      expect(style.layout.kind).toBe(template.layout.kind);
      expect(style.typography.baseFontSize).toBeGreaterThan(0);
      expect(style.spacing.pageMargin.top).toBeGreaterThan(0);
    }
  });

  it("未知模板回退到默认模板", () => {
    expect(createResumeStyleFromTemplate("missing-template").templateId).toBe(
      defaultResumeTemplateId,
    );
  });
});
