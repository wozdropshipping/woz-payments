// (Removed) Hero background animation per user request.
document.addEventListener('DOMContentLoaded', function() {
	// Función para el Acordeón (FAQ)
	const faqItems = document.querySelectorAll('.faq-item');

	faqItems.forEach(item => {
		const question = item.querySelector('.faq-question');
		question.addEventListener('click', () => {
			// Cierra todas las otras respuestas
			faqItems.forEach(otherItem => {
				if (otherItem !== item && otherItem.classList.contains('active')) {
					otherItem.classList.remove('active');
				}
			});

			// Alterna la clase 'active' para abrir/cerrar el ítem actual
			item.classList.toggle('active');
		});
	});

	// --- Plan choose -> QR modal logic ---
	(function(){
		function formatGsLocal(n){
			const rounded = Math.round(Number(n) || 0);
			return 'Gs. ' + String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
		}

		const chooseBtns = document.querySelectorAll('.choose-plan');
		const modal = document.getElementById('planPayModal');
		const ppmClose = document.getElementById('ppmClose');
		const ppmPlanName = document.getElementById('ppmPlanName');
		const ppmAmount = document.getElementById('ppmAmount');
		const bankAccs = Array.from(document.querySelectorAll('.bank-item'));
		const ppmAlias = null; // alias input removed; kept for compatibility
		const ppmCopy = document.getElementById('ppmCopyAlias');
		const ppmTitle = document.getElementById('ppmTitle');
		const infoAliasVal = document.getElementById('infoAliasVal');
		const infoBancoVal = document.getElementById('infoBancoVal');
		const infoMontoVal = document.getElementById('infoMontoVal');
		const aliasLabel = document.querySelector('.ppm-info-left .alias-label');
        const bancoLabel = document.querySelectorAll('.ppm-info-left .ppm-info-row')[2];
		const bankSelector = document.querySelector('.bank-selector');
		const bankSelectorHeader = document.querySelector('.bank-selector-header');
		const infoVisual = document.getElementById('infoVisual');
		const ppmQR = document.getElementById('ppmQR');
		const ppmSend = document.getElementById('ppmSendReceipt');

		let current = { plan:'', amount:0, bank:'Ueno Bank', alias:'4920791', color:'#0a7d3b' };

		// Calcula el total para métodos de billetera: +5.5% de comisión y 10% sobre esa comisión (IVA)
		function computeWalletTotal(amount){
			const commission = Math.round(amount * 0.055);
			const iva = Math.round(commission * 0.10);
			return amount + commission + iva;
		}

		function openModalWith(plan, amount, walletMethod){
			current.plan = plan;
			current.amount = Number(amount) || 0;
			current.walletMethod = walletMethod || null;
			const defaultBankBtn = document.getElementById('bankUeno');
			// Only select default bank when not opening modal for a wallet method
			if (!current.walletMethod) selectBank(defaultBankBtn);
			if (ppmPlanName) ppmPlanName.textContent = plan;

			// If opening for a wallet, show the inflated total
			const displayAmount = (current.walletMethod === 'personalpay' || current.walletMethod === 'tigomoney')
				? computeWalletTotal(current.amount)
				: current.amount;

			if (ppmAmount) ppmAmount.textContent = formatGsLocal(displayAmount);
			// adjust UI when opening modal for wallet methods
			if (current.walletMethod === 'personalpay' || current.walletMethod === 'tigomoney') {
				if (bankSelector) bankSelector.style.display = 'none';
				if (aliasLabel) {
					if (current.walletMethod === 'personalpay') aliasLabel.textContent = 'Linea Personal Pay';
					else aliasLabel.textContent = 'Linea Tigo';
				}
				if (bancoLabel) bancoLabel.textContent = 'Telefonia';
				if (infoAliasVal) infoAliasVal.textContent = (current.walletMethod === 'personalpay') ? '0974 141073' : '0984261043';
				if (infoBancoVal) infoBancoVal.textContent = (current.walletMethod === 'personalpay') ? 'Personal' : 'Tigo Paraguay';
				if (infoMontoVal) infoMontoVal.textContent = formatGsLocal(displayAmount);
				if (ppmTitle) ppmTitle.textContent = (current.walletMethod === 'personalpay') ? 'Pago por Personal Pay' : 'Pago por Tigo Money';
				if (infoVisual) infoVisual.innerHTML = '';
			} else {
				if (bankSelector) bankSelector.style.display = '';
				if (aliasLabel) aliasLabel.textContent = `Alias ${current.bank}`;
				if (bancoLabel) bancoLabel.textContent = 'Banco';
				if (infoAliasVal) infoAliasVal.textContent = current.alias || (current.bank === 'Eko' ? 'QR - Eko' : '-');
				if (infoBancoVal) infoBancoVal.textContent = current.bank;
				if (infoMontoVal) infoMontoVal.textContent = formatGsLocal(current.amount);
				if (ppmTitle) ppmTitle.textContent = 'Pago de membresía';
			}

			modal?.classList.add('active');
			renderQR();
		}

		function closeModal(){ modal?.classList.remove('active'); }

		function selectBank(btn){
			if (!btn) return;
			// collapse others
			bankAccs.forEach(b => b.classList.remove('selected'));
			btn.classList.add('selected');

			current.bank = btn.getAttribute('data-bank') || current.bank;
			current.alias = btn.getAttribute('data-alias') || '';
			current.color = btn.getAttribute('data-color') || current.color;

			// update info fields
			if (infoAliasVal) infoAliasVal.textContent = current.alias || (current.bank === 'Eko' ? 'QR - Eko' : '-');
			if (infoBancoVal) infoBancoVal.textContent = current.bank;
			if (infoMontoVal) infoMontoVal.textContent = formatGsLocal(current.amount);
			if (aliasLabel) {
				if (current.bank === 'Eko') aliasLabel.textContent = 'QR - Eko';
				else aliasLabel.textContent = `Alias ${current.bank}`;
			}

			// update visual area: show Eko image only inside infoVisual
			if (infoVisual) {
				infoVisual.innerHTML = '';
				if (current.bank === 'Eko') {
					const img = document.getElementById('ppmEkoImg');
					if (img && img.src) infoVisual.appendChild(img.cloneNode(true));
					else infoVisual.textContent = 'QR de Eko (imagen no encontrada)';
				}
			}
		}

		function renderQR(){
			if (!ppmQR) return;
			ppmQR.innerHTML = '';
			// If this modal is being used for wallet methods, show wallet-specific info
			if (current.walletMethod === 'personalpay' || current.walletMethod === 'tigomoney') {
				const displayAmount = computeWalletTotal(current.amount);
				const div = document.createElement('div');
				div.style.fontWeight = '600';
				div.style.whiteSpace = 'pre-wrap';
				div.style.textAlign = 'left';
				if (current.walletMethod === 'personalpay') {
					div.textContent = `Titular: Héctor Gonzalez\nLinea: 0974 141073\nTelefonia: Personal\nMonto: ${formatGsLocal(displayAmount)}`;
				} else {
					div.textContent = `Titular: Héctor Gonzalez\nLinea: 0984261043\nTelefonia: Tigo Paraguay\nMonto: ${formatGsLocal(displayAmount)}`;
				}
				ppmQR.appendChild(div);
				return;
			}

			// If selected bank is Eko, show the provided Eko image (if present) and also the alias label set to QR - Eko
			if (current.bank === 'Eko') {
				const img = document.getElementById('ppmEkoImg');
				if (img && img.src) {
					ppmQR.appendChild(img.cloneNode(true));
				} else {
					const p = document.createElement('div');
					p.textContent = 'QR de Eko (imagen no encontrada)';
					ppmQR.appendChild(p);
				}
				return;
			}


			// For other banks, do not show an image QR — instead show a compact textual block with details
			const infoPre = document.createElement('pre');
			infoPre.style.whiteSpace = 'pre-wrap';
			infoPre.style.textAlign = 'left';
			infoPre.style.fontWeight = '600';
			infoPre.textContent = `Titular: Héctor Gonzalez\nAlias: ${current.alias || '-'}\nBanco: ${current.bank}\nMonto: ${formatGsLocal(current.amount)}`;
			ppmQR.appendChild(infoPre);
		}

		function copyAlias(){
			const text = infoAliasVal ? infoAliasVal.textContent.trim() : '';
			if (!text) return;
			navigator.clipboard?.writeText(text).then(() => {
				if (ppmCopy) { ppmCopy.textContent = 'Copiado'; setTimeout(()=> ppmCopy.textContent = '📋', 1500); }
			}).catch(()=>{ if (ppmCopy) { ppmCopy.textContent = 'Error'; setTimeout(()=> ppmCopy.textContent = '📋', 1500); } });
		}

		function sendReceipt(){
			const phone = '0983994268';
			const msg = encodeURIComponent(`Adjunto comprobante de pago - Plan: ${current.plan} - Banco: ${current.bank} - Monto: ${formatGsLocal(current.amount)} - Alias: ${current.alias}`);
			const url = `https://wa.me/${phone}?text=${msg}`;
			window.open(url, '_blank');
		}

		// Payment methods modal elements and logic (selection, price calc, pay)
		const methodsModal = document.getElementById('paymentMethodsModal');
		const methodsClose = document.getElementById('pmClose');
		const pmCancel = document.getElementById('pmCancel');
		const pmPayBtn = document.getElementById('pmPayBtn');
		const pmTotalEl = methodsModal?.querySelector('.pm-total');
		const pmOptions = Array.from(methodsModal?.querySelectorAll('.pm-option') || []);

		// Totales predeterminados (sin cálculos) para métodos no-transferencia
		const OVERRIDE_TOTALS = {
			250000: 265125,
			600000: 636300,
			1500000: 1590750
		};
		let selectedMethod = null;

		function resetMethodsUI() {
			selectedMethod = null;
			pmOptions.forEach(o => { o.classList.remove('selected'); });
			if (pmTotalEl) pmTotalEl.innerHTML = formatGsLocal(current.amount);
			if (pmPayBtn) { pmPayBtn.disabled = true; pmPayBtn.textContent = 'Pagar'; }
		}

		function openMethodsModal(plan, amount) {
			current.plan = plan;
			current.amount = Number(amount) || 0;
			if (!methodsModal) return;
			// preserve previous focused element to restore focus on close
			methodsModal._previousFocus = document.activeElement;
			// Update total immediately to avoid stale values
			if (pmTotalEl) pmTotalEl.textContent = formatGsLocal(current.amount);
			// reset any previous selection (this will also set button disabled)
			resetMethodsUI();
			// mark as visible for assistive tech and show modal
			methodsModal.setAttribute('aria-hidden', 'false');
			// ensure modal is above other floating elements
			try { methodsModal.style.zIndex = '12000'; } catch(e){}
			methodsModal.classList.add('active');
			// ensure per-option listeners are attached now that modal is visible
			try { attachOptionListeners(); } catch(e){ console.debug('attachOptionListeners call failed', e); }
			// ensure per-option listeners are attached now that modal is visible
			try { attachOptionListeners(); } catch(e){ console.debug('attachOptionListeners call failed', e); }
			// move focus into modal (prefer first option, then close button)
			setTimeout(() => {
				const firstOpt = methodsModal.querySelector('.pm-option[tabindex]');
				if (firstOpt) firstOpt.focus();
				else if (methodsClose) methodsClose.focus();
			}, 10);
		}

		function closeMethodsModal() {
			if (!methodsModal) return;
			methodsModal.classList.remove('active');
			methodsModal.setAttribute('aria-hidden', 'true');
			resetMethodsUI();
			try { if (methodsModal._previousFocus && methodsModal._previousFocus.focus) methodsModal._previousFocus.focus(); } catch(e){}
		}

		// When user clicks a plan, open methods selector first
		chooseBtns.forEach(btn => {
			btn.addEventListener('click', function(e){
				e.preventDefault();
				const plan = btn.getAttribute('data-plan') || 'Plan';
				// Prefer monthly price when the toggle is set to monthly. Fall back to data-amount (annual) otherwise.
				let amount = 0;
				try {
					const card = btn.closest('.pricing-card') || btn.closest('.card-price');
					const monthlyBtn = document.getElementById('payMonthly');
					const isMonthly = monthlyBtn ? (monthlyBtn.getAttribute('aria-pressed') === 'true' || monthlyBtn.classList.contains('active')) : false;
					if (isMonthly && card && card.dataset && card.dataset.monthly) {
						amount = parseInt(String(card.dataset.monthly).replace(/[^0-9]/g,''), 10) || 0;
					} else if (card && card.dataset && card.dataset.annual) {
						amount = parseInt(String(card.dataset.annual).replace(/[^0-9]/g,''), 10) || 0;
					} else {
						const rawAmount = (btn.getAttribute('data-amount') || '0').toString();
						const normalized = rawAmount.replace(/[^0-9]/g, '');
						amount = parseInt(normalized || '0', 10) || 0;
					}
				} catch(err) {
					const rawAmount = (btn.getAttribute('data-amount') || '0').toString();
					const normalized = rawAmount.replace(/[^0-9]/g, '');
					amount = parseInt(normalized || '0', 10) || 0;
				}
				openMethodsModal(plan, amount);
			});
		});

		function updateForMethod(method) {
			if (!methodsModal) return;
			if (!method) { resetMethodsUI(); return; }
			// Decide total to show: transfer -> base, wallets -> computed, others -> override table when available
			let total = current.amount;
			if (method === 'personalpay' || method === 'tigomoney') {
				total = computeWalletTotal(current.amount);
			} else if (method !== 'transfer') {
				const forced = OVERRIDE_TOTALS[String(current.amount)] || OVERRIDE_TOTALS[current.amount];
				if (forced) total = forced;
			}
			if (pmTotalEl) pmTotalEl.innerHTML = formatGsLocal(total);
			if (pmPayBtn) {
				pmPayBtn.disabled = false;
				if (method === 'transfer') {
					pmPayBtn.textContent = 'Ver datos bancarios';
				} else if (method === 'personalpay' || method === 'tigomoney') {
					pmPayBtn.textContent = 'Ver información de pago';
				} else {
					pmPayBtn.textContent = 'Pagar';
				}
			}
			return { total };
		}

		// Option selection: use event delegation on the container for robustness
		const pmOptionsContainer = methodsModal?.querySelector('.pm-options');

		function logPmDiagnostics(){
			try{
				const overlay = methodsModal;
				const cont = overlay?.querySelector('.pm-options');
				const first = cont?.querySelector('.pm-option');
				console.log('PM-DIAG overlay:', overlay);
				console.log('PM-DIAG aria-hidden:', overlay?.getAttribute('aria-hidden'));
				console.log('PM-DIAG inline z-index:', overlay?.style.zIndex);
				console.log('PM-DIAG computed z-index:', overlay ? getComputedStyle(overlay).zIndex : 'n/a');
				console.log('PM-DIAG pm-options container:', cont);
				console.log('PM-DIAG pm-options bbox:', cont ? cont.getBoundingClientRect() : 'n/a');
				console.log('PM-DIAG first option:', first);
				if(first){
					const r = first.getBoundingClientRect();
					console.log('PM-DIAG first bbox:', r);
					console.log('PM-DIAG first pointer-events:', getComputedStyle(first)['pointer-events']);
					const cx = Math.round(r.left + r.width/2);
					const cy = Math.round(r.top + r.height/2);
					console.log('PM-DIAG center coords:', cx, cy);
					console.log('PM-DIAG elementFromPoint:', document.elementFromPoint(cx, cy));
					const evt = new MouseEvent('click', {bubbles:true, cancelable:true, view:window});
					const dispatched = first.dispatchEvent(evt);
					console.log('PM-DIAG synthetic click dispatched on first option:', dispatched);
				}
				console.log('PM-DIAG selected count:', document.querySelectorAll('.pm-option.selected').length);
			}catch(err){ console.error('PM-DIAG error', err); }
		}

		function attachOptionListeners(){
			try{
				const opts = Array.from(methodsModal.querySelectorAll('.pm-option'));
				opts.forEach(opt => {
					if (opt.dataset.pmListener === '1') return;
					opt.dataset.pmListener = '1';
					function onOptClick(e){
						const method = opt.getAttribute('data-method');
						console.debug('pm-option clicked ->', method);
						if (!method) return;
						const already = opt.classList.contains('selected');
						// clear others
						Array.from(methodsModal.querySelectorAll('.pm-option')).forEach(o => o.classList.remove('selected'));
						if (already) { selectedMethod = null; resetMethodsUI(); return; }
						opt.classList.add('selected');
						selectedMethod = method;
						updateForMethod(method);
					}
					opt.addEventListener('click', onOptClick);
					opt.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOptClick(); } });
				});
			}catch(err){ console.debug('attachOptionListeners error', err); }
		}
		if (pmOptionsContainer) {
			pmOptionsContainer.addEventListener('click', function(e) {
				const opt = e.target.closest('.pm-option');
				if (!opt || !pmOptionsContainer.contains(opt)) return;
				const method = opt.getAttribute('data-method');
				console.debug('pmOptionsContainer click -> method:', method, 'target:', e.target);
				if (!method) return;
				const already = opt.classList.contains('selected');
				pmOptions.forEach(o => o.classList.remove('selected'));
				if (already) {
					selectedMethod = null;
					resetMethodsUI();
					return;
				}
				opt.classList.add('selected');
				selectedMethod = method;
				updateForMethod(method);
			});
			pmOptionsContainer.addEventListener('keydown', function(e) {
				const opt = e.target.closest('.pm-option');
				if (!opt) return;
				if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opt.click(); }
			});
			// pointerdown to see if pointer events reach the container
			pmOptionsContainer.addEventListener('pointerdown', function(e){ console.debug('pmOptionsContainer pointerdown', e.target); }, {passive:true});
		}

		// Pay / View bank details button
		pmPayBtn?.addEventListener('click', function(){
			// determine selected method from DOM to avoid duplicated-state issues
			const domSelected = methodsModal?.querySelector('.pm-option.selected');
			const method = domSelected?.getAttribute('data-method') || selectedMethod;
			if (!method) return;
			if (method === 'transfer') {
				closeMethodsModal();
				openModalWith(current.plan, current.amount);
				return;
			}
			if (method === 'personalpay' || method === 'tigomoney') {
				closeMethodsModal();
				openModalWith(current.plan, current.amount, method);
				return;
			}
			const forced = OVERRIDE_TOTALS[String(current.amount)] || OVERRIDE_TOTALS[current.amount];
			const totalToSend = forced || current.amount;
			const base = 'https://pago.dpago.com/producto/comprar/5fbb-recarga-de-saldo-anual';
			const params = new URLSearchParams({
				method: method,
				plan: current.plan,
				amount: String(current.amount),
				total: String(totalToSend)
			});
			const url = `${base}?${params.toString()}`;
			window.open(url, '_blank');
			closeMethodsModal();
		});

		methodsClose?.addEventListener('click', closeMethodsModal);
		methodsModal?.addEventListener('click', (e) => { if (e.target === methodsModal) closeMethodsModal(); });

		ppmClose?.addEventListener('click', closeModal);
		modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
		bankAccs.forEach(b => b.addEventListener('click', () => selectBank(b)));
		// accordion open/close
		if (bankSelectorHeader && bankSelector) {
			bankSelectorHeader.addEventListener('click', () => {
				bankSelector.classList.toggle('open');
			});
		}
		ppmCopy?.addEventListener('click', copyAlias);
		ppmSend?.addEventListener('click', sendReceipt);

	})();

	// Script para smooth scrolling a las secciones
	document.querySelectorAll('a[href^="#"]').forEach(anchor => {
		anchor.addEventListener('click', function (e) {
			// Ignorar enlaces que funcionan como botones para elegir plan
			if (this.classList.contains('choose-plan') || this.hasAttribute('data-plan')) return;
			e.preventDefault();

			const targetId = this.getAttribute('href');
			// Evitar usar querySelector con selectores inválidos como '#' o ''
			if (!targetId || targetId === '#') {
				window.scrollTo({ top: 0, behavior: 'smooth' });
				return;
			}
			const targetElement = document.querySelector(targetId);
			if (targetElement) {
				window.scrollTo({
					top: targetElement.offsetTop,
					behavior: 'smooth'
				});
			}
		});
	});

	// Eliminado: Animación del fondo del hero

	// Modal: open/close
	const btnOpenForms = document.querySelectorAll('#btn-open-woz-form');
	const modal = document.getElementById('wozModal');
	const btnClose = document.getElementById('wozClose');
	const btnGenerate = document.getElementById('wozGenerate');
	const typeInputs = document.querySelectorAll('input[name="wozType"]');
	const typeSwitch = document.getElementById('wozTypeSwitch');
	const categorySelect = document.getElementById('wozCategory');
	const categoryLabel = document.getElementById('wozCategoryLabel');
	const titleInput = document.getElementById('wozTitle');
	const priceInput = document.getElementById('wozPrice');
	const detailsInput = document.getElementById('wozDetails');
	// New UI elements for mobile replica
	const feePercentLabel = document.getElementById('wozFeePercentLabel');
	const feePercentAmount = document.getElementById('wozFeePercentAmount');
	const feeTransAmount = document.getElementById('wozFeeTransAmount');
	const totalAmountEl = document.getElementById('wozTotalAmount');
	const linkOutEl = document.getElementById('wozLinkOut');
	const qrBox = document.getElementById('wozQR');
	const summaryEl = document.getElementById('wozSummary');
	const loading = document.getElementById('wozLoading');
	const floating = document.getElementById('wozFloating');
	const floatingBody = document.getElementById('wozFloatingBody');
	const floatingClose = document.getElementById('wozFloatingClose');
	const floatingCloseBottom = document.getElementById('wozFloatingCloseBottom');

	function openModal() { modal.classList.add('active'); }
	function closeModal() { modal.classList.remove('active'); }

	btnOpenForms.forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); openModal(); }));
	if (btnClose) btnClose.addEventListener('click', closeModal);
	modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

	// Assumptions for the mobile design: 3.9% Woz Pay (retiro 30 días) + 1 USD
	const WOZ_PERCENT = 3.9; // 3,9%
	const USD_FIXED = 1; // 1 USD
	const USD_TO_GS = 7230; // tasa demo

	function formatGs(n) {
		const rounded = Math.round(Number(n) || 0);
		const withDots = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
		return `Gs. ${withDots}`;
	}

	function formatInputThousands(val) {
		// Allow only digits, then insert dot separators; supports any length
		const digits = String(val).replace(/[^0-9]/g, '');
		if (!digits) return '';
		return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
	}

	function calcTotals() {
		const raw = (priceInput?.value || '').replace(/[^0-9]/g, '');
		const priceGs = parseInt(raw || '0', 10);
		const feeGs = priceGs * (WOZ_PERCENT / 100); // Comisión Woz Payments 3,9%
		const feeUsdInGs = USD_FIXED * USD_TO_GS; // Comisión por transacción 1 USD
		const totalToCharge = priceGs - feeGs - feeUsdInGs; // Total a cobrar

		// Update UI cards
		if (feePercentAmount) feePercentAmount.textContent = formatGs(feeGs);
		if (feeTransAmount) feeTransAmount.textContent = formatGs(feeUsdInGs);
		if (totalAmountEl) totalAmountEl.textContent = formatGs(totalToCharge);

		// Update summary text inside the modal
		// Summary content is now split into rows via HTML; only numbers update above.

		return { priceGs, feeGs, feeUsdInGs, totalToCharge };
	}

	function generatePayload() {
		const type = Array.from(typeInputs).find(i => i.checked)?.value || 'link';
		const category = categorySelect.value;
		const title = titleInput.value.trim();
		const price = parseFloat(priceInput.value || '0');
		const details = detailsInput.value.trim();
		const calc = calcTotals();
		const payload = {
			type, category, title, priceGs: price, details,
			fees: { percent: WOZ_PERCENT, usdFixed: USD_FIXED, feeGs: calc.feeGs, feeUsdInGs: calc.feeUsdInGs },
			totalToCharge: calc.totalToCharge
		};
		return payload;
	}

	function buildShareLink(payload) {
		const base = 'https://woz-payments.example/link';
		const params = new URLSearchParams({
			type: payload.type,
			category: payload.category,
			title: payload.title,
			priceGs: String(payload.priceGs),
			details: payload.details,
			total: String(payload.totalToCharge)
		});
		return `${base}?${params.toString()}`;
	}

	function ensureQRBox() {
		qrBox.classList.add('active');
		qrBox.innerHTML = '';
	}

	btnGenerate?.addEventListener('click', (e) => {
		e.preventDefault();
		const payload = generatePayload();
		const link = buildShareLink(payload);
		const type = payload.type;

		// Clear previous outputs
		if (linkOutEl) linkOutEl.innerHTML = '';
		qrBox?.classList.remove('active');
		if (qrBox) qrBox.innerHTML = '';


		// Show loading, then floating result with QR or Link
		loading?.classList.add('active');
		setTimeout(() => {
			loading?.classList.remove('active');
			let html = '';
			if (type === 'qr') {
				html += '<h3>Generaste un QR exitoso</h3>';
				html += '<p>Este QR sirve para cobros internacionales.</p>';
				html += '<div class="woz-qr-center"><div id="wozQRFloat"></div></div>';
				html += '<div class="woz-qr-actions"><button class="woz-download-btn" id="wozDownloadQR">Descargar QR</button></div>';
				html += '<div class="woz-qr-demo">'
					+ '<div class="woz-phone">'
						+ '<div class="woz-phone-header">'
							+ '<div class="woz-avatar" aria-hidden="true"></div>'
							+ '<div class="woz-chat-title">Cliente</div>'
						+ '</div>'
						+ '<div class="woz-phone-screen">'
							+ '<div class="woz-chat" id="wozChat">'
								+ '<div class="woz-bubble out" id="wozBubbleQR">'
									+ '<img class="woz-chat-qr" id="wozChatQRImg" alt="QR de pago"/>'
								+ '</div>'
								+ '<div class="woz-bubble out" id="wozBubbleText"><span>Este es el QR de ventas para que puedas comprar</span></div>'
								+ '<div class="woz-bubble in" id="wozBubbleReply"><span>Holaa, genial te pago ahora</span></div>'
							+ '</div>'
							+ '<div class="woz-typing" id="wozTyping"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>'
							+ '<div class="woz-inputbar">'
								+ '<input type="text" placeholder="Escribir mensaje" readonly />'
								+ '<button class="woz-send" aria-label="Enviar">➤</button>'
							+ '</div>'
						+ '</div>'
					+ '</div>'
				+ '</div>';
				html += '<div class="woz-info-box"><div class="woz-info-title">Compartir</div><p>Podés enviar el QR a WhatsApp, redes sociales o pegarlo en tu web.</p></div>';
			} else {
				html += '<h3>Generaste un Link exitoso</h3>';
				html += '<p>Este Link sirve para cobros internacionales.</p>';
				// Mostrar el link centrado por 3s antes de la demo de chat
				html += `<div class="woz-qr-center"><div class="woz-link-box" id="wozLinkFloat"><span class="woz-link-text">${link}</span><button class="woz-copy-btn" id="wozCopyLink" aria-label="Copiar">📋</button></div></div>`;
				html += '<div class="woz-qr-actions"><button class="woz-download-btn" id="wozCopyLinkSecondary">Copiar Link</button></div>';
				html += '<div class="woz-qr-demo">'
					+ '<div class="woz-phone">'
						+ '<div class="woz-phone-header">'
							+ '<div class="woz-avatar" aria-hidden="true"></div>'
							+ '<div class="woz-chat-title">Cliente</div>'
						+ '</div>'
						+ '<div class="woz-phone-screen">'
							+ '<div class="woz-chat" id="wozChat">'
								+ '<div class="woz-bubble out" id="wozBubbleLink">'
									+ `<div class="woz-chat-link"><div class="woz-chat-link-title">Pago Woz</div><div class="woz-chat-link-url">${link}</div></div>`
								+ '</div>'
								+ '<div class="woz-bubble out" id="wozBubbleText"><span>Te envío el link de pago</span></div>'
								+ '<div class="woz-bubble in" id="wozBubbleReply"><span>Perfecto, pago ahora</span></div>'
							+ '</div>'
							+ '<div class="woz-typing" id="wozTyping"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>'
							+ '<div class="woz-inputbar">'
								+ '<input type="text" placeholder="Escribir mensaje" readonly />'
								+ '<button class="woz-send" aria-label="Enviar">➤</button>'
							+ '</div>'
						+ '</div>'
					+ '</div>'
				+ '</div>';
				html += '<div class="woz-info-box"><div class="woz-info-title">Compartir</div><p>Podés enviar el enlace a WhatsApp, redes sociales o pegarlo en tu web.</p></div>';
			}
			floatingBody.innerHTML = html;
			floating?.classList.add('active');

			// Init QR and download handler
			if (type === 'qr') {
				const floatQR = document.getElementById('wozQRFloat');
				if (floatQR && window.QRCode) {
					try {
						const smallScreen = window.matchMedia('(max-width: 600px)').matches;
						const size = smallScreen ? 200 : 220;
						new QRCode(floatQR, { text: link, width: size, height: size });
					} catch (err) {
						const pre = document.createElement('pre');
						pre.style.whiteSpace = 'pre-wrap';
						pre.style.textAlign = 'center';
						pre.style.fontWeight = '700';
						pre.textContent = link;
						floatQR.appendChild(pre);
					}
				}
				const dlBtn = document.getElementById('wozDownloadQR');
				dlBtn?.addEventListener('click', () => {
					const canvas = floatQR?.querySelector('canvas');
					const img = floatQR?.querySelector('img');
					let dataUrl = '';
					if (canvas) {
						dataUrl = canvas.toDataURL('image/png');
					} else if (img && img.src) {
						dataUrl = img.src;
					}
					if (dataUrl) {
						const a = document.createElement('a');
						a.href = dataUrl;
						a.download = 'woz-qr.png';
						a.click();
					}
				});

				// Chat demo animation using the generated QR
				(function initQrChatDemo() {
					const bubbleQR = document.getElementById('wozBubbleQR');
					const bubbleText = document.getElementById('wozBubbleText');
					const bubbleReply = document.getElementById('wozBubbleReply');
					const typing = document.getElementById('wozTyping');
					const qrImg = document.getElementById('wozChatQRImg');
					const srcCanvas = floatQR?.querySelector('canvas');
					const srcImg = floatQR?.querySelector('img');
					let dataUrl = '';
					if (srcCanvas) {
						try { dataUrl = srcCanvas.toDataURL('image/png'); } catch (_) {}
					} else if (srcImg && srcImg.src) {
						dataUrl = srcImg.src;
					}
					if (qrImg && dataUrl) qrImg.src = dataUrl;

					// Replace standalone QR with phone by hiding the top QR block
					const qrCenter = document.querySelector('.woz-qr-center');
					qrCenter?.classList.add('hidden');

					let t1 = 0, t2 = 0, t3 = 0, t4 = 0, tLoop = 0;
					function play() {
						// reset
						bubbleQR?.classList.remove('show');
						bubbleText?.classList.remove('show');
						bubbleReply?.classList.remove('show');
						typing?.classList.remove('show');
						// force reflow
						void bubbleQR?.offsetWidth;
						// timeline
						t1 = window.setTimeout(() => { bubbleQR?.classList.add('show'); }, 400);
						t2 = window.setTimeout(() => { bubbleText?.classList.add('show'); }, 1200);
						t3 = window.setTimeout(() => { typing?.classList.add('show'); }, 2200);
						t4 = window.setTimeout(() => { typing?.classList.remove('show'); bubbleReply?.classList.add('show'); }, 7200); // after 5s typing
						tLoop = window.setTimeout(play, 12000); // loop
					}
					play();

					// stop on close
					function stop() { [t1,t2,t3,t4,tLoop].forEach(id => window.clearTimeout(id)); }
					floatingClose?.addEventListener('click', stop, { once: true });
					floatingCloseBottom?.addEventListener('click', stop, { once: true });
				})();
			} else {
				const copyBtn = document.getElementById('wozCopyLink');
				const copyBtnSecondary = document.getElementById('wozCopyLinkSecondary');
				const linkBoxCenter = document.getElementById('wozLinkFloat');
				async function doCopy() {
					try {
						await navigator.clipboard.writeText(link);
						if (copyBtn) { copyBtn.textContent = 'Copiado'; setTimeout(() => { copyBtn.textContent = 'Copiar'; }, 1500); }
						if (copyBtnSecondary) { copyBtnSecondary.textContent = 'Copiado'; setTimeout(() => { copyBtnSecondary.textContent = 'Copiar Link'; }, 1500); }
					} catch (_) {
						if (copyBtn) { copyBtn.textContent = 'Error'; setTimeout(() => { copyBtn.textContent = 'Copiar'; }, 1500); }
						if (copyBtnSecondary) { copyBtnSecondary.textContent = 'Error'; setTimeout(() => { copyBtnSecondary.textContent = 'Copiar Link'; }, 1500); }
					}
				}
				copyBtn?.addEventListener('click', doCopy);
				copyBtnSecondary?.addEventListener('click', doCopy);

				// Mostrar link 3s, desvanecerlo y ocultar acciones; luego animación de chat
				(function initLinkChatDemo() {
					const bubbleLink = document.getElementById('wozBubbleLink');
					const bubbleText = document.getElementById('wozBubbleText');
					const bubbleReply = document.getElementById('wozBubbleReply');
					const typing = document.getElementById('wozTyping');
					const qrActions = document.querySelector('.woz-qr-actions');
					const center = document.querySelector('.woz-qr-center');

					let timers = [];
					function holdAndFadeCenter() {
						timers.push(setTimeout(() => {
							center?.classList.add('woz-fade-out');
							qrActions?.classList.add('woz-fade-out');
						}, 3000));
						timers.push(setTimeout(() => {
							center?.classList.add('woz-hidden');
							qrActions?.classList.add('woz-hidden');
						}, 3800));
					}

					function play() {
						bubbleLink?.classList.remove('show');
						bubbleText?.classList.remove('show');
						bubbleReply?.classList.remove('show');
						typing?.classList.remove('show');
						void bubbleLink?.offsetWidth;

						holdAndFadeCenter();
						timers.push(setTimeout(() => { bubbleLink?.classList.add('show'); }, 4200));
						timers.push(setTimeout(() => { bubbleText?.classList.add('show'); }, 5000));
						timers.push(setTimeout(() => { typing?.classList.add('show'); }, 5900));
						timers.push(setTimeout(() => { typing?.classList.remove('show'); bubbleReply?.classList.add('show'); }, 10900));
						timers.push(setTimeout(play, 15000));
					}
					play();

					function stop() { timers.forEach(id => clearTimeout(id)); }
					floatingClose?.addEventListener('click', stop, { once: true });
					floatingCloseBottom?.addEventListener('click', stop, { once: true });
				})();
			}
		}, 800);
	});

	floatingClose?.addEventListener('click', () => { floating?.classList.remove('active'); });
	floatingCloseBottom?.addEventListener('click', () => { floating?.classList.remove('active'); });

	// Live updates
	[titleInput, detailsInput].forEach(el => el?.addEventListener('input', calcTotals));
	priceInput?.addEventListener('input', () => {
		// Format input with thousands separators while typing
		const cursorPos = priceInput.selectionStart;
		const before = priceInput.value;
		priceInput.value = formatInputThousands(priceInput.value);
		calcTotals();
		// Try to maintain cursor near the end for simplicity
		try { priceInput.selectionStart = priceInput.selectionEnd = cursorPos; } catch (_) {}
	});
	categorySelect?.addEventListener('change', () => {
		if (categoryLabel) categoryLabel.textContent = categorySelect.value;
		calcTotals();
	});
	function syncButtonLabel() {
		const selectedType = Array.from(typeInputs).find(i => i.checked)?.value || 'link';
		if (selectedType === 'qr') {
			btnGenerate.textContent = 'Genera un QR de pago';
		} else {
			btnGenerate.textContent = 'Genera un link de pago';
		}
	}
	typeInputs.forEach(inp => inp.addEventListener('change', () => {
		// reset QR/link areas; recalc remains the same
		if (linkOutEl) linkOutEl.innerHTML = '';
		qrBox?.classList.remove('active');
		if (qrBox) qrBox.innerHTML = '';
		syncButtonLabel();
	}));
	// Switch control mirrors radios
	typeSwitch?.addEventListener('change', () => {
		const isQR = typeSwitch.checked;
		Array.from(typeInputs).forEach(i => { i.checked = (i.value === (isQR ? 'qr' : 'link')); });
		syncButtonLabel();
	});

	// Initial
	if (categoryLabel && categorySelect) categoryLabel.textContent = categorySelect.value;
	syncButtonLabel();
	calcTotals();

	// Hero animated demo: QR/Link + device selector
	(function initHeroDemo() {
	    const demo = document.getElementById('wozHeroDemo');
	    if (!demo) return;
	    const typeBtns = document.querySelectorAll('.demo-type-btn');
	    const deviceBtns = document.querySelectorAll('.device-btn');
	    const bubbleMain = document.getElementById('heroBubbleMain');
	    const bubbleText = document.getElementById('heroBubbleText');
	    const bubbleReply = document.getElementById('heroBubbleReply');
	    const typing = document.getElementById('heroTyping');
	    const qrImg = document.getElementById('heroQRImg');
	    const linkBox = document.getElementById('heroLinkBox');
	    const linkText = document.getElementById('heroLinkText');
	    const titleEl = document.getElementById('heroDemoTitle');
	    const frame = document.getElementById('heroDeviceFrame');

	    function setType(type) {
	        demo.dataset.type = type;
	        typeBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-type') === type));
	        typeBtns.forEach(b => b.setAttribute('aria-pressed', String(b.classList.contains('active'))));
	        if (type === 'qr') {
	            titleEl.textContent = 'Generar un QR para tu cliente';
	            qrImg.style.display = 'block';
	            linkBox.style.display = 'none';
	            bubbleText.querySelector('span').textContent = 'Holaa, este es el QR para que pagues';
	            ensureDemoQR();
	        } else {
	            titleEl.textContent = 'Generar un Link de ventas para tu cliente';
	            qrImg.style.display = 'none';
	            linkBox.style.display = 'block';
	            bubbleText.querySelector('span').textContent = 'Holaa, este es el link para que pagues';
	        }
	    }
	    function setDevice(device) {
	        demo.dataset.device = device;
	        deviceBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-device') === device));
	        deviceBtns.forEach(b => b.setAttribute('aria-selected', String(b.classList.contains('active'))));
	        frame.classList.remove('phone', 'tablet', 'laptop');
	        frame.classList.add(device);
	    }
	    typeBtns.forEach(b => b.addEventListener('click', () => setType(b.getAttribute('data-type'))));
	    deviceBtns.forEach(b => b.addEventListener('click', () => setDevice(b.getAttribute('data-device'))));

	    // QR SVG detallado (no solo cuadrado)
	    function ensureDemoQR() {
	        qrImg.innerHTML = `
	        <svg width="110" height="110" viewBox="0 0 110 110">
	            <rect x="0" y="0" width="110" height="110" rx="16" fill="#fff"/>
	            <rect x="8" y="8" width="24" height="24" rx="5" fill="#111"/>
	            <rect x="78" y="8" width="24" height="24" rx="5" fill="#111"/>
	            <rect x="8" y="78" width="24" height="24" rx="5" fill="#111"/>
	            <rect x="38" y="38" width="34" height="34" fill="#111"/>
	            <rect x="50" y="50" width="10" height="10" fill="#fff"/>
	            <rect x="85" y="45" width="10" height="10" fill="#111"/>
	            <rect x="45" y="85" width="10" height="10" fill="#111"/>
	            <rect x="65" y="85" width="10" height="10" fill="#111"/>
	            <rect x="85" y="65" width="10" height="10" fill="#111"/>
	            <rect x="25" y="55" width="6" height="6" fill="#111"/>
	            <rect x="55" y="25" width="6" height="6" fill="#111"/>
	        </svg>
	        `;
	    }
	    // Demo link
	    function ensureDemoLink() {
	        linkText.textContent = 'https://woz-payments.example/link?demo=1';
	    }

	    // Animación de chat
	    let t1=0,t2=0,t3=0,t4=0,tLoop=0;
	    function play() {
	        bubbleMain.classList.remove('show');
	        bubbleText.classList.remove('show');
	        bubbleReply.classList.remove('show');
	        typing.classList.remove('show');
	        void bubbleMain.offsetWidth;
	        setType(demo.dataset.type); // actualiza QR/Link
	        t1 = window.setTimeout(() => { bubbleMain.classList.add('show'); }, 300);
	        t2 = window.setTimeout(() => { bubbleText.classList.add('show'); }, 1100);
	        t3 = window.setTimeout(() => { typing.classList.add('show'); }, 2000);
	        t4 = window.setTimeout(() => {
	            typing.classList.remove('show');
	            bubbleReply.classList.add('show');
	        }, 3200);
	        tLoop = window.setTimeout(play, 6000);
	    }
	    play();
	    function stop() { [t1,t2,t3,t4,tLoop].forEach(id => window.clearTimeout(id)); }
	    // Si abres modal, puedes pausar animación aquí si quieres

	    // defaults
	    setType('qr');
	    setDevice('phone');
	})();

	// --- Pricing Carousel Logic ---
	const pricingCarousel = document.getElementById('pricingCarousel');

	if (pricingCarousel) {
	  const track = pricingCarousel.querySelector('.carousel-track');
	  const cards = pricingCarousel.querySelectorAll('.pricing-card');
		const prevBtn = pricingCarousel.querySelector('.carousel-btn.prev');
		const nextBtn = pricingCarousel.querySelector('.carousel-btn.next');
		const tabButtons = pricingCarousel.querySelectorAll('.pricing-tab-button');

	  let index = 0;
	  const total = cards.length;

	  function isMobile() {
	    return window.innerWidth <= 600;
	  }

		function update() {
			if (!isMobile()) {
				track.style.transform = '';
				return;
			}

			const card = cards[0];
			if (!card) return;
			// card width and gap
			const cardRect = card.getBoundingClientRect();
			const gap = parseFloat(getComputedStyle(track).gap) || 24;
			const slideWidth = cardRect.width + gap;

			// center active card in the carousel container
			const containerRect = pricingCarousel.getBoundingClientRect();
			const containerWidth = containerRect.width;

			// Compute translate so that current card is centered
			const centerOffset = (containerWidth - cardRect.width) / 2;
			const translate = Math.round(index * slideWidth - centerOffset);
			track.style.transform = `translateX(${-translate}px)`;
		}

	  function next() {
	    if (index < total - 1) {
	      index++;
	      update();
	    }
	  }

	  function prev() {
	    if (index > 0) {
	      index--;
	      update();
	    }
	  }

		prevBtn?.addEventListener('click', prev);
		nextBtn?.addEventListener('click', next);

		// Tabs selection (Básico / Estándar / Premium)
		function setTabActive(i) {
			tabButtons.forEach((b, idx) => {
				const isActive = idx === i;
				b.classList.toggle('active', isActive);
				b.setAttribute('aria-selected', String(isActive));
			});
		}
		tabButtons.forEach(btn => {
			btn.addEventListener('click', () => {
				const i = Number(btn.getAttribute('data-index')) || 0;
				index = Math.min(Math.max(0, i), total - 1);
				update();
				setTabActive(index);
			});
		});

	  // Swipe móvil
	  let startX = 0;

	  track.addEventListener('touchstart', e => {
	    if (!isMobile()) return;
	    startX = e.touches[0].clientX;
	  });

	  track.addEventListener('touchend', e => {
	    if (!isMobile()) return;
	    const dx = e.changedTouches[0].clientX - startX;
	    if (dx < -50) next();
	    if (dx > 50) prev();
	  });

		window.addEventListener('resize', () => {
			index = Math.min(index, total - 1);
			update();
		});

		// Estado inicial: mostrar la primera tarjeta (Básico) y activar pestaña
		index = 0;
		update();
		setTabActive(0);
	}

	// Generar QR grande y nítido en el demo
	function renderHeroQR(text) {
	  const qrContainer = document.getElementById('heroQRImg');
	  qrContainer.innerHTML = '';
	  try { 
		new QRCode(qrContainer, {
			text: text,
			width: 140,
			height: 140,
			colorDark: "#111",
			colorLight: "#fff",
			correctLevel: QRCode.CorrectLevel.H
		});
	  } catch (err) {
		qrContainer.textContent = text;
	  }
	}

	// --- Testimonios: inyectar sección, estilos y slider móvil automático ---
	;(function insertTestimonials(){
	const testimonials = [
		{ text: '"Las comisiones y los bloqueos de otras plataformas eran un problema. Con Woz cobro desde el exterior sin trabas y rápido."', name: 'María P. - Desarrolladora', rating: 5 },
		{ text: '"Soy programador freelancer y cobrar fue mucho más sencillo desde que uso Woz. Pagos claros y inmediatos."', name: 'Carlos G. - Dev', rating: 5 },
		{ text: '"Recibo dinero de mi familia desde Europa sin complicaciones y puedo retirarlo en mi banco."', name: 'Ana F. - Traductora', rating: 4.5 },
		{ text: '"Retiro mis ganancias directo a mi banco sin papeleo ni esperas, ideal para quienes trabajan con clientes del exterior."', name: 'Luis R. - Diseñador', rating: 5 },
		{ text: '"Al fin hay alternativas a Bancard y menos trámites para recibir pagos desde otros países."', name: 'Sofía M. - Comercio', rating: 4.5 },
		{ text: '"Perdía tiempo con límites y procesos. Ahora los clientes pagan fácil y yo cobro al instante."', name: 'Mateo V. - Programador', rating: 5 },
		{ text: '"Perfecto para freelancers, los pagos internacionales llegan rápido y las tarifas son competitivas para lo que ofrecen."', name: 'Luisa T. - Consultora', rating: 5 },
		{ text: '"Western Union exige trámites y comisiones altas. Tener una opción más simple como Woz hace la diferencia."', name: 'Diego H. - Operaciones', rating: 4.5 },
		{ text: '"Cobrar trabajos freelance dejó de ser un problema. La experiencia es cómoda y eficiente."', name: 'Natalia Q. - UX', rating: 5 },
		{ text: '"Excelente relación precio calidad, fácil de usar y cómodo para el volumen y tarifas que ofrecen."', name: 'Pablo S. - Artesano', rating: 4.5 }
	];

	  // Build HTML
	  const sectionHtml = `
	    <section id="testimonials" class="testimonials-section section">
	      <div class="container">
			<h2 class="section-title">Testimonios</h2>
			<p class="section-sub">Historias reales de quienes cobran en Paraguay y reciben remesas desde el extranjero, superando las limitaciones de PayPal, Western Union, MoneyGram, Binance y Mercado Pago.</p>
	        <div class="testimonials-carousel" id="testimonialsCarousel">
	          <div class="testimonials-track">
	            ${testimonials.map(t => `
	              <article class="testimonial-card">
	                <p class="testimonial-quote">${t.text}</p>
	                <div class="testimonial-meta">
	                  <strong class="testimonial-name">${t.name}</strong>
	                  <span class="testimonial-rating">${renderStars(t.rating)}</span>
	                </div>
	              </article>
	            `).join('')}
	          </div>
	        </div>
	      </div>
	    </section>
	  `;

	function renderStars(r) {
		const full = Math.floor(r);
		let s = '';
		for (let i = 0; i < full; i++) s += '★';
		while (s.length < 5) s += '☆';
		return s;
	}

	  // Inject styles scoped for testimonials
	  const style = document.createElement('style');
	  style.textContent = `
	    /* Testimonials */
		.testimonials-section { padding: 32px 0; background: #f3f4f6; }
	    .testimonials-section .section-title { margin-bottom: 6px; }
	    .testimonials-section .section-sub { margin-bottom: 18px; color: #555; }
	    .testimonials-carousel { overflow: hidden; }
	    .testimonials-track { display: flex; gap: 14px; transition: transform 420ms ease; will-change: transform; }
	    .testimonial-card { flex: 0 0 86%; max-width: 86%; background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 14px; box-shadow: 0 6px 20px rgba(0,0,0,0.04); }
	    .testimonial-quote { font-style: italic; color: #222; margin: 0 0 10px; }
	    .testimonial-meta { display:flex; align-items:center; justify-content:space-between; gap: 10px; }
	    .testimonial-name { color:#111; font-weight:700; }
	    .testimonial-rating { color:#ffb400; font-weight:700; }

		/* Responsive: use flex carousel layout and adjust card width per breakpoint */
		.testimonials-track { gap: 14px; }
		@media (min-width: 700px) {
			.testimonials-track { gap: 18px; }
			.testimonial-card { flex: 0 0 calc((100% - 36px) / 3); max-width: none; }
			.testimonials-carousel { overflow: hidden; }
		}

		@media (min-width: 1024px) {
			.testimonials-section { padding: 44px 0; background: #f3f4f6; }
			.testimonial-card { flex: 0 0 calc((100% - 54px) / 4); }
		}
	  `;

	// Inject into DOM: place after #confianza if present, otherwise append to body
	document.head.appendChild(style);
	const anchor = document.getElementById('confianza');
	if (anchor) anchor.insertAdjacentHTML('afterend', sectionHtml);
	else document.body.insertAdjacentHTML('beforeend', sectionHtml);

	// Carousel behavior (responsive: mobile, tablet, desktop)
	const carousel = document.getElementById('testimonialsCarousel');
	const track = carousel?.querySelector('.testimonials-track');
	if (!carousel || !track) return;

	let tIndex = 0;
	let autoId = null;

	function getCards() { return Array.from(track.querySelectorAll('.testimonial-card')); }

	function slidesToShow() {
		const w = window.innerWidth;
		if (w >= 1024) return 4;
		if (w >= 700) return 3;
		return 1;
	}

	function updatePosition() {
		const cards = getCards();
		const total = cards.length;
		const show = slidesToShow();
		if (total <= show) { track.style.transform = ''; return; }
		const cardRect = cards[0].getBoundingClientRect();
		const gap = parseFloat(getComputedStyle(track).gap) || 14;
		const slideWidth = Math.round(cardRect.width + gap);
		const maxIndex = Math.max(0, total - show);
		if (tIndex > maxIndex) tIndex = 0;
		const translate = Math.round(tIndex * slideWidth);
		track.style.transform = `translateX(${-translate}px)`;
	}

	function next() {
		const cards = getCards();
		const total = cards.length;
		const show = slidesToShow();
		const maxIndex = Math.max(0, total - show);
		tIndex = (tIndex + 1) > maxIndex ? 0 : tIndex + 1;
		updatePosition();
	}

	function prev() {
		const cards = getCards();
		const total = cards.length;
		const show = slidesToShow();
		const maxIndex = Math.max(0, total - show);
		tIndex = (tIndex - 1) < 0 ? maxIndex : tIndex - 1;
		updatePosition();
	}

	function startAuto() { stopAuto(); autoId = setInterval(() => next(), 3500); }
	function stopAuto() { if (autoId) { clearInterval(autoId); autoId = null; } }

	// pause on hover/touch
	carousel.addEventListener('mouseenter', stopAuto);
	carousel.addEventListener('mouseleave', startAuto);
	track.addEventListener('touchstart', (e)=> { stopAuto(); startX = e.touches[0].clientX; }, {passive:true});
	let startX = 0;
	track.addEventListener('touchend', (e)=>{
		const dx = e.changedTouches[0].clientX - startX;
		if (dx < -40) next();
		if (dx > 40) prev();
		startAuto();
	}, {passive:true});

	window.addEventListener('resize', () => { updatePosition(); startAuto(); });

	// Initial layout
	setTimeout(()=>{ updatePosition(); startAuto(); }, 120);

	})();

});
// (Removed) Hero background animation per user request.
document.addEventListener('DOMContentLoaded', function() {
	// Función para el Acordeón (FAQ)
	const faqItems = document.querySelectorAll('.faq-item');

	faqItems.forEach(item => {
		const question = item.querySelector('.faq-question');
		question.addEventListener('click', () => {
			// Cierra todas las otras respuestas
			faqItems.forEach(otherItem => {
				if (otherItem !== item && otherItem.classList.contains('active')) {
					otherItem.classList.remove('active');
				}
			});

			// Alterna la clase 'active' para abrir/cerrar el ítem actual
			item.classList.toggle('active');
		});
	});

	// --- Plan choose -> QR modal logic ---
	(function(){
		function formatGsLocal(n){
			const rounded = Math.round(Number(n) || 0);
			return 'Gs. ' + String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
		}

		const chooseBtns = document.querySelectorAll('.choose-plan');
		const modal = document.getElementById('planPayModal');
		const ppmClose = document.getElementById('ppmClose');
		const ppmPlanName = document.getElementById('ppmPlanName');
		const ppmAmount = document.getElementById('ppmAmount');
		const bankAccs = Array.from(document.querySelectorAll('.bank-item'));
		const ppmAlias = null; // alias input removed; kept for compatibility
		const ppmCopy = null;
		const infoAliasVal = document.getElementById('infoAliasVal');
		const infoBancoVal = document.getElementById('infoBancoVal');
		const infoMontoVal = document.getElementById('infoMontoVal');
		const aliasLabel = document.querySelector('.ppm-info-left .alias-label');
		const bancoLabel = document.querySelectorAll('.ppm-info-left .ppm-info-row')[2];
		const bankSelector = document.querySelector('.bank-selector');
		const bankSelectorHeader = document.querySelector('.bank-selector-header');
		const infoVisual = document.getElementById('infoVisual');
		const ppmQR = document.getElementById('ppmQR');
		const ppmSend = document.getElementById('ppmSendReceipt');

		let current = { plan:'', amount:0, bank:'Ueno Bank', alias:'4920791', color:'#0a7d3b' };

		// Calcula el total para métodos de billetera: +5.5% de comisión y 10% sobre esa comisión (IVA)
		function computeWalletTotal(amount){
			const commission = Math.round(amount * 0.055);
			const iva = Math.round(commission * 0.10);
			return amount + commission + iva;
		}

		function openModalWith(plan, amount, walletMethod){
			current.plan = plan;
			current.amount = Number(amount) || 0;
			current.walletMethod = walletMethod || null;
			const defaultBankBtn = document.getElementById('bankUeno');
			// Only select default bank when not opening modal for a wallet method
			if (!current.walletMethod) selectBank(defaultBankBtn);
			if (ppmPlanName) ppmPlanName.textContent = plan;

			const displayAmount = (current.walletMethod === 'personalpay' || current.walletMethod === 'tigomoney')
				? computeWalletTotal(current.amount)
				: current.amount;

			if (ppmAmount) ppmAmount.textContent = formatGsLocal(displayAmount);
			// adjust UI when opening modal for wallet methods
			if (current.walletMethod === 'personalpay' || current.walletMethod === 'tigomoney') {
				if (bankSelector) bankSelector.style.display = 'none';
				if (aliasLabel) {
					if (current.walletMethod === 'personalpay') aliasLabel.textContent = 'Linea Personal Pay';
					else aliasLabel.textContent = 'Linea Tigo';
				}
				if (bancoLabel) bancoLabel.textContent = 'Telefonia';
				if (infoAliasVal) infoAliasVal.textContent = (current.walletMethod === 'personalpay') ? '0974 141073' : '0984261043';
				if (infoBancoVal) infoBancoVal.textContent = (current.walletMethod === 'personalpay') ? 'Personal' : 'Tigo Paraguay';
				if (infoMontoVal) infoMontoVal.textContent = formatGsLocal(displayAmount);
				if (ppmTitle) ppmTitle.textContent = (current.walletMethod === 'personalpay') ? 'Pago por Personal Pay' : 'Pago por Tigo Money';
				if (infoVisual) infoVisual.innerHTML = '';
			} else {
				if (bankSelector) bankSelector.style.display = '';
				if (aliasLabel) aliasLabel.textContent = `Alias ${current.bank}`;
				if (bancoLabel) bancoLabel.textContent = 'Banco';
				if (infoAliasVal) infoAliasVal.textContent = current.alias || (current.bank === 'Eko' ? 'QR - Eko' : '-');
				if (infoBancoVal) infoBancoVal.textContent = current.bank;
				if (infoMontoVal) infoMontoVal.textContent = formatGsLocal(current.amount);
				if (ppmTitle) ppmTitle.textContent = 'Pago de membresía';
			}

			modal?.classList.add('active');
			renderQR();
		}

		function closeModal(){ modal?.classList.remove('active'); }

		function selectBank(btn){
			if (!btn) return;
			// collapse others
			bankAccs.forEach(b => b.classList.remove('selected'));
			btn.classList.add('selected');

			current.bank = btn.getAttribute('data-bank') || current.bank;
			current.alias = btn.getAttribute('data-alias') || '';
			current.color = btn.getAttribute('data-color') || current.color;

			// update info fields
			if (infoAliasVal) infoAliasVal.textContent = current.alias || (current.bank === 'Eko' ? 'QR - Eko' : '-');
			if (infoBancoVal) infoBancoVal.textContent = current.bank;
			if (infoMontoVal) infoMontoVal.textContent = formatGsLocal(current.amount);
			if (aliasLabel) {
				if (current.bank === 'Eko') aliasLabel.textContent = 'QR - Eko';
				else aliasLabel.textContent = `Alias ${current.bank}`;
			}

			// update visual area: show Eko image only inside infoVisual
			if (infoVisual) {
				infoVisual.innerHTML = '';
				if (current.bank === 'Eko') {
					const img = document.getElementById('ppmEkoImg');
					if (img && img.src) infoVisual.appendChild(img.cloneNode(true));
					else infoVisual.textContent = 'QR de Eko (imagen no encontrada)';
				}
			}
		}

		function renderQR(){
			if (!ppmQR) return;
			ppmQR.innerHTML = '';

			// If selected bank is Eko, show the provided Eko image (if present) and also the alias label set to QR - Eko
			if (current.bank === 'Eko') {
				const img = document.getElementById('ppmEkoImg');
				if (img && img.src) {
					ppmQR.appendChild(img.cloneNode(true));
				} else {
					const p = document.createElement('div');
					p.textContent = 'QR de Eko (imagen no encontrada)';
					ppmQR.appendChild(p);
				}
				return;
			}

			// For other banks, do not show an image QR — instead show a compact textual block with details
			const infoPre = document.createElement('pre');
			infoPre.style.whiteSpace = 'pre-wrap';
			infoPre.style.textAlign = 'left';
			infoPre.style.fontWeight = '600';
			infoPre.textContent = `Titular: Héctor Gonzalez\nAlias: ${current.alias || '-'}\nBanco: ${current.bank}\nMonto: ${formatGsLocal(current.amount)}`;
			ppmQR.appendChild(infoPre);
		}

		function copyAlias(){
			const text = infoAliasVal ? infoAliasVal.textContent.trim() : '';
			if (!text) return;
			navigator.clipboard?.writeText(text).then(() => {
				if (ppmCopy) { ppmCopy.textContent = 'Copiado'; setTimeout(()=> ppmCopy.textContent = '📋', 1500); }
			}).catch(()=>{ if (ppmCopy) { ppmCopy.textContent = 'Error'; setTimeout(()=> ppmCopy.textContent = '📋', 1500); } });
		}

		function sendReceipt(){
			const phone = '0983994268';
			const msg = encodeURIComponent(`Adjunto comprobante de pago - Plan: ${current.plan} - Banco: ${current.bank} - Monto: ${formatGsLocal(current.amount)} - Alias: ${current.alias}`);
			const url = `https://wa.me/${phone}?text=${msg}`;
			window.open(url, '_blank');
		}

		// Payment methods modal elements and logic (selection, price calc, pay)
		const methodsModal = document.getElementById('paymentMethodsModal');
		const methodsClose = document.getElementById('pmClose');
		const pmCancel = document.getElementById('pmCancel');
		const pmPayBtn = document.getElementById('pmPayBtn');
		const pmTotalEl = methodsModal?.querySelector('.pm-total');
		const pmOptions = Array.from(methodsModal?.querySelectorAll('.pm-option') || []);

		// Totales predeterminados (sin cálculos) para métodos no-transferencia
		const OVERRIDE_TOTALS = {
			250000: 265125,
			600000: 636300,
			1500000: 1590750
		};
		let selectedMethod = null;

		function resetMethodsUI() {
			selectedMethod = null;
			pmOptions.forEach(o => { o.classList.remove('selected'); });
			if (pmTotalEl) pmTotalEl.textContent = formatGsLocal(current.amount);
			if (pmPayBtn) { pmPayBtn.disabled = true; pmPayBtn.textContent = 'Pagar'; }
		}

		function openMethodsModal(plan, amount) {
			current.plan = plan;
			current.amount = Number(amount) || 0;
			if (!methodsModal) return;
			// preserve previous focused element to restore focus on close
			methodsModal._previousFocus = document.activeElement;
			// Update total immediately to avoid stale values
			if (pmTotalEl) pmTotalEl.textContent = formatGsLocal(current.amount);
			// reset any previous selection (this will also set button disabled)
			resetMethodsUI();
			// mark as visible for assistive tech and show modal
			methodsModal.setAttribute('aria-hidden', 'false');
			try { methodsModal.style.zIndex = '12000'; } catch(e){}
			methodsModal.classList.add('active');
			// move focus into modal (prefer first option, then close button)
			setTimeout(() => {
				const firstOpt = methodsModal.querySelector('.pm-option[tabindex]');
				if (firstOpt) firstOpt.focus();
				else if (methodsClose) methodsClose.focus();
			}, 10);
		}

		function closeMethodsModal() {
			if (!methodsModal) return;
			methodsModal.classList.remove('active');
			methodsModal.setAttribute('aria-hidden', 'true');
			resetMethodsUI();
			try { if (methodsModal._previousFocus && methodsModal._previousFocus.focus) methodsModal._previousFocus.focus(); } catch(e){}
		}

		// When user clicks a plan, open methods selector first
		chooseBtns.forEach(btn => {
			btn.addEventListener('click', function(e){
				e.preventDefault();
				const plan = btn.getAttribute('data-plan') || 'Plan';
				// Prefer monthly price when the toggle is set to monthly. Fall back to data-amount (annual) otherwise.
				let amount = 0;
				try {
					const card = btn.closest('.pricing-card') || btn.closest('.card-price');
					const monthlyBtn = document.getElementById('payMonthly');
					const isMonthly = monthlyBtn ? (monthlyBtn.getAttribute('aria-pressed') === 'true' || monthlyBtn.classList.contains('active')) : false;
					if (isMonthly && card && card.dataset && card.dataset.monthly) {
						amount = parseInt(String(card.dataset.monthly).replace(/[^0-9]/g,''), 10) || 0;
					} else if (card && card.dataset && card.dataset.annual) {
						amount = parseInt(String(card.dataset.annual).replace(/[^0-9]/g,''), 10) || 0;
					} else {
						const rawAmount = (btn.getAttribute('data-amount') || '0').toString();
						const normalized = rawAmount.replace(/[^0-9]/g, '');
						amount = parseInt(normalized || '0', 10) || 0;
					}
				} catch(err) {
					const rawAmount = (btn.getAttribute('data-amount') || '0').toString();
					const normalized = rawAmount.replace(/[^0-9]/g, '');
					amount = parseInt(normalized || '0', 10) || 0;
				}
				openMethodsModal(plan, amount);
			});
		});

		function updateForMethod(method) {
			if (!methodsModal) return;
			if (!method) { resetMethodsUI(); return; }
			// Decide total to show: transfer -> base, wallets -> computed, others -> override table when available
			let total = current.amount;
			if (method === 'personalpay' || method === 'tigomoney') {
				total = computeWalletTotal(current.amount);
			} else if (method !== 'transfer') {
				const forced = OVERRIDE_TOTALS[String(current.amount)] || OVERRIDE_TOTALS[current.amount];
				if (forced) total = forced;
			}
			if (pmTotalEl) pmTotalEl.textContent = formatGsLocal(total);
			if (pmPayBtn) {
				pmPayBtn.disabled = false;
				if (method === 'transfer') {
					pmPayBtn.textContent = 'Ver datos bancarios';
				} else if (method === 'personalpay' || method === 'tigomoney') {
					pmPayBtn.textContent = 'Ver información de pago';
				} else {
					pmPayBtn.textContent = 'Pagar';
				}
			}
			return { total };
		}

		// Option selection: delegated handler on container for robustness
		const pmOptionsContainer = methodsModal?.querySelector('.pm-options');
		if (pmOptionsContainer) {
			pmOptionsContainer.addEventListener('click', function(e) {
				const opt = e.target.closest('.pm-option');
				if (!opt || !pmOptionsContainer.contains(opt)) return;
				const method = opt.getAttribute('data-method');
				if (!method) return;
				const already = opt.classList.contains('selected');
				pmOptions.forEach(o => o.classList.remove('selected'));
				if (already) {
					selectedMethod = null;
					resetMethodsUI();
					return;
				}
				opt.classList.add('selected');
				selectedMethod = method;
				updateForMethod(method);
			});
			pmOptionsContainer.addEventListener('keydown', function(e) {
				const opt = e.target.closest('.pm-option');
				if (!opt) return;
				if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opt.click(); }
			});
		}

		// Pay / View bank details button
		pmPayBtn?.addEventListener('click', function(){
			// determine selected method from DOM to avoid duplicated-state issues
			const domSelected = methodsModal?.querySelector('.pm-option.selected');
			const method = domSelected?.getAttribute('data-method') || selectedMethod;
			if (!method) return;
			if (method === 'transfer') {
				closeMethodsModal();
				openModalWith(current.plan, current.amount);
				return;
			}
			if (method === 'personalpay' || method === 'tigomoney') {
				closeMethodsModal();
				openModalWith(current.plan, current.amount, method);
				return;
			}
			const forced = OVERRIDE_TOTALS[String(current.amount)] || OVERRIDE_TOTALS[current.amount];
			const totalToSend = forced || current.amount;
			const base = 'https://pago.dpago.com/producto/comprar/5fbb-recarga-de-saldo-anual';
			const params = new URLSearchParams({
				method: method,
				plan: current.plan,
				amount: String(current.amount),
				total: String(totalToSend)
			});
			const url = `${base}?${params.toString()}`;
			window.open(url, '_blank');
			closeMethodsModal();
		});

		methodsClose?.addEventListener('click', closeMethodsModal);
		methodsModal?.addEventListener('click', (e) => { if (e.target === methodsModal) closeMethodsModal(); });

		ppmClose?.addEventListener('click', closeModal);
		modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
		bankAccs.forEach(b => b.addEventListener('click', () => selectBank(b)));
		// accordion open/close
		if (bankSelectorHeader && bankSelector) {
			bankSelectorHeader.addEventListener('click', () => {
				bankSelector.classList.toggle('open');
			});
		}
		ppmCopy?.addEventListener('click', copyAlias);
		ppmSend?.addEventListener('click', sendReceipt);

	})();

	// Script para smooth scrolling a las secciones
	document.querySelectorAll('a[href^="#"]').forEach(anchor => {
		anchor.addEventListener('click', function (e) {
			// Ignorar enlaces que funcionan como botones para elegir plan
			if (this.classList.contains('choose-plan') || this.hasAttribute('data-plan')) return;
			e.preventDefault();

			const targetId = this.getAttribute('href');
			// Evitar usar querySelector con selectores inválidos como '#' o ''
			if (!targetId || targetId === '#') {
				window.scrollTo({ top: 0, behavior: 'smooth' });
				return;
			}
			const targetElement = document.querySelector(targetId);
			if (targetElement) {
				window.scrollTo({
					top: targetElement.offsetTop,
					behavior: 'smooth'
				});
			}
		});
	});

	// Eliminado: Animación del fondo del hero

	// Modal: open/close
	const btnOpenForms = document.querySelectorAll('#btn-open-woz-form');
	const modal = document.getElementById('wozModal');
	const btnClose = document.getElementById('wozClose');
	const btnGenerate = document.getElementById('wozGenerate');
	const typeInputs = document.querySelectorAll('input[name="wozType"]');
	const typeSwitch = document.getElementById('wozTypeSwitch');
	const categorySelect = document.getElementById('wozCategory');
	const categoryLabel = document.getElementById('wozCategoryLabel');
	const titleInput = document.getElementById('wozTitle');
	const priceInput = document.getElementById('wozPrice');
	const detailsInput = document.getElementById('wozDetails');
	// New UI elements for mobile replica
	const feePercentLabel = document.getElementById('wozFeePercentLabel');
	const feePercentAmount = document.getElementById('wozFeePercentAmount');
	const feeTransAmount = document.getElementById('wozFeeTransAmount');
	const totalAmountEl = document.getElementById('wozTotalAmount');
	const linkOutEl = document.getElementById('wozLinkOut');
	const qrBox = document.getElementById('wozQR');
	const summaryEl = document.getElementById('wozSummary');
	const loading = document.getElementById('wozLoading');
	const floating = document.getElementById('wozFloating');
	const floatingBody = document.getElementById('wozFloatingBody');
	const floatingClose = document.getElementById('wozFloatingClose');
	const floatingCloseBottom = document.getElementById('wozFloatingCloseBottom');

	function openModal() { modal.classList.add('active'); }
	function closeModal() { modal.classList.remove('active'); }

	btnOpenForms.forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); openModal(); }));
	if (btnClose) btnClose.addEventListener('click', closeModal);
	modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

	// Assumptions for the mobile design: 3.9% Woz Pay (retiro 30 días) + 1 USD
	const WOZ_PERCENT = 3.9; // 3,9%
	const USD_FIXED = 1; // 1 USD
	const USD_TO_GS = 7230; // tasa demo

	function formatGs(n) {
		const rounded = Math.round(Number(n) || 0);
		const withDots = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
		return `Gs. ${withDots}`;
	}

	function formatInputThousands(val) {
		// Allow only digits, then insert dot separators; supports any length
		const digits = String(val).replace(/[^0-9]/g, '');
		if (!digits) return '';
		return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
	}

	function calcTotals() {
		const raw = (priceInput?.value || '').replace(/[^0-9]/g, '');
		const priceGs = parseInt(raw || '0', 10);
		const feeGs = priceGs * (WOZ_PERCENT / 100); // Comisión Woz Payments 3,9%
		const feeUsdInGs = USD_FIXED * USD_TO_GS; // Comisión por transacción 1 USD
		const totalToCharge = priceGs - feeGs - feeUsdInGs; // Total a cobrar

		// Update UI cards
		if (feePercentAmount) feePercentAmount.textContent = formatGs(feeGs);
		if (feeTransAmount) feeTransAmount.textContent = formatGs(feeUsdInGs);
		if (totalAmountEl) totalAmountEl.textContent = formatGs(totalToCharge);

		// Update summary text inside the modal
		// Summary content is now split into rows via HTML; only numbers update above.

		return { priceGs, feeGs, feeUsdInGs, totalToCharge };
	}

	function generatePayload() {
		const type = Array.from(typeInputs).find(i => i.checked)?.value || 'link';
		const category = categorySelect.value;
		const title = titleInput.value.trim();
		const price = parseFloat(priceInput.value || '0');
		const details = detailsInput.value.trim();
		const calc = calcTotals();
		const payload = {
			type, category, title, priceGs: price, details,
			fees: { percent: WOZ_PERCENT, usdFixed: USD_FIXED, feeGs: calc.feeGs, feeUsdInGs: calc.feeUsdInGs },
			totalToCharge: calc.totalToCharge
		};
		return payload;
	}

	function buildShareLink(payload) {
		const base = 'https://woz-payments.example/link';
		const params = new URLSearchParams({
			type: payload.type,
			category: payload.category,
			title: payload.title,
			priceGs: String(payload.priceGs),
			details: payload.details,
			total: String(payload.totalToCharge)
		});
		return `${base}?${params.toString()}`;
	}

	function ensureQRBox() {
		qrBox.classList.add('active');
		qrBox.innerHTML = '';
	}

	btnGenerate?.addEventListener('click', (e) => {
		e.preventDefault();
		const payload = generatePayload();
		const link = buildShareLink(payload);
		const type = payload.type;

		// Clear previous outputs
		if (linkOutEl) linkOutEl.innerHTML = '';
		qrBox?.classList.remove('active');
		if (qrBox) qrBox.innerHTML = '';


		// Show loading, then floating result with QR or Link
		loading?.classList.add('active');
		setTimeout(() => {
			loading?.classList.remove('active');
			let html = '';
			if (type === 'qr') {
				html += '<h3>Generaste un QR exitoso</h3>';
				html += '<p>Este QR sirve para cobros internacionales.</p>';
				html += '<div class="woz-qr-center"><div id="wozQRFloat"></div></div>';
				html += '<div class="woz-qr-actions"><button class="woz-download-btn" id="wozDownloadQR">Descargar QR</button></div>';
				html += '<div class="woz-qr-demo">'
					+ '<div class="woz-phone">'
						+ '<div class="woz-phone-header">'
							+ '<div class="woz-avatar" aria-hidden="true"></div>'
							+ '<div class="woz-chat-title">Cliente</div>'
						+ '</div>'
						+ '<div class="woz-phone-screen">'
							+ '<div class="woz-chat" id="wozChat">'
								+ '<div class="woz-bubble out" id="wozBubbleQR">'
									+ '<img class="woz-chat-qr" id="wozChatQRImg" alt="QR de pago"/>'
								+ '</div>'
								+ '<div class="woz-bubble out" id="wozBubbleText"><span>Este es el QR de ventas para que puedas comprar</span></div>'
								+ '<div class="woz-bubble in" id="wozBubbleReply"><span>Holaa, genial te pago ahora</span></div>'
							+ '</div>'
							+ '<div class="woz-typing" id="wozTyping"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>'
							+ '<div class="woz-inputbar">'
								+ '<input type="text" placeholder="Escribir mensaje" readonly />'
								+ '<button class="woz-send" aria-label="Enviar">➤</button>'
							+ '</div>'
						+ '</div>'
					+ '</div>'
				+ '</div>';
				html += '<div class="woz-info-box"><div class="woz-info-title">Compartir</div><p>Podés enviar el QR a WhatsApp, redes sociales o pegarlo en tu web.</p></div>';
			} else {
				html += '<h3>Generaste un Link exitoso</h3>';
				html += '<p>Este Link sirve para cobros internacionales.</p>';
				// Mostrar el link centrado por 3s antes de la demo de chat
				html += `<div class=\"woz-qr-center\"><div class=\"woz-link-box\" id=\"wozLinkFloat\"><span class=\"woz-link-text\">${link}</span><button class=\"woz-copy-btn\" id=\"wozCopyLink\" aria-label=\"Copiar\">📋</button></div></div>`;
				html += '<div class="woz-qr-actions"><button class="woz-download-btn" id="wozCopyLinkSecondary">Copiar Link</button></div>';
				html += '<div class="woz-qr-demo">'
					+ '<div class="woz-phone">'
						+ '<div class="woz-phone-header">'
							+ '<div class="woz-avatar" aria-hidden="true"></div>'
							+ '<div class="woz-chat-title">Cliente</div>'
						+ '</div>'
						+ '<div class="woz-phone-screen">'
							+ '<div class="woz-chat" id="wozChat">'
								+ '<div class="woz-bubble out" id="wozBubbleLink">'
									+ `<div class=\"woz-chat-link\"><div class=\"woz-chat-link-title\">Pago Woz</div><div class=\"woz-chat-link-url\">${link}</div></div>`
								+ '</div>'
								+ '<div class="woz-bubble out" id="wozBubbleText"><span>Te envío el link de pago</span></div>'
								+ '<div class="woz-bubble in" id="wozBubbleReply"><span>Perfecto, pago ahora</span></div>'
							+ '</div>'
							+ '<div class="woz-typing" id="wozTyping"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>'
							+ '<div class="woz-inputbar">'
								+ '<input type="text" placeholder="Escribir mensaje" readonly />'
								+ '<button class="woz-send" aria-label="Enviar">➤</button>'
							+ '</div>'
						+ '</div>'
					+ '</div>'
				+ '</div>';
				html += '<div class="woz-info-box"><div class="woz-info-title">Compartir</div><p>Podés enviar el enlace a WhatsApp, redes sociales o pegarlo en tu web.</p></div>';
			}
			floatingBody.innerHTML = html;
			floating?.classList.add('active');

			// Init QR and download handler
			if (type === 'qr') {
				const floatQR = document.getElementById('wozQRFloat');
				if (floatQR && window.QRCode) {
					try {
						const smallScreen = window.matchMedia('(max-width: 600px)').matches;
						const size = smallScreen ? 200 : 220;
						new QRCode(floatQR, { text: link, width: size, height: size });
					} catch (err) {
						const pre = document.createElement('pre');
						pre.style.whiteSpace = 'pre-wrap';
						pre.style.textAlign = 'center';
						pre.style.fontWeight = '700';
						pre.textContent = link;
						floatQR.appendChild(pre);
					}
				}
				const dlBtn = document.getElementById('wozDownloadQR');
				dlBtn?.addEventListener('click', () => {
					const canvas = floatQR?.querySelector('canvas');
					const img = floatQR?.querySelector('img');
					let dataUrl = '';
					if (canvas) {
						dataUrl = canvas.toDataURL('image/png');
					} else if (img && img.src) {
						dataUrl = img.src;
					}
					if (dataUrl) {
						const a = document.createElement('a');
						a.href = dataUrl;
						a.download = 'woz-qr.png';
						a.click();
					}
				});

				// Chat demo animation using the generated QR
				(function initQrChatDemo() {
					const bubbleQR = document.getElementById('wozBubbleQR');
					const bubbleText = document.getElementById('wozBubbleText');
					const bubbleReply = document.getElementById('wozBubbleReply');
					const typing = document.getElementById('wozTyping');
					const qrImg = document.getElementById('wozChatQRImg');
					const srcCanvas = floatQR?.querySelector('canvas');
					const srcImg = floatQR?.querySelector('img');
					let dataUrl = '';
					if (srcCanvas) {
						try { dataUrl = srcCanvas.toDataURL('image/png'); } catch (_) {}
					} else if (srcImg && srcImg.src) {
						dataUrl = srcImg.src;
					}
					if (qrImg && dataUrl) qrImg.src = dataUrl;

					// Replace standalone QR with phone by hiding the top QR block
					const qrCenter = document.querySelector('.woz-qr-center');
					qrCenter?.classList.add('hidden');

					let t1 = 0, t2 = 0, t3 = 0, t4 = 0, tLoop = 0;
					function play() {
						// reset
						bubbleQR?.classList.remove('show');
						bubbleText?.classList.remove('show');
						bubbleReply?.classList.remove('show');
						typing?.classList.remove('show');
						// force reflow
						void bubbleQR?.offsetWidth;
						// timeline
						t1 = window.setTimeout(() => { bubbleQR?.classList.add('show'); }, 400);
						t2 = window.setTimeout(() => { bubbleText?.classList.add('show'); }, 1200);
						t3 = window.setTimeout(() => { typing?.classList.add('show'); }, 2200);
						t4 = window.setTimeout(() => { typing?.classList.remove('show'); bubbleReply?.classList.add('show'); }, 7200); // after 5s typing
						tLoop = window.setTimeout(play, 12000); // loop
					}
					play();

					// stop on close
					function stop() { [t1,t2,t3,t4,tLoop].forEach(id => window.clearTimeout(id)); }
					floatingClose?.addEventListener('click', stop, { once: true });
					floatingCloseBottom?.addEventListener('click', stop, { once: true });
				})();
			} else {
				const copyBtn = document.getElementById('wozCopyLink');
				const copyBtnSecondary = document.getElementById('wozCopyLinkSecondary');
				const linkBoxCenter = document.getElementById('wozLinkFloat');
				async function doCopy() {
					try {
						await navigator.clipboard.writeText(link);
						if (copyBtn) { copyBtn.textContent = 'Copiado'; setTimeout(() => { copyBtn.textContent = 'Copiar'; }, 1500); }
						if (copyBtnSecondary) { copyBtnSecondary.textContent = 'Copiado'; setTimeout(() => { copyBtnSecondary.textContent = 'Copiar Link'; }, 1500); }
					} catch (_) {
						if (copyBtn) { copyBtn.textContent = 'Error'; setTimeout(() => { copyBtn.textContent = 'Copiar'; }, 1500); }
						if (copyBtnSecondary) { copyBtnSecondary.textContent = 'Error'; setTimeout(() => { copyBtnSecondary.textContent = 'Copiar Link'; }, 1500); }
					}
				}
				copyBtn?.addEventListener('click', doCopy);
				copyBtnSecondary?.addEventListener('click', doCopy);

				// Mostrar link 3s, desvanecerlo y ocultar acciones; luego animación de chat
				(function initLinkChatDemo() {
					const bubbleLink = document.getElementById('wozBubbleLink');
					const bubbleText = document.getElementById('wozBubbleText');
					const bubbleReply = document.getElementById('wozBubbleReply');
					const typing = document.getElementById('wozTyping');
					const qrActions = document.querySelector('.woz-qr-actions');
					const center = document.querySelector('.woz-qr-center');

					let timers = [];
					function holdAndFadeCenter() {
						timers.push(setTimeout(() => {
							center?.classList.add('woz-fade-out');
							qrActions?.classList.add('woz-fade-out');
						}, 3000));
						timers.push(setTimeout(() => {
							center?.classList.add('woz-hidden');
							qrActions?.classList.add('woz-hidden');
						}, 3800));
					}

					function play() {
						bubbleLink?.classList.remove('show');
						bubbleText?.classList.remove('show');
						bubbleReply?.classList.remove('show');
						typing?.classList.remove('show');
						void bubbleLink?.offsetWidth;

						holdAndFadeCenter();
						timers.push(setTimeout(() => { bubbleLink?.classList.add('show'); }, 4200));
						timers.push(setTimeout(() => { bubbleText?.classList.add('show'); }, 5000));
						timers.push(setTimeout(() => { typing?.classList.add('show'); }, 5900));
						timers.push(setTimeout(() => { typing?.classList.remove('show'); bubbleReply?.classList.add('show'); }, 10900));
						timers.push(setTimeout(play, 15000));
					}
					play();

					function stop() { timers.forEach(id => clearTimeout(id)); }
					floatingClose?.addEventListener('click', stop, { once: true });
					floatingCloseBottom?.addEventListener('click', stop, { once: true });
				})();
			}
		}, 800);
	});

	floatingClose?.addEventListener('click', () => { floating?.classList.remove('active'); });
	floatingCloseBottom?.addEventListener('click', () => { floating?.classList.remove('active'); });

	// Live updates
	[titleInput, detailsInput].forEach(el => el?.addEventListener('input', calcTotals));
	priceInput?.addEventListener('input', () => {
		// Format input with thousands separators while typing
		const cursorPos = priceInput.selectionStart;
		const before = priceInput.value;
		priceInput.value = formatInputThousands(priceInput.value);
		calcTotals();
		// Try to maintain cursor near the end for simplicity
		try { priceInput.selectionStart = priceInput.selectionEnd = cursorPos; } catch (_) {}
	});
	categorySelect?.addEventListener('change', () => {
		if (categoryLabel) categoryLabel.textContent = categorySelect.value;
		calcTotals();
	});
	function syncButtonLabel() {
		const selectedType = Array.from(typeInputs).find(i => i.checked)?.value || 'link';
		if (selectedType === 'qr') {
			btnGenerate.textContent = 'Genera un QR de pago';
		} else {
			btnGenerate.textContent = 'Genera un link de pago';
		}
	}
	typeInputs.forEach(inp => inp.addEventListener('change', () => {
		// reset QR/link areas; recalc remains the same
		if (linkOutEl) linkOutEl.innerHTML = '';
		qrBox?.classList.remove('active');
		if (qrBox) qrBox.innerHTML = '';
		syncButtonLabel();
	}));
	// Switch control mirrors radios
	typeSwitch?.addEventListener('change', () => {
		const isQR = typeSwitch.checked;
		Array.from(typeInputs).forEach(i => { i.checked = (i.value === (isQR ? 'qr' : 'link')); });
		syncButtonLabel();
	});

	// Initial
	if (categoryLabel && categorySelect) categoryLabel.textContent = categorySelect.value;
	syncButtonLabel();
	calcTotals();

	// Hero animated demo: QR/Link + device selector
	(function initHeroDemo() {
    const demo = document.getElementById('wozHeroDemo');
    if (!demo) return;
    const typeBtns = document.querySelectorAll('.demo-type-btn');
    const deviceBtns = document.querySelectorAll('.device-btn');
    const bubbleMain = document.getElementById('heroBubbleMain');
    const bubbleText = document.getElementById('heroBubbleText');
    const bubbleReply = document.getElementById('heroBubbleReply');
    const typing = document.getElementById('heroTyping');
    const qrImg = document.getElementById('heroQRImg');
    const linkBox = document.getElementById('heroLinkBox');
    const linkText = document.getElementById('heroLinkText');
    const titleEl = document.getElementById('heroDemoTitle');
    const frame = document.getElementById('heroDeviceFrame');

    function setType(type) {
        demo.dataset.type = type;
        typeBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-type') === type));
        typeBtns.forEach(b => b.setAttribute('aria-pressed', String(b.classList.contains('active'))));
        if (type === 'qr') {
            titleEl.textContent = 'Generar un QR para tu cliente';
            qrImg.style.display = 'block';
            linkBox.style.display = 'none';
            bubbleText.querySelector('span').textContent = 'Holaa, este es el QR para que pagues';
            ensureDemoQR();
        } else {
            titleEl.textContent = 'Generar un Link de ventas para tu cliente';
            qrImg.style.display = 'none';
            linkBox.style.display = 'block';
            bubbleText.querySelector('span').textContent = 'Holaa, este es el link para que pagues';
        }
    }
    function setDevice(device) {
        demo.dataset.device = device;
        deviceBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-device') === device));
        deviceBtns.forEach(b => b.setAttribute('aria-selected', String(b.classList.contains('active'))));
        frame.classList.remove('phone', 'tablet', 'laptop');
        frame.classList.add(device);
    }
    typeBtns.forEach(b => b.addEventListener('click', () => setType(b.getAttribute('data-type'))));
    deviceBtns.forEach(b => b.addEventListener('click', () => setDevice(b.getAttribute('data-device'))));

    // QR SVG detallado (no solo cuadrado)
    function ensureDemoQR() {
        qrImg.innerHTML = `
        <svg width="110" height="110" viewBox="0 0 110 110">
            <rect x="0" y="0" width="110" height="110" rx="16" fill="#fff"/>
            <rect x="8" y="8" width="24" height="24" rx="5" fill="#111"/>
            <rect x="78" y="8" width="24" height="24" rx="5" fill="#111"/>
            <rect x="8" y="78" width="24" height="24" rx="5" fill="#111"/>
            <rect x="38" y="38" width="34" height="34" fill="#111"/>
            <rect x="50" y="50" width="10" height="10" fill="#fff"/>
            <rect x="85" y="45" width="10" height="10" fill="#111"/>
            <rect x="45" y="85" width="10" height="10" fill="#111"/>
            <rect x="65" y="85" width="10" height="10" fill="#111"/>
            <rect x="85" y="65" width="10" height="10" fill="#111"/>
            <rect x="25" y="55" width="6" height="6" fill="#111"/>
            <rect x="55" y="25" width="6" height="6" fill="#111"/>
        </svg>
        `;
    }
    // Demo link
    function ensureDemoLink() {
        linkText.textContent = 'https://woz-payments.example/link?demo=1';
    }

    // Animación de chat
    let t1=0,t2=0,t3=0,t4=0,tLoop=0;
    function play() {
        bubbleMain.classList.remove('show');
        bubbleText.classList.remove('show');
        bubbleReply.classList.remove('show');
        typing.classList.remove('show');
        void bubbleMain.offsetWidth;
        setType(demo.dataset.type); // actualiza QR/Link
        t1 = window.setTimeout(() => { bubbleMain.classList.add('show'); }, 300);
        t2 = window.setTimeout(() => { bubbleText.classList.add('show'); }, 1100);
        t3 = window.setTimeout(() => { typing.classList.add('show'); }, 2000);
        t4 = window.setTimeout(() => {
            typing.classList.remove('show');
            bubbleReply.classList.add('show');
        }, 3200);
        tLoop = window.setTimeout(play, 6000);
    }
    play();
    function stop() { [t1,t2,t3,t4,tLoop].forEach(id => window.clearTimeout(id)); }
    // Si abres modal, puedes pausar animación aquí si quieres

    // defaults
    setType('qr');
    setDevice('phone');
})();

// --- Pricing Carousel Logic ---
const pricingCarousel = document.getElementById('pricingCarousel');

if (pricingCarousel) {
  const track = pricingCarousel.querySelector('.carousel-track');
  const cards = pricingCarousel.querySelectorAll('.pricing-card');
	const prevBtn = pricingCarousel.querySelector('.carousel-btn.prev');
	const nextBtn = pricingCarousel.querySelector('.carousel-btn.next');
	const tabButtons = pricingCarousel.querySelectorAll('.pricing-tab-button');

  let index = 0;
  const total = cards.length;

  function isMobile() {
    return window.innerWidth <= 600;
  }

	function update() {
		if (!isMobile()) {
			track.style.transform = '';
			return;
		}

		const card = cards[0];
		if (!card) return;
		// card width and gap
		const cardRect = card.getBoundingClientRect();
		const gap = parseFloat(getComputedStyle(track).gap) || 24;
		const slideWidth = cardRect.width + gap;

		// center active card in the carousel container
		const containerRect = pricingCarousel.getBoundingClientRect();
		const containerWidth = containerRect.width;

		// Compute translate so that current card is centered
		const centerOffset = (containerWidth - cardRect.width) / 2;
		const translate = Math.round(index * slideWidth - centerOffset);
		track.style.transform = `translateX(${-translate}px)`;
	}

  function next() {
    if (index < total - 1) {
      index++;
      update();
    }
  }

  function prev() {
    if (index > 0) {
      index--;
      update();
    }
  }

	prevBtn?.addEventListener('click', prev);
	nextBtn?.addEventListener('click', next);

	// Tabs selection (Básico / Estándar / Premium)
	function setTabActive(i) {
		tabButtons.forEach((b, idx) => {
			const isActive = idx === i;
			b.classList.toggle('active', isActive);
			b.setAttribute('aria-selected', String(isActive));
		});
	}
	tabButtons.forEach(btn => {
		btn.addEventListener('click', () => {
			const i = Number(btn.getAttribute('data-index')) || 0;
			index = Math.min(Math.max(0, i), total - 1);
			update();
			setTabActive(index);
		});
	});

  // Swipe móvil
  let startX = 0;

  track.addEventListener('touchstart', e => {
    if (!isMobile()) return;
    startX = e.touches[0].clientX;
  });

  track.addEventListener('touchend', e => {
    if (!isMobile()) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (dx < -50) next();
    if (dx > 50) prev();
  });

	window.addEventListener('resize', () => {
		index = Math.min(index, total - 1);
		update();
	});

	// Estado inicial: mostrar la primera tarjeta (Básico) y activar pestaña
	index = 0;
	update();
	setTabActive(0);
}

// Generar QR grande y nítido en el demo
function renderHeroQR(text) {
  const qrContainer = document.getElementById('heroQRImg');
  qrContainer.innerHTML = '';
	try {
		new QRCode(qrContainer, {
			text: text,
			width: 140,
			height: 140,
			colorDark: "#111",
			colorLight: "#fff",
			correctLevel: QRCode.CorrectLevel.H
		});
	} catch (err) {
		qrContainer.textContent = text;
	}
}});
