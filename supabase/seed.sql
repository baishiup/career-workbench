-- Demo seed data for local development (supabase db reset).
-- Job rows mirror the web app mock fixture so the UI looks the same
-- in mock mode and in local Supabase mode. Privacy-free demo content only.

insert into public.job_descriptions (
  id,
  source_platform,
  source_url,
  company,
  title,
  company_stage,
  location,
  remote_status,
  job_type,
  seniority,
  years_required,
  required_skills,
  preferred_skills,
  responsibilities,
  requirements,
  salary_range,
  posted_at,
  summary,
  imported_by,
  import_method,
  is_active
) values
  (
    '11111111-1111-4111-8111-111111111111',
    'LinkedIn',
    'https://www.linkedin.com/jobs/view/mock-thrivecart',
    'ThriveCart',
    'Senior Frontend Engineer',
    '电商 · 营销自动化 · 成长期',
    'United States',
    'remote',
    'full_time',
    'Senior',
    '5+ 年',
    array['React', 'TypeScript', 'Design System', 'A/B Testing'],
    array['Next.js', 'Checkout UX', 'Conversion Analytics'],
    array[
      '维护和扩展面向商家的结账、漏斗和订阅管理前端体验。',
      '与产品和设计协作，把增长实验转成稳定、可复用的组件。',
      '用可观测指标跟踪页面性能、转化率和发布质量。'
    ],
    array[
      '有生产级 React/TypeScript 应用经验，能独立负责复杂前端模块。',
      '理解设计系统、表单、状态管理和可访问性基础。',
      '能把业务指标转化为前端实现和实验方案。'
    ],
    null,
    now() - interval '11 hours',
    '面向商家增长和结账转化的前端岗位，适合突出组件系统、复杂表单和产品指标经验。',
    'Admin demo',
    'manual_text',
    true
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Company careers',
    'https://www.nextinsurance.com/careers/mock-frontend',
    'AP Intego (now NEXT)',
    'Frontend Software Engineer',
    '保险科技 · 成熟期',
    'Boston, MA',
    'hybrid',
    'full_time',
    'Senior',
    '6+ 年',
    array['React', 'TypeScript', 'Accessibility', 'Forms'],
    array['Insurance workflows', 'Testing', 'Design QA'],
    array[
      '构建保险报价、购买和账号管理相关的前端流程。',
      '维护高可靠表单、校验、状态流转和错误处理体验。',
      '和后端、法务、运营团队协作，保证复杂业务规则可追踪。'
    ],
    array[
      '熟悉大型 React 应用、表单体验和前端测试。',
      '能在合规约束下处理复杂用户流程和边界状态。',
      '具备可访问性、浏览器兼容和性能优化意识。'
    ],
    '$142K/yr - $192K/yr',
    now() - interval '4 days',
    '偏成熟业务系统的前端岗位，匹配复杂表单、可靠交付和可访问性证据。',
    'Admin demo',
    'manual_text',
    true
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'LinkedIn',
    'https://www.linkedin.com/jobs/view/mock-emergent',
    'Emergent',
    'Frontend Engineer, AI Products',
    '人工智能 · 软件 · 成长期',
    'San Francisco',
    'onsite',
    'full_time',
    'Staff / Lead',
    '7+ 年',
    array['React', 'AI UX', 'Frontend Architecture', 'Realtime UI'],
    array['Agents', 'Streaming', 'Developer Tools'],
    array[
      '设计和实现 AI 产品的核心前端交互，包括生成、编辑和反馈闭环。',
      '建设实时状态、流式输出和复杂任务编排的前端架构。',
      '推动设计、模型和工程团队围绕用户工作流快速迭代。'
    ],
    array[
      '有 AI 产品或开发者工具前端经验。',
      '能在不确定需求下拆分复杂交互和工程边界。',
      '具备跨团队技术负责人经验。'
    ],
    null,
    now() - interval '1 day',
    'AI 产品前端岗位，方向高度相关，但级别偏高，需要更强架构和负责人证据。',
    'Admin demo',
    'screenshot',
    true
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'Job board',
    'https://www.datacamp.com/careers/mock-platform-frontend',
    'DataCamp',
    'Frontend Platform Engineer',
    '在线教育 · 数据学习 · 成熟期',
    'Remote - Europe / US overlap',
    'remote',
    'full_time',
    'Mid-Senior',
    '4+ 年',
    array['React', 'TypeScript', 'Component Library', 'Testing'],
    array['Monorepo', 'Design Tokens', 'Documentation'],
    array[
      '维护跨产品复用的前端平台、组件库和设计 token。',
      '提升工程文档、测试覆盖和团队交付效率。',
      '支持课程、练习和学习路径页面的体验一致性。'
    ],
    array[
      '熟悉组件抽象、前端工程化和跨团队协作。',
      '能写清晰文档并推动设计系统落地。',
      '具备测试、可维护性和性能意识。'
    ],
    null,
    now() - interval '6 days',
    '前端平台方向匹配度稳定，适合把组件系统、工程化和文档能力作为主线。',
    'Admin demo',
    'manual_text',
    true
  )
on conflict (id) do nothing;
