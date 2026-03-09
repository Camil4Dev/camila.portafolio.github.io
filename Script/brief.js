(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const briefForm = document.getElementById('brief-form');
    if (!briefForm) return;

    const root = document.documentElement;
    const status = document.getElementById('brief-status');
    const copyBtn = document.getElementById('brief-copy');
    const summaryBox = document.getElementById('brief-summary-box');
    const summaryPre = document.getElementById('brief-summary');

    const uiText = {
      es: {
        blocked: 'Solicitud bloqueada.',
        complete: 'Completá todos los campos.',
        openingGmail: 'Abriendo borrador en Gmail...',
        openingMail: 'Abriendo tu app de correo...',
        fallbackMail: 'Gmail no se pudo abrir. Te redirijo a tu app de correo.',
        copied: 'Resumen copiado al portapapeles.',
        copyError: 'No pude copiar automaticamente. Copialo manualmente.',
        copyFirst: 'Primero completá el brief para generar el resumen.',
        name: 'Nombre',
        type: 'Tipo',
        budget: 'Presupuesto',
        channel: 'Canal preferido',
        goal: 'Objetivo'
      },
      en: {
        blocked: 'Request blocked.',
        complete: 'Please complete all fields.',
        openingGmail: 'Opening Gmail draft...',
        openingMail: 'Opening your email app...',
        fallbackMail: 'Gmail could not be opened. Redirecting to your email app.',
        copied: 'Summary copied to clipboard.',
        copyError: 'Could not copy automatically. Please copy it manually.',
        copyFirst: 'Complete the brief first to generate the summary.',
        name: 'Name',
        type: 'Type',
        budget: 'Budget',
        channel: 'Preferred channel',
        goal: 'Goal'
      }
    };

    const getUiText = () => (root.lang === 'en' ? uiText.en : uiText.es);

    const setStatus = (text, isError) => {
      if (!status) return;
      status.textContent = text;
      status.style.color = isError ? '#fda4af' : 'rgba(255, 255, 255, 0.82)';
    };

    const buildBriefSummary = (payload) => {
      const t = getUiText();
      return `${t.name}: ${payload.name}\n${t.type}: ${payload.type}\n${t.budget}: ${payload.budget}\n${t.channel}: ${payload.channel}\n\n${t.goal}:\n${payload.message}`;
    };

    const shouldPreferGmail = () => {
      const ua = navigator.userAgent || '';
      const vendor = navigator.vendor || '';
      const isGoogleVendor = /Google/i.test(vendor);
      const isChromiumFamily = /(Chrome|Chromium|Edg|OPR|CriOS|Android)/i.test(ua);
      return isGoogleVendor || isChromiumFamily;
    };

    const openEmailDraft = (subject, body) => {
      const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&to=c.carpincho.gaucho@gmail.com&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      const mailtoHref = `mailto:c.carpincho.gaucho@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      const t = getUiText();

      const openMailto = (message) => {
        setStatus(message || t.openingMail, false);
        window.location.href = mailtoHref;
      };

      if (!shouldPreferGmail()) {
        openMailto(t.openingMail);
        return;
      }

      setStatus(t.openingGmail, false);
      let draftWindow = null;
      try {
        draftWindow = window.open(gmailHref, '_blank', 'noopener,noreferrer');
      } catch (error) {
        draftWindow = null;
      }

      if (!draftWindow) {
        openMailto(t.fallbackMail);
        return;
      }

      setTimeout(() => {
        try {
          if (draftWindow.closed) return;
          const href = draftWindow.location && draftWindow.location.href;
          if (href === 'about:blank') {
            try { draftWindow.close(); } catch (error) { }
            openMailto(t.fallbackMail);
          }
        } catch (error) {
          // Cross-origin means Gmail is loaded correctly.
        }
      }, 1000);
    };

    const updateSummary = (summary) => {
      if (summaryPre) summaryPre.textContent = summary;
      if (summaryBox) summaryBox.classList.remove('hidden');
    };

    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const t = getUiText();
        const summary = summaryPre ? summaryPre.textContent.trim() : '';
        if (!summary) {
          setStatus(t.copyFirst, true);
          return;
        }

        try {
          await navigator.clipboard.writeText(summary);
          setStatus(t.copied, false);
        } catch (error) {
          setStatus(t.copyError, true);
        }
      });
    }

    briefForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(briefForm);
      const honeypot = (formData.get('website') || '').toString().trim();
      if (honeypot) {
        setStatus(getUiText().blocked, true);
        return;
      }

      const payload = {
        name: (formData.get('name') || '').toString().trim(),
        type: (formData.get('type') || '').toString().trim(),
        budget: (formData.get('budget') || '').toString().trim(),
        channel: (formData.get('channel') || '').toString().trim(),
        message: (formData.get('message') || '').toString().trim()
      };

      if (!payload.name || !payload.type || !payload.budget || !payload.channel || !payload.message) {
        setStatus(getUiText().complete, true);
        return;
      }

      const summary = buildBriefSummary(payload);
      updateSummary(summary);

      const subject = root.lang === 'en'
        ? `New project from camila.dev - ${payload.type}`
        : `Nuevo proyecto desde camila.dev - ${payload.type}`;

      openEmailDraft(subject, summary);
    });
  });
})();
