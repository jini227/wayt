const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

function requireTs(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020
    }
  }).outputText;
  const module = { exports: {} };
  const dirname = path.dirname(filePath);

  function localRequire(id) {
    if (id.startsWith(".")) {
      const resolved = path.resolve(dirname, id.endsWith(".ts") ? id : `${id}.ts`);
      return requireTs(resolved);
    }
    return require(id);
  }

  new Function("require", "module", "exports", "__filename", "__dirname", output)(
    localRequire,
    module,
    module.exports,
    filePath,
    dirname
  );

  return module.exports;
}

const {
  buildReceivedInviteRows,
  receivedInviteSummaryLabel
} = requireTs(path.join(__dirname, "receivedInvites.ts"));

const now = new Date("2026-05-01T12:00:00+09:00");

test("builds received invite rows for pending invites ordered by urgency", () => {
  const rows = buildReceivedInviteRows([
    {
      id: "later",
      appointmentTitle: "저녁 약속",
      placeName: "강남역",
      scheduledAt: "2026-05-01T20:00:00+09:00",
      status: "PENDING",
      token: "LATER",
      inviterNickname: "민수",
      inviterWaytId: "@minsu",
      inviterAvatarUrl: "https://example.com/minsu.png"
    },
    {
      id: "accepted",
      appointmentTitle: "이미 수락한 약속",
      placeName: "홍대입구",
      scheduledAt: "2026-05-01T14:00:00+09:00",
      status: "ACCEPTED",
      token: "ACCEPTED",
      inviterNickname: "지윤",
      inviterWaytId: "@jiyoon",
      inviterAvatarUrl: null
    },
    {
      id: "soon",
      appointmentTitle: "커피",
      placeName: "서울역",
      scheduledAt: "2026-05-01T13:00:00+09:00",
      status: "PENDING",
      token: "SOON",
      inviterNickname: "서연",
      inviterWaytId: "@seoyeon",
      inviterAvatarUrl: null
    },
    {
      id: "past",
      appointmentTitle: "지난 초대",
      placeName: "잠실",
      scheduledAt: "2026-05-01T10:00:00+09:00",
      status: "PENDING",
      token: "PAST",
      inviterNickname: "도윤",
      inviterWaytId: "@doyun",
      inviterAvatarUrl: null
    }
  ], now);

  assert.deepEqual(rows.map((row) => row.id), ["soon", "later"]);
  assert.equal(rows[0].title, "커피");
  assert.equal(rows[0].place, "서울역");
  assert.equal(rows[0].inviterLabel, "서연님의 초대");
  assert.equal(rows[0].inviterHandle, "@seoyeon");
  assert.equal(rows[0].route, "/invites/SOON");
  assert.equal(rows[0].isPast, false);
});

test("summarizes pending received invite count for compact entry points", () => {
  assert.equal(receivedInviteSummaryLabel(0), null);
  assert.equal(receivedInviteSummaryLabel(1), "받은 초대 1개");
  assert.equal(receivedInviteSummaryLabel(3), "받은 초대 3개");
});
