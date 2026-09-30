/* Website dialog behavior only. Apps Script and analytics contracts stay separate. */
(() => {
    const about = document.getElementById('about-overlay');
    const portal = document.getElementById('portal-overlay');
    const frame = document.getElementById('portal-frame');
    const openers = new WeakMap();
    const previousOverflow = new WeakMap();

    function openDialog(dialog, trigger) {
        if (!dialog || dialog.open) return;
        openers.set(dialog, trigger);
        previousOverflow.set(dialog, document.body.style.overflow);
        document.body.style.overflow = 'hidden';
        dialog.classList.add('active');
        // Native modal dialogs make the background inert, including to keyboard focus.
        dialog.showModal();
        dialog.querySelector('.close-btn')?.focus({ preventScroll: true });
    }

    function restorePage(dialog) {
        if (!previousOverflow.has(dialog)) return;
        dialog.classList.remove('active');
        document.body.style.overflow = previousOverflow.get(dialog);
        previousOverflow.delete(dialog);
        openers.get(dialog)?.focus({ preventScroll: true });
    }

    function closeDialog(dialog) {
        if (!dialog?.open) return;
        dialog.close();
        restorePage(dialog);
    }

    for (const dialog of [about, portal].filter(Boolean)) {
        dialog.querySelector('.close-btn')?.setAttribute('aria-label',
            dialog === about ? 'Close About' : 'Close project portal');
        dialog.querySelectorAll('.close-btn, [data-close-dialog]').forEach(button => {
            button.addEventListener('click', () => closeDialog(dialog));
        });
        dialog.addEventListener('cancel', (event) => {
            event.preventDefault();
            closeDialog(dialog);
        });
        dialog.addEventListener('click', (event) => {
            if (event.target === dialog) closeDialog(dialog);
        });
        dialog.addEventListener('close', () => restorePage(dialog));
        dialog.addEventListener('keydown', (event) => {
            if (event.key !== 'Tab') return;
            const controls = [...dialog.querySelectorAll('button, a[href], input, select, textarea, iframe, [tabindex]')]
                .filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length);
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault(); last?.focus();
            } else if (!event.shiftKey && document.activeElement === last && last?.tagName !== 'IFRAME') {
                event.preventDefault(); first?.focus();
            }
            // Leave iframe-internal traversal to the browser's native modal focus scope.
        });
    }

    document.getElementById('open-about')?.addEventListener('click', event => openDialog(about, event.currentTarget));
    const portalTriggers = ['open-portal', 'open-portal-nav', 'open-portal-final',
        'open-portal-services', 'open-portal-pricing', 'open-portal-work', 'open-portal-case'];
    for (const id of portalTriggers) {
        document.getElementById(id)?.addEventListener('click', event => {
            if (!portal || !frame) return;
            // Preserve lazy initialization and the existing loaded iframe state on reopen.
            if (frame.src === 'about:blank' || frame.src === '') {
                frame.src = portal.dataset.portalUrl || frame.dataset.src || '';
            }
            openDialog(portal, event.currentTarget);
        });
    }

    // Native details navigation: support Escape and focus return without custom menu roles.
    document.querySelectorAll('.services-menu').forEach(menu => {
        menu.addEventListener('keydown', event => {
            if (event.key === 'Escape' && menu.open) {
                menu.open = false;
                menu.querySelector('summary')?.focus();
            }
        });
    });

    const toggle = document.querySelector('.menu-toggle');
    const nav = document.getElementById('site-nav');
    if (toggle && nav) {
        toggle.hidden = false;
        const narrow = matchMedia('(max-width: 760px)');
        function closeNav() { toggle.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); }
        toggle.addEventListener('click', () => {
            const open = toggle.getAttribute('aria-expanded') !== 'true';
            toggle.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open);
        });
        nav.addEventListener('keydown', event => { if (event.key === 'Escape') { closeNav(); toggle.focus(); } });
        nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNav));
        narrow.addEventListener('change', closeNav);
        document.documentElement.classList.add('js');
    }
})();
