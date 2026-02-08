import { getMimeType } from "./server";

describe("Server module", () => {
    test("Get mime type", () => {
        expect(getMimeType(".foo")).toBe("text/plain");

        expect(getMimeType(".html")).toBe("text/html");
        expect(getMimeType(".css")).toBe("text/css");
        expect(getMimeType(".js")).toBe("text/javascript");
        expect(getMimeType(".json")).toBe("application/json");
        expect(getMimeType(".jpg")).toBe("image/jpeg");
        expect(getMimeType(".png")).toBe("image/png");
        expect(getMimeType(".svg")).toBe("image/svg+xml");
    });
});