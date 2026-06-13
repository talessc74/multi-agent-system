import { describe, it, expect } from "vitest";
import {
  buildInterpreterPrompt,
  interpretJudgmentForSide,
} from "../lib/judgment-interpreter";

// ── 1. Testes puros — construção do prompt (sem Gemini) ───────────────────────

describe("buildInterpreterPrompt — construção do prompt", () => {
  const judgment = "O Autor tem 80% de chance de procedência do pedido.";

  it("prompt para AUTHOR menciona AUTOR", () => {
    const prompt = buildInterpreterPrompt(judgment, "AUTHOR");
    expect(prompt).toContain("AUTOR");
    expect(prompt).toContain(judgment);
  });

  it("prompt para DEFENSE menciona RÉU (DEFESA)", () => {
    const prompt = buildInterpreterPrompt(judgment, "DEFENSE");
    expect(prompt).toContain("RÉU (DEFESA)");
    expect(prompt).toContain(judgment);
  });

  it("prompt inclui a sentença completa", () => {
    const long = "Sentença longa com fundamentação técnica e referência a lei 9.029/1995.";
    const prompt = buildInterpreterPrompt(long, "AUTHOR");
    expect(prompt).toContain(long);
  });

  it("prompts para AUTHOR e DEFENSE diferem na parte avaliada", () => {
    const pA = buildInterpreterPrompt(judgment, "AUTHOR");
    const pD = buildInterpreterPrompt(judgment, "DEFENSE");
    expect(pA).not.toBe(pD);
    expect(pA).toContain("AUTOR");
    expect(pD).toContain("RÉU (DEFESA)");
  });

  it("prompt pede probabilidade do lado correto — AUTHOR", () => {
    const prompt = buildInterpreterPrompt(judgment, "AUTHOR");
    expect(prompt).toContain("chance de êxito do AUTOR");
  });

  it("prompt pede probabilidade do lado correto — DEFENSE", () => {
    const prompt = buildInterpreterPrompt(judgment, "DEFENSE");
    expect(prompt).toContain("chance de êxito do RÉU (DEFESA)");
  });
});

// ── 2. Testes de integração com Gemini (requerem GEMINI_API_KEY) ──────────────
//
// Rodam automaticamente quando GEMINI_API_KEY está no ambiente.
// Critério: margem de ±15 pontos é aceitável (Gemini não é determinístico).
// O que NÃO pode acontecer: inversão total (e.g. retornar 80 quando esperado é 20).

const MARGIN = 15;

describe.skipIf(!process.env.GEMINI_API_KEY)(
  "interpretJudgmentForSide — integração com Gemini",
  () => {
    it(
      "AUTHOR: sentença favorável ao autor → probabilidade alta",
      async () => {
        const judgment =
          "O Autor demonstrou cabalmente a violação contratual. " +
          "A documentação apresentada comprova os fatos alegados. " +
          "A probabilidade de procedência do pedido do Autor é estimada em 80%.";
        const prob = await interpretJudgmentForSide(judgment, "AUTHOR");
        expect(prob).toBeGreaterThanOrEqual(80 - MARGIN);
        expect(prob).toBeLessThanOrEqual(80 + MARGIN);
      },
      20000
    );

    it(
      "DEFENSE: mesma sentença favorável ao autor → probabilidade baixa para réu",
      async () => {
        const judgment =
          "O Autor demonstrou cabalmente a violação contratual. " +
          "A documentação apresentada comprova os fatos alegados. " +
          "A probabilidade de procedência do pedido do Autor é estimada em 80%.";
        const prob = await interpretJudgmentForSide(judgment, "DEFENSE");
        expect(prob).toBeGreaterThanOrEqual(20 - MARGIN);
        expect(prob).toBeLessThanOrEqual(20 + MARGIN);
      },
      20000
    );

    it(
      "DEFENSE: sentença favorável ao réu → probabilidade alta",
      async () => {
        const judgment =
          "A contestação do Réu foi sólida e derrubou os principais argumentos da petição inicial. " +
          "O Réu não incorreu em qualquer ilegalidade. " +
          "Estimo em 85% a chance de êxito do Réu nesta demanda.";
        const prob = await interpretJudgmentForSide(judgment, "DEFENSE");
        expect(prob).toBeGreaterThanOrEqual(85 - MARGIN);
        expect(prob).toBeLessThanOrEqual(85 + MARGIN);
      },
      20000
    );

    it(
      "AUTHOR: mesma sentença favorável ao réu → probabilidade baixa para autor",
      async () => {
        const judgment =
          "A contestação do Réu foi sólida e derrubou os principais argumentos da petição inicial. " +
          "O Réu não incorreu em qualquer ilegalidade. " +
          "Estimo em 85% a chance de êxito do Réu nesta demanda.";
        const prob = await interpretJudgmentForSide(judgment, "AUTHOR");
        expect(prob).toBeGreaterThanOrEqual(15 - MARGIN);
        expect(prob).toBeLessThanOrEqual(15 + MARGIN);
      },
      20000
    );

    it(
      "AUTHOR: sentença equilibrada com leve vantagem ao autor → ~60",
      async () => {
        const judgment =
          "Ambas as partes apresentaram argumentos relevantes. " +
          "Contudo, o Autor trouxe documentação mais robusta. " +
          "Estimo 60% de chance de procedência do pedido do Autor e 40% de êxito do Réu.";
        const prob = await interpretJudgmentForSide(judgment, "AUTHOR");
        expect(prob).toBeGreaterThanOrEqual(60 - MARGIN);
        expect(prob).toBeLessThanOrEqual(60 + MARGIN);
      },
      20000
    );

    it(
      "DEFENSE: sentença equilibrada com leve vantagem ao autor → ~40 para defesa",
      async () => {
        const judgment =
          "Ambas as partes apresentaram argumentos relevantes. " +
          "Contudo, o Autor trouxe documentação mais robusta. " +
          "Estimo 60% de chance de procedência do pedido do Autor e 40% de êxito do Réu.";
        const prob = await interpretJudgmentForSide(judgment, "DEFENSE");
        expect(prob).toBeGreaterThanOrEqual(40 - MARGIN);
        expect(prob).toBeLessThanOrEqual(40 + MARGIN);
      },
      20000
    );
  }
);
