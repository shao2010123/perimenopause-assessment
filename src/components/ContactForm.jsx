import { getRequiredPhoneError } from '../utils/contactValidation.js';

function ContactForm({ userInfo, onChange, children }) {
  const phoneError = getRequiredPhoneError(userInfo.phone);

  return (
    <section className="surface-card space-y-5">
      <div className="space-y-2">
        <span className="soft-pill">保存您的报告</span>
        <h3 className="text-2xl font-semibold text-[var(--color-text-primary)]">填写报告署名信息</h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          填写以下信息，姓名和手机号会印在 HTML 报告上，方便您就诊时出示给医生。微信/邮箱可以留空。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-shell">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">姓名</span>
          <input
            type="text"
            value={userInfo.name ?? ''}
            onChange={(event) => onChange('name', event.target.value)}
            className="field-input"
            placeholder="请输入姓名"
          />
        </label>

        <label className="field-shell">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            手机号 <span className="text-[var(--color-accent-coral)]">必填</span>
          </span>
          <input
            type="tel"
            inputMode="tel"
            required
            maxLength={11}
            aria-invalid={Boolean(phoneError)}
            value={userInfo.phone ?? ''}
            onChange={(event) => onChange('phone', event.target.value)}
            className="field-input"
            placeholder="请输入手机号"
          />
          {phoneError ? (
            <span className="text-xs leading-5 text-[var(--color-accent-coral)]">
              {phoneError}
            </span>
          ) : null}
        </label>

        <label className="field-shell md:col-span-2">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            微信或邮箱 <span className="text-[var(--color-text-muted)]">选填</span>
          </span>
          <input
            type="text"
            value={userInfo.contact ?? ''}
            onChange={(event) => onChange('contact', event.target.value)}
            className="field-input"
            placeholder="请输入微信号或邮箱"
          />
        </label>
      </div>

      <label className="inline-flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
        <input
          type="checkbox"
          checked={userInfo.consentMarketing ?? true}
          onChange={(event) => onChange('consentMarketing', event.target.checked)}
          className="h-4 w-4 accent-[var(--color-primary-start)]"
        />
        <span>我希望收到后续的健康资讯和复测提醒</span>
      </label>

      <div className="space-y-3">
        {children}
        <p className="text-xs leading-6 text-[var(--color-text-secondary)]">
          您的信息仅用于报告标识和后续服务，不会用于任何商业推广。
        </p>
      </div>
    </section>
  );
}

export default ContactForm;
