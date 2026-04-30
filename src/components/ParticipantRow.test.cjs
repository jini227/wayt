process.env.TS_NODE_SKIP_PROJECT = "true";
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: "CommonJS",
  moduleResolution: "Node",
  jsx: "react-jsx"
});

require("ts-node/register/transpile-only");

const Module = require("module");
const originalLoad = Module._load;

Module._load = function loadWithReactNativeStubs(request, parent, isMain) {
  if (request === "react-native") {
    return {
      Image: "Image",
      Pressable: "Pressable",
      StyleSheet: { create: (styles) => styles },
      Text: "Text",
      View: "View"
    };
  }

  if (request === "lucide-react-native") {
    return {
      CheckCircle2: function CheckCircle2() {
        return null;
      },
      ChevronRight: function ChevronRight() {
        return null;
      },
      LocateFixed: function LocateFixed() {
        return null;
      },
      PencilLine: function PencilLine() {
        return null;
      }
    };
  }

  if (parent?.filename?.endsWith("ParticipantRow.tsx") && request === "./Avatar") {
    return {
      Avatar: function Avatar() {
        return null;
      }
    };
  }

  return originalLoad.apply(this, arguments);
};

const { ParticipantRow } = require("./ParticipantRow.tsx");

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function collectTextChildren(node, insideText = false) {
  if (node == null || typeof node === "boolean") {
    return [];
  }
  if (typeof node === "string" || typeof node === "number") {
    return insideText ? [String(node)] : [];
  }
  if (Array.isArray(node)) {
    return node.flatMap((child) => collectTextChildren(child, insideText));
  }

  const nextInsideText = insideText || node.type === "Text";
  return collectTextChildren(node.props?.children, nextInsideText);
}

const inviteRow = ParticipantRow({
  participant: {
    id: "participant-minsu",
    name: "Minsu",
    handle: "@minsu",
    avatar: "",
    accent: "#3478F6",
    inviteStatus: "참가 완료"
  },
  mode: "invite",
  showInviteStatus: false
});

assertEqual(
  collectTextChildren(inviteRow)[0],
  "Minsu",
  "invite participant rows display the participant name before the Wayt ID"
);
