import { chromium } from "playwright";

const BASE = "http://localhost:3001";
const SALON = "demo-salon";

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function screenshot(page, name) {
  await page.screenshot({ path: `scripts/screenshots/${name}.png`, fullPage: false });
  console.log(`📸 ${name}.png`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  try {
    // ── 1. Página inicial do booking ───────────────────────────────────────────
    console.log("\n🔍 1. Acessando site de agendamento...");
    await page.goto(`${BASE}/book/${SALON}`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "01-booking-home");

    const title = await page.textContent("h1");
    console.log(`   Salão: ${title}`);

    // ── 2. Seletor de cabelo ───────────────────────────────────────────────────
    console.log("\n🔍 2. Selecionando tipo de cabelo...");
    // Clica no primeiro botão de tipo de cabelo disponível
    const hairBtn = page.locator("button").filter({ hasText: /liso|ondulado|cacheado|crespo/i }).first();
    if (await hairBtn.count() === 0) {
      // Tenta botão genérico de confirmação do seletor
      const anyBtn = page.locator("button").nth(0);
      await anyBtn.click();
    } else {
      await hairBtn.click();
    }
    await sleep(500);

    // Comprimento do cabelo
    const lengthBtn = page.locator("button").filter({ hasText: /curto|médio|longo/i }).first();
    if (await lengthBtn.count() > 0) await lengthBtn.click();
    await sleep(500);

    // Confirmar seleção
    const confirmBtn = page.locator("button").filter({ hasText: /confirmar|continuar|ver serviços/i }).first();
    if (await confirmBtn.count() > 0) await confirmBtn.click();
    await sleep(1000);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "02-hair-selected");

    // ── 3. Catálogo de serviços ────────────────────────────────────────────────
    console.log("\n🔍 3. Selecionando serviço...");
    await sleep(500);

    // Os cards de serviço são <Link> (tag <a>) que levam para /book/slug/book?serviceId=...
    const serviceLink = page.locator("a[href*='/book?serviceId=']").first();
    await serviceLink.waitFor({ timeout: 10000 });
    const serviceName = await serviceLink.locator("span.font-semibold, [class*='font-semibold']").first().textContent().catch(() => "serviço");
    console.log(`   Serviço: ${serviceName?.trim()}`);
    await serviceLink.click();
    await sleep(1000);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "03-service-selected");

    // ── 4. Seleção de profissional ────────────────────────────────────────────
    console.log("\n🔍 4. Selecionando profissional...");
    // Se já estiver no calendário (step auto-avançou), não precisa clicar
    const isOnCalendar = await page.locator("text=Escolha a data").count();
    if (!isOnCalendar) {
      // Clica no primeiro card de profissional (CSS selector, sem depender de texto com acento)
      const profCard = page.locator("div.grid button, button.rounded-2xl").first();
      await profCard.waitFor({ timeout: 8000 });
      await profCard.click();
      await sleep(800);
    } else {
      console.log("   (passo de profissional já foi avançado automaticamente)");
    }
    await screenshot(page, "04-professional-selected");

    // ── 5. Seleção de data ─────────────────────────────────────────────────────
    console.log("\n🔍 5. Selecionando data...");
    // Clica em dia 10 (futuro, sabemos que tem horários disponíveis)
    await page.locator("text=Escolha a data").waitFor({ timeout: 8000 });
    const dayBtn = page.locator("button:not([disabled])").filter({ hasText: /^10$/ }).first();
    await dayBtn.waitFor({ timeout: 5000 });
    console.log("   Dia: 10");
    await dayBtn.click();
    await sleep(600);
    await screenshot(page, "05-date-selected");

    // ── 6. Seleção de horário ──────────────────────────────────────────────────
    console.log("\n🔍 6. Aguardando horários carregarem...");
    // Espera botão real de slot (tem texto HH:MM, não é skeleton)
    const slotBtn = page.locator("button").filter({ hasText: /^[0-9]{2}:[0-9]{2}$/ }).first();
    await slotBtn.waitFor({ timeout: 15000 });
    const slotText = await slotBtn.textContent();
    console.log(`   Horário: ${slotText?.trim()}`);
    await slotBtn.click();
    await sleep(800);
    await screenshot(page, "05-slot-selected");

    // ── 7. Dados pessoais ──────────────────────────────────────────────────────
    console.log("\n🔍 7. Preenchendo dados da cliente...");
    const nameInput = page.locator("input[name='name'], input[placeholder*='nome'], input[id*='name']").first();
    const phoneInput = page.locator("input[name='phone'], input[placeholder*='telefone'], input[type='tel']").first();

    if (await nameInput.count() > 0) {
      await nameInput.fill("Maria Teste");
      console.log("   Nome: Maria Teste");
    }
    if (await phoneInput.count() > 0) {
      await phoneInput.fill("(21) 99999-9999");
      console.log("   Telefone: (21) 99999-9999");
    }
    await screenshot(page, "06-personal-info");

    // ── 8. Confirmar agendamento ───────────────────────────────────────────────
    console.log("\n🔍 8. Confirmando agendamento...");
    const submitBtn = page.locator("button[type='submit'], button").filter({ hasText: /confirmar|agendar/i }).last();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await sleep(2000);
      await page.waitForLoadState("networkidle");
    }
    await screenshot(page, "07-confirmation");

    const pageContent = await page.textContent("body");
    const confirmed = pageContent?.toLowerCase().includes("confirmado") ||
                      pageContent?.toLowerCase().includes("agendado") ||
                      pageContent?.toLowerCase().includes("sucesso");
    console.log(`\n${confirmed ? "✅" : "⚠️ "} Confirmação na tela: ${confirmed ? "SIM" : "NÃO detectada"}`);

    // ── 9. Verifica no painel admin ────────────────────────────────────────────
    console.log("\n🔍 9. Verificando no painel admin...");
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState("networkidle");

    await page.fill("input[id='salonSlug'], input[placeholder='meu-salao']", "demo-salon");
    await page.fill("input[type='email']", "admin@demo-salon.com");
    await page.fill("input[type='password']", "senha123");
    await page.locator("button[type='submit']").click();
    await sleep(2000);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "08-admin-dashboard");

    await page.goto(`${BASE}/dashboard/appointments`);
    await page.waitForLoadState("networkidle");
    await sleep(1000);
    await screenshot(page, "09-appointments-list");

    const hasMaria = (await page.textContent("body"))?.includes("Maria");
    console.log(`\n${hasMaria ? "✅" : "⚠️ "} Agendamento no painel admin: ${hasMaria ? "SIM — Maria Teste aparece" : "NÃO encontrado"}`);

    console.log("\n✅ Teste concluído. Screenshots em scripts/screenshots/");

  } catch (err) {
    console.error("\n❌ Erro:", err.message);
    await screenshot(page, "error-state").catch(() => {});
  } finally {
    await browser.close();
  }
})();
