import { useEffect, useMemo, useRef, useState } from "react";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import { apiRequest } from "../../lib/api.js";

const defaultSettings = {
  is_enabled: false,
  approval_required: true,
  openai_api_key: "",
  openai_text_model: "gpt-4.1-mini",
  openai_image_model: "gpt-image-1",
  facebook_page_id: "",
  facebook_page_access_token: "",
  facebook_api_version: "v21.0",
  facebook_webhook_verify_token: "",
  comment_automation_enabled: false,
  comment_require_review: true,
  auto_public_reply_enabled: false,
  auto_private_reply_enabled: false,
  ai_comment_reply_enabled: false,
  default_language: "bn",
  default_tone: "friendly-local",
  brand_voice:
    "Bholavashi is a trusted local service app for Bhola. Write clear, warm Bangla copy. Avoid fake claims, medical guarantees, political content, and personal data.",
  schedule_timezone: "Asia/Dhaka",
  daily_post_limit: 3,
};

const sourceTypes = [
  ["all", "All DB sources"],
  ["food_item", "Food items"],
  ["restaurant", "Restaurants"],
  ["coupon", "Coupons"],
  ["app_feature", "App features"],
];

const pageCss = `
@keyframes aiRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes aiPop{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes aiFade{from{opacity:0}to{opacity:1}}
@keyframes aiRing{0%{box-shadow:0 0 0 0 rgba(238,0,18,.45)}100%{box-shadow:0 0 0 9px rgba(238,0,18,0)}}
@keyframes aiDraw{to{stroke-dashoffset:0}}
.ai-rise{opacity:0;animation:aiRise .55s cubic-bezier(.2,.8,.2,1) var(--d,0ms) forwards}
.ai-pop{opacity:0;animation:aiPop .4s cubic-bezier(.2,.8,.2,1) var(--d,0ms) forwards}
.ai-fade{animation:aiFade .3s ease both}
.ai-ring{animation:aiRing 1.8s ease-out infinite}
.ai-draw{stroke-dasharray:1;stroke-dashoffset:1;animation:aiDraw 1s ease-out var(--d,0ms) forwards}
@media (prefers-reduced-motion:reduce){.ai-rise,.ai-pop,.ai-fade,.ai-ring,.ai-draw{animation:none!important;opacity:1!important;stroke-dashoffset:0!important}}
`;

function useCountUp(target, duration = 800) {
  const [val, setVal] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const end = Number(target || 0);
    const start = from.current;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      from.current = end;
      setVal(end);
      return undefined;
    }
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const cur = start + (end - start) * (1 - Math.pow(1 - p, 3));
      from.current = cur;
      setVal(cur);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

export default function AiSocialAutomationPage({ token, onUnauthorized }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [meta, setMeta] = useState(null);
  const [posts, setPosts] = useState([]);
  const [commentRules, setCommentRules] = useState([]);
  const [facebookComments, setFacebookComments] = useState([]);
  const [ruleDraft, setRuleDraft] = useState(defaultRule());
  const [sources, setSources] = useState([]);
  const [sourceType, setSourceType] = useState("all");
  const [selectedSource, setSelectedSource] = useState(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [generateImage, setGenerateImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [openAiModels, setOpenAiModels] = useState([]);
  const [modelsFetchedAt, setModelsFetchedAt] = useState("");

  const postStats = useMemo(() => {
    const counts = posts.reduce(
      (acc, post) => {
        const status = post.status || "draft";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      { draft: 0, approved: 0, published: 0, failed: 0 },
    );
    return {
      total: posts.length,
      drafts: counts.draft || 0,
      approved: counts.approved || 0,
      published: counts.published || 0,
      failed: counts.failed || 0,
    };
  }, [posts]);

  const automationReady = Boolean(
    settings.is_enabled &&
      (meta?.has_openai_api_key || settings.openai_api_key) &&
      settings.facebook_page_id &&
      (meta?.has_facebook_page_access_token || settings.facebook_page_access_token),
  );

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/admin/ai-social", { token });
      hydrateSettings(data.settings || {});
      setPosts(data.posts || []);
      setCommentRules(data.comment_rules || []);
      setFacebookComments(data.facebook_comments || []);
      await loadSources(sourceType);
      if (data.settings?.has_openai_api_key) {
        await loadOpenAiModels({ silent: true });
      }
    } catch (err) {
      setError(err.message || "Unable to load AI social automation.");
      if (/unauthorized|forbidden/i.test(err.message || "")) onUnauthorized?.();
    } finally {
      setLoading(false);
    }
  };

  const hydrateSettings = (incoming) => {
    setMeta(incoming);
    setSettings({
      ...defaultSettings,
      ...incoming,
      openai_api_key: "",
      facebook_page_access_token: "",
    });
  };

  const loadSources = async (type = sourceType) => {
    const data = await apiRequest(`/admin/ai-social/sources?type=${encodeURIComponent(type)}`, { token });
    setSources(data.sources || []);
    setSelectedSource((data.sources || [])[0] || null);
  };

  const loadOpenAiModels = async ({ silent = false } = {}) => {
    if (!silent) setBusy("models");
    setError("");
    try {
      const payload = settings.openai_api_key?.trim() ? { openai_api_key: settings.openai_api_key.trim() } : {};
      const data = await apiRequest("/admin/ai-social/openai-models", { method: "POST", token, body: payload });
      setOpenAiModels(data.models || []);
      setModelsFetchedAt(data.fetched_at || "");
      if (data.settings) {
        setMeta(data.settings);
      }
    } catch (err) {
      if (!silent) setError(err.message || "Unable to load OpenAI models.");
    } finally {
      if (!silent) setBusy("");
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const update = (field, value) => setSettings((prev) => ({ ...prev, [field]: value }));

  const saveSettings = async (event) => {
    event.preventDefault();
    setBusy("save");
    setError("");
    try {
      const payload = { ...settings };
      if (!payload.openai_api_key.trim()) delete payload.openai_api_key;
      if (!payload.facebook_page_access_token.trim()) delete payload.facebook_page_access_token;
      const data = await apiRequest("/admin/ai-social/settings", { method: "PUT", token, body: payload });
      hydrateSettings(data.settings || {});
    } catch (err) {
      setError(err.message || "Unable to save settings.");
    } finally {
      setBusy("");
    }
  };

  const test = async (kind) => {
    setBusy(kind);
    setError("");
    try {
      const data = await apiRequest(`/admin/ai-social/test-${kind}`, { method: "POST", token });
      hydrateSettings(data.settings || meta || {});
    } catch (err) {
      setError(err.message || `${kind} test failed.`);
    } finally {
      setBusy("");
    }
  };

  const generate = async () => {
    if (!selectedSource) return;
    setBusy("generate");
    setError("");
    try {
      const data = await apiRequest("/admin/ai-social/generate", {
        method: "POST",
        token,
        body: {
          source_type: selectedSource.source_type,
          source_id: selectedSource.source_id,
          tone: settings.default_tone,
          scheduled_at: scheduledAt || null,
          generate_image: generateImage,
        },
      });
      setPosts((prev) => [data.post, ...prev]);
    } catch (err) {
      setError(err.message || "AI generation failed.");
    } finally {
      setBusy("");
    }
  };

  const savePost = async (post, patch) => {
    const data = await apiRequest(`/admin/ai-social/posts/${post.id}`, {
      method: "PUT",
      token,
      body: patch,
    });
    setPosts((prev) => prev.map((item) => (item.id === post.id ? data.post : item)));
  };

  const action = async (post, name) => {
    setBusy(`${name}-${post.id}`);
    setError("");
    try {
      const data = await apiRequest(`/admin/ai-social/posts/${post.id}/${name}`, { method: "POST", token });
      if (data.post) setPosts((prev) => prev.map((item) => (item.id === post.id ? data.post : item)));
    } catch (err) {
      setError(err.message || `${name} failed.`);
    } finally {
      setBusy("");
    }
  };

  const publishDue = async () => {
    setBusy("publish-due");
    try {
      await apiRequest("/admin/ai-social/publish-due", { method: "POST", token });
      await load();
    } finally {
      setBusy("");
    }
  };

  const saveRule = async (event) => {
    event.preventDefault();
    setBusy("rule");
    setError("");
    try {
      const path = ruleDraft.id ? `/admin/ai-social/comment-rules/${ruleDraft.id}` : "/admin/ai-social/comment-rules";
      const data = await apiRequest(path, {
        method: ruleDraft.id ? "PUT" : "POST",
        token,
        body: ruleDraft,
      });
      setCommentRules(data.comment_rules || []);
      setRuleDraft(defaultRule());
    } catch (err) {
      setError(err.message || "Unable to save comment rule.");
    } finally {
      setBusy("");
    }
  };

  const deleteRule = async (rule) => {
    setBusy(`delete-rule-${rule.id}`);
    try {
      const data = await apiRequest(`/admin/ai-social/comment-rules/${rule.id}`, { method: "DELETE", token });
      setCommentRules(data.comment_rules || []);
    } finally {
      setBusy("");
    }
  };

  const sendCommentReply = async (comment, patch) => {
    setBusy(`comment-${comment.id}`);
    setError("");
    try {
      const data = await apiRequest(`/admin/ai-social/facebook-comments/${comment.id}/reply`, {
        method: "POST",
        token,
        body: patch,
      });
      setFacebookComments(data.facebook_comments || []);
    } catch (err) {
      setError(err.message || "Unable to send comment reply.");
    } finally {
      setBusy("");
    }
  };

  if (loading) return <LoadingPanel />;

  return (
    <div className="space-y-5">
      <style>{pageCss}</style>
      {error && (
        <div className="ai-rise rounded-2xl border border-[#ee0012]/20 bg-[#fef2f2] px-4 py-3 text-sm font-semibold text-[#b91c1c]">{error}</div>
      )}

      <section className="ai-rise overflow-hidden rounded-[26px] border border-[#ececec] bg-white shadow-[0_18px_50px_rgba(17,24,39,0.06)]">
        <div className="grid gap-0 lg:grid-cols-[1.15fr,0.85fr]">
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={automationReady ? "dark" : "red"}>{automationReady ? "Ready" : "Setup needed"}</StatusPill>
              <StatusPill tone={settings.is_enabled ? "red" : "gray"}>{settings.is_enabled ? "Automation on" : "Automation off"}</StatusPill>
              <StatusPill tone={settings.comment_automation_enabled ? "red" : "gray"}>
                {settings.comment_automation_enabled ? "Comment CRM on" : "Comment CRM off"}
              </StatusPill>
            </div>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-[#111] sm:text-4xl">AI Social Automation</h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-[#6b7280]">
              Bholavashi database theke campaign draft, image, schedule, Facebook publishing and comment reply control.
            </p>
          </div>
          <div className="border-t border-[#ececec] bg-[#fafafa] p-5 sm:p-7 lg:border-l lg:border-t-0">
            <div className="flex items-center gap-5">
              <PostDonut stats={postStats} />
              <div className="grid flex-1 grid-cols-2 gap-3">
                <KpiCard label="Posts" value={postStats.total} delay={0} />
                <KpiCard label="Drafts" value={postStats.drafts + postStats.approved} delay={60} />
                <KpiCard label="Published" value={postStats.published} accent delay={120} />
                <KpiCard label="Comments" value={facebookComments.length} delay={180} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.04fr,0.96fr]">
        <form onSubmit={saveSettings} className="ai-rise" style={{ "--d": "70ms" }}>
          <SectionCard
            kicker="Control center"
            title="Credentials & Guardrails"
            subtitle="OpenAI, Facebook Page, webhook and reply safety controls."
            action={<Toggle checked={settings.is_enabled} label="Enabled" onChange={(value) => update("is_enabled", value)} />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label={`OpenAI API Key ${meta?.openai_api_key_masked ? `(${meta.openai_api_key_masked})` : ""}`}
                type="password"
                value={settings.openai_api_key}
                onChange={(e) => update("openai_api_key", e.target.value)}
                placeholder={meta?.has_openai_api_key ? "Leave blank to keep saved key" : "sk-..."}
              />
              <Input label="Daily post limit" type="number" value={settings.daily_post_limit} onChange={(e) => update("daily_post_limit", Number(e.target.value))} />

              <div className="md:col-span-2 rounded-2xl border border-[#ececec] bg-[#fafafa] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-black text-[#111]">OpenAI model list</p>
                    <p className="mt-1 text-xs font-semibold text-[#6b7280]">
                      {openAiModels.length
                        ? `${openAiModels.length} models loaded${modelsFetchedAt ? ` at ${modelsFetchedAt}` : ""}`
                        : "Use saved or typed key to load model dropdowns."}
                    </p>
                  </div>
                  <Button type="button" variant="ghost" onClick={() => loadOpenAiModels()} disabled={busy === "models"}>
                    {busy === "models" ? "Loading..." : "Refresh models"}
                  </Button>
                </div>
              </div>

              <OpenAiModelSelect label="Text model" value={settings.openai_text_model} models={openAiModels} preferredKind="text" onChange={(value) => update("openai_text_model", value)} />
              <OpenAiModelSelect label="Image model" value={settings.openai_image_model} models={openAiModels} preferredKind="image" onChange={(value) => update("openai_image_model", value)} />
              <Input label="Facebook Graph version" value={settings.facebook_api_version} onChange={(e) => update("facebook_api_version", e.target.value)} />
              <Input label="Facebook Page ID" value={settings.facebook_page_id || ""} onChange={(e) => update("facebook_page_id", e.target.value)} />
              <Input
                label={`Page Access Token ${meta?.facebook_page_access_token_masked ? `(${meta.facebook_page_access_token_masked})` : ""}`}
                type="password"
                value={settings.facebook_page_access_token}
                onChange={(e) => update("facebook_page_access_token", e.target.value)}
                placeholder={meta?.has_facebook_page_access_token ? "Leave blank to keep saved token" : "EAAG..."}
              />
              <Input label="Webhook verify token" value={settings.facebook_webhook_verify_token || ""} onChange={(e) => update("facebook_webhook_verify_token", e.target.value)} />

              <div className="md:col-span-2 rounded-2xl border border-[#ececec] bg-white p-4 text-sm shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                <div className="font-black text-[#111]">Webhook callback URL</div>
                <div className="mt-1 break-all font-semibold text-[#6b7280]">{meta?.webhook_callback_url || "Save settings to generate callback URL"}</div>
              </div>

              <Toggle label="Comment automation" checked={settings.comment_automation_enabled} onChange={(value) => update("comment_automation_enabled", value)} />
              <Toggle label="Require review before reply" checked={settings.comment_require_review} onChange={(value) => update("comment_require_review", value)} />
              <Toggle label="Auto public reply" checked={settings.auto_public_reply_enabled} onChange={(value) => update("auto_public_reply_enabled", value)} />
              <Toggle label="Auto private reply" checked={settings.auto_private_reply_enabled} onChange={(value) => update("auto_private_reply_enabled", value)} />
              <Toggle label="AI comment reply" checked={settings.ai_comment_reply_enabled} onChange={(value) => update("ai_comment_reply_enabled", value)} />
              <Input label="Default tone" value={settings.default_tone} onChange={(e) => update("default_tone", e.target.value)} />

              <label className="md:col-span-2 text-sm font-bold text-[#111]">
                Brand voice & AI safety instruction
                <textarea
                  className="mt-2 min-h-28 w-full rounded-2xl border border-[#ececec] bg-white px-4 py-3 text-sm font-medium text-[#111] outline-none transition focus:border-[#ee0012]/50 focus:ring-4 focus:ring-[#ee0012]/10"
                  value={settings.brand_voice || ""}
                  onChange={(e) => update("brand_voice", e.target.value)}
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-[#ececec] pt-4">
              <Button type="button" variant="ghost" onClick={() => test("openai")} disabled={busy === "openai"}>
                {busy === "openai" ? "Checking..." : "Check OpenAI"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => test("facebook")} disabled={busy === "facebook"}>
                {busy === "facebook" ? "Checking..." : "Check Facebook"}
              </Button>
              <Button disabled={busy === "save"}>{busy === "save" ? "Saving..." : "Save settings"}</Button>
            </div>
          </SectionCard>
        </form>

        <div className="ai-rise" style={{ "--d": "130ms" }}>
          <SectionCard kicker="Campaign generator" title="DB Source Studio" subtitle="Pick a source, schedule it, then generate a draft.">
            <div className="grid gap-4">
              <label className="text-sm font-bold text-[#111]">
                Source type
                <select
                  className="mt-2 w-full rounded-2xl border border-[#ececec] bg-white px-4 py-3 text-sm font-semibold text-[#111] outline-none focus:border-[#ee0012]/50 focus:ring-4 focus:ring-[#ee0012]/10"
                  value={sourceType}
                  onChange={async (e) => {
                    setSourceType(e.target.value);
                    await loadSources(e.target.value);
                  }}
                >
                  {sourceTypes.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-bold text-[#111]">
                Source
                <select
                  className="mt-2 w-full rounded-2xl border border-[#ececec] bg-white px-4 py-3 text-sm font-semibold text-[#111] outline-none focus:border-[#ee0012]/50 focus:ring-4 focus:ring-[#ee0012]/10"
                  value={selectedSource ? `${selectedSource.source_type}:${selectedSource.source_id}` : ""}
                  onChange={(e) => setSelectedSource(sources.find((source) => `${source.source_type}:${source.source_id}` === e.target.value))}
                >
                  {sources.map((source) => (
                    <option key={`${source.source_type}:${source.source_id}`} value={`${source.source_type}:${source.source_id}`}>
                      {source.title} {source.subtitle ? `- ${source.subtitle}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <SourcePreview source={selectedSource} />

              <Input label="Schedule time (optional)" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              <Toggle label="Generate image immediately" checked={generateImage} onChange={setGenerateImage} />
              <Button type="button" onClick={generate} disabled={busy === "generate" || !selectedSource}>
                {busy === "generate" ? "Generating..." : "Generate AI Draft"}
              </Button>
            </div>
          </SectionCard>
        </div>
      </div>

      <section className="ai-rise" style={{ "--d": "180ms" }}>
        <SectionCard
          kicker="Publishing"
          title="Drafts & Schedule Queue"
          subtitle={`${postStats.total} posts, ${postStats.failed} failed, ${postStats.published} published.`}
          action={
            <Button variant="ghost" onClick={publishDue} disabled={busy === "publish-due"}>
              {busy === "publish-due" ? "Publishing..." : "Publish Due"}
            </Button>
          }
        >
          <div className="grid gap-4">
            {posts.map((post, i) => (
              <PostCard key={post.id} post={post} busy={busy} onSave={savePost} onAction={action} delay={i * 40} />
            ))}
            {!posts.length && <Panel>No AI social posts yet.</Panel>}
          </div>
        </SectionCard>
      </section>

      <div className="ai-rise" style={{ "--d": "230ms" }}>
        <CommentAutomationPanel
          rules={commentRules}
          comments={facebookComments}
          draft={ruleDraft}
          setDraft={setRuleDraft}
          onSaveRule={saveRule}
          onDeleteRule={deleteRule}
          onSendReply={sendCommentReply}
          busy={busy}
        />
      </div>
    </div>
  );
}

function defaultRule() {
  return {
    is_active: true,
    keyword: "",
    public_reply: "ধন্যবাদ {name}, বিস্তারিত ইনবক্সে পাঠানো হলো।",
    private_reply: "ভোলাবাসী থেকে শুভেচ্ছা। আপনার কমেন্টের বিষয়ে বিস্তারিত জানতে এই মেসেজে রিপ্লাই করুন।",
    ai_enabled: false,
    auto_public_reply: true,
    auto_private_reply: false,
    sort_order: 0,
  };
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="group flex items-center justify-between gap-3 rounded-2xl border border-[#ececec] bg-white px-4 py-3 text-sm font-bold text-[#111] shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:border-[#ee0012]/35">
      <span>{label}</span>
      <span className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${checked ? "bg-[#ee0012]" : "bg-[#e5e7eb]"}`}>
        <input
          type="checkbox"
          checked={!!checked}
          onChange={(event) => onChange(event.target.checked)}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        />
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all duration-300 ${checked ? "left-6" : "left-1"}`} />
      </span>
    </label>
  );
}

function OpenAiModelSelect({ label, value, models, preferredKind, onChange }) {
  const normalized = Array.isArray(models) ? models : [];
  const optionMap = new Map();
  if (value) {
    optionMap.set(value, { id: value, kind: "selected", owned_by: "current setting" });
  }
  normalized.forEach((model) => optionMap.set(model.id, model));

  const options = Array.from(optionMap.values()).sort((a, b) => {
    const aPreferred = a.kind === preferredKind ? 0 : 1;
    const bPreferred = b.kind === preferredKind ? 0 : 1;
    if (aPreferred !== bPreferred) return aPreferred - bPreferred;
    return a.id.localeCompare(b.id);
  });

  return (
    <label className="block text-sm font-bold text-[#111]">
      {label}
      <select
        className="mt-2 w-full rounded-2xl border border-[#ececec] bg-white px-4 py-3 text-sm font-semibold text-[#111] outline-none transition focus:border-[#ee0012]/50 focus:ring-4 focus:ring-[#ee0012]/10"
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
      >
        {!options.length && <option value="">Refresh models first</option>}
        {options.map((model) => (
          <option key={`${label}-${model.id}`} value={model.id}>
            {model.id}
            {model.kind ? ` (${model.kind})` : ""}
            {model.owned_by ? ` - ${model.owned_by}` : ""}
          </option>
        ))}
      </select>
      <span className="mt-1.5 block text-xs font-semibold text-[#6b7280]">
        {models.length ? "Loaded from OpenAI for this account." : "Refresh after adding an OpenAI API key."}
      </span>
    </label>
  );
}

function CommentAutomationPanel({ rules, comments, draft, setDraft, onSaveRule, onDeleteRule, onSendReply, busy }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[0.85fr,1.15fr]">
      <form onSubmit={onSaveRule}>
        <SectionCard kicker="Comment CRM" title="Keyword Reply Rules" subtitle={`${rules.length} active or saved rules.`}>
          <div className="grid gap-3">
            <Toggle label="Rule active" checked={draft.is_active} onChange={(value) => setDraft((prev) => ({ ...prev, is_active: value }))} />
            <Input label="Keyword/tag" value={draft.keyword} onChange={(e) => setDraft((prev) => ({ ...prev, keyword: e.target.value }))} placeholder="price, inbox, menu" />
            <label className="text-sm font-bold text-[#111]">
              Public comment reply
              <textarea
                className="mt-2 min-h-24 w-full rounded-2xl border border-[#ececec] px-4 py-3 text-sm font-medium outline-none focus:border-[#ee0012]/50 focus:ring-4 focus:ring-[#ee0012]/10"
                value={draft.public_reply || ""}
                onChange={(e) => setDraft((prev) => ({ ...prev, public_reply: e.target.value }))}
              />
            </label>
            <label className="text-sm font-bold text-[#111]">
              Private inbox reply
              <textarea
                className="mt-2 min-h-24 w-full rounded-2xl border border-[#ececec] px-4 py-3 text-sm font-medium outline-none focus:border-[#ee0012]/50 focus:ring-4 focus:ring-[#ee0012]/10"
                value={draft.private_reply || ""}
                onChange={(e) => setDraft((prev) => ({ ...prev, private_reply: e.target.value }))}
              />
            </label>
            <div className="grid gap-2 md:grid-cols-2">
              <Toggle label="AI rewrite" checked={draft.ai_enabled} onChange={(value) => setDraft((prev) => ({ ...prev, ai_enabled: value }))} />
              <Toggle label="Public enabled" checked={draft.auto_public_reply} onChange={(value) => setDraft((prev) => ({ ...prev, auto_public_reply: value }))} />
              <Toggle label="Private enabled" checked={draft.auto_private_reply} onChange={(value) => setDraft((prev) => ({ ...prev, auto_private_reply: value }))} />
              <Input label="Sort" type="number" value={draft.sort_order || 0} onChange={(e) => setDraft((prev) => ({ ...prev, sort_order: Number(e.target.value) }))} />
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-[#ececec] pt-4">
              {draft.id && (
                <Button type="button" variant="ghost" onClick={() => setDraft(defaultRule())}>
                  New rule
                </Button>
              )}
              <Button disabled={busy === "rule"}>{busy === "rule" ? "Saving..." : "Save rule"}</Button>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {rules.map((rule, i) => (
              <div
                key={rule.id}
                className="ai-pop rounded-2xl border border-[#ececec] bg-[#fafafa] p-4 transition hover:border-[#ee0012]/30"
                style={{ "--d": `${i * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-black text-[#111]">{rule.keyword}</div>
                    <div className="mt-1 text-xs font-semibold text-[#6b7280]">
                      {rule.is_active ? "Active" : "Off"} / public {rule.auto_public_reply ? "on" : "off"} / private {rule.auto_private_reply ? "on" : "off"}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button type="button" variant="ghost" onClick={() => setDraft(rule)}>
                      Edit
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => onDeleteRule(rule)} disabled={busy === `delete-rule-${rule.id}`}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {!rules.length && <Panel>No comment rules yet.</Panel>}
          </div>
        </SectionCard>
      </form>

      <SectionCard kicker="Facebook" title="Comment Inbox" subtitle={`${comments.length} webhook comments captured.`}>
        <div className="space-y-3">
          {comments.map((comment, i) => (
            <CommentCard key={comment.id} comment={comment} busy={busy} onSendReply={onSendReply} delay={i * 40} />
          ))}
          {!comments.length && <Panel>No Facebook comments received yet.</Panel>}
        </div>
      </SectionCard>
    </div>
  );
}

function CommentCard({ comment, busy, onSendReply, delay = 0 }) {
  const [publicReply, setPublicReply] = useState(comment.public_reply_text || "");
  const [privateReply, setPrivateReply] = useState(comment.private_reply_text || "");

  useEffect(() => {
    setPublicReply(comment.public_reply_text || "");
    setPrivateReply(comment.private_reply_text || "");
  }, [comment.id, comment.public_reply_text, comment.private_reply_text]);

  return (
    <div className="ai-pop rounded-[22px] border border-[#ececec] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:border-[#ee0012]/25" style={{ "--d": `${delay}ms` }}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="truncate font-black text-[#111]">{comment.sender_name || "Facebook user"}</div>
          <div className="mt-1 text-xs font-semibold text-[#6b7280]">
            {comment.comment_id} / {comment.status}
            {comment.matched_keyword ? ` / ${comment.matched_keyword}` : ""}
          </div>
        </div>
        <StatusPill tone={comment.last_error ? "red" : comment.public_replied_at || comment.private_replied_at ? "dark" : "gray"}>
          {comment.last_error ? "Needs review" : comment.public_replied_at || comment.private_replied_at ? "Replied" : "Pending"}
        </StatusPill>
      </div>
      <p className="mt-3 rounded-2xl bg-[#fafafa] p-3 text-sm font-semibold leading-6 text-[#374151]">{comment.message || "No comment text"}</p>
      {comment.last_error && (
        <div className="mt-3 whitespace-pre-wrap rounded-2xl border border-[#ee0012]/20 bg-[#fef2f2] p-3 text-xs font-bold text-[#b91c1c]">{comment.last_error}</div>
      )}
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="text-sm font-bold text-[#111]">
          Public reply
          <textarea
            className="mt-2 min-h-20 w-full rounded-2xl border border-[#ececec] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ee0012]/50 focus:ring-4 focus:ring-[#ee0012]/10"
            value={publicReply}
            onChange={(e) => setPublicReply(e.target.value)}
          />
        </label>
        <label className="text-sm font-bold text-[#111]">
          Private reply
          <textarea
            className="mt-2 min-h-20 w-full rounded-2xl border border-[#ececec] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ee0012]/50 focus:ring-4 focus:ring-[#ee0012]/10"
            value={privateReply}
            onChange={(e) => setPrivateReply(e.target.value)}
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" disabled={busy === `comment-${comment.id}`} onClick={() => onSendReply(comment, { public_reply_text: publicReply, private_reply_text: privateReply, send_public: true, send_private: false })}>
          Send public
        </Button>
        <Button type="button" variant="ghost" disabled={busy === `comment-${comment.id}`} onClick={() => onSendReply(comment, { public_reply_text: publicReply, private_reply_text: privateReply, send_public: false, send_private: true })}>
          Send private
        </Button>
        <Button type="button" disabled={busy === `comment-${comment.id}`} onClick={() => onSendReply(comment, { public_reply_text: publicReply, private_reply_text: privateReply, send_public: true, send_private: true })}>
          Send both
        </Button>
      </div>
    </div>
  );
}

function PostCard({ post, busy, onSave, onAction, delay = 0 }) {
  const [caption, setCaption] = useState(post.caption || "");
  const [imagePrompt, setImagePrompt] = useState(post.image_prompt || "");
  const [scheduledAt, setScheduledAt] = useState(toLocalInput(post.scheduled_at));

  useEffect(() => {
    setCaption(post.caption || "");
    setImagePrompt(post.image_prompt || "");
    setScheduledAt(toLocalInput(post.scheduled_at));
  }, [post.id, post.caption, post.image_prompt, post.scheduled_at]);

  return (
    <div
      className="ai-pop grid gap-4 rounded-[22px] border border-[#ececec] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:border-[#ee0012]/25 lg:grid-cols-[190px,1fr]"
      style={{ "--d": `${delay}ms` }}
    >
      <div>
        {post.image_url ? (
          <img src={post.image_url} alt="" className="aspect-square w-full rounded-[20px] border border-[#ececec] object-cover" />
        ) : (
          <div className="grid aspect-square place-items-center rounded-[20px] border border-dashed border-[#d1d5db] bg-[#fafafa] text-sm font-bold text-[#6b7280]">
            No image
          </div>
        )}
        <div className="mt-3 flex justify-center">
          <StatusPill tone={post.status === "published" ? "dark" : post.status === "failed" ? "red" : "gray"}>{post.status}</StatusPill>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-black text-[#111]">{post.topic || "AI post"}</h3>
            <p className="mt-1 text-xs font-semibold text-[#6b7280]">
              {post.source_type} #{post.source_id || "-"}
              {post.platform_post_id ? ` / ${post.platform_post_id}` : ""}
            </p>
          </div>
          {post.failure_message && (
            <div className="rounded-2xl border border-[#ee0012]/20 bg-[#fef2f2] px-3 py-2 text-xs font-bold text-[#b91c1c]">{post.failure_message}</div>
          )}
        </div>
        <textarea
          className="min-h-36 w-full rounded-2xl border border-[#ececec] px-4 py-3 text-sm font-medium leading-6 outline-none focus:border-[#ee0012]/50 focus:ring-4 focus:ring-[#ee0012]/10"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <textarea
          className="min-h-20 w-full rounded-2xl border border-[#ececec] bg-[#fafafa] px-4 py-3 text-xs font-semibold leading-5 text-[#6b7280] outline-none focus:border-[#ee0012]/50 focus:ring-4 focus:ring-[#ee0012]/10"
          value={imagePrompt}
          onChange={(e) => setImagePrompt(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="rounded-2xl border border-[#ececec] px-4 py-2.5 text-sm font-semibold outline-none focus:border-[#ee0012]/50 focus:ring-4 focus:ring-[#ee0012]/10"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
          <Button variant="ghost" type="button" onClick={() => onSave(post, { caption, image_prompt: imagePrompt, scheduled_at: scheduledAt || null })}>
            Save
          </Button>
          <Button variant="ghost" type="button" onClick={() => onAction(post, "image")} disabled={busy === `image-${post.id}`}>
            Image
          </Button>
          <Button variant="ghost" type="button" onClick={() => onAction(post, "approve")} disabled={busy === `approve-${post.id}`}>
            Approve
          </Button>
          <Button type="button" onClick={() => onAction(post, "publish")} disabled={busy === `publish-${post.id}`}>
            Publish now
          </Button>
        </div>
      </div>
    </div>
  );
}

function SourcePreview({ source }) {
  if (!source) {
    return <Panel>No source selected.</Panel>;
  }

  return (
    <div className="ai-fade rounded-[22px] border border-[#111] bg-[#111] p-4 text-white">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/55">{source.source_type}</p>
          <h3 className="mt-1 truncate text-lg font-black">{source.title}</h3>
          {source.subtitle && <p className="mt-1 text-sm font-semibold text-white/65">{source.subtitle}</p>}
        </div>
        <span className="rounded-full bg-[#ee0012] px-3 py-1 text-xs font-black">#{source.source_id}</span>
      </div>
      <pre className="mt-4 max-h-52 overflow-auto rounded-2xl bg-white/8 p-3 text-xs leading-5 text-white/75">{JSON.stringify(source.snapshot, null, 2)}</pre>
    </div>
  );
}

function SectionCard({ kicker, title, subtitle, action, children }) {
  return (
    <section className="rounded-[26px] border border-[#ececec] bg-white p-5 shadow-[0_12px_34px_rgba(17,24,39,0.05)] sm:p-6">
      <div className="mb-5 flex flex-col gap-3 border-b border-[#ececec] pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          {kicker && <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#ee0012]">{kicker}</p>}
          <h2 className="mt-1 text-xl font-black tracking-tight text-[#111]">{title}</h2>
          {subtitle && <p className="mt-1 text-sm font-medium text-[#6b7280]">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function KpiCard({ label, value, accent, delay = 0 }) {
  const displayed = Math.round(useCountUp(value));
  return (
    <div
      className={`ai-pop rounded-2xl border p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:-translate-y-0.5 ${
        accent ? "border-[#ee0012]/25 bg-[#fef2f2]" : "border-[#ececec] bg-white"
      }`}
      style={{ "--d": `${delay}ms` }}
    >
      <div className={`text-2xl font-black ${accent ? "text-[#ee0012]" : "text-[#111]"}`}>{displayed}</div>
      <div className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[#6b7280]">{label}</div>
    </div>
  );
}

function PostDonut({ stats }) {
  const rows = [
    { key: "published", label: "Published", color: "#ee0012" },
    { key: "approved", label: "Approved", color: "#111827" },
    { key: "drafts", label: "Drafts", color: "#f87171" },
    { key: "failed", label: "Failed", color: "#d1d5db" },
  ];
  const total = stats.total || 0;
  const R = 34;
  const C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="relative hidden h-24 w-24 shrink-0 sm:block">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="#ececec" strokeWidth="12" />
        {total > 0 &&
          rows.map((row, i) => {
            const val = Number(stats[row.key] || 0);
            const len = (val / total) * C;
            const seg = (
              <circle
                key={row.key}
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke={row.color}
                strokeWidth="12"
                strokeDashoffset={-acc}
                style={{
                  strokeDasharray: `${Math.max(0, len - 1.5)}px ${C}px`,
                  transition: `stroke-dasharray 900ms cubic-bezier(.2,.8,.2,1) ${i * 100}ms`,
                }}
              />
            );
            acc += len;
            return seg;
          })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-base font-black leading-none text-[#111]">{total}</p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-[#9ca3af]">Total</p>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ tone = "gray", children }) {
  const tones = {
    red: "bg-[#ee0012] text-white",
    dark: "bg-[#111] text-white",
    gray: "bg-[#f3f4f6] text-[#6b7280]",
  };
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${tones[tone] || tones.gray}`}>{children}</span>;
}

function Panel({ children }) {
  return <div className="rounded-2xl border border-[#ececec] bg-[#fafafa] p-5 text-sm font-semibold text-[#6b7280]">{children}</div>;
}

function LoadingPanel() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#ececec] bg-[#fafafa] p-5 text-sm font-semibold text-[#6b7280]">
      <span className="ai-ring h-2.5 w-2.5 rounded-full bg-[#ee0012]" aria-hidden="true" />
      Loading AI social automation...
    </div>
  );
}

function toLocalInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => `${n}`.padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}