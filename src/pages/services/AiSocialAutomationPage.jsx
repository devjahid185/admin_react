import { useEffect, useState } from "react";
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
  brand_voice: "Bholavashi is a trusted local service app for Bhola. Write clear, warm Bangla copy. Avoid fake claims, medical guarantees, political content, and personal data.",
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
      const payload = settings.openai_api_key?.trim()
        ? { openai_api_key: settings.openai_api_key.trim() }
        : {};
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

  if (loading) return <Panel>Loading AI social automation...</Panel>;

  return (
    <div className="space-y-5">
      {error && <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
        <form onSubmit={saveSettings} className="rounded-[18px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">AI Automation</p>
              <h2 className="mt-1 text-xl font-black text-[#101827]">Credentials & Policy Guardrails</h2>
              <p className="text-sm text-[#64748b]">OpenAI + Facebook Page credentials, encrypted on backend.</p>
            </div>
            <label className="flex items-center gap-2 rounded-[14px] border border-[#dfe6ef] bg-[#f8fafc] px-3 py-2 text-sm font-bold">
              <input type="checkbox" checked={settings.is_enabled} onChange={(e) => update("is_enabled", e.target.checked)} />
              Enabled
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input label={`OpenAI API Key ${meta?.openai_api_key_masked ? `(${meta.openai_api_key_masked})` : ""}`} type="password" value={settings.openai_api_key} onChange={(e) => update("openai_api_key", e.target.value)} placeholder={meta?.has_openai_api_key ? "Leave blank to keep saved key" : "sk-..."} />
            <div className="md:col-span-2 rounded-[16px] border border-[#dfe6ef] bg-[#f8fafc] p-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-black text-[#101827]">OpenAI model list</p>
                  <p className="text-xs font-semibold text-[#64748b]">
                    {openAiModels.length
                      ? `${openAiModels.length} models loaded${modelsFetchedAt ? ` at ${modelsFetchedAt}` : ""}`
                      : "Load models from your OpenAI account, then select from dropdowns."}
                  </p>
                </div>
                <Button type="button" variant="ghost" onClick={() => loadOpenAiModels()} disabled={busy === "models"}>
                  {busy === "models" ? "Loading models..." : "Refresh models"}
                </Button>
              </div>
            </div>
            <OpenAiModelSelect
              label="Text model"
              value={settings.openai_text_model}
              models={openAiModels}
              preferredKind="text"
              onChange={(value) => update("openai_text_model", value)}
            />
            <OpenAiModelSelect
              label="Image model"
              value={settings.openai_image_model}
              models={openAiModels}
              preferredKind="image"
              onChange={(value) => update("openai_image_model", value)}
            />
            <Input label="Facebook Graph version" value={settings.facebook_api_version} onChange={(e) => update("facebook_api_version", e.target.value)} />
            <Input label="Facebook Page ID" value={settings.facebook_page_id || ""} onChange={(e) => update("facebook_page_id", e.target.value)} />
            <Input label={`Page Access Token ${meta?.facebook_page_access_token_masked ? `(${meta.facebook_page_access_token_masked})` : ""}`} type="password" value={settings.facebook_page_access_token} onChange={(e) => update("facebook_page_access_token", e.target.value)} placeholder={meta?.has_facebook_page_access_token ? "Leave blank to keep saved token" : "EAAG..."} />
            <Input label="Webhook verify token" value={settings.facebook_webhook_verify_token || ""} onChange={(e) => update("facebook_webhook_verify_token", e.target.value)} />
            <div className="md:col-span-2 rounded-[16px] border border-[#dfe6ef] bg-[#f8fafc] p-3 text-sm">
              <div className="font-black text-[#101827]">Webhook callback URL</div>
              <div className="mt-1 break-all font-semibold text-[#64748b]">{meta?.webhook_callback_url || "Save settings to generate callback URL"}</div>
            </div>
            <Toggle label="Comment automation" checked={settings.comment_automation_enabled} onChange={(value) => update("comment_automation_enabled", value)} />
            <Toggle label="Require review before reply" checked={settings.comment_require_review} onChange={(value) => update("comment_require_review", value)} />
            <Toggle label="Auto public reply" checked={settings.auto_public_reply_enabled} onChange={(value) => update("auto_public_reply_enabled", value)} />
            <Toggle label="Auto private reply" checked={settings.auto_private_reply_enabled} onChange={(value) => update("auto_private_reply_enabled", value)} />
            <Toggle label="AI comment reply" checked={settings.ai_comment_reply_enabled} onChange={(value) => update("ai_comment_reply_enabled", value)} />
            <Input label="Default tone" value={settings.default_tone} onChange={(e) => update("default_tone", e.target.value)} />
            <Input label="Daily post limit" type="number" value={settings.daily_post_limit} onChange={(e) => update("daily_post_limit", Number(e.target.value))} />
            <label className="md:col-span-2 text-sm font-medium text-[#24324a]">
              Brand voice & AI safety instruction
              <textarea className="mt-1 min-h-28 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-500/10" value={settings.brand_voice || ""} onChange={(e) => update("brand_voice", e.target.value)} />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => test("openai")} disabled={busy === "openai"}>{busy === "openai" ? "Checking..." : "Check OpenAI"}</Button>
            <Button type="button" variant="ghost" onClick={() => test("facebook")} disabled={busy === "facebook"}>{busy === "facebook" ? "Checking..." : "Check Facebook"}</Button>
            <Button disabled={busy === "save"}>{busy === "save" ? "Saving..." : "Save settings"}</Button>
          </div>
        </form>

        <div className="rounded-[18px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-[#101827]">DB Source Generator</h2>
          <p className="mt-1 text-sm text-[#64748b]">AI only receives public marketing-safe data from Bholavashi database.</p>
          <div className="mt-4 grid gap-3">
            <label className="text-sm font-bold text-[#24324a]">
              Source type
              <select className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm" value={sourceType} onChange={async (e) => { setSourceType(e.target.value); await loadSources(e.target.value); }}>
                {sourceTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold text-[#24324a]">
              Source
              <select className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm" value={selectedSource ? `${selectedSource.source_type}:${selectedSource.source_id}` : ""} onChange={(e) => setSelectedSource(sources.find((source) => `${source.source_type}:${source.source_id}` === e.target.value))}>
                {sources.map((source) => <option key={`${source.source_type}:${source.source_id}`} value={`${source.source_type}:${source.source_id}`}>{source.title} {source.subtitle ? `- ${source.subtitle}` : ""}</option>)}
              </select>
            </label>
            {selectedSource && <pre className="max-h-44 overflow-auto rounded-[14px] bg-[#0f172a] p-3 text-xs text-white">{JSON.stringify(selectedSource.snapshot, null, 2)}</pre>}
            <Input label="Schedule time (optional)" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            <label className="flex items-center gap-2 text-sm font-bold text-[#24324a]">
              <input type="checkbox" checked={generateImage} onChange={(e) => setGenerateImage(e.target.checked)} />
              Generate image immediately
            </label>
            <Button type="button" onClick={generate} disabled={busy === "generate" || !selectedSource}>{busy === "generate" ? "Generating..." : "Generate AI Draft"}</Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-[18px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-[#101827]">Drafts & Schedule Queue</h2>
          <p className="text-sm text-[#64748b]">Edit, approve, generate image, or publish manually.</p>
        </div>
        <Button variant="ghost" onClick={publishDue} disabled={busy === "publish-due"}>{busy === "publish-due" ? "Publishing..." : "Publish Due"}</Button>
      </div>

      <div className="grid gap-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} busy={busy} onSave={savePost} onAction={action} />
        ))}
        {!posts.length && <Panel>No AI social posts yet.</Panel>}
      </div>

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
  );
}

function defaultRule() {
  return {
    is_active: true,
    keyword: "",
    public_reply: "ধন্যবাদ {name}, বিস্তারিত ইনবক্সে পাঠানো হলো।",
    private_reply: "ভোলাবাসী থেকে শুভেচ্ছা। আপনার কমেন্টের বিষয়ে বিস্তারিত জানতে এই মেসেজে রিপ্লাই করুন।",
    ai_enabled: false,
    auto_public_reply: true,
    auto_private_reply: false,
    sort_order: 0,
  };
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 rounded-[14px] border border-[#dfe6ef] bg-white px-3 py-2 text-sm font-bold text-[#24324a]">
      <input type="checkbox" checked={!!checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
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
    <label className="block text-sm font-semibold text-[#24324a]">
      {label}
      <select
        className="mt-1.5 w-full rounded-[14px] border border-[#dfe6ef] bg-white px-3.5 py-2.5 text-sm text-[#0f172a] shadow-sm outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-500/10"
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
      >
        {!options.length && <option value="">Refresh models first</option>}
        {options.map((model) => (
          <option key={`${label}-${model.id}`} value={model.id}>
            {model.id}{model.kind ? ` (${model.kind})` : ""}{model.owned_by ? ` - ${model.owned_by}` : ""}
          </option>
        ))}
      </select>
      <span className="mt-1 block text-xs font-semibold text-[#64748b]">
        {models.length ? "Dropdown is loaded from OpenAI for the saved/typed API key." : "Use Refresh models after adding an OpenAI API key."}
      </span>
    </label>
  );
}

function CommentAutomationPanel({ rules, comments, draft, setDraft, onSaveRule, onDeleteRule, onSendReply, busy }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[0.85fr,1.15fr]">
      <form onSubmit={onSaveRule} className="rounded-[18px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Comment CRM</p>
          <h2 className="mt-1 text-xl font-black text-[#101827]">Keyword Reply Rules</h2>
          <p className="text-sm text-[#64748b]">Matched comments can receive public replies and one private Messenger reply if Meta allows it.</p>
        </div>
        <div className="grid gap-3">
          <Toggle label="Rule active" checked={draft.is_active} onChange={(value) => setDraft((prev) => ({ ...prev, is_active: value }))} />
          <Input label="Keyword/tag" value={draft.keyword} onChange={(e) => setDraft((prev) => ({ ...prev, keyword: e.target.value }))} placeholder="price, inbox, menu" />
          <label className="text-sm font-semibold text-[#24324a]">
            Public comment reply
            <textarea className="mt-1.5 min-h-24 w-full rounded-[14px] border border-[#dfe6ef] px-3.5 py-2.5 text-sm" value={draft.public_reply || ""} onChange={(e) => setDraft((prev) => ({ ...prev, public_reply: e.target.value }))} />
          </label>
          <label className="text-sm font-semibold text-[#24324a]">
            Private inbox reply
            <textarea className="mt-1.5 min-h-24 w-full rounded-[14px] border border-[#dfe6ef] px-3.5 py-2.5 text-sm" value={draft.private_reply || ""} onChange={(e) => setDraft((prev) => ({ ...prev, private_reply: e.target.value }))} />
          </label>
          <div className="grid gap-2 md:grid-cols-2">
            <Toggle label="AI rewrite" checked={draft.ai_enabled} onChange={(value) => setDraft((prev) => ({ ...prev, ai_enabled: value }))} />
            <Toggle label="Public enabled" checked={draft.auto_public_reply} onChange={(value) => setDraft((prev) => ({ ...prev, auto_public_reply: value }))} />
            <Toggle label="Private enabled" checked={draft.auto_private_reply} onChange={(value) => setDraft((prev) => ({ ...prev, auto_private_reply: value }))} />
            <Input label="Sort" type="number" value={draft.sort_order || 0} onChange={(e) => setDraft((prev) => ({ ...prev, sort_order: Number(e.target.value) }))} />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {draft.id && <Button type="button" variant="ghost" onClick={() => setDraft(defaultRule())}>New rule</Button>}
            <Button disabled={busy === "rule"}>{busy === "rule" ? "Saving..." : "Save rule"}</Button>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {rules.map((rule) => (
            <div key={rule.id} className="rounded-[14px] border border-[#dfe6ef] bg-[#f8fafc] p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-black text-[#101827]">{rule.keyword}</div>
                  <div className="text-xs font-semibold text-[#64748b]">{rule.is_active ? "Active" : "Off"} • public {rule.auto_public_reply ? "on" : "off"} • private {rule.auto_private_reply ? "on" : "off"}</div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setDraft(rule)}>Edit</Button>
                  <Button type="button" variant="ghost" onClick={() => onDeleteRule(rule)} disabled={busy === `delete-rule-${rule.id}`}>Delete</Button>
                </div>
              </div>
            </div>
          ))}
          {!rules.length && <div className="rounded-[14px] bg-[#f8fafc] p-4 text-sm font-semibold text-[#64748b]">No comment rules yet.</div>}
        </div>
      </form>

      <div className="rounded-[18px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-black text-[#101827]">Facebook Comment Inbox</h2>
          <p className="text-sm text-[#64748b]">Webhook comments, matched keywords, reply status and manual actions.</p>
        </div>
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} busy={busy} onSendReply={onSendReply} />
          ))}
          {!comments.length && <Panel>No Facebook comments received yet.</Panel>}
        </div>
      </div>
    </div>
  );
}

function CommentCard({ comment, busy, onSendReply }) {
  const [publicReply, setPublicReply] = useState(comment.public_reply_text || "");
  const [privateReply, setPrivateReply] = useState(comment.private_reply_text || "");

  useEffect(() => {
    setPublicReply(comment.public_reply_text || "");
    setPrivateReply(comment.private_reply_text || "");
  }, [comment.id, comment.public_reply_text, comment.private_reply_text]);

  return (
    <div className="rounded-[16px] border border-[#dfe6ef] bg-[#f8fafc] p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="font-black text-[#101827]">{comment.sender_name || "Facebook user"}</div>
          <div className="text-xs font-semibold text-[#64748b]">{comment.comment_id} • {comment.status} {comment.matched_keyword ? `• ${comment.matched_keyword}` : ""}</div>
        </div>
        <div className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-[#64748b]">
          {comment.public_replied_at ? "public sent" : "public pending"} / {comment.private_replied_at ? "private sent" : "private pending"}
        </div>
      </div>
      <p className="mt-3 rounded-[12px] bg-white p-3 text-sm font-semibold text-[#24324a]">{comment.message || "No comment text"}</p>
      {comment.last_error && <div className="mt-3 rounded-[12px] bg-red-50 p-3 text-xs font-bold text-red-700 whitespace-pre-wrap">{comment.last_error}</div>}
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="text-sm font-semibold text-[#24324a]">
          Public reply
          <textarea className="mt-1.5 min-h-20 w-full rounded-[14px] border border-[#dfe6ef] bg-white px-3 py-2 text-sm" value={publicReply} onChange={(e) => setPublicReply(e.target.value)} />
        </label>
        <label className="text-sm font-semibold text-[#24324a]">
          Private reply
          <textarea className="mt-1.5 min-h-20 w-full rounded-[14px] border border-[#dfe6ef] bg-white px-3 py-2 text-sm" value={privateReply} onChange={(e) => setPrivateReply(e.target.value)} />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" disabled={busy === `comment-${comment.id}`} onClick={() => onSendReply(comment, { public_reply_text: publicReply, private_reply_text: privateReply, send_public: true, send_private: false })}>Send public</Button>
        <Button type="button" variant="ghost" disabled={busy === `comment-${comment.id}`} onClick={() => onSendReply(comment, { public_reply_text: publicReply, private_reply_text: privateReply, send_public: false, send_private: true })}>Send private</Button>
        <Button type="button" disabled={busy === `comment-${comment.id}`} onClick={() => onSendReply(comment, { public_reply_text: publicReply, private_reply_text: privateReply, send_public: true, send_private: true })}>Send both</Button>
      </div>
    </div>
  );
}

function PostCard({ post, busy, onSave, onAction }) {
  const [caption, setCaption] = useState(post.caption || "");
  const [imagePrompt, setImagePrompt] = useState(post.image_prompt || "");
  const [scheduledAt, setScheduledAt] = useState(toLocalInput(post.scheduled_at));

  useEffect(() => {
    setCaption(post.caption || "");
    setImagePrompt(post.image_prompt || "");
    setScheduledAt(toLocalInput(post.scheduled_at));
  }, [post.id, post.caption, post.image_prompt, post.scheduled_at]);

  return (
    <div className="grid gap-4 rounded-[18px] border border-[#dfe6ef] bg-white p-5 shadow-sm lg:grid-cols-[180px,1fr]">
      <div>
        {post.image_url ? <img src={post.image_url} alt="" className="aspect-square w-full rounded-[16px] object-cover" /> : <div className="grid aspect-square place-items-center rounded-[16px] bg-[#f8fafc] text-sm font-bold text-[#64748b]">No image</div>}
        <div className="mt-3 rounded-[999px] bg-[#f8fafc] px-3 py-1 text-center text-xs font-black uppercase tracking-wide text-[#53637a]">{post.status}</div>
      </div>
      <div className="space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-lg font-black text-[#101827]">{post.topic || "AI post"}</h3>
            <p className="text-xs text-[#64748b]">{post.source_type} #{post.source_id || "-"} {post.platform_post_id ? `• ${post.platform_post_id}` : ""}</p>
          </div>
          {post.failure_message && <div className="rounded-[12px] bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{post.failure_message}</div>}
        </div>
        <textarea className="min-h-36 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm" value={caption} onChange={(e) => setCaption(e.target.value)} />
        <textarea className="min-h-20 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-xs text-[#53637a]" value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} />
        <div className="flex flex-wrap items-center gap-2">
          <input className="rounded-[12px] border border-[#dfe6ef] px-3 py-2 text-sm" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          <Button variant="ghost" type="button" onClick={() => onSave(post, { caption, image_prompt: imagePrompt, scheduled_at: scheduledAt || null })}>Save</Button>
          <Button variant="ghost" type="button" onClick={() => onAction(post, "image")} disabled={busy === `image-${post.id}`}>Image</Button>
          <Button variant="ghost" type="button" onClick={() => onAction(post, "approve")} disabled={busy === `approve-${post.id}`}>Approve</Button>
          <Button type="button" onClick={() => onAction(post, "publish")} disabled={busy === `publish-${post.id}`}>Publish now</Button>
        </div>
      </div>
    </div>
  );
}

function Panel({ children }) {
  return <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-6 text-sm text-[#64748b] shadow-sm">{children}</div>;
}

function toLocalInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => `${n}`.padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
