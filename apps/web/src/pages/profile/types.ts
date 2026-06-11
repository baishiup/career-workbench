import type { ComponentType, SVGProps } from "react";

/** Profile 页面里可渲染的图标组件类型。 */
type ProfileIcon = ComponentType<SVGProps<SVGSVGElement>>;

/** Web 端 Profile 页面当前实际展示和编辑的分区。 */
type ProfileSection = "personal" | "education" | "work" | "skills";

export type { ProfileIcon, ProfileSection };
