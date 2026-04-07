import { EventEmitter } from "events";
import { jest } from "@jest/globals";

const mockRegisterPOSTHandler = jest.fn();
const mockDbInit = jest.fn();
const mockListen = jest.fn((port, host, callback) => {
  if (typeof callback === "function") {
    callback();
  }
});
const mockCreateHTTPServer = jest.fn(() => ({ listen: mockListen }));
const mockSpawn = jest.fn(() => {
  const process = new EventEmitter();
  process.stdout = new EventEmitter();
  process.stdout.setEncoding = jest.fn();
  process.stderr = new EventEmitter();
  return process;
});

jest.unstable_mockModule("./server/server.js", () => ({
  createHTTPServer: mockCreateHTTPServer,
  registerPOSTHandler: mockRegisterPOSTHandler,
}));
jest.unstable_mockModule("./dbManagement/index.js", () => ({
  init: mockDbInit,
}));
jest.unstable_mockModule("child_process", () => ({
  spawn: mockSpawn,
}));

function createMockResponse() {
  const res = {
    setHeader: jest.fn(),
    writeHead: jest.fn(() => res),
    end: jest.fn(() => res),
  };
  return res;
}

function getRegisteredHandler(route) {
  const registration = mockRegisterPOSTHandler.mock.calls.find(([path]) => path === route);
  if (!registration) {
    throw new Error(`No handler registered for route: ${route}`);
  }
  return registration[1];
}

beforeAll(async () => {
  await import("./index.js");
});

describe("Quiz API in index.js", () => {
  test("registers POST /api/quiz", () => {
    expect(mockRegisterPOSTHandler).toHaveBeenCalledWith("/api/quiz", expect.any(Function));
  });

  test("returns 400 for invalid quiz answers payload", async () => {
    const handler = getRegisteredHandler("/api/quiz");
    const req = new EventEmitter();
    const res = createMockResponse();

    handler(req, res);
    req.emit("data", JSON.stringify({ answers: ["not-a-number"] }));
    req.emit("end");

    await new Promise((resolve) => setImmediate(resolve));

    expect(res.writeHead).toHaveBeenCalledWith(400);
    expect(res.end).toHaveBeenCalledWith("Invalid quiz payload");
  });

  test("returns 400 when recommendation step fails", async () => {
    const handler = getRegisteredHandler("/api/quiz");
    const req = new EventEmitter();
    const res = createMockResponse();
    const process = mockSpawn();

    mockSpawn.mockReturnValueOnce(process);

    handler(req, res);
    req.emit("data", JSON.stringify({ answers: [1] }));
    req.emit("end");
    process.stderr.emit("data", "model error");

    await new Promise((resolve) => setImmediate(resolve));

    expect(res.writeHead).toHaveBeenCalledWith(400);
    expect(res.end).toHaveBeenCalledWith("Invalid quiz payload");
  });
});
