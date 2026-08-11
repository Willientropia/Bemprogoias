import { describe, expect, it } from "vitest";
import { whatsappNumber, whatsappUrl } from "../../src/utils/whatsapp";

describe("whatsapp", () => {
  it("normaliza um número brasileiro com DDD", () => {
    expect(whatsappNumber("(62) 9 9123-4567")).toBe("5562991234567");
  });

  it("preserva o código do país quando já foi informado", () => {
    expect(whatsappNumber("+55 62 99123-4567")).toBe("5562991234567");
  });

  it("monta o link direto com a mensagem codificada", () => {
    expect(whatsappUrl("(62) 9 9123-4567", "Olá, Patrícia!"))
      .toBe("https://wa.me/5562991234567?text=Ol%C3%A1%2C%20Patr%C3%ADcia!");
  });
});
