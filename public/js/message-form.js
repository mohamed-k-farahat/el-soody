/* =========================================================
   بن السعودي: contact, issues and suggestions forms
   ========================================================= */
(function () {
  'use strict';

  const t = (k) => window.SOODY.t(k);
  const lang = window.SOODY.lang;

  document.querySelectorAll('.msgform').forEach((form) => {
    const kind = form.dataset.kind;
    const optional = kind === 'suggestion';
    const started = Date.now();
    const field = (name) => form.elements[name];
    const btn = form.querySelector('button[type="submit"]');
    const formErr = form.querySelector('.form-err');
    const done = form.querySelector('.msgform__done');

    function setError(name, message) {
      const input = field(name);
      const box = form.querySelector(`[data-err="${name}"]`);
      if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (box) box.textContent = message || '';
    }

    function validate() {
      const name = field('name').value.trim();
      const phone = field('phone').value.replace(/[^\d٠-٩+]/g, '');
      const message = field('message').value.trim();
      setError('name', !optional && name.length < 2 ? t('form.err.name') : '');
      setError('phone', (!optional || phone) && phone.length < 10 ? t('form.err.phone') : '');
      setError('message', message.length < 10 ? t('form.err.message') : '');
      const bad = ['name', 'phone', 'message'].find((n) => field(n).getAttribute('aria-invalid') === 'true');
      if (bad) field(bad).focus();
      return !bad;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      formErr.textContent = '';
      if (!validate()) return;
      btn.disabled = true;
      btn.textContent = t('form.sending');
      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            kind, lang, started,
            name: field('name').value,
            phone: field('phone').value,
            order: field('order')?.value || '',
            branch: field('branch')?.value || '',
            message: field('message').value,
            website: field('website').value,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          form.querySelector('.msgform__fields').hidden = true;
          form.querySelector('.msgform__foot').hidden = true;
          done.hidden = false;
          done.querySelector('p').focus?.();
        } else if (data.field) {
          setError(data.field, t(`form.err.${data.error}`));
          field(data.field).focus();
        } else {
          formErr.textContent = t(data.error === 'tooMany' ? 'form.err.tooMany' : 'form.err.generic');
        }
      } catch {
        formErr.textContent = t('form.err.generic');
      }
      btn.disabled = false;
      btn.textContent = t('form.send');
    });

    form.querySelector('[data-again]').addEventListener('click', () => {
      form.reset();
      done.hidden = true;
      form.querySelector('.msgform__fields').hidden = false;
      form.querySelector('.msgform__foot').hidden = false;
      field('message').focus();
    });
  });
})();
