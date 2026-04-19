import { beforeEach, describe, expect, it, vi } from "vitest";
import { ModernMultiplayerService } from "@/features/multiplayer/modern/services/modernMultiplayerService";
import {
  PasswordError,
  RoomCodeGenerationError,
  RoomFullError,
  RoomNotFoundError,
  ValidationError,
} from "@/features/multiplayer/modern/errors/MultiplayerErrors";

const mocks = vi.hoisted(() => {
  return {
    mockCollection: vi.fn(),
    mockDoc: vi.fn(),
    mockSetDoc: vi.fn(async () => undefined),
    mockGetDoc: vi.fn(),
    mockGetDocs: vi.fn(),
    mockQuery: vi.fn(),
    mockWhere: vi.fn(),
    mockLimit: vi.fn(),
    mockOrderBy: vi.fn(),
    mockServerTimestamp: vi.fn(() => new Date()),
    mockSet: vi.fn(async () => undefined),
    mockUpdate: vi.fn(async () => undefined),
    mockRemove: vi.fn(async () => undefined),
    mockGet: vi.fn(),
    mockRef: vi.fn((_db: unknown, path: string) => ({ path })),
    mockOnDisconnect: vi.fn(),
    disconnectRefs: [] as Array<{
      update: ReturnType<typeof vi.fn>;
      cancel: ReturnType<typeof vi.fn>;
    }>,
    mockGetAuth: vi.fn(() => ({
      currentUser: { uid: "user-1", displayName: "Test User", photoURL: null },
    })),
    mockCanPerform: vi.fn(() => true),
    mockGetRemaining: vi.fn(() => 1000),
    mockRetryWithBackoff: vi.fn(async (fn: () => Promise<unknown>) => fn()),
    mockEnsureOnline: vi.fn(),
  };
});

vi.mock("firebase/database", () => ({
  getDatabase: vi.fn(() => ({})),
  ref: mocks.mockRef,
  set: mocks.mockSet,
  update: mocks.mockUpdate,
  remove: mocks.mockRemove,
  get: mocks.mockGet,
  onValue: vi.fn(() => vi.fn()),
  push: vi.fn(() => ({ key: "mock-key" })),
  onDisconnect: mocks.mockOnDisconnect,
  runTransaction: vi.fn(async () => ({
    committed: true,
    snapshot: { val: () => null },
  })),
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => ({})),
  doc: mocks.mockDoc,
  collection: mocks.mockCollection,
  setDoc: mocks.mockSetDoc,
  getDoc: mocks.mockGetDoc,
  getDocs: mocks.mockGetDocs,
  query: mocks.mockQuery,
  where: mocks.mockWhere,
  orderBy: mocks.mockOrderBy,
  limit: mocks.mockLimit,
  serverTimestamp: mocks.mockServerTimestamp,
  Timestamp: { now: vi.fn(() => ({ seconds: 0, nanoseconds: 0 })) },
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
}));

vi.mock("firebase/auth", () => ({
  getAuth: mocks.mockGetAuth,
}));

vi.mock("@/features/multiplayer/modern/utils/rateLimiter", () => ({
  rateLimiter: {
    canPerform: mocks.mockCanPerform,
    getRemaining: mocks.mockGetRemaining,
  },
}));

vi.mock("@/features/multiplayer/modern/utils/retry", () => ({
  retryWithBackoff: mocks.mockRetryWithBackoff,
  retryStrategies: {
    standard: { maxRetries: 0 },
    critical: { maxRetries: 0 },
  },
}));

vi.mock("@/features/multiplayer/modern/utils/networkMonitor", () => ({
  networkMonitor: {
    ensureOnline: mocks.mockEnsureOnline,
    on: vi.fn(() => "listener-id"),
    off: vi.fn(),
  },
}));

vi.mock("@/features/multiplayer/modern/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("ModernMultiplayerService target methods", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.disconnectRefs.length = 0;

    mocks.mockOnDisconnect.mockImplementation(() => {
      const refObj = {
        update: vi.fn(async () => undefined),
        cancel: vi.fn(async () => undefined),
      };
      mocks.disconnectRefs.push(refObj);
      return refObj;
    });

    mocks.mockCanPerform.mockReturnValue(true);
    mocks.mockGet.mockResolvedValue({ val: () => false });

    mocks.mockCollection.mockImplementation(
      (_db: unknown, ...segments: string[]) => {
        return { path: segments.join("/") };
      },
    );

    mocks.mockDoc.mockImplementation((...args: any[]) => {
      if (args.length === 1 && args[0]?.path === "multiplayer_rooms") {
        return { id: "room-new", path: "multiplayer_rooms/room-new" };
      }

      if (args.length >= 3) {
        return { id: args[2], path: `${args[1]}/${args[2]}` };
      }

      return { id: "doc-id", path: "unknown" };
    });

    mocks.mockWhere.mockReturnValue({});
    mocks.mockLimit.mockReturnValue({});
    mocks.mockOrderBy.mockReturnValue({});
    mocks.mockQuery.mockReturnValue({});
    mocks.mockGetDocs.mockResolvedValue({
      empty: true,
      size: 0,
      docs: [],
      forEach: vi.fn(),
    });

    mocks.mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: "quiz-1",
      data: () => ({
        title: "Quiz 1",
        description: "<p>Demo</p>",
        category: "General",
        difficulty: "Medium",
        timeLimit: 30,
        questions: [
          {
            id: "q1",
            question: "Q1",
            options: ["A", "B", "C", "D"],
            correctAnswer: 0,
            points: 100,
            timeLimit: 30,
          },
        ],
      }),
    });
  });

  // ===== Test cho ham: randomCode =====
  it("returns a 6-character uppercase alphanumeric code", () => {
    // TC: UT-MMS-01 | randomCodeFormat
    // Muc tieu: Dam bao randomCode tao ma phong dung format.
    // Expected tu spec: do dai = 6 va chi gom A-Z, 0-9.

    const service = new ModernMultiplayerService() as any;
    const code = service.randomCode();

    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });

  // ===== Test cho ham: generateRoomCode =====
  it("returns code immediately when first generated code is unique", async () => {
    // TC: UT-MMS-02 | generateRoomCodeUniqueFirstTry
    // Muc tieu: Dam bao generateRoomCode tra ve ngay khi code chua ton tai.
    // Expected tu spec: getDocs empty=true -> tra ve ma vua random.

    const service = new ModernMultiplayerService() as any;
    vi.spyOn(service, "randomCode").mockReturnValue("AB12CD");
    mocks.mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] });

    const result = await service.generateRoomCode();
    expect(result).toBe("AB12CD");
  });

  // ===== Test cho ham: generateRoomCode =====
  it("retries when duplicated code is found, then returns next unique code", async () => {
    // TC: UT-MMS-03 | generateRoomCodeRetryOnDuplicate
    // Muc tieu: Dam bao generateRoomCode thu lai khi code trung.
    // Expected tu spec: lan 1 empty=false, lan 2 empty=true -> tra ve code lan 2.

    const service = new ModernMultiplayerService() as any;
    const randomSpy = vi.spyOn(service, "randomCode");
    randomSpy.mockReturnValueOnce("AAAAAA").mockReturnValueOnce("BBBBBB");

    mocks.mockGetDocs
      .mockResolvedValueOnce({ empty: false, docs: [{ id: "room-exists" }] })
      .mockResolvedValueOnce({ empty: true, docs: [] });

    const result = await service.generateRoomCode();
    expect(result).toBe("BBBBBB");
    expect(randomSpy).toHaveBeenCalledTimes(2);
  });

  // ===== Test cho ham: findRoomByCode =====
  it("returns room id when room code exists", async () => {
    // TC: UT-MMS-04 | findRoomByCodeFound
    // Muc tieu: Dam bao findRoomByCode tra ve id phong khi tim thay.
    // Expected tu spec: snapshot.empty=false -> tra ve { id }.

    const service = new ModernMultiplayerService();
    mocks.mockGetDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: "room-123" }],
    });

    await expect(service.findRoomByCode("ABC123")).resolves.toEqual({
      id: "room-123",
    });
  });

  // ===== Test cho ham: findRoomByCode =====
  it("returns null when room code does not exist", async () => {
    // TC: UT-MMS-05 | findRoomByCodeNotFound
    // Muc tieu: Dam bao findRoomByCode tra null khi khong tim thay.
    // Expected tu spec: snapshot.empty=true -> null.

    const service = new ModernMultiplayerService();
    mocks.mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] });

    await expect(service.findRoomByCode("ZZZZZZ")).resolves.toBeNull();
  });

  // ===== Test cho ham: createRoom =====
  it("creates room successfully and returns roomId + roomCode", async () => {
    // TC: UT-MMS-06 | createRoomSuccess
    // Muc tieu: Dam bao createRoom tao phong thanh cong.
    // Expected tu spec: tra ve { roomId, roomCode } va co ghi setDoc.

    const service = new ModernMultiplayerService() as any;
    vi.spyOn(service, "generateRoomCode").mockResolvedValue("ROOM01");
    vi.spyOn(service, "setupListeners").mockImplementation(() => undefined);

    const result = await service.createRoom("Test Room", "quiz-1", 4, false);

    expect(result).toEqual({ roomId: "room-new", roomCode: "ROOM01" });
    expect(mocks.mockSetDoc).toHaveBeenCalled();
    expect(mocks.mockSet).toHaveBeenCalledWith(
      { path: "rooms/room-new" },
      expect.objectContaining({
        id: "room-new",
        code: "ROOM01",
        hostId: "user-1",
      }),
    );
  });

  // ===== Test cho ham: createRoom =====
  it("rejects createRoom when room name is blank", async () => {
    // TC: UT-MMS-07 | createRoomInvalidName
    // Muc tieu: Dam bao createRoom validate roomName.
    // Expected tu spec: roomName rong -> throw ValidationError.

    const service = new ModernMultiplayerService() as any;
    await expect(service.createRoom("   ", "quiz-1")).rejects.toThrowError();
  });

  // ===== Test cho ham: createRoom =====
  it("rejects createRoom when room name is too long", async () => {
    // TC: UT-MMS-11 | createRoomVeryLongName
    // Muc tieu: Dam bao createRoom chan roomName qua gioi han do dai.
    // Expected tu spec: roomName.length > 50 -> ValidationError.

    const service = new ModernMultiplayerService() as any;
    const veryLongName = "A".repeat(51);

    await expect(
      service.createRoom(veryLongName, "quiz-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  // ===== Test cho ham: createRoom =====
  it("rejects createRoom when room name is too short", async () => {
    // TC: UT-MMS-17 | createRoomTooShortName
    // Muc tieu: hien thi huong dan ten phong qua ngan (logic: throw ValidationError).
    // Expected tu spec: roomName.length < 3 -> ValidationError.

    const service = new ModernMultiplayerService() as any;

    await expect(service.createRoom("AB", "quiz-1")).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  // ===== Test cho ham: createRoom =====
  it("rejects createRoom when private password is below minimum length", async () => {
    // TC: UT-MMS-18 | createRoomPrivatePasswordMinLength
    // Muc tieu: gioi han do dai toi thieu cua mat khau phong rieng tu.
    // Expected tu spec: password.length < 4 -> ValidationError.

    const service = new ModernMultiplayerService() as any;

    await expect(
      service.createRoom("Private Room", "quiz-1", 4, true, "123"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  // ===== Test cho ham: createRoom =====
  it("creates private room with very long password (current behavior)", async () => {
    // TC: UT-MMS-19 | createRoomPrivatePasswordVeryLong
    // Muc tieu: kiem tra gioi han do dai toi da cua mat khau private.
    // Expected hien tai: service khong chan max length, van tao phong.

    const service = new ModernMultiplayerService() as any;
    vi.spyOn(service, "generateRoomCode").mockResolvedValue("LONGPW");
    vi.spyOn(service, "setupListeners").mockImplementation(() => undefined);

    const longPassword = "p".repeat(200);
    const result = await service.createRoom(
      "Private Room",
      "quiz-1",
      4,
      true,
      longPassword,
    );

    expect(result).toEqual({ roomId: "room-new", roomCode: "LONGPW" });
  });

  // ===== Test cho ham: createRoom =====
  it("rejects createRoom when quiz is not found", async () => {
    // TC: UT-MMS-20 | createRoomQuizRequired
    // Muc tieu: bat buoc chon bo cau hoi (logic: quiz phai ton tai).
    // Expected tu spec: getDoc quiz.exists=false -> throw Error.

    const service = new ModernMultiplayerService() as any;
    vi.spyOn(service, "generateRoomCode").mockResolvedValue("NOQUIZ");
    mocks.mockGetDoc.mockResolvedValueOnce({ exists: () => false });

    await expect(service.createRoom("Room", "quiz-missing")).rejects.toThrow(
      "Quiz not found",
    );
  });

  // ===== Test cho ham: joinRoom =====
  it("joins room by room code and returns room id/code", async () => {
    // TC: UT-MMS-08 | joinRoomByCodeSuccess
    // Muc tieu: Dam bao joinRoom theo room code tra ve ket qua dung.
    // Expected tu spec: tim thay room + room chua full -> join thanh cong.

    const service = new ModernMultiplayerService() as any;
    vi.spyOn(service, "setupRealtimeRoom").mockResolvedValue(undefined);
    vi.spyOn(service, "addPlayerToRTDB").mockResolvedValue(undefined);

    mocks.mockGetDocs.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: "room-join-1",
          data: () => ({
            code: "ABC123",
            status: "waiting",
            settings: { allowLateJoin: true },
            maxPlayers: 4,
            isPrivate: false,
          }),
        },
      ],
    });

    mocks.mockGet.mockResolvedValueOnce({
      val: () => ({ userA: {}, userB: {} }),
    });

    const result = await service.joinRoom("ABC123");
    expect(result).toEqual({ roomId: "room-join-1", roomCode: "ABC123" });
    expect(service.addPlayerToRTDB).toHaveBeenCalledWith(
      expect.objectContaining({ id: "user-1", role: "player" }),
    );
  });

  // ===== Test cho ham: joinRoom =====
  it("rejects joinRoom when room is full", async () => {
    // TC: UT-MMS-09 | joinRoomFull
    // Muc tieu: Dam bao joinRoom chan khi phong da day.
    // Expected tu spec: playerCount >= maxPlayers -> RoomFullError.

    const service = new ModernMultiplayerService();

    mocks.mockGetDocs.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: "room-full-1",
          data: () => ({
            code: "FULL01",
            status: "waiting",
            settings: { allowLateJoin: true },
            maxPlayers: 2,
            isPrivate: false,
          }),
        },
      ],
    });

    mocks.mockGet.mockResolvedValueOnce({ val: () => ({ p1: {}, p2: {} }) });

    await expect(service.joinRoom("FULL01")).rejects.toBeInstanceOf(
      RoomFullError,
    );
  });

  // ===== Test cho ham: joinRoom =====
  it("rejects joinRoom when room code is not found", async () => {
    // TC: UT-MMS-10 | joinRoomNotFound
    // Muc tieu: Dam bao joinRoom tra loi loi khi khong tim thay room.
    // Expected tu spec: snapshot.empty=true -> RoomNotFoundError.

    const service = new ModernMultiplayerService();
    mocks.mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] });

    await expect(service.joinRoom("NF0001")).rejects.toBeInstanceOf(
      RoomNotFoundError,
    );
  });

  // ===== Test cho ham: joinRoom =====
  it("joins private room with valid password", async () => {
    // TC: UT-MMS-21 | joinPrivateRoomValidPassword
    // Muc tieu: tham gia phong rieng tu voi mat khau hop le.
    // Expected tu spec: password dung -> join thanh cong.

    const service = new ModernMultiplayerService() as any;
    vi.spyOn(service, "setupRealtimeRoom").mockResolvedValue(undefined);
    vi.spyOn(service, "addPlayerToRTDB").mockResolvedValue(undefined);

    const privateRoomData = {
      code: "PRIV01",
      status: "waiting",
      settings: { allowLateJoin: true },
      maxPlayers: 4,
      isPrivate: true,
      password: "1234",
      passwordSalt: undefined,
      passwordVersion: undefined,
    };

    mocks.mockGetDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: "room-private-1", data: () => privateRoomData }],
    });
    mocks.mockGet.mockResolvedValueOnce({ val: () => ({}) });

    await expect(service.joinRoom("PRIV01", "1234")).resolves.toEqual({
      roomId: "room-private-1",
      roomCode: "PRIV01",
    });
  });

  // ===== Test cho ham: joinRoom =====
  it("rejects joinRoom for private room when password is blank", async () => {
    // TC: UT-MMS-22 | joinPrivateRoomBlankPassword
    // Muc tieu: bo trong mat khau khi vao phong rieng tu.
    // Expected tu spec: isPrivate=true && !password -> PasswordError.

    const service = new ModernMultiplayerService();

    mocks.mockGetDocs.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: "room-private-2",
          data: () => ({
            code: "PRIV02",
            status: "waiting",
            settings: { allowLateJoin: true },
            maxPlayers: 4,
            isPrivate: true,
            password: "abcd",
          }),
        },
      ],
    });

    await expect(service.joinRoom("PRIV02", "")).rejects.toBeInstanceOf(
      PasswordError,
    );
  });

  // ===== Test cho ham: joinRoom =====
  it("rejects joinRoom for private room with wrong password", async () => {
    // TC: UT-MMS-23 | joinPrivateRoomWrongPassword
    // Muc tieu: tham gia phong rieng tu voi mat khau sai.
    // Expected tu spec: verifyPassword=false -> PasswordError.

    const service = new ModernMultiplayerService();

    mocks.mockGetDocs.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: "room-private-3",
          data: () => ({
            code: "PRIV03",
            status: "waiting",
            settings: { allowLateJoin: true },
            maxPlayers: 4,
            isPrivate: true,
            password: "correct",
          }),
        },
      ],
    });

    await expect(service.joinRoom("PRIV03", "wrong")).rejects.toBeInstanceOf(
      PasswordError,
    );
  });

  // ===== Test cho ham: joinRoom =====
  it("still requires password for legacy private room with empty stored password", async () => {
    // TC: UT-MMS-24 | joinPrivateLegacyEmptyPassword
    // Muc tieu: du lieu ngoai le private nhung pass rong (bug ke thua).
    // Expected hien tai: isPrivate=true va khong gui pass -> PasswordError.

    const service = new ModernMultiplayerService();

    mocks.mockGetDocs.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: "room-private-legacy",
          data: () => ({
            code: "LEGACY",
            status: "waiting",
            settings: { allowLateJoin: true },
            maxPlayers: 4,
            isPrivate: true,
            password: "",
          }),
        },
      ],
    });

    await expect(service.joinRoom("LEGACY")).rejects.toBeInstanceOf(
      PasswordError,
    );
  });

  // ===== Test cho ham: joinRoom =====
  it("joins public room even when redundant password is provided", async () => {
    // TC: UT-MMS-25 | joinPublicRoomWithRedundantPassword
    // Muc tieu: gui thua data mat khau vao phong cong khai do loi UI.
    // Expected tu spec: phong public bo qua password va join thanh cong.

    const service = new ModernMultiplayerService() as any;
    vi.spyOn(service, "setupRealtimeRoom").mockResolvedValue(undefined);
    vi.spyOn(service, "addPlayerToRTDB").mockResolvedValue(undefined);

    mocks.mockGetDocs.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: "room-public-extra",
          data: () => ({
            code: "PUB999",
            status: "waiting",
            settings: { allowLateJoin: true },
            maxPlayers: 4,
            isPrivate: false,
          }),
        },
      ],
    });
    mocks.mockGet.mockResolvedValueOnce({ val: () => ({}) });

    await expect(service.joinRoom("PUB999", "extra-pass")).resolves.toEqual({
      roomId: "room-public-extra",
      roomCode: "PUB999",
    });
  });

  // ===== Test cho ham: joinRoom =====
  it("joins room by roomId (invite link/QR deep link style)", async () => {
    // TC: UT-MMS-26 | joinRoomByRoomId
    // Muc tieu: vao phong cong khai thong qua link moi/QR (roomId).
    // Expected tu spec: input khac 6 ky tu -> lookup theo roomId va join thanh cong.

    const service = new ModernMultiplayerService() as any;
    vi.spyOn(service, "setupRealtimeRoom").mockResolvedValue(undefined);
    vi.spyOn(service, "addPlayerToRTDB").mockResolvedValue(undefined);

    mocks.mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: "room-id-xyz",
      data: () => ({
        code: "INV123",
        status: "waiting",
        settings: { allowLateJoin: true },
        maxPlayers: 4,
        isPrivate: false,
      }),
    });
    mocks.mockGet.mockResolvedValueOnce({ val: () => ({ userA: {} }) });

    await expect(service.joinRoom("room-id-xyz")).resolves.toEqual({
      roomId: "room-id-xyz",
      roomCode: "INV123",
    });
  });

  // ===== Test cho ham: joinRoom =====
  it("rejects joinRoom when code/id is empty string", async () => {
    // TC: UT-MMS-12 | joinRoomEmptyCode
    // Muc tieu: Dam bao joinRoom khong chap nhan code/id rong.
    // Expected tu spec: khong tim thay room -> RoomNotFoundError.

    const service = new ModernMultiplayerService();
    mocks.mockGetDoc.mockResolvedValueOnce({ exists: () => false });

    await expect(service.joinRoom("")).rejects.toBeInstanceOf(
      RoomNotFoundError,
    );
  });

  // ===== Test cho ham: joinRoom =====
  it("rejects joinRoom when code/id is only whitespace", async () => {
    // TC: UT-MMS-13 | joinRoomWhitespaceCode
    // Muc tieu: Dam bao joinRoom khong chap nhan code/id toan khoang trang.
    // Expected tu spec: khong tim thay room -> RoomNotFoundError.

    const service = new ModernMultiplayerService();
    mocks.mockGetDoc.mockResolvedValueOnce({ exists: () => false });

    await expect(service.joinRoom("      ")).rejects.toBeInstanceOf(
      RoomNotFoundError,
    );
  });

  // ===== Test cho ham: findRoomByCode =====
  it("returns null for whitespace-only room code", async () => {
    // TC: UT-MMS-14 | findRoomByCodeWhitespace
    // Muc tieu: Dam bao findRoomByCode tra null khi ma phong khong hop le.
    // Expected tu spec: snapshot.empty=true -> null.

    const service = new ModernMultiplayerService();
    mocks.mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] });

    await expect(service.findRoomByCode("    ")).resolves.toBeNull();
  });

  // ===== Test cho ham: findRoomByCode =====
  it("returns null for very long room code", async () => {
    // TC: UT-MMS-15 | findRoomByCodeVeryLong
    // Muc tieu: Dam bao findRoomByCode xu ly input rat dai ma khong vo logic.
    // Expected tu spec: snapshot.empty=true -> null.

    const service = new ModernMultiplayerService();
    mocks.mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] });

    await expect(service.findRoomByCode("A".repeat(500))).resolves.toBeNull();
  });

  // ===== Test cho ham: generateRoomCode =====
  it("throws when all generated codes are duplicated", async () => {
    // TC: UT-MMS-16 | generateRoomCodeAllDuplicated
    // Muc tieu: Dam bao generateRoomCode throw khi trung ma lien tuc qua MAX_ATTEMPTS.
    // Expected tu spec: sau 10 lan trung -> RoomCodeGenerationError.

    const service = new ModernMultiplayerService() as any;
    const randomSpy = vi.spyOn(service, "randomCode").mockReturnValue("DUP999");
    mocks.mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [{ id: "dup" }],
    });

    await expect(service.generateRoomCode()).rejects.toBeInstanceOf(
      RoomCodeGenerationError,
    );
    expect(randomSpy).toHaveBeenCalledTimes(10);
  });
});
